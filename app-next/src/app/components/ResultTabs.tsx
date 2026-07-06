"use client";

import { useRef, useState } from "react";
import { useLang } from "../lib/LanguageContext";
import type { TKey } from "../lib/i18n";

type TabId = "extract" | "language" | "spec";

const TABS: {
  id: TabId;
  labelKey: TKey;
  sublabelKey?: TKey;
  icon: React.ReactNode;
}[] = [
  {
    id: "extract",
    labelKey: "rtExtract",
    sublabelKey: "rtExtractSub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </svg>
    ),
  },
  {
    id: "language",
    labelKey: "rtLanguage",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
      </svg>
    ),
  },
  {
    id: "spec",
    labelKey: "rtSpec",
    sublabelKey: "rtSpecSub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function ResultTabs({
  visible = true,
  extractPanel,
  languagePanel,
  specPanel,
}: {
  visible?: boolean;
  extractPanel?: React.ReactNode;
  languagePanel?: React.ReactNode;
  specPanel?: React.ReactNode;
}) {
  const { t } = useLang();
  const [active, setActive] = useState<TabId>("extract");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    extract: null,
    language: null,
    spec: null,
  });

  // Arrow-key navigation (ARIA tabs pattern, automatic activation).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const ids = TABS.map((t) => t.id);
    const i = ids.indexOf(active);
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % ids.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + ids.length) % ids.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = ids.length - 1;
    else return;
    e.preventDefault();
    const next = ids[n];
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const panels: Record<TabId, React.ReactNode> = {
    extract: extractPanel ?? <Placeholder label="Text extraction & diff table land with the DiffTable step." />,
    language: languagePanel ?? <Placeholder label="Language detection & grammar cards land in a later step." />,
    spec: specPanel ?? <Placeholder label="Spec-check score & artwork table land in a later step." />,
  };

  return (
    <div className={`result-tabs${visible ? " visible" : ""}`}>
      <div className="result-tab-bar" role="tablist" aria-label="Results" onKeyDown={onKeyDown}>
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                className={`result-tab-btn${isActive ? " active" : ""}`}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`rp-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(tab.id)}
              >
                {tab.icon}
                <span>{t(tab.labelKey)}</span>
                {tab.sublabelKey && <span className="sublabel">{t(tab.sublabelKey)}</span>}
              </button>
            );
          })}
        </div>

        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <div
              key={tab.id}
              className={`result-panel${isActive ? " active" : ""}`}
              id={`rp-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              tabIndex={0}
              hidden={!isActive}
            >
              {panels[tab.id]}
            </div>
          );
        })}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return <p style={{ fontSize: 13, color: "var(--fg-faint)" }}>{label}</p>;
}
