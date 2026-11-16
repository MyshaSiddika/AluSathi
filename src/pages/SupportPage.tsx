import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteTheme } from "@/hooks/useSiteTheme";

export default function SupportPage({ help = false }: { help?: boolean }) {
  const { language } = useLanguage();
  const theme = useSiteTheme();
  const bn = language === "bn";
  const title = help ? (bn ? "সহায়তা কেন্দ্র" : "Help Center") : (bn ? "যোগাযোগ" : "Contact");

  return (
    <div className={`farmer-v2 min-h-screen ${bn ? "font-bangla" : ""}`} data-home-theme={theme}>
      <main className="app-shell py-12">
        <Link to="/" className="text-button">← {bn ? "মূল পাতায় ফিরুন" : "Back to home"}</Link>
        <h1 className="my-4 text-3xl font-bold">{title}</h1>
        <p>{help
          ? (bn ? "আলুসাথী ব্যবহার করতে কোনো সমস্যা হলে সহায়তার ইমেইল এখানে পাবেন।" : "The support email will appear here when it’s available.")
          : (bn ? "আলুসাথী দলের যোগাযোগের তথ্য এখানে প্রকাশ করা হবে।" : "AluSathi team contact details will appear here when available.")}</p>
      </main>
    </div>
  );
}
