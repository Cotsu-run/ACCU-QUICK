"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dict, type Lang, type TKey } from "./i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("aq-lang");
    if (saved === "th" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("aq-lang", l);
    } catch {
      /* ignore */
    }
  };

  const t = (k: TKey) => dict[lang][k];

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
