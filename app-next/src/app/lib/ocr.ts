// Client-side text extraction (Path A).
// - Plain-text files (CSV/TXT/…) are read directly.
// - Images are OCR'd with Tesseract.js (WASM), English + Thai.
// - PDF/Office/vector formats aren't handled client-side yet (later step).

export const OCR_LANGS = "eng+tha";

// PDF pages are rasterised at this scale. A PDF user-space unit is 1/72 inch, so
// at scale S the image has S*72 px/inch → this many source-image px per mm. This
// lets the preview ruler report real millimetres for PDF artwork (raster image
// uploads carry no DPI, so mm is unknown for them → pxPerMm is null there).
const PDF_RENDER_SCALE = 2;
export const PDF_PX_PER_MM = (PDF_RENDER_SCALE * 72) / 25.4;

// Self-hosted Tesseract assets (worker, core WASM, language data) under /public.
// Keeps OCR fully first-party — no runtime CDN fetch.
const TESS_PATHS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/core",
  langPath: "/tesseract/lang",
} as const;

function ext(name: string): string {
  return (name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
}

function isTextFile(file: File): boolean {
  const e = ext(file.name);
  const t = (file.type || "").toLowerCase();
  return /\.(csv|txt|tsv|json|md|log)$/i.test(e) || t.startsWith("text/") || t === "application/json";
}

function isImageFile(file: File): boolean {
  const e = ext(file.name);
  const t = (file.type || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(e) || /^image\/(png|jpeg|gif|webp|bmp)$/.test(t);
}

function isPdfFile(file: File): boolean {
  return ext(file.name) === ".pdf" || (file.type || "").toLowerCase() === "application/pdf";
}

function isDocxFile(file: File): boolean {
  return ext(file.name) === ".docx" ||
    (file.type || "").toLowerCase() === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isXlsxFile(file: File): boolean {
  return ext(file.name) === ".xlsx" ||
    (file.type || "").toLowerCase() === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

async function ocrImage(source: File | HTMLCanvasElement, onProgress: (p: number) => void): Promise<string> {
  const mod = await import("tesseract.js");
  const recognize = mod.recognize ?? mod.default.recognize;
  const { data } = await recognize(source, OCR_LANGS, {
    ...TESS_PATHS,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress(m.progress);
    },
  });
  return data.text.trim();
}

// A detected word's location within its page image, as fractions (0..1).
export interface WordBox {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// A detected line's location + its words, as fractions (0..1).
export interface LineBox {
  n: number; // 1-based line number in the comparison text
  page: number; // 0-based page index
  x: number;
  y: number;
  w: number;
  h: number;
  words: WordBox[];
}

type Bbox = { x0: number; y0: number; x1: number; y1: number };
type OcrWord = { text: string; bbox: Bbox };
type OcrLine = { text: string; bbox: Bbox; words: OcrWord[] };

// OCR that also returns per-line bounding boxes (via Tesseract's block output).
async function ocrLines(
  source: File | HTMLCanvasElement,
  onProgress: (p: number) => void
): Promise<{ text: string; lines: OcrLine[] }> {
  const mod = await import("tesseract.js");
  const createWorker = mod.createWorker ?? mod.default.createWorker;
  const worker = await createWorker(OCR_LANGS, 1, {
    ...TESS_PATHS,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress(m.progress);
    },
  });
  const { data } = await worker.recognize(source, {}, { blocks: true });
  await worker.terminate();
  const lines: OcrLine[] = [];
  for (const b of data.blocks ?? [])
    for (const p of b.paragraphs ?? [])
      for (const l of p.lines ?? [])
        lines.push({
          text: l.text.replace(/\s+/g, " ").trim(),
          bbox: l.bbox,
          words: (l.words ?? [])
            .map((w) => ({ text: w.text.trim(), bbox: w.bbox }))
            .filter((w) => w.text.length > 0),
        });
  const text = lines.map((l) => l.text).filter(Boolean).join("\n").trim() || data.text.trim();
  return { text, lines };
}

function toFrac(b: Bbox, W: number, H: number): { x: number; y: number; w: number; h: number } {
  return { x: b.x0 / W, y: b.y0 / H, w: (b.x1 - b.x0) / W, h: (b.y1 - b.y0) / H };
}

function imageDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Extract the comparison file's text + preview image(s) + precise per-line boxes.
// Boxes come from OCR of the exact rendered image, so they align with the preview.
export async function extractComparison(
  file: File,
  onProgress: (p: number) => void
): Promise<{ text: string; pageUrls: string[]; boxes: LineBox[]; pxPerMm: number | null }> {
  if (isImageFile(file)) {
    const dataUrl = await fileToDataUrl(file);
    const dims = await imageDims(file);
    const { text, lines } = await ocrLines(file, onProgress);
    const boxes: LineBox[] = lines.map((l, i) => ({
      n: i + 1,
      page: 0,
      ...toFrac(l.bbox, dims.w, dims.h),
      words: l.words.map((w) => ({ text: w.text, ...toFrac(w.bbox, dims.w, dims.h) })),
    }));
    onProgress(1);
    return { text, pageUrls: [dataUrl], boxes, pxPerMm: null };
  }

  if (isPdfFile(file)) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const buf = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: buf, standardFontDataUrl: "/standard_fonts/" });
    const pdf = await loadingTask.promise;
    const n = pdf.numPages;
    const pageUrls: string[] = [];
    const pageTexts: string[] = [];
    const boxes: LineBox[] = [];
    let lineNo = 0;
    try {
      for (let i = 1; i <= n; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        pageUrls.push(canvas.toDataURL("image/png"));
        const { text, lines } = await ocrLines(canvas, (p) => onProgress((i - 1 + p) / n));
        pageTexts.push(text);
        lines.forEach((l) => {
          lineNo++;
          boxes.push({
            n: lineNo,
            page: i - 1,
            ...toFrac(l.bbox, canvas.width, canvas.height),
            words: l.words.map((w) => ({ text: w.text, ...toFrac(w.bbox, canvas.width, canvas.height) })),
          });
        });
      }
    } finally {
      try {
        await loadingTask.destroy();
      } catch {
        /* ignore */
      }
    }
    onProgress(1);
    return { text: pageTexts.join("\n").trim(), pageUrls, boxes, pxPerMm: PDF_PX_PER_MM };
  }

  // Text file or unsupported: text only, no preview boxes.
  const text = isTextFile(file)
    ? await file.text()
    : `[Client-side extraction not yet supported for ${file.name}.]`;
  onProgress(1);
  return { text, pageUrls: [], boxes: [], pxPerMm: null };
}

function pdfTextFromContent(items: { str?: string; hasEOL?: boolean }[]): string {
  let s = "";
  for (const it of items) {
    if (typeof it.str !== "string") continue;
    s += it.str + (it.hasEOL ? "\n" : " ");
  }
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Load a PDF ONCE and produce both its text and a rendered PNG per page.
// (Loading the same PDF twice on pdf.js's single worker deadlocks page.render.)
export async function extractPdfArt(
  file: File,
  onProgress: (p: number) => void,
  scale = 2
): Promise<{ text: string; pageUrls: string[] }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buf, standardFontDataUrl: "/standard_fonts/" });
  const pdf = await loadingTask.promise;
  const n = pdf.numPages;
  const pageTexts: string[] = [];
  const pageUrls: string[] = [];
  const canvases: HTMLCanvasElement[] = [];
  try {
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pageTexts.push(pdfTextFromContent(content.items as { str?: string; hasEOL?: boolean }[]));

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      pageUrls.push(canvas.toDataURL("image/png"));
      canvases.push(canvas);
      onProgress((i / n) * 0.9);
    }

    let text = pageTexts.join("\n").trim();
    if (text.replace(/\s/g, "").length < 10) {
      // Scanned PDF — OCR the pages we already rendered.
      const ocr: string[] = [];
      for (const cv of canvases) ocr.push(await ocrImage(cv, () => {}));
      text = ocr.join("\n").trim();
    }
    onProgress(1);
    return { text, pageUrls };
  } finally {
    try {
      await loadingTask.destroy();
    } catch {
      /* ignore */
    }
  }
}

// Extract text from a PDF: try pdf.js's native text layer first (digital PDFs);
// if a page yields little/no text (scanned PDF), rasterize it and OCR instead.
async function extractPdf(file: File, onProgress: (p: number) => void): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf, standardFontDataUrl: "/standard_fonts/" }).promise;
  const n = pdf.numPages;

  const pages: string[] = [];
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Reconstruct line breaks: pdf.js flags line ends with `hasEOL`; otherwise
    // join adjacent runs with a space. Without this every page collapses to one line.
    let s = "";
    for (const it of content.items) {
      if (!("str" in it)) continue;
      s += it.str + (it.hasEOL ? "\n" : " ");
    }
    const pageText = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    pages.push(pageText);
    onProgress((i / n) * 0.5); // first half = text-layer pass
  }

  const nativeText = pages.join("\n").trim();
  if (nativeText.replace(/\s/g, "").length >= 10) {
    onProgress(1);
    return nativeText;
  }

  // Scanned PDF — rasterize each page and OCR it.
  const ocrPages: string[] = [];
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const text = await ocrImage(canvas, (p) => onProgress(0.5 + ((i - 1 + p) / n) * 0.5));
    ocrPages.push(text);
  }
  onProgress(1);
  return ocrPages.join("\n").trim();
}

/**
 * Extract text from a file. `onProgress` receives 0..1.
 * Returns the extracted text (or a clearly-labelled placeholder for
 * formats we can't yet handle in the browser).
 */
export async function extractText(
  file: File | null,
  onProgress: (p: number) => void
): Promise<string> {
  if (!file) {
    onProgress(1);
    return "";
  }

  if (isTextFile(file)) {
    const text = await file.text();
    onProgress(1);
    return text;
  }

  if (isImageFile(file)) {
    const text = await ocrImage(file, onProgress);
    onProgress(1);
    return text;
  }

  if (isPdfFile(file)) {
    return extractPdf(file, onProgress);
  }

  // DOCX / XLSX — read directly from the Office Open XML container (no OCR).
  if (isDocxFile(file)) {
    const { extractDocx } = await import("./office");
    const text = await extractDocx(file);
    onProgress(1);
    return text;
  }
  if (isXlsxFile(file)) {
    const { extractXlsx } = await import("./office");
    const text = await extractXlsx(file);
    onProgress(1);
    return text;
  }

  // Legacy binary .xls/.doc, TIFF, AI, EPS — not handled client-side yet.
  onProgress(1);
  return `[Client-side extraction not yet supported for ${file.name}. Legacy/vector handling is a later step.]`;
}
