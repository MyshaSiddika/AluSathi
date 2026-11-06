import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Droplets, Eye, Flower2, Leaf, PackageCheck, Sprout, Volume2 } from "lucide-react";
import "@/farmer-today.css";
import type { WeatherData } from "@/lib/api";
import { cropAge, cropGuidance, plantingAges, rangeGuidance, type PlantingAge } from "@/lib/crop-advice";
import { spreadOutlook } from "@/lib/farmer-tools";
import { localToday } from "@/lib/local-date";
import { useLanguage } from "@/contexts/LanguageContext";
import { readFieldActions, saveFieldActions, FIELD_ACTIONS_EVENT, type FieldAction } from "@/lib/field-actions";
import { buildTodayTasks, photoContext, readTodayPlan, type PlanContext, type PlanTask } from "@/lib/today-plan";
import TodayCare from "./TodayCare";
import TodayWeather from "./TodayWeather";
import { readCareArea } from "@/lib/care-area";
import { PROFILE_CHANGED } from "@/lib/farmer-profile";

type CheckinPreview = { createdAt: string; thumbnails: string[] };

const ageIcons = { lt30: Sprout, "30to60": Leaf, "60to90": Flower2, gt90: PackageCheck };
const taskStyles = [
  { tone: "urgent", Icon: Leaf },
  { tone: "info", Icon: Droplets },
  { tone: "calm", Icon: Eye },
] as const;

function readActions(): FieldAction[] {
  return readFieldActions();
}

function ageBand(age: number | null, range: PlantingAge | ""): PlantingAge | "" {
  if (age === null) return range;
  if (age < 30) return "lt30";
  if (age < 60) return "30to60";
  if (age < 90) return "60to90";
  return "gt90";
}

export default function FarmerToday({ weather, loading, district, districts, plantingDate, onPhoto }: {
  weather: WeatherData | null; loading: boolean; district: string; districts: Record<string, string>;
  plantingDate: string; onPhoto: () => void; lastCheckin?: CheckinPreview;
}) {
  const { language } = useLanguage(); const bn = language === "bn";
  const [range, setRange] = useState<PlantingAge | "">(() => {
    const value = localStorage.getItem("alusathi-planting-age");
    return plantingAges.includes(value as PlantingAge) ? value as PlantingAge : "";
  });
  const [recorded, setRecorded] = useState(() => localStorage.getItem("alusathi-planting-age-recorded") || "");
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [actions, setActions] = useState(readActions);
  const [area, setArea] = useState(readCareArea);
  const [saveError, setSaveError] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const refresh = () => { setActions(readActions()); setArea(readCareArea()); };
    window.addEventListener(PROFILE_CHANGED, refresh);
    window.addEventListener(FIELD_ACTIONS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener(PROFILE_CHANGED, refresh); window.removeEventListener(FIELD_ACTIONS_EVENT, refresh); window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => setVoice(speechSynthesis.getVoices().find(v => /^bn(?:-|_)/i.test(v.lang) || v.lang === "bn") || null);
    refresh(); speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => { speechSynthesis.removeEventListener("voiceschanged", refresh); speechSynthesis.cancel(); };
  }, []);

  const age = cropAge(plantingDate);
  const elapsed = cropAge(recorded);
  const stale = Boolean(range) && (elapsed === null || elapsed >= 30);
  const approximate = age === null && range && !stale ? rangeGuidance(range, bn) : null;
  const advice = cropGuidance(age, weather, bn);
  const risk = spreadOutlook(weather);
  const hasPlanting = age !== null || Boolean(approximate);
  const currentBand = ageBand(age, approximate ? range : "");
  const stage = age !== null ? `${bn ? `লাগানোর ${age.toLocaleString("bn-BD")} দিন` : `Day ${age}`} · ${advice.stage}` : approximate?.stage;
  const number = (value: number) => value.toLocaleString(bn ? "bn-BD" : "en-GB", { maximumFractionDigits: 1 });

  const freshWeather = Boolean(weather?.observed_at && !weather.cached && Number.isFinite(Date.parse(weather.observed_at)) && Date.now() - Date.parse(weather.observed_at) < 6 * 3600_000);
  const treatment = actions.find(item => (item.category === "fertilizer" || item.category === "spray") && item.status === "applied");
  const candidate: PlanContext = { date: localToday(), district, band: currentBand, rain: freshWeather && Boolean(weather && (weather.rainfall > 0 || (weather.forecastRainMm ?? 0) > 0)), humid: Boolean(risk?.high), photo: photoContext(actions), lastTreatment: treatment ? `${treatment.date} · ${treatment.details || treatment.text}` : "" };
  const [plan, setPlan] = useState(() => readTodayPlan(candidate));
  const tasks = useMemo(() => buildTodayTasks(plan,bn), [plan,bn]);
  const contextKey = JSON.stringify(candidate);
  useEffect(() => {
    const next = JSON.parse(contextKey) as PlanContext;
    setPlan(next);
    try { localStorage.setItem("alusathi-today-plan-v1", contextKey); }
    catch { setSaveError(bn ? "তালিকা সেভ হয়নি। আবার চেষ্টা করুন।" : "Checklist could not be saved. Please retry."); }
  }, [contextKey, bn]);
  const actionKey = (task: PlanTask) => `today|${localToday()}|${district}|${task.id}|${task.id.startsWith("photo-") ? plan.photo?.id || "" : ""}`;
  const completed = new Set(actions.filter(action => action.date === localToday() && action.kind === "task").map(action => action.id));
  const saveActions = (next: FieldAction[]) => {
    try { localStorage.setItem("alusathi-today-plan-v1",JSON.stringify(plan)); saveFieldActions(next); setActions(next); setSaveError(""); }
    catch { setSaveError(bn ? "রাখা যায়নি। আবার চেষ্টা করুন।" : "Could not save. Please retry."); }
  };
  const toggleTask = (task: PlanTask) => {
    const key = actionKey(task);
    if (completed.has(key)) saveActions(actions.filter(action => action.id !== key));
    else saveActions([{ id: key, date: localToday(), text: task.text, district, kind: "task" as const }, ...actions].slice(0, 100));
  };
  const choose = (value: PlantingAge) => {
    setRange(value); setRecorded(localToday());
    localStorage.setItem("alusathi-planting-age", value); localStorage.setItem("alusathi-planting-age-recorded", localToday());
  };

  const completedCount = tasks.filter(item => completed.has(actionKey(item))).length;
  const dateLabel = new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Dhaka" }).format(new Date());

  return <><div className="farmer-field-scene" aria-hidden="true">
    {["one", "two", "three", "four", "five"].map(name => <img key={name} className={`field-leaves field-leaves-${name}`} src="/field-potato-leaves.webp" alt="" />)}
    {["one", "two"].map(name => <img key={name} className={`field-tree field-tree-${name}`} src="/field-tree-canopy.webp" alt="" />)}
    <span className="field-bird field-bird-one"><svg viewBox="0 0 62 28" fill="none"><path d="M2 20 Q9 11 17 19 Q25 11 32 20 M29 9 Q35 2 41 9 Q48 2 54 10" /></svg></span><span className="field-bird field-bird-two"><svg viewBox="0 0 62 28" fill="none"><path d="M2 21 Q15 2 30 17 Q45 2 60 21" /></svg></span>
  </div><section className="app-shell farmer-today" aria-label={bn ? "আজকের কাজ" : "Today's work"}>
    <div className="today-titlebar">
      <div className="farmer-greeting"><div><p className="today-date">{dateLabel}</p><h1>{bn ? "আজকের কাজ" : "Today's work"}</h1><p>{bn ? "কাজ করুন, শেষ হলে টিক দিন।" : "Tick off each task as you finish."}</p></div></div>
    <div className="today-field-context">
      <div className="today-location"><span><Sprout size={18} />{bn ? "আমার জমি" : "My field"}</span><strong>{districts[district] || district} · {number(Number(area.value))} {({decimal:bn ? "শতক" : "shotok",acre:bn ? "একর" : "acres",hectare:bn ? "হেক্টর" : "ha",bigha:bn ? "বিঘা" : "bigha"})[area.unit]}</strong></div>
      <div className="today-crop-context"><span>{bn ? "চাষের সময়" : "Crop stage"}</span><strong>{stage || (bn ? "বয়স দেওয়া হয়নি" : "Crop age not added")}</strong></div>
      {stage && bn && voice && <button className="farmer-listen" onClick={() => { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance([stage, ...tasks.map(item => item.text)].join("। ")); utterance.voice = voice; utterance.lang = voice.lang; speechSynthesis.speak(utterance); }}><Volume2 size={17} />শুনুন</button>}
      {age === null && <details className="today-age-editor"><summary>{hasPlanting ? (bn ? "বয়স বদলান" : "Change age") : (bn ? "গাছের বয়স দিন" : "Add crop age")}</summary><fieldset className="planting-choices"><legend>{stale ? (bn ? "এখন গাছের বয়স কত?" : "How old is the crop now?") : (bn ? "কবে আলু লাগিয়েছেন?" : "When did you plant?")}</legend>{plantingAges.map(value => { const AgeIcon = ageIcons[value]; return <button type="button" key={value} aria-pressed={currentBand === value} onClick={event => { choose(value); event.currentTarget.closest("details")?.removeAttribute("open"); }}><AgeIcon size={17} />{rangeGuidance(value, bn).stage.replace(bn ? "প্রায় " : "Approximately ", "")}</button>; })}</fieldset></details>}
    </div>
    </div>

    <div className="today-layout"><div className="today-primary-column">
      <div className="farmer-day-card">
        <div className="today-checklist-heading"><h2>{bn ? "আজকের চেকলিস্ট" : "Today's checklist"}</h2><span className="today-completion" role="status">{number(completedCount)} / {number(tasks.length)} {bn ? "শেষ" : "done"}</span></div>
        <div className="today-photo-basis"><p>{plan.photo ? (bn ? "আপনার দেওয়া ছবির ভিত্তিতে আজকের কাজ।" : "Today's tasks are based on your photo.") : (bn ? "ছবি দিলে সেই অনুযায়ী কাজ দেখাবে।" : "Add a photo to see tasks based on it.")}</p>{plan.photo && <span key={contextKey} className="today-plan-ready" role="status"><Check size={16} aria-hidden="true"/>{bn ? "তালিকা তৈরি" : "Checklist ready"}</span>}</div>
        {tasks.length > 0 && <progress className="today-progress" value={completedCount} max={tasks.length} aria-label={bn ? "আজকের কাজের অগ্রগতি" : "Today's task progress"} />}
        {!hasPlanting && <p className="today-context-note">{bn ? "গাছের বয়স জানালে বয়স অনুযায়ী কাজ দেখাতে পারব।" : "Add the crop's age to see checks for its stage."}</p>}
        <div className="today-task-list">{tasks.map((item, index) => { const done = completed.has(actionKey(item)); const { Icon } = taskStyles[index % taskStyles.length]; return <div className={`today-task ${done ? "done" : ""}`} key={item.id}><label><input type="checkbox" checked={done} onChange={() => toggleTask(item)} /><span className="task-check" aria-hidden="true">{done ? <Check size={20} /> : <Icon size={21} />}</span><strong>{item.text}</strong></label><details><summary>{bn ? "কেন?" : "Why?"}</summary><p>{item.why}</p></details></div>; })}</div>
        {tasks.length === 0 && <p className="today-no-tasks">{bn ? "এখন কী কাজ করবেন, তা বোঝা যাচ্ছে না। গাছের বয়স লিখুন বা জমির নতুন খবর যোগ করুন।" : "There is not enough context for a task yet. Add crop age or a new observation."}</p>}
        {tasks.length > 0 && completedCount === tasks.length && <p className="today-all-done" role="status"><Check size={18} />{bn ? "আজকের তালিকার সব কাজ শেষ।" : "All tasks on today's list are complete."}</p>}
        {saveError && <p role="alert">{saveError}</p>}
      </div>
    </div>

    <TodayWeather weather={weather} loading={loading} district={bn ? districts[district] || district : district} bn={bn} fresh={freshWeather} online={online}/></div>
    <TodayCare bn={bn} area={area} actions={actions} cropAgeDays={age} onPhoto={onPhoto} />
    <div className="today-next"><Link to="/farmer#diary">{bn ? "খাতায় যান →" : "Go to Khata →"}</Link></div>
  </section></>;
}
