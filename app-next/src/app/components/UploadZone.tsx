"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/LanguageContext";
import type { TKey } from "../lib/i18n";

type Slot = "doc" | "art";
// Reason a dropped/picked file was rejected, or null when the zone is fine.
type DropError = null | "type" | "size";

const ZONES: {
  slot: Slot;
  labelKey: TKey;
  accept: string;
  formatsKey: TKey;
  maxSize?: number;
}[] = [
  {
    slot: "doc",
    labelKey: "sourceFile",
    accept: ".docx,.xlsx,.xls",
    formatsKey: "formatsDoc",
  },
  {
    slot: "art",
    labelKey: "comparisonFile",
    accept: ".pdf,.ai",
    formatsKey: "formatsArt",
    maxSize: 100 * 1024 * 1024, // 100 MB
  },
];

// ── Icons (ported from prototype IC set) ──
const IcPdf = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IcExcel = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IcImg = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcRefresh = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IcUpload = (
  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ── Helpers (ported from prototype) ──
function formatBytes(b: number): string {
  if (!b && b !== 0) return "";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  if (b < 1024 * 1024 * 1024) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1073741824).toFixed(2) + " GB";
}

function formatDate(ts: number): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

type Kind = "pdf" | "excel" | "image" | "doc";
function classify(file: File): { kind: Kind; kindLabel: string; icon: React.ReactNode } {
  const ext = (file.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
  const ftype = (file.type || "").toLowerCase();
  const isPdf = ext === ".pdf" || ftype === "application/pdf";
  const isExcel = /\.(xlsx|xls|csv)$/i.test(ext);
  const isImg = /\.(png|jpg|jpeg|tiff|ai|eps|bmp|gif|webp|svg)$/i.test(ext) || ftype.startsWith("image/");
  const isDocx = /\.(docx|doc)$/i.test(ext);

  if (isPdf) return { kind: "pdf", kindLabel: "PDF", icon: IcPdf };
  if (isExcel) return { kind: "excel", kindLabel: ext.replace(".", "").toUpperCase(), icon: IcExcel };
  if (isImg) return { kind: "image", kindLabel: (ext.replace(".", "") || ftype.split("/")[1] || "image").toUpperCase(), icon: IcImg };
  if (isDocx) return { kind: "doc", kindLabel: ext.replace(".", "").toUpperCase(), icon: IcPdf };
  return { kind: "doc", kindLabel: ext.replace(".", "").toUpperCase() || "FILE", icon: IcPdf };
}

// Validate a file against an `accept` attribute string (comma-separated
// extensions and/or MIME types, e.g. ".pdf,.docx" or "image/*").
function matchesAccept(file: File, accept: string): boolean {
  const tokens = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;
  const ext = (file.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
  const mime = (file.type || "").toLowerCase();
  return tokens.some((tok) => {
    if (tok.startsWith(".")) return ext === tok;
    if (tok.endsWith("/*")) return mime.startsWith(tok.slice(0, -1));
    return mime === tok;
  });
}

function isWebImage(file: File): boolean {
  const ext = (file.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
  const ftype = (file.type || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(ext) || /^image\/(png|jpeg|gif|webp|svg\+xml|bmp)$/.test(ftype);
}

// ── File preview (async metadata enrichment) ──
function FilePreview({
  file,
  slot,
  onRemove,
  onReplace,
}: {
  file: File;
  slot: Slot;
  onRemove: () => void;
  onReplace: () => void;
}) {
  const { t } = useLang();
  const { kind, kindLabel, icon } = classify(file);
  const [status, setStatus] = useState<"pending" | "ready" | "error">("pending");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isWebImage(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          setThumbUrl(url);
          setDims({ w: img.naturalWidth, h: img.naturalHeight });
          setStatus("ready");
        };
        img.onerror = () => !cancelled && setStatus("error");
        img.src = url;
      };
      reader.onerror = () => !cancelled && setStatus("error");
      reader.readAsDataURL(file);
    } else {
      // Non-web-image types (PDF/TIFF/AI/EPS/Excel/DOCX): heavy rasterization
      // preview is deferred to the preview step; mark ready with the kind icon.
      setStatus("ready");
    }
    return () => {
      cancelled = true;
    };
  }, [file]);

  const dateStr = formatDate(file.lastModified);
  // The file type is already shown as the `DOCX`/`PDF` chip — omit the raw MIME
  // string (it's noise and its unbreakable length blew out the grid column).
  const modifiedLine = dateStr ? `Modified: ${dateStr}` : "";

  return (
    <div className="file-info" style={{ display: "block" }}>
      <div className="file-info-row">
        <div className={`file-thumb ${kind}`}>
          {thumbUrl ? <img src={thumbUrl} alt="" /> : icon}
        </div>
        <div className="file-details">
          <div className="file-name-row">
            <span className="file-name" title={file.name}>{file.name}</span>
            {status !== "ready" && (
              <span className={`file-status ${status}`} role="status" aria-live="polite">
                {status === "pending" && <><span className="spin" /> {t("parsing")}</>}
                {status === "error" && <>{t("parseError")}</>}
              </span>
            )}
          </div>
          <div className="file-meta">
            <span><strong>{kindLabel}</strong></span>
            <span className="sep">·</span>
            <span>{formatBytes(file.size)}</span>
            {dims && (
              <span className="meta-extra">
                <span className="sep">·</span>
                <span>{dims.w} × {dims.h}px</span>
              </span>
            )}
          </div>
          {modifiedLine && <div className="file-modified">{modifiedLine}</div>}
        </div>
        <div className="file-actions">
          <button
            className="file-remove"
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title={t("remove")}
            aria-label={t("remove")}
          >
            {IcX}
          </button>
          <button
            className="file-replace"
            type="button"
            onClick={(e) => { e.stopPropagation(); onReplace(); }}
            title={t("replace")}
          >
            {IcRefresh}<span>{t("replace")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export type ScanStatus = "idle" | "scanning" | "done" | "error";
export type SlotFiles = Record<Slot, File | null>;

export default function UploadZone({
  scanStatus,
  scanMs,
  onVerify,
  onReset,
  onFilesChange,
}: {
  scanStatus: ScanStatus;
  scanMs?: number | null;
  onVerify: (files: SlotFiles) => void;
  onReset: () => void;
  onFilesChange?: () => void;
}) {
  const { t } = useLang();
  const [files, setFiles] = useState<Record<Slot, File | null>>({ doc: null, art: null });
  const [dropError, setDropError] = useState<Record<Slot, DropError>>({ doc: null, art: null });
  const inputRefs = { doc: useRef<HTMLInputElement>(null), art: useRef<HTMLInputElement>(null) };

  const setFile = (slot: Slot, file: File) => {
    setDropError((prev) => ({ ...prev, [slot]: null }));
    setFiles((prev) => ({ ...prev, [slot]: file }));
    onFilesChange?.(); // any file change invalidates the previous scan
  };
  // Accept the file only if it matches the zone's `accept` list and size limit;
  // otherwise flag the reason ("type" | "size") and ignore the file. Applies to
  // both drag-and-drop and the file picker (which only filters type, not size).
  const acceptFile = (slot: Slot, accept: string, file: File, maxSize?: number) => {
    if (!matchesAccept(file, accept)) {
      setDropError((prev) => ({ ...prev, [slot]: "type" }));
    } else if (maxSize && file.size > maxSize) {
      setDropError((prev) => ({ ...prev, [slot]: "size" }));
    } else {
      setFile(slot, file);
    }
  };
  const removeFile = (slot: Slot) => {
    setDropError((prev) => ({ ...prev, [slot]: null }));
    setFiles((prev) => ({ ...prev, [slot]: null }));
    if (inputRefs[slot].current) inputRefs[slot].current!.value = "";
    onFilesChange?.();
  };
  const openPicker = (slot: Slot) => inputRefs[slot].current?.click();
  const replaceFile = (slot: Slot) => {
    if (inputRefs[slot].current) inputRefs[slot].current!.value = "";
    openPicker(slot);
  };
  const reset = () => {
    setFiles({ doc: null, art: null });
    setDropError({ doc: null, art: null });
    (["doc", "art"] as Slot[]).forEach((s) => {
      if (inputRefs[s].current) inputRefs[s].current!.value = "";
    });
    onReset();
  };

  return (
    <>
      <div className="upload-grid">
          {ZONES.map((zone) => {
            const file = files[zone.slot];
            return (
              <div key={zone.slot}>
                <label className="upload-label" htmlFor={`aq-upload-${zone.slot}`}>{t(zone.labelKey)}</label>
                <div
                  className={`upload-zone${file ? " has-file" : ""}`}
                  onClick={() => !file && openPicker(zone.slot)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) acceptFile(zone.slot, zone.accept, e.dataTransfer.files[0], zone.maxSize);
                  }}
                >
                  <input
                    ref={inputRefs[zone.slot]}
                    id={`aq-upload-${zone.slot}`}
                    type="file"
                    accept={zone.accept}
                    onChange={(e) => {
                      if (e.target.files?.[0]) acceptFile(zone.slot, zone.accept, e.target.files[0], zone.maxSize);
                    }}
                  />
                  {!file ? (
                    <div>
                      {IcUpload}
                      <p className="hint">{t("dropOr")} <span className="accent">{t("browse")}</span></p>
                      {dropError[zone.slot] ? (
                        <p className="sub sub-error" role="alert">
                          {dropError[zone.slot] === "size" ? t("dropTooLarge") : t("dropRejected")}
                        </p>
                      ) : (
                        <p className="sub">{t(zone.formatsKey)}</p>
                      )}
                    </div>
                  ) : (
                    <FilePreview
                      file={file}
                      slot={zone.slot}
                      onRemove={() => removeFile(zone.slot)}
                      onReplace={() => replaceFile(zone.slot)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

      <div className="verify-row">
        <button className="btn-reset" type="button" onClick={reset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <polyline points="3 3 3 8 8 8" />
          </svg>
          <span>{t("reset")}</span>
        </button>
        <button
          className={`btn-verify${scanStatus === "done" ? " is-scanned" : ""}${scanStatus === "error" ? " is-error" : ""}`}
          type="button"
          disabled={scanStatus === "scanning" || (scanStatus !== "done" && (!files.doc || !files.art))}
          onClick={() => { if (scanStatus === "idle" || scanStatus === "error") onVerify(files); }}
        >
          {scanStatus === "scanning" ? (
            <><span className="spinner" /><span>{t("analyzing")}</span></>
          ) : scanStatus === "done" ? (
            <>{IcCheck}<span>{t("scanned")}</span></>
          ) : scanStatus === "error" ? (
            <>{IcRefresh}<span>{t("retry")}</span></>
          ) : (
            t("verify")
          )}
        </button>
      </div>
    </>
  );
}
