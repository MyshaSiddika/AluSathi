import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const key = "alusathi-buyer-needs-v1";
type Request = { id: string; district: string; quantity: number; readyDate: string; budget: number; note: string; paused: boolean; contact: { name: string; phone: string } };
function read(): Request[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Dhaka" });
    return Array.isArray(rows) ? rows.slice(0, 100).filter(r => r && !r.paused && typeof r.id === "string" && typeof r.district === "string" && Number.isFinite(r.quantity) && r.quantity > 0 && typeof r.readyDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.readyDate) && r.readyDate >= today && typeof r.note === "string" && typeof r.contact?.name === "string" && typeof r.contact?.phone === "string" && /^\+?[0-9]{8,15}$/.test(r.contact.phone)) : [];
  } catch { return []; }
}

export default function LocalBuyerRequests() {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;
  const [rows, setRows] = useState(read);
  useEffect(() => {
    const refresh = () => setRows(read());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  const format = new Intl.NumberFormat(t("bn-BD", "en-BD"));
  return <section className="prep-lot">
    <h2>{t("ক্রেতারা যে আলু খুঁজছেন", "What buyers are looking for")}</h2>
    <p>{t("দর ও নেওয়ার সময় ঠিক করতে সরাসরি কথা বলুন। শুধু এই ব্রাউজারে শেয়ার করা চাহিদা এখানে দেখা যায়।", "Talk directly to agree on price and pickup. Only requests shared in this browser appear here.")}</p>
    {rows.length ? <ul className="divide-y">{rows.map(row => <li className="py-4" key={row.id}>
      <h3>{row.contact.name || t("ক্রেতা", "Buyer")} · {format.format(row.quantity)} {t("কেজি", "kg")}</h3>
      <p>{row.district} · {t("দরকার", "Needed by")}: {row.readyDate}{Number.isFinite(row.budget) && row.budget > 0 ? ` · ${t("বাজেট", "Budget")}: ৳${format.format(row.budget)}` : ""}</p>
      {row.note && <p className="break-words">{row.note}</p>}
      <a className="underline" href={`tel:${row.contact.phone}`}>{t("ক্রেতাকে ফোন করুন", "Call buyer")} · {row.contact.phone}</a>
    </li>)}</ul> : <p>{t("এখন শেয়ার করা কোনো চাহিদা নেই।", "No shared requests right now.")}</p>}
  </section>;
}
