"use client";

import { useEffect, useState } from "react";

type PageId = "docreview" | "dashboard" | "usage" | "settings";
type Lang = "en" | "th";

const NAV_ITEMS: {
  id: PageId;
  label: string;
  badge?: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "docreview",
    label: "Document Inspect",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
  },
  {
    id: "dashboard",
    label: "Workboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="9" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "usage",
    label: "Usage History",
    badge: "12",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <polyline points="3 3 3 8 8 8" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [activePage, setActivePage] = useState<PageId>("docreview");
  const [lang, setLang] = useState<Lang>("en");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mirror the prototype's body.nav-collapsed class so the CSS shell rules apply.
  useEffect(() => {
    document.body.classList.toggle("nav-collapsed", collapsed);
  }, [collapsed]);

  // The header toggle closes the drawer on mobile, collapses the rail on desktop.
  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 1024) setMobileOpen(false);
    else setCollapsed(true);
  };

  return (
    <>
      <div className="mobile-topbar">
        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-controls="sidebar"
          aria-expanded={mobileOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="logo-group">
          <div className="logo-icon" style={{ width: 30, height: 30, borderRadius: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
            </svg>
          </div>
          <div className="logo-text"><span className="brand-name">ACCU QUICK</span></div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div
        className={`sidebar-backdrop${mobileOpen ? " open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar${mobileOpen ? " open" : ""}`} id="sidebar">
        <div className="sidebar-header">
          <div className="logo-group">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="7" y1="8" x2="13" y2="8" />
                <line x1="7" y1="16" x2="15" y2="16" />
              </svg>
            </div>
            <div className="logo-text">
              <h1>ACCU QUICK</h1>
              <p>Intelligent OCR platform</p>
            </div>
          </div>
          <button
            className="sidebar-toggle"
            type="button"
            onClick={handleToggle}
            aria-label="Hide sidebar"
            aria-controls="sidebar"
            aria-expanded={!collapsed}
            title="Hide sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="m16 15-3-3 3-3" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => { setActivePage(item.id); setMobileOpen(false); }}
              >
                <span className="nav-icon-wrap">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="user-pill" type="button" aria-label="User menu">
            <div className="user-avatar">AC</div>
            <div className="user-info">
              <div className="name">Alex Chen</div>
              <div className="email">alex@accuquick.com</div>
            </div>
            <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              className={`lang-btn${lang === "th" ? " active" : ""}`}
              type="button"
              onClick={() => setLang("th")}
              aria-pressed={lang === "th"}
            >
              <span className="flag" aria-hidden="true">🇹🇭</span> <span>Thai</span>
            </button>
            <button
              className={`lang-btn${lang === "en" ? " active" : ""}`}
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              <span className="flag" aria-hidden="true">🇬🇧</span> <span>English</span>
            </button>
          </div>

          <button className="logout-btn" type="button">
            <span className="nav-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <button
        className="sidebar-show-btn"
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Show sidebar"
        aria-controls="sidebar"
        aria-expanded={!collapsed}
        title="Show sidebar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="m13 9 3 3-3 3" />
        </svg>
      </button>
    </>
  );
}
