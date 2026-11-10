import { useEffect, useState } from "react";
import { ChevronDown, CircleCheck, CircleMinus, Clock, Flower2, Leaf, PackageCheck, Sprout } from "lucide-react";
import { areaSquareMetres } from "@/lib/farmer-tools";
import { cropGuidance } from "@/lib/crop-advice";
import { localToday } from "@/lib/local-date";
import { readFieldActions } from "@/lib/field-actions";
import { readCareArea } from "@/lib/care-area";
import CareLandEditor from "./CareLandEditor";
import { recentPhoto, sprayReference } from "@/lib/today-plan";
import { PROFILE_CHANGED } from "@/lib/farmer-profile";

// BAMIS potato bulletin: basal rates and one urea top dressing, kg/hectare.
const nutrients = [
  { bn: "ইউরিয়া", en: "Urea", basal: [160, 175], later: [160, 175] },
  { bn: "টিএসপি", en: "TSP", basal: [200, 220] },
  { bn: "এমওপি (পটাশ)", en: "MOP (potash)", basal: [250, 300] },
  { bn: "জিপসাম", en: "Gypsum", basal: [100, 120] },
  { bn: "জিংক সালফেট", en: "Zinc sulphate", basal: [8, 10] },
  { bn: "বোরিক অ্যাসিড", en: "Boric acid", basal: [6, 9] },
] as const;

const milestones = [
  { start: 1, end: 14, icon: Sprout, bn: "রোপণ", en: "Planting", note: ["লাগানো আলু থেকে অঙ্কুর বের হতে শুরু করে।", "Shoots begin to emerge from planted tubers."] },
  { start: 15, end: 30, icon: Leaf, bn: "প্রাথমিক বৃদ্ধি", en: "Early growth", note: ["গাছের কাণ্ড ও পাতা বাড়তে থাকে।", "Stems and leaves continue to grow."] },
  { start: 31, end: 45, icon: Flower2, bn: "কন্দ গঠন", en: "Tuber formation", note: ["মাটির নিচে নতুন আলু গঠন শুরু হতে পারে।", "New tubers may begin forming below ground."] },
  { start: 46, end: 70, icon: Sprout, bn: "কন্দ বৃদ্ধি", en: "Tuber growth", note: ["মাটির নিচে আলুর আকার বাড়তে থাকে।", "Tubers continue to grow below ground."] },
  { start: 71, end: 90, icon: PackageCheck, bn: "ফসল সংগ্রহ", en: "Harvest", note: ["ফসল তোলার সময় জাত ও জমির অবস্থা অনুযায়ী বদলায়।", "Harvest timing varies by variety and field conditions."] },
] as const;

function readSeasonArea() {
  const area = readCareArea();
  return area.example ? { ...area, unit: "acre" as const } : area;
}

export default function SeasonProgress({ bn, district }: { bn: boolean; district: string }) {
  const t = (b: string, e: string) => bn ? b : e;
  const now = new Date();
  const today = localToday(now);
  const actual = 8;
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const preview = selected ?? actual;
  const [area, setArea] = useState(readSeasonArea);
  useEffect(() => {
    const refresh = () => setArea(readSeasonArea());
    window.addEventListener(PROFILE_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(PROFILE_CHANGED, refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const areaM2 = areaSquareMetres(Number(area.value), area.unit, Number(area.bigha));
  const fmt = (value: number) => value.toLocaleString(bn ? "bn-BD" : "en-GB", { maximumFractionDigits: 2 });
  const amount = (range: readonly number[], metres: number) => `${fmt(range[0] * metres / 10000)}–${fmt(range[1] * metres / 10000)}`;
  const actions = readFieldActions();
  const stage = milestones.find(item => preview <= item.end) ?? milestones[0];
  const StageIcon = stage.icon;
  const range = (item: typeof stage) => t(`দিন ${fmt(item.start)}–${fmt(item.end)}`, `Days ${fmt(item.start)}–${fmt(item.end)}`);
  const weeklySpray = sprayReference(recentPhoto(actions, district, today), bn);
  const weekdayIndex = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - weekdayIndex);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart); day.setDate(weekStart.getDate() + index);
    const date = localToday(day);
    return { day, date, records: date <= today ? actions.filter(item => item.date === date && (item.district === district || !item.district) && (item.kind === "task" || item.category === "fertilizer" && item.status === "applied")) : [] };
  });
  const activeDay = days.find(item => item.date === selectedDate) ?? days.find(item => item.date === today)!;
  const isToday = activeDay.date === today;

  return <div className="app-shell season-progress">
    <section className="season-card season-journey" aria-labelledby="season-title">
      <div className="season-journey-heading">
        <div><h1 id="season-title">{t("আলুর ৯০ দিনের যাত্রা", "The 90-day potato journey")}</h1><p>{t("আপনার মৌসুমটি ঘুরে দেখুন", "Explore your growing season")}</p></div>
        <span>{fmt(Number(area.value))} {({ acre: t("একর", Number(area.value) === 1 ? "acre" : "acres"), decimal: t("শতক", "shotok"), bigha: t("বিঘা", "bigha"), hectare: t("হেক্টর", "ha") })[area.unit]}</span>
      </div>
      <div className="season-actual">
        <div className="season-progress-label"><strong>{t("মৌসুমের পরিকল্পনা", "Season plan")}</strong><span className="season-current">{t(`দিন ${fmt(actual)} / ৯০`, `Day ${fmt(actual)} / 90`)}</span></div>
        <div className="season-track"><progress value={actual} max={90} aria-label={t("মৌসুমের পরিকল্পনা", "Season plan")} /><i aria-hidden="true" style={{ insetInlineStart: `${actual / 90 * 100}%` }} /></div>
      </div>
      <div className="season-milestones">{milestones.map(item => <button type="button" key={item.start} aria-pressed={stage === item} aria-current={actual >= item.start && actual <= item.end ? "step" : undefined} aria-controls="season-stage" onClick={() => setSelected(item.start)}>
        <item.icon size={22} aria-hidden="true" />
        <strong>{bn ? item.bn : item.en}</strong><span>{range(item)}</span>
      </button>)}</div>
      <section id="season-stage" className="season-stage" aria-live="polite" aria-labelledby="season-stage-title">
        <div className="season-stage-heading">
          <span><StageIcon size={24} aria-hidden="true" /></span>
          <div><p>{t("আপনি যে ধাপটি দেখছেন", "Stage you’re viewing")}</p><h2 id="season-stage-title">{bn ? stage.bn : stage.en}</h2><p>{range(stage)}</p></div>
        </div>
        <p>{stage.note[bn ? 0 : 1]}</p>
        <p className="season-activity"><CircleCheck size={16} aria-hidden="true" /><span>{t("এই ধাপের কাজ:", "Stage activity:")} {cropGuidance(preview, null, bn).reminders[0]}</span></p>
      </section>
      <label className="season-preview"><span className="season-progress-label"><strong>{t("যে দিনটি দেখছেন", "Preview day")}</strong><span>{t(`দিন ${fmt(preview)}`, `Day ${fmt(preview)}`)}</span></span><input aria-label={t("যে দিনটি দেখছেন", "Preview day")} aria-valuetext={t(`দিন ${fmt(preview)}`, `Day ${fmt(preview)}`)} type="range" min={1} max={90} value={preview} onChange={event => setSelected(Number(event.target.value))} /></label>
      <p className="season-safety">{t("এটি আনুমানিক ধাপ, জমির নিশ্চিত অবস্থা নয়। সার বা স্প্রে প্রয়োগের নির্দেশও নয়।", "Stages are approximate, not verified field conditions or instructions to apply fertilizer or spray.")}</p>
    </section>
    <section className="season-card season-week">
      <h2>{t("এই সপ্তাহের পরিকল্পনা", "This week’s plan")}</h2>
        <ul>{days.map(({ day, date, records }) => {
          const pending = date >= today;
          const Icon = records.length ? CircleCheck : pending ? Clock : CircleMinus;
          const status = records.length ? t("কাজ শেষ", "Completed") : pending ? t("বাকি", "Pending") : t("কাজ লেখা নেই", "No activity recorded");
          return <li key={date}><button type="button" aria-current={date === today ? "date" : undefined} aria-pressed={date === activeDay.date} aria-controls="season-day-details" onClick={() => setSelectedDate(date)}>
            <span>{day.toLocaleDateString(bn ? "bn-BD" : "en-GB", { weekday: "short" })}</span>
            <time dateTime={date}>{day.toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "short" })}</time>
            <Icon className={records.length ? "season-completed" : undefined} size={16} role="img" aria-label={status} />
          </button></li>;
        })}</ul>
        <div id="season-day-details" className="season-day-details" aria-live="polite">
          <h3>{activeDay.day.toLocaleDateString(bn ? "bn-BD" : "en-GB", { weekday: "long" })} — {t("দিনের পরিকল্পনা", "Day plan")}</h3>
          {isToday && <p>{cropGuidance(actual, null, bn).reminders[0]}</p>}
          {isToday && weeklySpray && <p>{t("শুধু মাঠে লেট ব্লাইট নিশ্চিত হলে তথ্যসূত্র:", "Reference only if field late blight is confirmed:")} {weeklySpray}.</p>}
          {activeDay.records.map(record => <p className="season-record" key={record.id}>{t("খাতায় রাখা হয়েছে:", "Recorded in Khata:")} {record.text}</p>)}
          {!isToday && !activeDay.records.length && <p>{t("এই দিনের জন্য আলাদা কোনো কাজ বা খাতার রেকর্ড নেই।", "No separate activity or Khata entry for this day.")}</p>}
        </div>
    </section>
    <details className="season-card farming-fertilizer">
      <summary>{t("পুরো সারের পরিমাণ", "Full-season fertiliser amounts")} <ChevronDown size={18} aria-hidden="true" /></summary>
      <p>{t("পুরো মৌসুমের আনুমানিক হিসাব। মাটি ও জাতভেদে বদলাতে পারে।", "Full-season estimates vary by soil and variety.")}</p>
      <CareLandEditor bn={bn} area={area} />
      <div className="farming-table-wrap"><table><thead><tr><th>{t("সার", "Fertiliser")}</th><th>{t("পর্যায়", "Stage")}</th><th>{t("কেজি/একর", "kg/acre")}</th><th>{t("এই জমিতে মোট কেজি", "Total kg for field")}</th><th>{t("জমি তৈরির হিসাব (কেজি)", "Basal estimate (kg)")}</th><th>{t("পরের কিস্তির হিসাব (কেজি)", "Later estimate (kg)")}</th></tr></thead>
        <tbody>{nutrients.map(item => {
          const later = "later" in item ? item.later : null;
          const total = later ? [item.basal[0] + later[0], item.basal[1] + later[1]] : item.basal;
          return <tr key={item.en}><th scope="row">{bn ? item.bn : item.en}</th><td>{later ? t("জমি তৈরি + ৩০–৩৫ দিন", "Basal + days 30–35") : t("জমি তৈরি", "Basal")}</td><td>{amount(total, areaSquareMetres(1, "acre"))}</td><td>{amount(total, areaM2)}</td><td>{amount(item.basal, areaM2)}</td><td>{later ? amount(later, areaM2) : fmt(0)}</td></tr>;
        })}</tbody></table></div>
      <p><a href="https://www.bamis.gov.bd/en/bulletin/view/37638/" target="_blank" rel="noopener noreferrer">BAMIS · {t("জমি তৈরি", "basal rates")} ↗</a> · <a href="https://www.bamis.gov.bd/en/bulletin/view/32495/" target="_blank" rel="noopener noreferrer">BAMIS · {t("ইউরিয়া", "urea top dressing")} ↗</a></p>
    </details>
  </div>;
}
