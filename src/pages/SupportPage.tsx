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
          ? (bn ? "আলুসাথী ব্যবহার করতে কোনো সমস্যা হলে ফোন করুন অথবা ইমেইল পাঠান।" : "Call or email us for help using AluSathi.")
          : (bn ? "আলুসাথী সম্পর্কে জানতে ফোন করুন অথবা ইমেইল পাঠান।" : "Call or email us to get in touch about AluSathi.")}</p>
        <section className="mt-6 max-w-xl rounded-2xl border border-[var(--home-line)] bg-white p-6" aria-labelledby="contact-name">
          <h2 id="contact-name" className="mb-5 text-xl font-bold">Zarif Ahmed</h2>
          <dl className="grid gap-4">
            <div><dt className="text-sm text-[var(--home-muted)]">{bn ? "ফোন" : "Phone"}</dt><dd><a className="inline-block py-2 font-semibold text-[var(--home-green)] underline underline-offset-4" href="tel:+8801797092258">01797092258</a></dd></div>
            <div><dt className="text-sm text-[var(--home-muted)]">{bn ? "ইমেইল" : "Email"}</dt><dd><a className="inline-block break-all py-2 text-[var(--home-green)] underline underline-offset-4" href="mailto:zarifahmed14@gmail.com">zarifahmed14@gmail.com</a></dd></div>
          </dl>
        </section>
      </main>
    </div>
  );
}
