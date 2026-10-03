import { useState } from "react";
import { useLang } from "../context/LangContext.jsx";

/** Code panel. `code` is { pseudo: [...], c: [...], ... }; `activeLine` only highlights in pseudocode (line numbers refer to it). */
export default function CodeCard({ code, activeLine = -1, title = "CODE" }) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const lines = code?.[lang] || code?.pseudo || [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="code-card">
      <div className="code-card-head">
        <div className="code-title">{title}</div>
        <button className={"copy-btn" + (copied ? " copied" : "")} onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre className="code">
        {lines.map((l, i) => (
          <div key={i} className={"code-line" + (lang === "pseudo" && i === activeLine ? " active" : "")}>{l || " "}</div>
        ))}
      </pre>
    </div>
  );
}
