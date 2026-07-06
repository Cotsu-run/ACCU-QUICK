"use client";

import { GRAMMAR, type GrammarIssue } from "../lib/mockData";

const IcAlertT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function LanguagePanel({
  detectedLanguage = "English",
  isoCode = "EN",
  flag = "🇺🇸",
  confidence = 98.7,
  grammar = GRAMMAR,
}: {
  detectedLanguage?: string;
  isoCode?: string;
  flag?: string;
  confidence?: number;
  grammar?: GrammarIssue[];
}) {
  const medium = grammar.filter((g) => g.severity === "medium").length;
  const low = grammar.filter((g) => g.severity === "low").length;

  return (
    <>
      <div className="lang-results-grid">
        <div className="lang-card">
          <div className="lbl">Detected Language</div>
          <div className="lang-detected">
            <span className="flag">{flag}</span>
            <div>
              <div className="name">{detectedLanguage}</div>
              <div className="code">ISO 639-1: {isoCode}</div>
            </div>
          </div>
        </div>
        <div className="lang-card">
          <div className="lbl">Confidence Score</div>
          <div className="confidence-value">{confidence}%</div>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${Math.round(confidence)}%` }} />
          </div>
        </div>
        <div className="lang-card">
          <div className="lbl">Grammar Issues</div>
          <div className="grammar-count">{grammar.length}</div>
          <div className="grammar-detail">{medium} medium, {low} low</div>
        </div>
      </div>

      <div className="grammar-panel">
        <div className="grammar-panel-header">
          {IcAlertT} Grammar &amp; Style Issues
        </div>
        {grammar.map((g, i) => (
          <div className="grammar-item" key={i}>
            <span className={`severity-badge severity-${g.severity}`}>{g.severity}</span>
            <div>
              <div className="msg">{g.message}</div>
              <div className="meta">Line {g.line} · {g.type}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
