"use client";

import { useLang } from "../lib/LanguageContext";

type SpecStatus = "pass" | "mismatch" | "missing";

// Prototype spec-check data. None of these can be measured by the text-only OCR
// (barcodes, QR, nutrition/GDA tables), so these are representative placeholder
// values — surfaced with a "prototype" note.
const BARCODE = { value: "8 850001 234567", status: "pass" as SpecStatus };
const QR = { value: "https://accu-quick.co/p/BT-PRO-600", status: "pass" as SpecStatus };
const NUTRITION: SpecStatus = "mismatch";
const GDA: SpecStatus = "missing";

const IcCheck = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const IcWarn = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const IcX = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IcShield = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>);
const IcBarcode =(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14" /></svg>);
const IcQr = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 21v.01M17 21h.01M21 17v.01" /></svg>);
const IcTable = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="12" y1="3" x2="12" y2="21" /></svg>);

function StatusPill({ status }: { status: SpecStatus }) {
  const { t } = useLang();
  const label = status === "pass" ? t("specPass") : status === "mismatch" ? t("legModified") : t("legMissing");
  const icon = status === "pass" ? IcCheck : status === "mismatch" ? IcWarn : IcX;
  return <span className={`spec-status ${status}`}>{icon}{label}</span>;
}

export default function SpecCheck() {
  const { t } = useLang();
  return (
    <div className="spec-check">
      <div className="spec-check-head">
        {IcShield}<span>{t("specTitle")}</span>
        <span className="spec-proto">{t("specProto")}</span>
      </div>

      <div className="spec-list">
        {/* 1 — Barcodes: detected number */}
        <div className="spec-row">
          <span className="spec-ico">{IcBarcode}</span>
          <span className="spec-name">{t("specBarcode")}</span>
          <span className="spec-detected mono">{BARCODE.value}</span>
          <StatusPill status={BARCODE.status} />
        </div>

        {/* 2 — QR code: detected URL */}
        <div className="spec-row">
          <span className="spec-ico">{IcQr}</span>
          <span className="spec-name">{t("specQr")}</span>
          <a className="spec-detected mono spec-link" href={QR.value} target="_blank" rel="noopener noreferrer">{QR.value}</a>
          <StatusPill status={QR.status} />
        </div>

        {/* 3 — Nutrition information table */}
        <div className="spec-row">
          <span className="spec-ico">{IcTable}</span>
          <span className="spec-name">{t("specNutrition")}</span>
          <span className="spec-detected" />
          <StatusPill status={NUTRITION} />
        </div>

        {/* 4 — GDA table */}
        <div className="spec-row">
          <span className="spec-ico">{IcTable}</span>
          <span className="spec-name">{t("specGda")}</span>
          <span className="spec-detected" />
          <StatusPill status={GDA} />
        </div>
      </div>
    </div>
  );
}
