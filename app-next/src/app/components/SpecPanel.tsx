"use client";

import { useState } from "react";
import { STANDARDS, STANDARD_REF, type StdStatus, type StdPart } from "../lib/mockData";
import { useLang } from "../lib/LanguageContext";

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
const IcDot = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const CIRCUMFERENCE = 213.6; // 2π·34
type Filter = "all" | StdPart;

export default function SpecPanel() {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<Filter>("all");
  const [statuses, setStatuses] = useState<Record<string, StdStatus>>({});

  const statusOf = (id: string): StdStatus => statuses[id] ?? "pending";
  const cycle = (id: string) =>
    setStatuses((prev) => {
      const cur = prev[id] ?? "pending";
      const next: StdStatus = cur === "pending" ? "pass" : cur === "pass" ? "fail" : "pending";
      return { ...prev, [id]: next };
    });

  const counts = { pass: 0, fail: 0, pending: 0 };
  STANDARDS.forEach((r) => counts[statusOf(r.id)]++);
  const total = STANDARDS.length;
  const score = total ? Math.round((counts.pass / total) * 100) : 0;
  const sColor = score >= 80 ? "var(--green)" : score >= 60 ? "var(--yellow)" : "var(--red)";
  const dash = (score / 100) * CIRCUMFERENCE;

  const filtered = STANDARDS.filter((r) => filter === "all" || r.part === filter);

  const statCards: { label: string; c: number; co: string; ic: React.ReactNode }[] = [
    { label: t("specPassed"), c: counts.pass, co: "green", ic: IcCheckC },
    { label: t("specFailed"), c: counts.fail, co: "red", ic: IcXC },
    { label: t("stdPending"), c: counts.pending, co: "muted", ic: IcDot },
  ];

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("specCatAll") },
    { id: "1", label: t("stdPart1") },
    { id: "2", label: t("stdPart2") },
  ];

  const resultIcon = (s: StdStatus) =>
    s === "pass" ? (
      <span style={{ color: "var(--green)" }}>{IcCheckC}</span>
    ) : s === "fail" ? (
      <span style={{ color: "var(--red)" }}>{IcXC}</span>
    ) : (
      <span style={{ color: "var(--fg-faint)" }}>{IcDot}</span>
    );

  const cell = (v: string) =>
    v === "—" ? <span className="std-na">—</span> : <code className="spec-code">{v}</code>;

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
          <div className="stat-label">{t("specCompliance")}</div>
        </div>
        {statCards.map((s) => (
          <div className="stat-card-h" key={s.label}>
            <div className={`stat-icon bg-${s.co}-light`} style={{ color: s.co === "muted" ? "var(--fg-faint)" : `var(--${s.co})` }}>{s.ic}</div>
            <div>
              <div className={`stat-value text-${s.co}`}>{s.c}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="controls-bar">
        <div className="cat-bar">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`cat-btn${filter === f.id ? " active" : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="controls-right">
          <span className="std-ref">{t("stdTitle")}: {STANDARD_REF}</span>
        </div>
      </div>

      <div className="spec-table-wrap">
        <table className="spec-table std-table">
          <thead>
            <tr>
              <th scope="col">{t("stdElement")}</th>
              <th scope="col" style={{ textAlign: "center" }}>Thai</th>
              <th scope="col" style={{ textAlign: "center" }}>EU</th>
              <th scope="col" style={{ textAlign: "center" }}>USA</th>
              <th scope="col" style={{ textAlign: "center" }}>{t("stdResult")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const st = statusOf(r.id);
              const primary = lang === "th" ? r.labelTh : r.labelEn;
              const secondary = lang === "th" ? r.labelEn : r.labelTh;
              return (
                <tr key={r.id} className={st === "fail" ? "spec-fail" : st === "pass" ? "spec-pass" : ""}>
                  <td>
                    <span className="spec-name">{primary}</span>
                    <div className="std-sub">{secondary}{r.note ? ` · ${r.note}` : ""}</div>
                  </td>
                  <td style={{ textAlign: "center" }}>{cell(r.thai)}</td>
                  <td style={{ textAlign: "center" }}>{cell(r.eu)}</td>
                  <td style={{ textAlign: "center" }}>{cell(r.usa)}</td>
                  <td style={{ textAlign: "center" }}>
                    <button className="std-result-btn" type="button" onClick={() => cycle(r.id)} title={st} aria-label={`${primary}: ${st}`}>
                      {resultIcon(st)}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
