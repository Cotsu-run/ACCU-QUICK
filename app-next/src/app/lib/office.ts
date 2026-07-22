// Dependency-free text extraction from Office Open XML files (DOCX / XLSX).
// Both formats are ZIP containers of XML parts, so we read them entirely
// in-browser with the platform `DecompressionStream` + `DOMParser` — no
// third-party library, matching the self-hosted OCR/PDF setup (no runtime CDN).
//
// Legacy binary .xls / .doc are NOT ZIP containers and are not handled here.

// ── Minimal ZIP reader ──────────────────────────────────────────────────────
// Reads the central directory, then extracts named entries (stored or
// DEFLATE-compressed). Enough for Office parts; not a general ZIP library.

interface ZipEntry {
  name: string;
  method: number; // 0 = stored, 8 = deflate
  compressedSize: number;
  localHeaderOffset: number;
}

const u16 = (v: DataView, o: number) => v.getUint16(o, true);
const u32 = (v: DataView, o: number) => v.getUint32(o, true);

// End Of Central Directory record (sig 0x06054b50) — scan back from the end,
// past a possible trailing comment (max 0xffff bytes).
function findEocd(view: DataView): number {
  const min = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (u32(view, i) === 0x06054b50) return i;
  }
  return -1;
}

function readCentralDirectory(buf: ArrayBuffer): Map<string, ZipEntry> {
  const view = new DataView(buf);
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error("Not a ZIP-based Office file (no EOCD record)");
  const count = u16(view, eocd + 10);
  let ptr = u32(view, eocd + 16); // central directory start offset
  const decoder = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  for (let i = 0; i < count; i++) {
    if (u32(view, ptr) !== 0x02014b50) break; // central directory file header
    const method = u16(view, ptr + 10);
    const compressedSize = u32(view, ptr + 20);
    const nameLen = u16(view, ptr + 28);
    const extraLen = u16(view, ptr + 30);
    const commentLen = u16(view, ptr + 32);
    const localHeaderOffset = u32(view, ptr + 42);
    const name = decoder.decode(new Uint8Array(buf, ptr + 46, nameLen));
    entries.set(name, { name, method, compressedSize, localHeaderOffset });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntry(buf: ArrayBuffer, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(buf);
  const o = entry.localHeaderOffset;
  if (u32(view, o) !== 0x04034b50) throw new Error(`Bad local header for ${entry.name}`);
  // The local header repeats name/extra lengths, which can differ from the
  // central directory entry — the file data starts after them.
  const nameLen = u16(view, o + 26);
  const extraLen = u16(view, o + 28);
  const dataStart = o + 30 + nameLen + extraLen;
  const raw = new Uint8Array(buf, dataStart, entry.compressedSize);
  if (entry.method === 0) return raw; // stored
  if (entry.method === 8) return inflateRaw(raw); // deflate
  throw new Error(`Unsupported ZIP compression method ${entry.method}`);
}

async function readXml(buf: ArrayBuffer, entries: Map<string, ZipEntry>, name: string): Promise<Document | null> {
  const entry = entries.get(name);
  if (!entry) return null;
  const text = new TextDecoder().decode(await readEntry(buf, entry));
  return new DOMParser().parseFromString(text, "application/xml");
}

// ── DOCX ─────────────────────────────────────────────────────────────────────

// Text of a single paragraph, walking runs in document order so tabs and line
// breaks land in the right place (w:t = text, w:tab = tab, w:br/w:cr = newline).
function paragraphText(p: Element): string {
  let s = "";
  const visit = (node: Node) => {
    for (let c = node.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      const el = c as Element;
      switch (el.tagName) {
        case "w:t": s += el.textContent ?? ""; break;
        case "w:tab": s += "\t"; break;
        case "w:br":
        case "w:cr": s += "\n"; break;
        default: visit(el);
      }
    }
  };
  visit(p);
  return s;
}

export async function extractDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const entries = readCentralDirectory(buf);
  const doc = await readXml(buf, entries, "word/document.xml");
  if (!doc) return "";
  const paras = doc.getElementsByTagName("w:p");
  const out: string[] = [];
  for (let i = 0; i < paras.length; i++) out.push(paragraphText(paras[i]));
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

// Concatenated text of an <si> / <is> node (plain <t> or rich-text <r><t> runs).
function stringItemText(node: Element): string {
  const ts = node.getElementsByTagName("t");
  let s = "";
  for (let i = 0; i < ts.length; i++) s += ts[i].textContent ?? "";
  return s;
}

function cellText(c: Element, shared: string[]): string {
  const type = c.getAttribute("t");
  if (type === "s") {
    // Shared string: <v> holds the index into the shared strings table.
    const v = c.getElementsByTagName("v")[0];
    const idx = v ? parseInt(v.textContent ?? "", 10) : NaN;
    return Number.isFinite(idx) ? shared[idx] ?? "" : "";
  }
  if (type === "inlineStr") {
    const is = c.getElementsByTagName("is")[0];
    return is ? stringItemText(is) : "";
  }
  // Number, boolean, date, or cached formula result.
  return c.getElementsByTagName("v")[0]?.textContent ?? "";
}

const sheetNum = (name: string) => parseInt(name.match(/sheet(\d+)\.xml$/)?.[1] ?? "0", 10);

export async function extractXlsx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const entries = readCentralDirectory(buf);

  // Shared strings table (optional — inline-string workbooks omit it).
  const shared: string[] = [];
  const ss = await readXml(buf, entries, "xl/sharedStrings.xml");
  if (ss) {
    const sis = ss.getElementsByTagName("si");
    for (let i = 0; i < sis.length; i++) shared.push(stringItemText(sis[i]));
  }

  const sheetNames = [...entries.keys()]
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => sheetNum(a) - sheetNum(b));

  const sheets: string[] = [];
  for (const name of sheetNames) {
    const sheet = await readXml(buf, entries, name);
    if (!sheet) continue;
    const rowEls = sheet.getElementsByTagName("row");
    const rows: string[] = [];
    for (let r = 0; r < rowEls.length; r++) {
      const cells = rowEls[r].getElementsByTagName("c");
      const vals: string[] = [];
      for (let c = 0; c < cells.length; c++) vals.push(cellText(cells[c], shared));
      rows.push(vals.join("\t").replace(/\t+$/, ""));
    }
    sheets.push(rows.join("\n"));
  }
  return sheets.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
