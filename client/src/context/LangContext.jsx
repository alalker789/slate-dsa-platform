import { createContext, useContext, useState } from "react";

export const LANGS = [
  { id: "pseudo", label: "Pseudocode" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
];

const LangContext = createContext({ lang: "pseudo", setLang: () => {} });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("slate.lang") || "pseudo");
  const setLang = (l) => { localStorage.setItem("slate.lang", l); setLangState(l); };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
