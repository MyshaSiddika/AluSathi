import { useRef, useState } from "react";
import { Droplets, Sprout } from "lucide-react";
import { areaSquareMetres } from "@/lib/farmer-tools";
import { exampleTopDressing } from "@/lib/potato-nutrients";
import { photoContext } from "@/lib/today-plan";
import { readFieldActions, saveFieldActions, type FieldAction } from "@/lib/field-actions";
import { localToday } from "@/lib/local-date";
import type { CareArea } from "@/lib/care-area";
import { PROFILE_CHANGED } from "@/lib/farmer-profile";

const numeric = (value: string) => Number(value.replace(/[০-৯]/g, digit => String("০১২৩৪৫৬৭৮৯".indexOf(digit))));
export default function TodayCare({ bn, area, actions, cropAgeDays, onPhoto }: {
  bn: boolean; area: CareArea; actions: FieldAction[]; cropAgeDays: number | null; onPhoto: () => void;
}) {
  const t = (b: string, e: string) => bn ? b : e;
  const [message, setMessage] = useState("");
  const [logError, setLogError] = useState("");
  const [showReminderConfirmation, setShowReminderConfirmation] = useState(false);
  const [editingLand, setEditingLand] = useState(false);
  const [landValue, setLandValue] = useState(area.value);
  const [landUnit, setLandUnit] = useState(area.unit);
  const [landError, setLandError] = useState("");
  const editButton = useRef<HTMLButtonElement>(null);
  function closeLand() { setEditingLand(false); requestAnimationFrame(() => editButton.current?.focus()); }
  function saveLand(event: React.FormEvent) {
    event.preventDefault();
    const value = numeric(landValue.trim());
    if (!Number.isFinite(value) || value <= 0 || value > 100000) { setLandError(t("শূন্যের বেশি সঠিক জমির মাপ দিন।", "Enter a valid land area greater than zero.")); return; }
    try {
      const profile = JSON.parse(localStorage.getItem("alusathi-farmer-profile-v1") || "{}");
      localStorage.setItem("alusathi-farmer-profile-v1", JSON.stringify({...profile, land:String(value), landUnit}));
      window.dispatchEvent(new Event(PROFILE_CHANGED));
      setMessage(t("জমির মাপ রাখা হয়েছে। হিসাব বদলে গেছে।", "Land area saved. Quantities updated."));
      closeLand();
    } catch { setLandError(t("মাপ রাখা যায়নি। আবার চেষ্টা করুন।", "Could not save. Please retry.")); }
  }
  const format = (value: number) => value.toLocaleString(bn ? "bn-BD" : "en-GB", { maximumFractionDigits: 2 });
  let dose: ReturnType<typeof exampleTopDressing> | null = null;
  try {
    const measured = areaSquareMetres(numeric(area.value), area.unit, numeric(area.bigha));
    if (!area.example || photoContext(actions)) dose = exampleTopDressing(measured);
  } catch { /* Invalid areas never display nutrient quantities. */ }
  const photo = photoContext(actions);
  const sprayExample = photo?.condition === "marks" && /^demo-sample-[345]-\d{4}-\d{2}-\d{2}$/.test(photo.id);
  const today = localToday();
  const entry = actions.find(item => item.id === `fertilizer-check-${today}`);
  const lastApplied = actions.filter(item => item.status === "applied" && item.id === `fertilizer-check-${item.date}` && item.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0];
  const ureaWindow = cropAgeDays !== null && cropAgeDays >= 30 && cropAgeDays <= 35;
  const windowStart = new Date(`${today}T12:00:00`);
  if (ureaWindow) windowStart.setDate(windowStart.getDate() - (cropAgeDays - 30));
  const alreadyReported = entry?.status === "applied" || (ureaWindow && lastApplied && lastApplied.date >= localToday(windowStart));
  const reminder = lastApplied ? new Date(`${lastApplied.date}T12:00:00`) : null;
  if (reminder) reminder.setDate(reminder.getDate() + 21);
  const reminderLabel = reminder?.toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  function record(applied: boolean) {
    const next: FieldAction = { id: `fertilizer-check-${today}`, date: today, district: localStorage.getItem("alusathi-district") || "", kind: "observation", category: "fertilizer", status: applied ? "applied" : "not-applied", text: applied ? t("সার দেওয়ার কথা জানিয়েছেন", "Reported applying fertilizer") : t("আজ সার দেওয়া হয়নি", "No fertilizer applied today"), details: t("শুধু প্রয়োগের দিন রাখা হয়েছে; সারের ধরন ও পরিমাণ নিশ্চিত করা হয়নি।", "Application date only; products and amounts were not confirmed.") };
    try { saveFieldActions([next, ...readFieldActions().filter(item => item.id !== next.id)].slice(0,100)); setLogError(""); setShowReminderConfirmation(applied); }
    catch { setShowReminderConfirmation(false); setLogError(t("রাখা যায়নি। আবার চেষ্টা করুন।", "Could not save. Please retry.")); }
  }
  return <section className="today-care" aria-labelledby="care-heading">
    <h2 id="care-heading" className="sr-only">{t("সার ও স্প্রের পরিকল্পনা", "Fertiliser and spray plan")}</h2>
    <div className="care-land-summary"><strong>{area.example ? t("জমির মাপ দেওয়া নেই—১ শতক ধরে হিসাব", "Land area not set—estimate for 1 shotok") : `${t("আপনার জমির পরিমাণ:", "Your land area:")} ${format(numeric(area.value))} ${({decimal:t("শতক","shotok"),acre:t("একর","acres"),hectare:t("হেক্টর","hectares"),bigha:t("বিঘা","bigha")})[area.unit]}`}</strong><button ref={editButton} type="button" aria-expanded={editingLand} aria-controls="care-land-editor" onClick={() => { setLandValue(area.value); setLandUnit(area.unit); setLandError(""); setEditingLand(true); }}>{t("এডিট করুন", "Edit")}</button></div>
    {editingLand && <form id="care-land-editor" className="care-land-editor" onSubmit={saveLand} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closeLand(); } }}>
      <label>{t("জমির পরিমাণ", "Land area")}<input autoFocus inputMode="decimal" maxLength={12} value={landValue} onChange={event => setLandValue(event.target.value)} /></label>
      <label>{t("একক", "Unit")}<select value={landUnit} onChange={event => setLandUnit(event.target.value as CareArea["unit"])}><option value="decimal">{t("শতক", "Shotok")}</option><option value="acre">{t("একর", "Acres")}</option><option value="hectare">{t("হেক্টর", "Hectares")}</option><option value="bigha">{t("বিঘা", "Bigha")}</option></select></label>
      {landUnit === "bigha" && <small>{t("এই হিসাবে ১ বিঘা =", "This calculation uses 1 bigha =")} {format(numeric(area.bigha))} {t("শতক", "shotok")}</small>}
      <div><button type="submit">{t("সেভ করুন", "Save")}</button><button type="button" onClick={closeLand}>{t("বাতিল", "Cancel")}</button></div>{landError && <p role="alert">{landError}</p>}
    </form>}
    <div className="care-plan-columns">
    <article className="care-auto-spray" data-photo-condition={photo?.condition || "none"} data-example={sprayExample ? "true" : "false"} aria-labelledby="spray-results-heading"><h3 id="spray-results-heading"><Droplets size={21} />{t("স্প্রে", "Spray")}</h3>
      <div className="care-spray-status"><strong>{t("ছবিতে যা দেখা যাচ্ছে", "What the photo shows")}</strong><p>{photo?.title || t("আগে আলুর ছবি দিন।", "Add a potato photo first.")}</p></div>
      {photo && <div className="care-spray-status"><strong>{t("যা পরীক্ষা করবেন", "What to inspect")}</strong><p>{photo.condition === "healthy" ? t("আলু ঘুরিয়ে দেখুন—নরম, ভেজা বা কাটা অংশ আছে কি না। শুধু ছবি দিয়ে স্প্রে দরকার কি না বলা যায় না।", "Turn the potato over and check for soft, wet or cut areas. A photo alone cannot establish whether spraying is needed.") : t("দাগযুক্ত আলু আলাদা রাখুন। দাগ নরম, ভেজা বা গভীর কি না দেখুন। শুধু আলুর ছবি দেখে মাঠের রোগ বা ওষুধ নিশ্চিত করা যায় না।", "Separate marked potatoes. Check whether marks are soft, wet or deep. A tuber photo cannot confirm a field disease or treatment.")}</p></div>}
      {sprayExample && <details className="care-reference"><summary>{t("স্প্রের উদাহরণ দেখুন", "See a spray example")}</summary>
      {sprayExample ? <><dl className="care-spray-facts"><div className="care-product"><dt>{t("উদাহরণের পণ্য", "Example product")}</dt><dd>Ridomil Gold MZ 68 WG</dd></div><div><dt>{t("মিশ্রণের উদাহরণ", "Mixing example")}</dt><dd>{t("৫০ গ্রাম / ১০ লিটার পানি", "50 g / 10 L water")}</dd></div></dl><p className="care-spray-caution">{t("এটি ১ শতকের প্রয়োজনীয় পরিমাণ নয়। তোলা আলুতে প্রয়োগ করবেন না; বর্তমান লেবেল ও কৃষি কর্মকর্তার পরামর্শ মিলিয়ে নিন।", "This is not the quantity required for 1 shotok. Do not apply to harvested potatoes; check the current label and an agricultural adviser.")}</p><details className="care-reference"><summary>{t("আরও জানুন", "More information")}</summary><p>{t("Syngenta Bangladesh-এর ২০২০ সালের তথ্য: আলুর লেট ব্লাইটে ৫ গ্রাম/লিটার। জমির স্প্রে-পানির পরিমাণ জানা নেই, তাই জমিভিত্তিক ওষুধের মোট দেখানো হয়নি।", "Syngenta Bangladesh, 2020: 5 g/L for potato late blight. Field spray-water volume is unknown, so no area-based product total is inferred.")}</p><a href="https://www.syngenta.com.bd/product/crop-protection/ridomil-gold-mz-68-wg" target="_blank" rel="noopener noreferrer">Syngenta Bangladesh ↗</a></details></> : <p>{!photo ? t("ছবি না দেখে কোনো ওষুধ বাছা হয়নি।", "No medicine selected without a photo.") : photo.condition === "healthy" ? t("অপ্রয়োজনীয় স্প্রে নয়; নিয়মিত পর্যবেক্ষণ করুন।", "Avoid unnecessary spraying; keep inspecting.") : t("তোলা আলুর দাগ থেকে মাঠের ওষুধ নিশ্চিত করা যায় না। নরম বা ভেজা আলু ভালো আলুর সঙ্গে মেশাবেন না।", "A harvested tuber's marks do not establish field treatment. Keep soft or wet potatoes away from sound ones.")}</p>}
      </details>}
      <button type="button" onClick={onPhoto}>{t("ছবির ফল দেখুন", "View photo result")}</button>
    </article>
    <article className="care-auto-fertilizer" aria-labelledby="fertilizer-results-heading">
      <h3 id="fertilizer-results-heading"><Sprout size={21} />{t("আজ কী দেবেন?", "What should you apply today?")}</h3>
      <div className="care-fertilizer-info">
        {alreadyReported ? <p>{t("সার দেওয়া হয়েছে। আবার দেওয়ার আগে কী সার দিয়েছেন, মিলিয়ে নিন।", "Fertiliser was reported. Check what you applied before adding more.")}</p>
          : photo && cropAgeDays === null && dose ? <div className="care-nutrient-grid"><div><span>{t("প্রথম মাসের সার পরিকল্পনা", "First-month fertiliser plan")}</span><strong>{t("ইউরিয়া:", "Urea:")} {format(Math.round(dose.minGrams))}–{format(Math.round(dose.maxGrams))} {t("গ্রাম", "g")}</strong><span>{t("আলু লাগানোর ৩০–৩৫ দিনে একবারের হিসাব। ছবির ফল দেখে আজকের মাত্রা ঠিক করা হয়নি।", "One application around days 30–35. The photo does not determine today's dose.")}</span></div></div>
          : cropAgeDays === null ? <p><a className="text-button" href="#settings">{t("আলু লাগানোর তারিখ দিন", "Add your planting date")}</a>{t(" — আজ সার লাগবে কি না দেখুন।", " to see whether fertiliser is due today.")}</p>
          : !ureaWindow ? <p>{t("আজকের জন্য কোনো সার নির্ধারিত নেই।", "No fertiliser is scheduled for today.")}</p>
          : !dose ? <p>{t("ইউরিয়ার পরিমাণ জানতে জমির মাপ দিন।", "Add your land area to see the urea amount.")}</p>
          : <div className="care-nutrient-grid"><div data-nutrient="urea"><span>{t("ইউরিয়া", "Urea")}</span><strong>{format(Math.round(dose.minGrams))}–{format(Math.round(dose.maxGrams))} {t("গ্রাম", "g")}</strong><span>{t("আনুমানিক পরিমাণ। এই কিস্তি আগে দিলে আবার দেবেন না।", "Estimated amount. Do not repeat this application if already given.")}</span></div></div>}
      </div>
      <div className="care-fertilizer-log"><h3>{t("আজ কি সার দিয়েছেন?", "Did you apply fertiliser today?")}</h3><div><button type="button" aria-pressed={entry?.status === "applied"} onClick={() => record(true)}>{t("হ্যাঁ, আজ দিয়েছি", "Yes, applied today")}</button><button type="button" aria-pressed={entry?.status === "not-applied"} onClick={() => record(false)}>{t("না, আজ দিইনি", "No, not today")}</button></div><p role="status">{logError || (entry ? t("খাতায় রাখা হয়েছে।", "Saved in Khata.") : "")}</p></div>
      {showReminderConfirmation && entry?.status === "applied" && reminderLabel && <p className="care-message" role="status">{t("৩ সপ্তাহ পর এই পাতায় মনে করিয়ে দেব:", "Reminder on this page in 3 weeks:")} {reminderLabel}</p>}
      {reminder && reminder <= new Date(`${today}T12:00:00`) && <p className="care-message">{t("আজ সারের হিসাব মিলিয়ে দেখুন।", "Review your fertiliser record today.")}</p>}
    </article>
    </div>
    {message && <p role="status" className="care-message">{message}</p>}
  </section>;
}
