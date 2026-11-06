import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PackageCheck, ScanEye, Scale, Tag, Layers, Check, ShoppingBag, Volume2, Square } from "lucide-react";
import PotatoDetailsDialog from "@/components/PotatoDetailsDialog";

const prepKey = "alusathi-selling-prep-v1";
function readChecks(): string[] {
  try { const checks=JSON.parse(localStorage.getItem(prepKey) || "{}").draft?.checks;return Array.isArray(checks)?checks.filter(c=>typeof c==="string"):[]; } catch{return [];}
}
const signs = [
  { id: "green", bn: "সবুজ অংশ", en: "Green patches", detailBn: "সবুজ অংশ দেখা গেলে আলাদা রাখুন। সাধারণ আলুর সঙ্গে মেশাবেন না।", detailEn: "Set potatoes with green patches aside. Do not mix them into the ordinary lot." },
  { id: "sprouted", bn: "অঙ্কুর বেরিয়েছে", en: "Sprouts", detailBn: "অঙ্কুর বেরোনো আলু আলাদা রাখুন। বীজের আলু হলে সেটিও আলাদা করে চিহ্ন দিন।", detailEn: "Separate sprouted potatoes. Keep intended seed potatoes clearly identified as a separate group." },
  { id: "cut", bn: "কাটা আলু", en: "Cuts", detailBn: "কাটা আলু আলাদা রাখুন। থেঁতলানো আলু থাকলেও আলাদা করে দেখুন।", detailEn: "Set cut potatoes aside. Inspect bruised potatoes separately too." },
  { id: "rot", bn: "নরম, ভেজা বা পচা অংশ", en: "Soft or wet damage", detailBn: "নরম, ভেজা বা পচা অংশ থাকলে আলাদা করুন। পাশে রাখা আলুগুলোও দেখে নিন।", detailEn: "Separate potatoes with soft, wet or rotting areas. Inspect neighbouring potatoes too." },
];
const packing = [
  ["sort", "খারাপ আলু আলাদা করেছি", "Damaged potatoes separated"],
  ["bag", "শুকনো, বাতাস চলার বস্তা নিয়েছি", "Dry, ventilated bags ready"],
  ["weight", "বস্তার ওজন মেপেছি", "Bags weighed"],
  ["label", "জাত ও অবস্থা লিখে চিহ্ন দিয়েছি", "Variety and condition labelled"],
];
const visit = [
  ["example", "বিভিন্ন বস্তা থেকে দেখানোর আলু রেখেছি", "Potatoes from different bags ready to show"],
  ["scales", "ওজন মাপার ব্যবস্থা রেখেছি", "Weighing arrangement ready"],
];

export default function SellingPreparationTools() {
  const { language } = useLanguage(); const bn = language === "bn";
  const t = (a: string, b: string) => bn ? a : b;
  const [sign, setSign] = useState("green"), [checks,setChecks]=useState(readChecks);
  const [checkMessage, setCheckMessage] = useState("");
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoice(speechSynthesis.getVoices().find(v => bn ? /^bn(?:-|_|$)/i.test(v.lang) : /^en(?:-|_|$)/i.test(v.lang)) || null);
    refresh(); speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => { speechSynthesis.removeEventListener("voiceschanged", refresh); speechSynthesis.cancel(); };
  }, [bn]);
  const currentSign = signs.find(s => s.id === sign)!;
  function remember(id:string) {
    const next=checks.includes(id)?checks.filter(c=>c!==id):[...checks,id];
    try {
      const saved=JSON.parse(localStorage.getItem(prepKey) || "{}");
      if (!saved || typeof saved!=="object" || Array.isArray(saved)) throw new Error("Unreadable saved checks");
      const previous=saved.draft && typeof saved.draft==="object" && !Array.isArray(saved.draft)?saved.draft:{};
      localStorage.setItem(prepKey,JSON.stringify({...saved,draft:{...previous,checks:next}}));
      setChecks(next);setCheckMessage(t("সেভ হয়েছে।", "Saved."));
    } catch {setCheckMessage(t("সেভ হয়নি। আবার চেষ্টা করুন।", "Could not save. Please retry."));}
  }
  function checklist(items: string[][], title: string, icon: React.ReactNode) {
    const symbols = { sort: ScanEye, bag: ShoppingBag, weight: Scale, label: Tag, example: Layers, scales: Scale };
    return <section className="prep-checklist"><h3>{icon}{title}<small>{new Intl.NumberFormat(bn ? "bn" : "en").format(items.filter(([id]) => checks.includes(id)).length)} / {new Intl.NumberFormat(bn ? "bn" : "en").format(items.length)}</small></h3>
      {items.map(([id, bangla, english]) => { const Icon = symbols[id as keyof typeof symbols]; return <label key={id}><input type="checkbox" checked={checks.includes(id)} onChange={() => remember(id)}/><Icon size={22} aria-hidden="true"/><span>{t(bangla, english)}</span></label>; })}
    </section>;
  }
  return <div className="selling-prep-tools">
    <div className="prep-main-column">
      <PotatoDetailsDialog />
      <section className="prep-lot" aria-labelledby="prep-title">
        <h2 id="prep-title">{t("বিক্রির জন্য তৈরি করুন", "Get ready to sell")}</h2>
        <p className="prep-caption">{t("কাজ শেষ হলে টিক দিন। টিক নিজে থেকেই সেভ হবে।", "Tick when done. Your checks save automatically.")}</p>
        <div className="prep-checks">{checklist(packing, t("বস্তায় ভরার আগে", "Before packing"), <PackageCheck size={24}/>)}{checklist(visit, t("ক্রেতা আসার আগে", "Before a buyer visits"), <ScanEye size={24}/>)}</div>
        <p role="status" className="prep-check-status">{checkMessage}</p>
      </section>
    </div>
    <div className="prep-side-column">
      <section id="sorting" className="prep-sorting" aria-labelledby="sorting-title">
        <h2 id="sorting-title">{t("কোন আলু আলাদা করবেন?", "Which potatoes should you separate?")}</h2>
        <p>{t("ছবিতে ক্লিক করে দেখে নিন।", "Click a picture for guidance.")}</p>
        <div className="prep-signs">{signs.map(s => <button key={s.id} type="button" aria-pressed={sign === s.id} onClick={() => setSign(s.id)}><img src={`/selling-guide/${s.id}.webp`} alt="" width="280" height="280" loading="lazy"/><strong>{t(s.bn, s.en)}</strong>{sign === s.id && <Check className="prep-chosen" size={21} aria-hidden="true"/>}</button>)}</div>
        <p className="prep-guidance" aria-live="polite"><ScanEye size={24}/>{t(currentSign.detailBn, currentSign.detailEn)}</p>
        {voice && <div className="prep-audio"><button type="button" onClick={() => { speechSynthesis.cancel(); const text = new SpeechSynthesisUtterance(t(currentSign.detailBn, currentSign.detailEn)); text.voice = voice; text.lang = voice.lang; speechSynthesis.speak(text); }}><Volume2 size={18}/>{t("শুনুন", "Listen")}</button><button type="button" onClick={() => speechSynthesis.cancel()}><Square size={16}/>{t("থামান", "Stop")}</button></div>}
        <details><summary>{t("ছবি ও পরামর্শ সম্পর্কে", "About this guide")}</summary><p>{t("ছবিগুলো বোঝানোর জন্য তৈরি। এটি রোগ শনাক্ত বা খাওয়া ও বিক্রির উপযোগিতা নিশ্চিত করে না। সন্দেহ হলে কৃষি কর্মকর্তাকে দেখান।", "These images illustrate visible signs. This is not a diagnosis or a food/sale safety certificate. Ask an agricultural adviser when unsure.")}</p><a href="https://extension.oregonstate.edu/news/best-practices-harvesting-storing-homegrown-potatoes" target="_blank" rel="noreferrer">{t("সংরক্ষণ বিষয়ে তথ্যসূত্র ↗", "Storage guidance source ↗")}</a></details>
      </section>
    </div>
  </div>;
}
