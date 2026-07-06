"use client";

import { useState } from "react";
import { SPECS, type SpecCat, type SpecRow, type SpecStatus } from "../lib/mockData";

const IcCheckC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IcXC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const IcAlertC = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcEye = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IcDl = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CAT_ICONS: Record<SpecCat, React.ReactNode> = {
  Dimensions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" />
    </svg>
  ),
  Colors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  Typography: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  Images: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Barcodes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
};

const CATEGORIES: ("All" | SpecCat)[] = ["All", "Dimensions", "Colors", "Typography", "Images", "Barcodes"];
const CIRCUMFERENCE = 213.6; // 2π·34

function statusIcon(status: SpecStatus) {
  if (status === "pass") return <span style={{ color: "var(--green)" }}>{IcCheckC}</span>;
  if (status === "fail") return <span style={{ color: "var(--red)" }}>{IcXC}</span>;
  return <span style={{ color: "var(--yellow)" }}>{IcAlertC}</span>;
}

export default function SpecPanel({ specs = SPECS }: { specs?: SpecRow[] }) {
  const [cat, setCat] = useState<"All" | SpecCat>("All");
  const [failOnly, setFailOnly] = useState(false);

  const counts = { pass: 0, fail: 0, warning: 0 };
  specs.forEach((s) => counts[s.status]++);
  const total = specs.length;
  const score = total ? Math.round((counts.pass / total) * 100) : 0;
  const sColor = score >= 80 ? "var(--green)" : score >= 60 ? "var(--yellow)" : "var(--red)";
  const dash = (score / 100) * CIRCUMFERENCE;

  const filtered = specs
    .filter((s) => cat === "All" || s.cat === cat)
    .filter((s) => !failOnly || s.status !== "pass");

  const fails = specs.filter((s) => s.status === "fail");

  const statCards: { label: string; c: number; co: string; ic: React.ReactNode }[] = [
    { label: "Passed", c: counts.pass, co: "green", ic: IcCheckC },
    { label: "Failed", c: counts.fail, co: "red", ic: IcXC },
    { label: "Warnings", c: counts.warning, co: "yellow", ic: IcAlertC },
  ];

  return (
    <>
      <div className="stats-grid score-grid">
        <div className="score-card">
          <div className="score-ring">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--score-ring-track)" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={sColor} strokeWidth="8" strokeDasharray={`${dash} ${CIRCUMFERENCE}`} strokeLinecap="round" />
            </svg>
            <div className="score-text" style={{ color: sColor }}>{score}%</div>
          </div>
          <div className="stat-label">Compliance Score</div>
        </div>
        {statCards.map((s) => (
          <div className="stat-card-h" key={s.label}>
            <div className={`stat-icon bg-${s.co}-light`} style={{ color: `var(--${s.co})` }}>{s.ic}</div>
            <div>
              <div className={`stat-value text-${s.co}`}>{s.c}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="controls-bar">
        <div className="cat-bar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`cat-btn${cat === c ? " active" : ""}`}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
            >
              {c !== "All" && CAT_ICONS[c]} {c}
            </button>
          ))}
        </div>
        <div className="controls-right">
          <button
            className="btn-sm"
            aria-pressed={failOnly}
            style={failOnly ? { background: "rgba(212,24,61,0.06)", borderColor: "rgba(212,24,61,0.3)", color: "var(--red)" } : undefined}
            onClick={() => setFailOnly((v) => !v)}
          >
            {IcEye} Show Failed Only
          </button>
          <button className="btn-sm">{IcDl} Export Report</button>
        </div>
      </div>

      <div className="spec-table-wrap">
        <table className="spec-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Specification</th>
              <th scope="col">Expected</th>
              <th scope="col">Actual</th>
              <th scope="col" style={{ textAlign: "center" }}>Status</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const rc = s.status === "fail" ? "spec-fail" : s.status === "warning" ? "spec-warning" : "";
              return (
                <tr key={s.id} className={rc}>
                  <td><span className="spec-cat">{CAT_ICONS[s.cat]} {s.cat}</span></td>
                  <td><span className="spec-name">{s.spec}</span></td>
                  <td><code className="spec-code">{s.expected}</code></td>
                  <td><code className={`spec-code ${s.status}`}>{s.actual}</code></td>
                  <td className="spec-status">{statusIcon(s.status)}</td>
                  <td><span className="spec-detail">{s.details || ""}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {counts.fail > 0 && (
        <div className="alert alert-red" style={{ marginTop: 16 }}>
          {IcXC}
          <div>
            <div className="alert-title">Critical Issues Requiring Attention</div>
            <ul>
              {fails.map((s) => (
                <li key={s.id}>
                  <strong>{s.cat} — {s.spec}:</strong> {s.details || `Expected ${s.expected}, got ${s.actual}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
