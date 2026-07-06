// Client-side text extraction (Path A).
// - Plain-text files (CSV/TXT/…) are read directly.
// - Images are OCR'd with Tesseract.js (WASM), English + Thai.
// - PDF/Office/vector formats aren't handled client-side yet (later step).

export const OCR_LANGS = "eng+tha";

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

  // XLSX / DOCX / TIFF / AI / EPS — not handled client-side yet.
  onProgress(1);
  return `[Client-side extraction not yet supported for ${file.name}. Office/vector handling is a later step.]`;
}
