"use client";

import { useMemo } from "react";
import { charDiff, computeLineDiff, type LineType } from "../lib/diff";
import { useLang } from "../lib/LanguageContext";

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

const PAD = 4; // % padding around the marker band (matches prototype's 4%)

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
  dismissed,
  onDismiss,
}: {
  artUrls: string[];
  fileName: string;
  textA: string;
  textB: string;
  dismissed: Set<number>;
  onDismiss: (n: number) => void;
}) {
  const { t } = useLang();
  const { mismatches, maxLines } = useMemo(() => {
    const diff = computeLineDiff(textA, textB);
    const ms = diff
      .map((d, idx) => ({ ...d, idx }))
      .filter((d) => d.type !== "unchanged" && !dismissed.has(d.n));
    return { mismatches: ms, maxLines: Math.max(diff.length, 1) };
  }, [textA, textB, dismissed]);

  const counts = { modified: 0, added: 0, removed: 0 } as Record<Exclude<LineType, "unchanged">, number>;
  mismatches.forEach((m) => counts[m.type as Exclude<LineType, "unchanged">]++);
  const total = mismatches.length;

  // Distribute the mismatch lines across the rendered pages, then position each
  // marker within its page (approximate line-index placement, per page).
  const pageCount = Math.max(artUrls.length, 1);
  const linesPerPage = Math.max(Math.ceil(maxLines / pageCount), 1);
  const pageBandH = (100 - PAD * 2) / linesPerPage; // % height per line within a page

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
        <div className="preview-pane">
          <div className="preview-pane-header">
            <span className="pane-dot" style={{ background: "var(--purple)" }} />
            {fileName}
            {pageCount > 1 && <span className="pane-pages">{pageCount} {t("pages")}</span>}
          </div>
          <div className="preview-canvas-wrap">
            {artUrls.map((url, p) => (
              <div className="preview-img-box" key={p}>
                {pageCount > 1 && <span className="page-badge">{t("page")} {p + 1}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Comparison preview page ${p + 1} with detected mismatches highlighted`} />
                {mismatches
                  .filter((m) => Math.floor(m.idx / linesPerPage) === p)
                  .map((m) => {
                    const localIdx = m.idx - p * linesPerPage;
                    return (
                      <div
                        key={m.idx}
                        className={`mark-box mark-box-${m.type}`}
                        style={{
                          top: `${PAD + localIdx * pageBandH}%`,
                          left: `${PAD}%`,
                          width: `${100 - PAD * 2}%`,
                          height: `${pageBandH}%`,
                        }}
                      />
                    );
                  })}
              </div>
            ))}
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
            {mismatches.length === 0 ? (
              <div className="mismatch-empty">{t("noMismatches")}</div>
            ) : (
              mismatches.map((m) => (
                <div className="mismatch-item" key={m.idx}>
                  <span className={`mi-line mi-line-${m.type}`}>{m.n}</span>
                  <span className="mi-text">
                    <MismatchText type={m.type} lineA={m.lineA} lineB={m.lineB} />
                  </span>
                  <button
                    className="mi-delete"
                    type="button"
                    aria-label={`Dismiss mismatch on line ${m.n}`}
                    onClick={() => onDismiss(m.n)}
                  >
                    {IcTrash}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
