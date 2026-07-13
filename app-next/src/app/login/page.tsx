"use client";

// ACCU QUICK — employee sign-in. Design ported 1:1 from login.html; the auth
// flow (Supabase | local) mirrors the original. The Supabase SDK is loaded from
// the same CDN the original page used, so no npm dependency is added here.

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import styles from "./login.module.css";

// Minimal shape of the supabase-js client we load from the CDN (untyped global).
type SupabaseSession = { access_token: string; refresh_token: string };
interface SupabaseClient {
  auth: {
    signInWithPassword(c: { email: string; password: string }): Promise<{
      data: { session: SupabaseSession };
      error: { message: string } | null;
    }>;
    getSession(): Promise<{ data?: { session?: SupabaseSession | null } }>;
    resetPasswordForEmail(
      email: string,
      opts: { redirectTo: string },
    ): Promise<{ error: { message: string } | null }>;
  };
}
interface SupabaseGlobal {
  createClient(url: string, key: string, opts?: unknown): SupabaseClient;
}

// ── CONFIG — same defaults as login.html; overridable at runtime via
//    window.__ACCU_QUICK_API / window.__ACCU_QUICK_APP. Guarded for SSR. ──
const w = (): Record<string, string | undefined> =>
  typeof window !== "undefined" ? (window as unknown as Record<string, string | undefined>) : {};

const CONFIG = {
  // Production backend the main app talks to (Singapore region, Supabase auth).
  API_BASE: (w().__ACCU_QUICK_API || "https://accu-quick-sg.onrender.com").replace(/\/$/, ""),
  // Where employees land after sign-in. Empty → same-origin workspace ("/").
  APP_URL: (w().__ACCU_QUICK_APP || "").replace(/\/$/, ""),
};

// ── DEV-ONLY test credentials ──────────────────────────────────────────────
// A local stub so the sign-in flow can be exercised without a real backend
// account. It is hard-gated to development builds: `process.env.NODE_ENV` is
// "production" in `next build`, so this branch is dead code / stripped in prod
// and can NEVER be used to sign in on a deployed site.
const DEV_LOGIN_ENABLED = process.env.NODE_ENV !== "production";
const DEV_TEST_EMAIL = "test@accuquick.dev";
const DEV_TEST_PASSWORD = "accuquick-dev";

type BannerType = "error" | "info";
interface AuthConfig {
  auth_mode?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
}

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: BannerType; text: string } | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const supabaseClient = useRef<SupabaseClient | null>(null);
  const authConfig = useRef<AuthConfig | null>(null);

  useEffect(() => {
    document.title = "ACCU QUICK — Log in";
  }, []);

  // ── UI helpers ──
  const showBanner = useCallback((text: string, type: BannerType = "error") => {
    setBanner({ type, text });
  }, []);
  const clearBanner = useCallback(() => setBanner(null), []);

  const shake = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove(styles.shake);
    void el.offsetWidth; // reflow so the animation can replay
    el.classList.add(styles.shake);
  };

  // Redirect to the workspace. When an external APP_URL is configured, the
  // session rides along in the URL hash (cross-origin handoff, as in the
  // original). In this same-origin Next.js app it simply goes to "/".
  const redirectToApp = useCallback((handoff: unknown) => {
    if (CONFIG.APP_URL) {
      window.location.href = handoff
        ? `${CONFIG.APP_URL}#aq_handoff=${encodeURIComponent(JSON.stringify(handoff))}`
        : CONFIG.APP_URL;
      return;
    }
    window.location.href = "/";
  }, []);

  // ── Init: fetch backend auth config; pick the sign-in path (supabase | local) ──
  const init = useCallback(async () => {
    try {
      const resp = await fetch(`${CONFIG.API_BASE}/api/v1/auth/config`);
      if (!resp.ok) throw new Error(`auth/config ${resp.status}`);
      authConfig.current = await resp.json();
    } catch (err) {
      showBanner("Cannot reach the authentication backend right now. Please try again shortly.");
      console.error("auth/config failed:", err);
      return;
    }

    const cfg = authConfig.current;
    if (cfg?.auth_mode === "supabase" && cfg.supabase_url && cfg.supabase_anon_key) {
      const supabase = (window as unknown as { supabase?: SupabaseGlobal }).supabase;
      if (!supabase?.createClient) {
        showBanner("Could not load the authentication library. Check your connection and refresh.");
        return;
      }
      supabaseClient.current = supabase.createClient(cfg.supabase_url, cfg.supabase_anon_key, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      try {
        const s = (await supabaseClient.current.auth.getSession())?.data?.session;
        if (s?.access_token) {
          redirectToApp({ v: 1, mode: "supabase", access_token: s.access_token, refresh_token: s.refresh_token });
        }
      } catch {
        /* no cached session */
      }
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem("accuQuickSession") || "null");
        if (saved?.access_token) redirectToApp({ v: 1, mode: "local", session: saved });
      } catch {
        /* no cached session */
      }
    }
  }, [redirectToApp, showBanner]);

  // Map raw auth errors to friendly copy.
  const friendlyAuthError = (message: string) => {
    if (/invalid login credentials|incorrect/i.test(message)) return "Incorrect email or password.";
    if (/email not confirmed|not.*activated/i.test(message))
      return "Your account is not yet activated. Contact your administrator.";
    return message || "Sign-in failed. Please try again.";
  };

  // ── Sign in with email + password (mirrors the app: supabase | local) ──
  const signIn = async (email: string, password: string) => {
    clearBanner();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      shake(emailRef);
      emailRef.current?.focus();
      showBanner("Enter a valid work email address.");
      return;
    }
    if (!password) {
      shake(passwordRef);
      passwordRef.current?.focus();
      showBanner("Enter your password.");
      return;
    }

    // Dev-only test login — never active in a production build (see DEV_LOGIN_ENABLED).
    if (DEV_LOGIN_ENABLED && email === DEV_TEST_EMAIL && password === DEV_TEST_PASSWORD) {
      setLoading(true);
      const session = { access_token: "dev-mock-token", refresh_token: "dev-mock-refresh", mode: "dev-mock" };
      localStorage.setItem("accuQuickSession", JSON.stringify(session));
      redirectToApp({ v: 1, mode: "local", session });
      return;
    }

    if (!authConfig.current) {
      showBanner("Authentication is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);
    let handoff: unknown = null;
    try {
      if (supabaseClient.current) {
        const { data, error } = await supabaseClient.current.auth.signInWithPassword({ email, password });
        if (error) throw new Error(friendlyAuthError(error.message));
        handoff = {
          v: 1,
          mode: "supabase",
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        };
      } else {
        const resp = await fetch(`${CONFIG.API_BASE}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(friendlyAuthError(err.detail || `Sign-in failed (${resp.status})`));
        }
        const session = await resp.json();
        localStorage.setItem("accuQuickSession", JSON.stringify(session));
        handoff = { v: 1, mode: "local", session };
      }
    } catch (e) {
      setLoading(false);
      showBanner((e as Error).message);
      shake(passwordRef);
      return;
    }
    setLoading(false);
    redirectToApp(handoff);
  };

  // ── Forgot password (Supabase reset email) ──
  const forgotPassword = async () => {
    const email = emailRef.current?.value.trim() || "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      shake(emailRef);
      emailRef.current?.focus();
      showBanner("Enter your work email above, then tap “Forgot password?” again.");
      return;
    }
    if (!supabaseClient.current) {
      showBanner(
        authConfig.current
          ? "Password resets are handled by your administrator in this environment."
          : "Authentication is still loading. Please wait a moment and try again.",
      );
      return;
    }
    const { error } = await supabaseClient.current.auth.resetPasswordForEmail(email, {
      redirectTo: CONFIG.APP_URL || CONFIG.API_BASE || window.location.origin,
    });
    if (error) {
      showBanner(error.message);
      return;
    }
    showBanner(`If an account exists for ${email}, a password reset link is on its way.`, "info");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(emailRef.current?.value.trim() || "", passwordRef.current?.value || "");
  };

  return (
    <div className={styles.app}>
      <Script
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        strategy="afterInteractive"
        onReady={() => {
          init();
        }}
      />

      {/* ── Left: Brand Panel ── */}
      <aside className={styles.brandPanel}>
        <div className={styles.gridOverlay} />
        <div className={styles.floatingElements}>
          <div className={styles.floatEl}>📄</div>
          <div className={styles.floatEl}>⚡</div>
          <div className={styles.floatEl}>🔍</div>
          <div className={styles.floatEl}>📊</div>
        </div>

        <Link href="/" className={styles.brandLogo}>
          <div className={styles.logoMark}>
            <div className={styles.logoIcon}>AQ</div>
            <div className={styles.logoText}>
              ACCU<span>QUICK</span>
            </div>
          </div>
        </Link>

        <div className={styles.brandHero}>
          <h1>
            Welcome <em>back</em>.
          </h1>
          <p>
            Sign in to your ACCU QUICK workspace to keep verifying packaging artwork and multilingual
            translations with precision.
          </p>
        </div>

        <div className={styles.brandFooter}>
          <div className={styles.brandStat}>
            <div className={styles.value}>2M+</div>
            <div className={styles.label}>Docs Processed</div>
          </div>
          <div className={styles.brandStat}>
            <div className={styles.value}>99.4%</div>
            <div className={styles.label}>Accuracy</div>
          </div>
          <div className={styles.brandStat}>
            <div className={styles.value}>1min</div>
            <div className={styles.label}>Avg. Time</div>
          </div>
        </div>
      </aside>

      {/* ── Right: Form Panel ── */}
      <main className={styles.formPanel}>
        <form className={styles.formContainer} autoComplete="on" noValidate onSubmit={onSubmit}>
          <div className={styles.stepHeader}>
            <h2>Log in to your account</h2>
            <p>Use the email and password set up by administrator.</p>
          </div>

          {/* Error / info banner */}
          {banner && (
            <div
              className={`${styles.formBanner} ${styles[banner.type]} ${styles.show}`}
              role="alert"
              aria-live="assertive"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{banner.text}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <div className={styles.inputLabelRow}>
              <label htmlFor="email">Email</label>
            </div>
            <div className={styles.inputWrapper}>
              <input
                ref={emailRef}
                type="email"
                className={styles.inputField}
                id="email"
                name="email"
                placeholder="you@company.com"
                autoComplete="username"
                required
                onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.shake)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputLabelRow}>
              <label htmlFor="password">Password</label>
              <button type="button" className={styles.forgotLink} onClick={forgotPassword}>
                Forgot password?
              </button>
            </div>
            <div className={styles.inputWrapper}>
              <input
                ref={passwordRef}
                type={showPw ? "text" : "password"}
                className={`${styles.inputField} ${styles.hasToggle}`}
                id="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.shake)}
              />
              <button
                type="button"
                className={styles.togglePw}
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : <span>Log in</span>}
          </button>

          <div className={styles.loginLink}>
            Don&apos;t have an account? <Link href="/register">Create one</Link>
          </div>

          {DEV_LOGIN_ENABLED && (
            <div
              style={{
                marginTop: 20,
                padding: "8px 12px",
                textAlign: "center",
                fontSize: 12,
                lineHeight: 1.5,
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
                background: "rgba(0,0,0,0.03)",
                border: "1px dashed var(--border)",
                borderRadius: 10,
              }}
            >
              Dev test login (development only)
              <br />
              {DEV_TEST_EMAIL} &nbsp;·&nbsp; {DEV_TEST_PASSWORD}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
