"use client";

import { useRef, useState } from "react";
import UploadZone, { type ScanStatus, type SlotFiles } from "./UploadZone";
import ProgressSection from "./ProgressSection";
import ResultTabs from "./ResultTabs";
import ExtractPanel from "./ExtractPanel";
import LanguagePanel from "./LanguagePanel";
import SpecPanel from "./SpecPanel";
import ImagePreview from "./ImagePreview";
import { extractText, extractPdfArt } from "../lib/ocr";
import { TEXT_A, TEXT_B } from "../lib/mockData";
import { useLang } from "../lib/LanguageContext";

interface ScanResult {
  textA: string;
  textB: string;
  artUrls: string[];
  artName: string;
}

function isImage(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name) || /^image\//.test(t);
}

function isPdf(file: File): boolean {
  return /\.pdf$/i.test(file.name) || (file.type || "").toLowerCase() === "application/pdf";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function DocumentInspect() {
  const { t } = useLang();
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanMs, setScanMs] = useState<number | null>(null);
  // Lines dismissed from the mismatch panel — shared so a delete in the image
  // preview also marks that line "unchanged" in the Text Extraction diff.
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  // Token to cancel an in-flight scan if files change / reset.
  const runToken = useRef(0);

  const dismissLine = (n: number) => setDismissed((prev) => new Set(prev).add(n));

  const invalidate = () => {
    runToken.current++;
    setScanStatus("idle");
    setPct(0);
    setDismissed(new Set());
    setScanMs(null);
  };

  // Real client-side extraction (Path A): OCR images, read text files directly.
  const runScan = async (files: SlotFiles) => {
    const token = ++runToken.current;
    const startedAt = Date.now();
    setScanStatus("scanning");
    setPct(0);
    setDismissed(new Set());

    setProgressLabel(t("stExtractSrc"));
    const textA = await extractText(files.doc, (p) => {
      if (runToken.current === token) setPct(Math.round(p * 45));
    });
    if (runToken.current !== token) return; // cancelled

    setProgressLabel(t("stExtractCmp"));
    // For a PDF comparison, load it once for BOTH text and every page image.
    // For images, OCR the text and use the file itself as the single preview page.
    let textB = "";
    let artUrls: string[] = [];
    const setArtPct = (p: number) => { if (runToken.current === token) setPct(45 + Math.round(p * 45)); };
    if (files.art && isPdf(files.art)) {
      const res = await extractPdfArt(files.art, setArtPct);
      textB = res.text;
      artUrls = res.pageUrls;
    } else {
      textB = await extractText(files.art, setArtPct);
      if (files.art && isImage(files.art)) artUrls = [await fileToDataUrl(files.art)];
    }
    if (runToken.current !== token) return;

    setProgressLabel(t("stComparing"));
    setPct(100);

    // If a slot had no file / unsupported format, fall back to sample text so the
    // diff still demonstrates — real content wins whenever extraction produced it.
    setResult({
      textA: textA || TEXT_A,
      textB: textB || TEXT_B,
      artUrls,
      artName: files.art?.name ?? "Comparison File",
    });
    if (runToken.current !== token) return;
    setScanMs(Date.now() - startedAt);
    setScanStatus("done");
  };

  return (
    <div className="combined-card">
      <div className="card-header">
        <div className="card-header-inner">
          <div className="card-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h3>{t("uploadTitle")}</h3>
            <p>{t("uploadDesc")}</p>
          </div>
        </div>
      </div>

      <div className="card-body">
        <UploadZone
          scanStatus={scanStatus}
          scanMs={scanMs}
          onVerify={runScan}
          onReset={invalidate}
          onFilesChange={invalidate}
        />
        <ProgressSection visible={scanStatus === "scanning"} label={progressLabel} pct={pct} />

        {scanStatus === "done" && result && result.artUrls.length > 0 && (
          <ImagePreview
            artUrls={result.artUrls}
            fileName={result.artName}
            textA={result.textA}
            textB={result.textB}
            dismissed={dismissed}
            onDismiss={dismissLine}
          />
        )}
      </div>

      <ResultTabs
        visible={scanStatus === "done"}
        extractPanel={<ExtractPanel textA={result?.textA} textB={result?.textB} dismissed={dismissed} />}
        languagePanel={<LanguagePanel />}
        specPanel={<SpecPanel />}
      />
    </div>
  );
}
