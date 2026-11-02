import { useEffect, useMemo, useState } from "react";
import { I18nContext } from "./context.js";
import { createTranslator, initialLanguage, LANGUAGE_KEY } from "./core.js";

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    let saved;
    try {
      saved = localStorage.getItem(LANGUAGE_KEY);
    } catch {
      /* Storage can be unavailable. */
    }
    return initialLanguage(saved, navigator.languages || [navigator.language]);
  });
  const t = useMemo(() => createTranslator(language), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `Markovian Town — ${t("マルコフ連鎖を、遊んで学ぶ")}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        t(
          "道を変え、人の流れを観察する。マルコフ連鎖・定常分布・PageRankを体験できるゲーム。",
        ),
      );
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* Keep the choice in memory. */
    }
  }, [language, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
