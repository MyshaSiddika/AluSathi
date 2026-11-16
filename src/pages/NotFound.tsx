import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { language } = useLanguage();
  const bn = language === "bn";
  return <main className="grid min-h-screen place-items-center bg-cream p-6 text-center"><div><p className="font-display text-7xl text-leaf">404</p><h1 className="mt-4 text-3xl font-bold text-ink">{bn ? <span className="font-bangla">পাতাটি পাওয়া যায়নি</span> : "Page not found"}</h1><a href="/" className="primary-button mt-7">{bn ? "AluSathi-তে ফিরুন" : "Back to AluSathi"}</a></div></main>;
}
