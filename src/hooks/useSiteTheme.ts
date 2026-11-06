import { useEffect, useState } from "react";
import "@/site-theme.css";

const themes = ["river", "monsoon", "sky", "earth", "harvest", "paddy", "coast", "indigo", "paper", "slate"];
function readTheme() {
  try {
    const saved = localStorage.getItem("alusathi-home-theme") || "river";
    return themes.includes(saved) ? saved : "river";
  } catch { return "river"; }
}

export function useSiteTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const refresh = () => setTheme(readTheme());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  return theme;
}
