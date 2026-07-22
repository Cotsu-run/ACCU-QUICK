"use client";

import { useRef, useState } from "react";
import UploadZone, { type ScanStatus, type SlotFiles } from "./UploadZone";
import ProgressSection from "./ProgressSection";
import ImagePreview from "./ImagePreview";
import SpecCheck from "./SpecCheck";
import { extractText, extractComparison, type LineBox } from "../lib/ocr";
import { TEXT_A, TEXT_B } from "../lib/mockData";
import { useLang } from "../lib/LanguageContext";

interface ScanResult {
  textA: string;
  textB: string;
  artUrls: string[];
  artName: string;
  boxes: LineBox[];
  pxPerMm: number | null;
}

export default function DocumentInspect() {
  const { t } = useLang();
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanMs, setScanMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    setErrorMsg(null);
  };

  // Real client-side extraction (Path A): OCR images, read text files directly.
  const runScan = async (files: SlotFiles) => {
    const token = ++runToken.current;
    const startedAt = Date.now();
    setScanStatus("scanning");
    setPct(0);
    setDismissed(new Set());
    setErrorMsg(null);

    try {
      setProgressLabel(t("stExtractSrc"));
      const textA = await extractText(files.doc, (p) => {
        if (runToken.current === token) setPct(Math.round(p * 45));
      });
      if (runToken.current !== token) return; // cancelled

      setProgressLabel(t("stExtractCmp"));
      // Comparison side: OCR the image / rendered PDF pages so the text AND the
      // per-line bounding boxes come from the exact preview image.
      let textB = "";
      let artUrls: string[] = [];
      let boxes: LineBox[] = [];
      let pxPerMm: number | null = null;
      const setArtPct = (p: number) => { if (runToken.current === token) setPct(45 + Math.round(p * 45)); };
      if (files.art) {
        const res = await extractComparison(files.art, setArtPct);
        textB = res.text;
        artUrls = res.pageUrls;
        boxes = res.boxes;
        pxPerMm = res.pxPerMm;
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
        boxes,
        pxPerMm,
      });
      setScanMs(Date.now() - startedAt);
      setScanStatus("done");
    } catch (err) {
      // A throw from extraction (corrupt/large PDF, OCR worker failure, …) used
      // to leave the scan spinning forever. Surface it and allow a retry.
      if (runToken.current !== token) return; // superseded by a newer run / reset
      console.error("Scan failed:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setScanStatus("error");
    }
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
            <h2>{t("uploadTitle")}</h2>
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

        {scanStatus === "error" && (
          <div className="scan-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="scan-error-body">
              <strong>{t("scanFailed")}</strong>
              <p>{t("scanFailedHint")}</p>
              {errorMsg && <code>{errorMsg}</code>}
            </div>
          </div>
        )}

        {scanStatus === "done" && result && result.artUrls.length > 0 && (
          <ImagePreview
            artUrls={result.artUrls}
            fileName={result.artName}
            textA={result.textA}
            textB={result.textB}
            boxes={result.boxes}
            pxPerMm={result.pxPerMm}
            dismissed={dismissed}
            onDismiss={dismissLine}
          />
        )}

        {scanStatus === "done" && result && <SpecCheck />}
      </div>
    </div>
  );
}
