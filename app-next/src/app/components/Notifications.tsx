"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NOTIFS, type Notif } from "../lib/mockData";
import { useLang } from "../lib/LanguageContext";

const ICONS: Record<Notif["ico"], React.ReactNode> = {
  checkC: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  alertT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  xC: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

const IcBell = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IcCheckCircle = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function Notifications() {
  const { t } = useLang();
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => n.unread).length;

  const position = useCallback(() => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn || !panel) return;
    const r = btn.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const gap = 8;
    const margin = 12;
    let left = r.right - pw;
    left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
    let top = r.bottom + gap;
    if (top + ph > window.innerHeight - margin) top = Math.max(margin, r.top - gap - ph);
    setPos({ left, top });
  }, []);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onResizeScroll = () => position();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, position]);

  const markRead = (id: number) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <>
      <button
        ref={btnRef}
        className={`hero-notif-btn${unreadCount > 0 ? " has-unread" : ""}`}
        type="button"
        aria-label={t("notifTitle")}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        {IcBell}
        <span className="notif-dot" />
      </button>

      {open && (
        <div
          className="notif-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            className="notif-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-title"
            style={{ left: pos.left, top: pos.top }}
          >
            <div className="notif-head">
              <h3 id="notif-title">{t("notifTitle")}</h3>
              <span className="notif-count" data-n={unreadCount}>{unreadCount > 0 ? unreadCount : ""}</span>
              <button
                className="notif-markall"
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                {t("notifMarkAll")}
              </button>
            </div>
            <div className="notif-list">
              {notifs.length === 0 ? (
                <div className="notif-empty">
                  {IcCheckCircle}
                  <p>{t("notifEmpty")}</p>
                </div>
              ) : (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    className={`notif-item${n.unread ? " unread" : ""}`}
                    type="button"
                    onClick={() => markRead(n.id)}
                  >
                    <span className={`notif-ico ni-${n.kind}`}>{ICONS[n.ico]}</span>
                    <span className="notif-body">
                      <span className="nt">{n.title}</span>
                      <span className="nd">{n.desc}</span>
                      <span className="nm">{n.time}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="notif-foot">
              <button type="button" onClick={() => setOpen(false)}>{t("notifViewAll")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
