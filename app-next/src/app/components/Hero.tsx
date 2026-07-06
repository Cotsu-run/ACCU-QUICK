"use client";

import Notifications from "./Notifications";
import { useLang } from "../lib/LanguageContext";
import type { TKey } from "../lib/i18n";

const FEATURE_TAGS: { labelKey: TKey; dot: string; icon: React.ReactNode }[] = [
  {
    labelKey: "tagText",
    dot: "dot-blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </svg>
    ),
  },
  {
    labelKey: "tagLang",
    dot: "dot-violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    labelKey: "tagSpec",
    dot: "dot-orange",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function Hero() {
  const { t } = useLang();
  return (
    <div className="hero">
      <div className="hero-breadcrumb">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span>{t("bcLeft")}</span>
        <Notifications />
      </div>
      <h2>
        <span>{t("docReview")}</span>
      </h2>
      <div className="feature-tags">
        {FEATURE_TAGS.map((tag) => (
          <span className="feature-tag" key={tag.labelKey}>
            <span className={`dot ${tag.dot}`}>{tag.icon}</span> <span>{t(tag.labelKey)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
