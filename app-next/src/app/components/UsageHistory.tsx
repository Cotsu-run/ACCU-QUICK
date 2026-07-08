"use client";

import { useState } from "react";
import { useLang } from "../lib/LanguageContext";

/* ── icons ────────────────────────────────────────────────────────────── */
const s = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IcInfo = (<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);
const IcChevron = (<svg viewBox="0 0 24 24" {...s}><polyline points="6 9 12 15 18 9" /></svg>);
const IcKebab = (<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>);
const IcList = (<svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>);
const IcGrid = (<svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>);
const IcFolder = (<svg viewBox="0 0 24 24" {...s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>);
const IcShared = (<svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
const IcDrive = (<svg viewBox="0 0 24 24" {...s}><polygon points="8 3 16 3 22 13 14 13" /><polygon points="2 13 10 13 6 21" /><line x1="14" y1="13" x2="22" y2="13" /></svg>);
const IcDoc = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>);

type Kind = "pdf" | "gdoc" | "word";
type Reason = "opened" | "modified" | "edited";
type Loc = "drive" | "folder";

const FOLDERS: { name: string; subKey: "uhInMyDrive" | "uhInShared" }[] = [
  { name: "MaMa Source files", subKey: "uhInMyDrive" },
  { name: "OCR project", subKey: "uhInShared" },
];

const FILES: { id: string; name: string; kind: Kind; shared: boolean; reason: Reason; date: string; loc: string; locType: Loc }[] = [
  { id: "f1", name: "3.1 AW หมูสับ ไม่แก้ไข.pdf", kind: "pdf", shared: true, reason: "opened", date: "Jul 7", loc: "AW SPNP", locType: "folder" },
  { id: "f2", name: "3.0 AW หมูสับ แก้ไข.pdf", kind: "pdf", shared: true, reason: "opened", date: "Jul 7", loc: "AW SPNP", locType: "folder" },
  { id: "f3", name: "สัญญาจ้างนักพัฒนา_Full-Stack Developer", kind: "gdoc", shared: false, reason: "modified", date: "Jul 6", loc: "My Drive", locType: "drive" },
  { id: "f4", name: "TC MAMA NOODLES_Sen Lek Tom Yum Sukhothai 27…", kind: "pdf", shared: true, reason: "opened", date: "Jul 4", loc: "New updates", locType: "folder" },
  { id: "f5", name: "2026 มาม่า 2 mm ก๋วยเตี๋ยวต้มยำ (แบบซอง) (1).docx", kind: "word", shared: true, reason: "opened", date: "Jul 3", loc: "New updates", locType: "folder" },
  { id: "f6", name: "1.0 ST. Albernia.pdf", kind: "pdf", shared: true, reason: "opened", date: "Jul 4", loc: "AW SPNP", locType: "folder" },
  { id: "f7", name: "PEA_Quotation_150626", kind: "gdoc", shared: false, reason: "edited", date: "Jul 6", loc: "My Drive", locType: "drive" },
  { id: "f8", name: "4.1 SPNP กล่องเย็นตาโฟ.pdf", kind: "pdf", shared: true, reason: "opened", date: "Jul 4", loc: "AW SPNP", locType: "folder" },
];

function kindBadge(kind: Kind) {
  if (kind === "pdf") return <span className="uh-fico k-pdf">PDF</span>;
  if (kind === "word") return <span className="uh-fico k-word">W</span>;
  return <span className="uh-fico k-gdoc">{IcDoc}</span>;
}

export default function UsageHistory() {
  const { t } = useLang();
  const [view, setView] = useState<"list" | "grid">("list");
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(true);

  const reasonLabel = (r: Reason) => (r === "opened" ? t("uhOpened") : r === "modified" ? t("uhModified") : t("uhEdited"));

  return (
    <div className="uh">
      <div className="uh-head">
        <div>
          <h1 className="uh-title">{t("uhTitle")}</h1>
          <p className="uh-sub">{t("uhSubtitle")}</p>
        </div>
        <button className="uh-icon-btn" type="button" aria-label="Info">{IcInfo}</button>
      </div>

      {/* Suggested folders */}
      <section className="uh-section">
        <button className={`uh-section-head${foldersOpen ? "" : " collapsed"}`} type="button" onClick={() => setFoldersOpen((v) => !v)}>
          <span className="uh-chevron">{IcChevron}</span>
          {t("uhSuggestedFolders")}
        </button>
        {foldersOpen && (
          <div className="uh-folders">
            {FOLDERS.map((f, i) => (
              <div className="uh-folder" key={f.name} style={{ animationDelay: `${i * 40}ms` }}>
                <span className="uh-folder-ico">{IcFolder}</span>
                <div className="uh-folder-text">
                  <div className="uh-folder-name">{f.name}</div>
                  <div className="uh-folder-sub">{t(f.subKey)}</div>
                </div>
                <button className="uh-kebab" type="button" aria-label="More">{IcKebab}</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggested files */}
      <section className="uh-section">
        <div className="uh-section-bar">
          <button className={`uh-section-head${filesOpen ? "" : " collapsed"}`} type="button" onClick={() => setFilesOpen((v) => !v)}>
            <span className="uh-chevron">{IcChevron}</span>
            {t("uhSuggestedFiles")}
          </button>
          <div className="uh-view-toggle" role="group" aria-label="View">
            <button className={view === "list" ? "active" : ""} type="button" onClick={() => setView("list")} aria-label={t("uhViewList")} aria-pressed={view === "list"}>{IcList}</button>
            <button className={view === "grid" ? "active" : ""} type="button" onClick={() => setView("grid")} aria-label={t("uhViewGrid")} aria-pressed={view === "grid"}>{IcGrid}</button>
          </div>
        </div>

        {filesOpen && view === "list" && (
          <div className="uh-table" role="table">
            <div className="uh-tr uh-thead" role="row">
              <div role="columnheader">{t("uhName")}</div>
              <div role="columnheader">{t("uhReason")}</div>
              <div role="columnheader">{t("uhLocation")}</div>
              <div aria-hidden="true" />
            </div>
            {FILES.map((f, i) => (
              <div className="uh-tr" role="row" key={f.id} style={{ animationDelay: `${i * 35}ms` }}>
                <div className="uh-cell-name" role="cell">
                  {kindBadge(f.kind)}
                  <span className="uh-fname" title={f.name}>{f.name}</span>
                  {f.shared && <span className="uh-shared" aria-label="Shared">{IcShared}</span>}
                </div>
                <div className="uh-cell-reason" role="cell">{reasonLabel(f.reason)} · {f.date}</div>
                <div className="uh-cell-loc" role="cell">
                  <span className="uh-loc-chip">
                    <span className={`uh-loc-ico ${f.locType === "drive" ? "is-drive" : "is-folder"}`}>{f.locType === "drive" ? IcDrive : IcFolder}</span>
                    {f.loc}
                  </span>
                </div>
                <button className="uh-kebab" type="button" aria-label="More">{IcKebab}</button>
              </div>
            ))}
          </div>
        )}

        {filesOpen && view === "grid" && (
          <div className="uh-grid">
            {FILES.map((f, i) => (
              <div className="uh-card" key={f.id} style={{ animationDelay: `${i * 35}ms` }}>
                <div className="uh-card-thumb">{kindBadge(f.kind)}</div>
                <div className="uh-card-foot">
                  <span className="uh-fname" title={f.name}>{f.name}</span>
                  <button className="uh-kebab" type="button" aria-label="More">{IcKebab}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
