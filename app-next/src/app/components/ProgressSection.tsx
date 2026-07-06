"use client";

export default function ProgressSection({
  visible,
  label,
  pct,
}: {
  visible: boolean;
  label: string;
  pct: number;
}) {
  return (
    <div className={`progress-section${visible ? " visible" : ""}`}>
      <div className="progress-header">
        <span className="stage-label">
          <span className="pulse" /> <span aria-live="polite">{label}</span>
        </span>
        <span style={{ fontWeight: 600 }}>{pct}%</span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label="Processing progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
