import { LANGS, useLang } from "../context/LangContext.jsx";

export default function LangBar() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-bar">
      <span className="lang-label">Show code in</span>
      <div className="lang-chips">
        {LANGS.map((l) => (
          <button key={l.id} className={"cat-chip" + (lang === l.id ? " active" : "")} onClick={() => setLang(l.id)}>{l.label}</button>
        ))}
      </div>
    </div>
  );
}
