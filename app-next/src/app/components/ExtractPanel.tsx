"use client";

import { useMemo, useState } from "react";
import { charDiff, computeLineDiff, type DiffLine, type LineType } from "../lib/diff";
import { TEXT_A, TEXT_B } from "../lib/mockData";

const IcCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcCopy = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IcChevD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcChevU = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IcAlertC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcLines = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="5" y1="15" x2="19" y2="15" />
  </svg>
);
const IcPlus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcMinus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

type Filter = "all" | "modified" | "added" | "removed";

const STAT_CARDS: { key: LineType; label: string; co: string; icon: React.ReactNode }[] = [
  { key: "modified", label: "Modified", co: "yellow", icon: IcLines },
  { key: "added", label: "Added", co: "green", icon: IcPlus },
  { key: "removed", label: "Missing", co: "red", icon: IcMinus },
  { key: "unchanged", label: "Unchanged", co: "muted", icon: IcCheck },
];

const SYMBOL: Record<LineType, string> = { added: "+", removed: "−", modified: "≠", unchanged: "=" };
const SYMBOL_COLOR: Record<LineType, string> = {
  added: "var(--green)",
  removed: "var(--red)",
  modified: "var(--yellow)",
  unchanged: "var(--fg-faint)",
};

function CharSegs({ segs, side }: { segs: ReturnType<typeof charDiff>["a"]; side: "a" | "b" }) {
  return (
    <>
      {segs.map((seg, i) => {
        if (seg.t === "eq") return <span key={i}>{seg.s}</span>;
        const cls = side === "a" ? "char-del" : "char-ins";
        return <span key={i} className={cls}>{seg.s}</span>;
      })}
    </>
  );
}

function DiffRow({ line }: { line: DiffLine }) {
  let colA: React.ReactNode;
  let colB: React.ReactNode;
  if (line.type === "modified") {
    const cd = charDiff(line.lineA || "", line.lineB || "");
    colA = <CharSegs segs={cd.a} side="a" />;
    colB = <CharSegs segs={cd.b} side="b" />;
  } else {
    colA = line.lineA !== undefined ? line.lineA : <span className="diff-empty">—</span>;
    colB = line.lineB !== undefined ? line.lineB : <span className="diff-empty">—</span>;
  }
  const rowClass = line.type !== "unchanged" ? `diff-${line.type}` : "";
  return (
    <tr className={rowClass}>
      <td>{line.n}</td>
      <td>{colA}</td>
      <td>{colB}</td>
      <td style={{ color: SYMBOL_COLOR[line.type] }}>{SYMBOL[line.type]}</td>
    </tr>
  );
}

function CollapsePanel({ label, text, color }: { label: string; text: string; color: string }) {
  const [open, setOpen] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
  };
  return (
    <div className="collapse-panel">
      <button className="collapse-header" onClick={() => setOpen((o) => !o)}>
        <span className="left" style={{ color }}>{label}</span>
        <span className="right">
          <span
            role="button"
            tabIndex={0}
            aria-label="Copy"
            onClick={copy}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copy(e as unknown as React.MouseEvent); }
            }}
            style={{ display: "inline-flex", color: "var(--fg-faint)" }}
          >
            {IcCopy}
          </span>
          <span>{open ? IcChevU : IcChevD}</span>
        </span>
      </button>
      <div className={`collapse-body${open ? " open" : ""}`}>
        <pre>{text}</pre>
      </div>
    </div>
  );
}

export default function ExtractPanel({
  textA = TEXT_A,
  textB = TEXT_B,
  dismissed,
}: {
  textA?: string;
  textB?: string;
  dismissed?: Set<number>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const diff = useMemo(() => {
    const base = computeLineDiff(textA, textB);
    if (!dismissed || dismissed.size === 0) return base;
    // A mismatch dismissed in the image preview is treated as resolved here too.
    return base.map((d) =>
      dismissed.has(d.n) && d.type !== "unchanged" ? { ...d, type: "unchanged" as LineType } : d
    );
  }, [textA, textB, dismissed]);

  const counts = useMemo(() => {
    const c = { modified: 0, added: 0, removed: 0, unchanged: 0 } as Record<LineType, number>;
    diff.forEach((d) => c[d.type]++);
    return c;
  }, [diff]);

  const sim = diff.length ? Math.round((counts.unchanged / diff.length) * 100) : 0;
  const rows = diff.filter((d) => filter === "all" || d.type === filter);

  return (
    <>
      <div className="stats-grid cols-4">
        {STAT_CARDS.map((s) => (
          <div className="stat-card" key={s.key}>
            <div className={`stat-icon bg-${s.co}-light`}>
              <span style={{ color: s.co === "muted" ? "var(--fg-faint)" : `var(--${s.co})` }}>{s.icon}</span>
            </div>
            <div className={`stat-value text-${s.co}`}>{counts[s.key]}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div id="raw-panels">
        <CollapsePanel label="Document — Extracted Text" text={textA} color="var(--blue)" />
        <CollapsePanel label="Image/PDF — Extracted Text" text={textB} color="var(--purple)" />
      </div>

      <div className="diff-container">
        <div className="diff-header">
          <h3>File Comparison</h3>
          <div className="filter-btns">
            {(["all", "modified", "added", "removed"] as Filter[]).map((f) => (
              <button
                key={f}
                className={`filter-btn${filter === f ? " active" : ""}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === "removed" ? "missing" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="diff-table-wrap">
          <table className="diff-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Document</th>
                <th scope="col">Comparison File</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((line) => (
                <DiffRow key={line.n} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="alert alert-blue">
        {IcAlertC}
        <div>
          <div className="alert-title">Comparison Summary</div>
          <div className="alert-body">
            Found <strong style={{ color: "var(--yellow)" }}>{counts.modified} modified</strong>,{" "}
            <strong style={{ color: "var(--green)" }}>{counts.added} added</strong>,{" "}
            <strong style={{ color: "var(--red)" }}>{counts.removed} missing lines out of</strong>{" "}
            {diff.length} total. Similarity: <strong>{sim}%</strong>
          </div>
        </div>
      </div>
    </>
  );
}
