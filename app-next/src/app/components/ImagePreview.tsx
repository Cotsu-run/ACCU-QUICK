"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { charDiff, computeLineDiff, type LineType } from "../lib/diff";
import { useLang } from "../lib/LanguageContext";
import type { LineBox } from "../lib/ocr";

const IcEye = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IcAlert = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const IcDownload = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Marker colours for the composited download (match the .mark-box-* styles).
const MARK_COLORS: Record<string, { stroke: string; fill: string }> = {
  modified: { stroke: "#be123c", fill: "rgba(190,18,57,0.10)" },
  added: { stroke: "#16a34a", fill: "rgba(34,197,94,0.10)" },
  removed: { stroke: "#d97706", fill: "rgba(245,158,11,0.10)" },
};

const IcZoomIn = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const IcZoomOut = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const IcReset = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const IcExpand = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);
const IcCompress = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

const IcFrame = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 3" />
  </svg>
);
const IcComment = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ANNO_COLOR = "#2563eb"; // user annotation colour (blue)
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;

type Annotation =
  | { id: string; kind: "frame"; page: number; x: number; y: number; w: number; h: number }
  | { id: string; kind: "comment"; page: number; x: number; y: number; text: string };

const uid = () => Math.random().toString(36).slice(2, 9);

const PAD = 4; // % padding around the marker band (matches prototype's 4%)

type Mark = { key: string; page: number; fx: number; fy: number; fw: number; fh: number; type: LineType };

// Word-level LCS between the source words and the comparison words; returns the
// indices of comparison words that changed/were added (the "specific points").
function changedCmpWordIdx(aWords: string[], bWords: string[]): Set<number> {
  const n = aWords.length;
  const m = bWords.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = aWords[i - 1] === bWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  let i = n;
  let j = m;
  const ins = new Set<number>();
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aWords[i - 1] === bWords[j - 1]) { i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { ins.add(j - 1); j--; }
    else { i--; }
  }
  return ins;
}

// Each discrepancy is labelled by origin: "Document" = the source data file,
// "Comparison" = the comparison file (the one shown in the preview).
function DocSide({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="mi-side">
      <span className="mi-origin mi-origin-doc">{t("origDoc")}</span>
      <span className="mi-val">{children}</span>
    </div>
  );
}
function CmpSide({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="mi-side">
      <span className="mi-origin mi-origin-cmp">{t("origCmp")}</span>
      <span className="mi-val">{children}</span>
    </div>
  );
}

function Absent() {
  const { t } = useLang();
  return <span className="mi-absent">{t("notPresent")}</span>;
}

// Every change shows BOTH sides: the original version (Document) and how the
// comparison file renders it (Comparison). An absent side is marked explicitly.
function MismatchText({ type, lineA, lineB }: { type: LineType; lineA?: string; lineB?: string }) {
  if (type === "unchanged") {
    // Matching line — both sides identical, no highlighting.
    return (
      <>
        <DocSide>{lineA}</DocSide>
        <CmpSide>{lineB}</CmpSide>
      </>
    );
  }
  if (type === "modified") {
    const cd = charDiff(lineA || "", lineB || "");
    return (
      <>
        <DocSide>
          {cd.a.map((s, i) => (s.t === "del" ? <span key={`a${i}`} className="char-del">{s.s}</span> : <span key={`a${i}`}>{s.s}</span>))}
        </DocSide>
        <CmpSide>
          {cd.b.map((s, i) => (s.t === "ins" ? <span key={`b${i}`} className="char-ins">{s.s}</span> : <span key={`b${i}`}>{s.s}</span>))}
        </CmpSide>
      </>
    );
  }
  // "added" = present only in the Comparison; "removed"/missing = present only in the Document.
  if (type === "added") {
    return (
      <>
        <DocSide><Absent /></DocSide>
        <CmpSide><span className="char-ins">{lineB}</span></CmpSide>
      </>
    );
  }
  return (
    <>
      <DocSide><span className="char-del">{lineA}</span></DocSide>
      <CmpSide><Absent /></CmpSide>
    </>
  );
}

export default function ImagePreview({
  artUrls,
  fileName,
  textA,
  textB,
  boxes = [],
  dismissed,
  onDismiss,
}: {
  artUrls: string[];
  fileName: string;
  textA: string;
  textB: string;
  boxes?: LineBox[];
  dismissed: Set<number>;
  onDismiss: (n: number) => void;
}) {
  const { t } = useLang();
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z * ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z / ZOOM_STEP).toFixed(2)));
  const resetZoom = () => setZoom(1);

  const paneRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === paneRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else paneRef.current?.requestFullscreen?.();
  };

  // Manual annotations: draw frames and place typed comments on the artwork.
  const [tool, setTool] = useState<"none" | "frame" | "comment">("none");
  const [annos, setAnnos] = useState<Annotation[]>([]);
  const [draft, setDraft] = useState<null | { page: number; x0: number; y0: number; x: number; y: number }>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const removeAnno = (id: string) => setAnnos((a) => a.filter((x) => x.id !== id));

  // Confirmation modal before dismissing a discrepancy row.
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const confirmDelete = () => {
    if (pendingDelete != null) onDismiss(pendingDelete);
    setPendingDelete(null);
  };
  const frac = (e: React.PointerEvent | React.MouseEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };
  const onSurfaceDown = (e: React.PointerEvent, page: number) => {
    if (tool !== "frame") return;
    const { fx, fy } = frac(e, e.currentTarget as HTMLElement);
    setDraft({ page, x0: fx, y0: fy, x: fx, y: fy });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer (e.g. synthetic event) */
    }
  };
  const onSurfaceMove = (e: React.PointerEvent) => {
    if (!draft) return;
    const { fx, fy } = frac(e, e.currentTarget as HTMLElement);
    setDraft((d) => (d ? { ...d, x: fx, y: fy } : d));
  };
  const onSurfaceUp = () => {
    if (!draft) return;
    const x = Math.min(draft.x0, draft.x);
    const y = Math.min(draft.y0, draft.y);
    const w = Math.abs(draft.x - draft.x0);
    const h = Math.abs(draft.y - draft.y0);
    if (w > 0.01 && h > 0.01) setAnnos((a) => [...a, { id: uid(), kind: "frame", page: draft.page, x, y, w, h }]);
    setDraft(null);
  };
  const onSurfaceClick = (e: React.MouseEvent, page: number) => {
    if (tool !== "comment") return;
    const { fx, fy } = frac(e, e.currentTarget as HTMLElement);
    const id = uid();
    setAnnos((a) => [...a, { id, kind: "comment", page, x: fx, y: fy, text: "" }]);
    setEditing(id);
    setTool("none");
  };
  const commitComment = (id: string, text: string) => {
    const t = text.trim();
    if (!t) removeAnno(id);
    else setAnnos((a) => a.map((x) => (x.id === id && x.kind === "comment" ? { ...x, text: t } : x)));
    setEditing(null);
  };
  const boxByLine = useMemo(() => {
    const m = new Map<number, LineBox>();
    boxes.forEach((b) => m.set(b.n, b));
    return m;
  }, [boxes]);
  const { mismatches, allItems, maxLines } = useMemo(() => {
    const diff = computeLineDiff(textA, textB);
    // A dismissed line is treated as matching (unchanged).
    const items = diff.map((d, idx) => ({
      ...d,
      idx,
      type: dismissed.has(d.n) ? ("unchanged" as LineType) : d.type,
    }));
    const ms = items.filter((d) => d.type !== "unchanged");
    return { mismatches: ms, allItems: items, maxLines: Math.max(diff.length, 1) };
  }, [textA, textB, dismissed]);

  const counts = { modified: 0, added: 0, removed: 0 } as Record<Exclude<LineType, "unchanged">, number>;
  mismatches.forEach((m) => counts[m.type as Exclude<LineType, "unchanged">]++);
  const total = mismatches.length;

  const pageCount = Math.max(artUrls.length, 1);
  const linesPerPage = Math.max(Math.ceil(maxLines / pageCount), 1);
  const pageBandH = (100 - PAD * 2) / linesPerPage; // % height per line within a page

  // Enclose only the specific changed word(s) of each discrepancy, coloured by
  // type. Falls back to the whole line, then to the approximate band.
  const marksFor = (m: { n: number; idx: number; type: LineType; lineA?: string; lineB?: string }): Mark[] => {
    if (m.type === "removed") return []; // missing text isn't present in the comparison image
    const box = boxByLine.get(m.n);
    if (!box) {
      const page = Math.floor(m.idx / linesPerPage);
      const localIdx = m.idx - page * linesPerPage;
      return [{ key: `${m.idx}-est`, page, fx: PAD / 100, fy: (PAD + localIdx * pageBandH) / 100, fw: (100 - PAD * 2) / 100, fh: pageBandH / 100, type: m.type }];
    }
    const bWords = box.words.map((w) => w.text);
    const aWords = (m.lineA ?? "").split(/\s+/).filter(Boolean);
    const changed = m.type === "added" ? new Set(bWords.map((_, i) => i)) : changedCmpWordIdx(aWords, bWords);
    const marks: Mark[] = [...changed]
      .filter((i) => box.words[i])
      .map((i) => {
        const w = box.words[i];
        return { key: `${m.idx}-${i}`, page: box.page, fx: w.x, fy: w.y, fw: w.w, fh: w.h, type: m.type };
      });
    // If nothing lined up, frame the whole detected line instead.
    return marks.length ? marks : [{ key: `${m.idx}-line`, page: box.page, fx: box.x, fy: box.y, fw: box.w, fh: box.h, type: m.type }];
  };
  const allMarks = mismatches.flatMap((m) => marksFor(m));

  // Download the preview with the discrepancy boxes drawn onto the actual image,
  // one file per page.
  const downloadAnnotated = async () => {
    const base = fileName.replace(/\.[^.]+$/, "") || "preview";
    for (let p = 0; p < artUrls.length; p++) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = artUrls[p];
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      allMarks.forEach((mk) => {
        if (mk.page !== p) return;
        const x = mk.fx * canvas.width;
        const y = mk.fy * canvas.height;
        const w = mk.fw * canvas.width;
        const h = mk.fh * canvas.height;
        const col = MARK_COLORS[mk.type] ?? MARK_COLORS.modified;
        ctx.fillStyle = col.fill;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = col.stroke;
        ctx.lineWidth = Math.max(2, canvas.width / 400);
        ctx.strokeRect(x, y, w, h);
      });
      // User frames + typed comments, baked into the downloaded image.
      const fs = Math.max(16, Math.round(canvas.width / 45)); // comment font size
      annos.forEach((an) => {
        if (an.page !== p) return;
        if (an.kind === "frame") {
          ctx.strokeStyle = ANNO_COLOR;
          ctx.lineWidth = Math.max(2, canvas.width / 350);
          ctx.strokeRect(an.x * canvas.width, an.y * canvas.height, an.w * canvas.width, an.h * canvas.height);
        } else {
          const px = an.x * canvas.width;
          const py = an.y * canvas.height;
          ctx.font = `600 ${fs}px sans-serif`;
          const padX = fs * 0.5;
          const padY = fs * 0.35;
          const tw = ctx.measureText(an.text).width;
          const bw = tw + padX * 2;
          const bh = fs + padY * 2;
          ctx.fillStyle = ANNO_COLOR;
          ctx.beginPath();
          const rr = 6;
          ctx.roundRect(px, py, bw, bh, rr);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.textBaseline = "middle";
          ctx.fillText(an.text, px + padX, py + bh / 2);
        }
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = artUrls.length > 1 ? `${base}-annotated-p${p + 1}.png` : `${base}-annotated.png`;
      a.click();
    }
  };

  return (
    <div className="preview-section">
      <div className="preview-header">
        <h3>{IcEye} {t("imagePreview")}</h3>
        <div className="preview-legend">
          <span><span className="swatch swatch-red" />{t("legModified")}</span>
          <span><span className="swatch swatch-green" />{t("legAdded")}</span>
          <span><span className="swatch swatch-yellow" />{t("legMissing")}</span>
        </div>
      </div>

      <div className="preview-layout">
        <div className="preview-pane" ref={paneRef}>
          <div className="preview-pane-header">
            <span className="pane-dot" style={{ background: "var(--purple)" }} />
            {fileName}
            {pageCount > 1 && <span className="pane-pages">{pageCount} {t("pages")}</span>}
          </div>
          <div className="preview-canvas-wrap">
            <div
              className="preview-zoom-layer"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              {artUrls.map((url, p) => (
                <div className="preview-img-box" key={p}>
                  {pageCount > 1 && <span className="page-badge">{t("page")} {p + 1}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Comparison preview page ${p + 1} with detected mismatches highlighted`} />
                  {allMarks
                    .filter((mk) => mk.page === p)
                    .map((mk) => (
                      <div
                        key={mk.key}
                        className={`mark-box mark-box-${mk.type}`}
                        style={{
                          top: `${mk.fy * 100}%`,
                          left: `${mk.fx * 100}%`,
                          width: `${mk.fw * 100}%`,
                          height: `${mk.fh * 100}%`,
                        }}
                      />
                    ))}
                  {/* User annotations */}
                  {annos
                    .filter((an) => an.page === p)
                    .map((an) =>
                      an.kind === "frame" ? (
                        <div
                          key={an.id}
                          className="anno-frame"
                          style={{ left: `${an.x * 100}%`, top: `${an.y * 100}%`, width: `${an.w * 100}%`, height: `${an.h * 100}%` }}
                        >
                          <button type="button" className="anno-del" onClick={() => removeAnno(an.id)} aria-label="Delete frame">×</button>
                        </div>
                      ) : (
                        <div key={an.id} className="anno-comment" style={{ left: `${an.x * 100}%`, top: `${an.y * 100}%` }}>
                          {editing === an.id ? (
                            <input
                              className="anno-input"
                              autoFocus
                              defaultValue={an.text}
                              placeholder="Comment…"
                              onBlur={(e) => commitComment(an.id, e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") commitComment(an.id, ""); }}
                            />
                          ) : (
                            <span className="anno-bubble" onClick={() => setEditing(an.id)}>
                              {an.text}
                              <button type="button" className="anno-del" onClick={(e) => { e.stopPropagation(); removeAnno(an.id); }} aria-label="Delete comment">×</button>
                            </span>
                          )}
                        </div>
                      )
                    )}
                  {draft && draft.page === p && (
                    <div
                      className="anno-frame anno-draft"
                      style={{
                        left: `${Math.min(draft.x0, draft.x) * 100}%`,
                        top: `${Math.min(draft.y0, draft.y) * 100}%`,
                        width: `${Math.abs(draft.x - draft.x0) * 100}%`,
                        height: `${Math.abs(draft.y - draft.y0) * 100}%`,
                      }}
                    />
                  )}
                  {tool !== "none" && (
                    <div
                      className={`anno-surface anno-surface-${tool}`}
                      onPointerDown={(e) => onSurfaceDown(e, p)}
                      onPointerMove={onSurfaceMove}
                      onPointerUp={onSurfaceUp}
                      onClick={(e) => onSurfaceClick(e, p)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Floating toolbar overlay inside the preview frame */}
          <div className="aq-float" role="toolbar" aria-label="Preview tools">
            <button type="button" className="aq-float-btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">
              {IcZoomOut}
            </button>
            <span className="aq-float-pct" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" className="aq-float-btn" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">
              {IcZoomIn}
            </button>
            <span className="aq-float-sep" />
            <button type="button" className="aq-float-btn" onClick={resetZoom} disabled={zoom === 1} aria-label="Reset zoom">
              {IcReset}
            </button>
            <span className="aq-float-sep" />
            <button
              type="button"
              className={`aq-float-btn${tool === "frame" ? " is-active" : ""}`}
              onClick={() => setTool((v) => (v === "frame" ? "none" : "frame"))}
              aria-pressed={tool === "frame"}
              aria-label="Draw frame"
            >
              {IcFrame}
            </button>
            <button
              type="button"
              className={`aq-float-btn${tool === "comment" ? " is-active" : ""}`}
              onClick={() => setTool((v) => (v === "comment" ? "none" : "comment"))}
              aria-pressed={tool === "comment"}
              aria-label="Add comment"
            >
              {IcComment}
            </button>
            <span className="aq-float-sep" />
            <button type="button" className="aq-float-btn" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Full screen"}>
              {isFullscreen ? IcCompress : IcExpand}
            </button>
          </div>
        </div>

        <div className="mismatch-panel">
          <div className="mismatch-panel-header">
            {IcAlert} {t("mismatchesTitle")}
            <span className="mismatch-total-badge">{total}</span>
          </div>
          <div className="mismatch-counts">
            <div className="mismatch-count-item">
              <div className="mc-value" style={{ color: "var(--red)" }}>{counts.modified}</div>
              <div className="mc-label">{t("legModified")}</div>
            </div>
            <div className="mismatch-count-item">
              <div className="mc-value" style={{ color: "var(--green)" }}>{counts.added}</div>
              <div className="mc-label">{t("legAdded")}</div>
            </div>
            <div className="mismatch-count-item">
              <div className="mc-value" style={{ color: "var(--yellow)" }}>{counts.removed}</div>
              <div className="mc-label">{t("legMissing")}</div>
            </div>
          </div>
          <div className="mismatch-list">
            {allItems.length === 0 ? (
              <div className="mismatch-empty">{t("noMismatches")}</div>
            ) : (
              allItems.map((m) => {
                const pageNo = Math.floor(m.idx / linesPerPage) + 1;
                return (
                <div className="mismatch-item" key={m.idx}>
                  <span className={`mi-line mi-line-${m.type}`}>{m.n}</span>
                  <span className="mi-text">
                    <div className="mi-loc">{pageCount > 1 && <>{t("page")} {pageNo} · </>}{t("line")} {m.n}</div>
                    <MismatchText type={m.type} lineA={m.lineA} lineB={m.lineB} />
                  </span>
                  {m.type !== "unchanged" && (
                    <button
                      className="mi-delete"
                      type="button"
                      aria-label={`Dismiss mismatch on line ${m.n}`}
                      onClick={() => setPendingDelete(m.n)}
                    >
                      {IcTrash}
                    </button>
                  )}
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="preview-save-row">
        <button className="btn-download" type="button" onClick={downloadAnnotated}>
          {IcDownload} {t("download")}
        </button>
      </div>

      {pendingDelete != null && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="del-modal-title" onClick={() => setPendingDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{IcTrash}</div>
            <h3 id="del-modal-title" className="modal-title">{t("delConfirmTitle")}</h3>
            <p className="modal-body">{t("delConfirmBody")}</p>
            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setPendingDelete(null)}>
                {t("cancel")}
              </button>
              <button type="button" className="modal-btn modal-btn-danger" onClick={confirmDelete} autoFocus>
                {t("delConfirmBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
