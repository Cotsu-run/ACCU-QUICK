"use client";

import Notifications from "./Notifications";
import { useLang } from "../lib/LanguageContext";

export default function Hero() {
  const { t } = useLang();
  return (
    <div className="hero">
      <div className="uh-head">
        <div>
          <h1 className="uh-title">{t("docReviewTitle")}</h1>
          <p className="uh-sub">{t("docReviewSub")}</p>
        </div>
        <Notifications />
      </div>
    </div>
  );
}
