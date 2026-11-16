import { fieldCards } from "@/data/today-field-tasks";
import type { FieldAction } from "./field-actions";

export type PlanPhoto = { id: string; title: string; body: string; condition: "healthy" | "marks" | "unclear"; modelResult?: "healthy" | "defective"; date?: string; sample?: number; thumbnail?: string };
export type PlanContext = { date: string; district: string; band: string; cropDay?: number; rainMode?: "heavy" | "current" | "forecast"; rain: boolean; humid: boolean; photo: PlanPhoto | null; lastTreatment?: string };
export type PlanTask = { id: string; text: string; why: string; how: string };
export function recentPhoto(actions: FieldAction[], district: string, today: string) {
  const now = Date.parse(today);
  return photoContext(actions.filter(item => {
    const elapsed = now - Date.parse(item.date);
    return item.district === district && elapsed >= 0 && elapsed <= 7 * 86400000;
  }));
}
export function sprayReference(photo: PlanPhoto | null, bn: boolean) {
  if (photo?.sample === 4) return bn ? "ম্যানকোজেব + মেটাল্যাক্সিল" : "Mancozeb + metalaxyl";
  if (photo?.sample === 5) return bn ? "ম্যানকোজেব" : "Mancozeb";
  return null;
}
export function photoContext(actions: FieldAction[]): PlanPhoto | null {
  const item = actions.find(action => action.category === "photo" && action.kind === "observation");
  if (!item) return null;
  const thumbnail = typeof item.image === "string" && item.image.length <= 60000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(item.image) ? item.image : undefined;
  return { id: item.id, title: typeof item.title === "string" ? item.title.slice(0,200) : "", body: typeof item.body === "string" ? item.body.slice(0,600) : "", condition: item.advice === "healthy" ? "healthy" : item.advice ? "marks" : "unclear", date: item.date, sample: Number(/^demo-sample-([1-5])-/.exec(item.id)?.[1]) || undefined, thumbnail, modelResult: item.tuberModelResult === "healthy" || item.tuberModelResult === "defective" ? item.tuberModelResult : undefined };
}
export function readTodayPlan(fallback: PlanContext): PlanContext {
  try {
    const saved = JSON.parse(localStorage.getItem("alusathi-today-plan-v1") || "null");
    if (saved?.date === fallback.date && saved.district === fallback.district && ["", "lt30","30to60","60to90","gt90"].includes(saved.band) && typeof saved.rain === "boolean" && typeof saved.humid === "boolean" && (!saved.lastTreatment || typeof saved.lastTreatment === "string") && (saved.photo === null || (typeof saved.photo?.id === "string" && typeof saved.photo.title === "string" && typeof saved.photo.body === "string" && ["healthy","marks","unclear"].includes(saved.photo.condition)))) return saved;
  } catch { /* Invalid saved plans never replace current field context. */ }
  return fallback;
}
export function buildPhotoTasks(context: PlanContext, bn: boolean): PlanTask[] {
  const t = (b:string,e:string) => bn ? b : e;
  const tasks: PlanTask[] = [];
  const add = (id:string,text:string,why:string) => tasks.push({id,text,why,how: t("জমিতে গিয়ে দেখে নিন এবং কাজ হলে টিক দিন।", "Check your field and tick this when done.")});
  if (context.photo?.condition === "healthy") add("photo-healthy",t("আলুটি ঘুরিয়ে নরম বা ভেজা অংশ আছে কি না দেখুন।","Turn the potato and check for soft or wet areas."),t("ছবিতে বড় দাগ না থাকলেও সব দিক ছবিতে দেখা যায় না। অকারণে স্প্রে নয়।","A photo does not show every surface. A normal-looking photo is not a reason to spray."));
  if (context.photo?.condition === "marks") {
    const labels: Record<number, [string,string]> = { 2:["হালকা দাগের চারপাশ আলাদা করে দেখুন।","Inspect around the light marks."], 3:["ছড়িয়ে থাকা দাগ নরম বা ভেজা কি না দেখুন।","Check whether the spread-out marks are soft or wet."], 4:["ক্ষতিগ্রস্ত আলুটি আলাদা রেখে ভেজা অংশ দেখুন।","Set the damaged potato apart and check for wet areas."], 5:["গভীর ক্ষতির আলুটি আলাদা পাত্রে রাখুন।","Keep the deeply damaged potato in a separate container."] };
    const label = labels[context.photo.sample || 0];
    add("photo-separate", label ? t(...label) : context.photo.modelResult ? t("আলুটি আলাদা করে দাগ আছে কি না দেখুন।","Set the potato aside and check for marks.") : t("দাগযুক্ত আলুটি আলাদা করে ক্ষতির জায়গা দেখুন।","Keep the marked potato separate and check the damaged area."),t("ছবির দাগের কারণ নিশ্চিত নয়। তোলা আলু দেখে মাঠের ওষুধ নির্ধারণ করা যায় না।","The cause of the marks is not clear. A harvested potato cannot tell you which field treatment to use."));
  }
  if (context.photo?.condition === "unclear") add("photo-retake",t("দিনের আলোয় একই আলুর অন্য দিকের ছবি দিন।","Take a photo of another side of the same potato in daylight."),t("অস্পষ্ট ফল দিয়ে রোগ বা ওষুধ বাছা ঠিক নয়।","Do not use an unclear result to choose a disease or treatment."));
  const how: Record<string, [string,string]> = {
    "photo-healthy": ["আলুটি ঘুরিয়ে প্রতিটি দিক হাতে ও চোখে দেখুন।", "Turn the potato and check each side by hand and eye."],
    "photo-separate": ["আলুটি আলাদা রেখে নরম বা ভেজা অংশ আছে কি না দেখুন।", "Set it aside and check for soft or wet areas."],
    "photo-retake": ["দিনের আলোয় কাছে থেকে আরেকটি পরিষ্কার ছবি তুলুন।", "Take a clear close-up in daylight."],
  };
  return tasks.map(task => ({ ...task, how: t(...how[task.id]) }));
}

export const rainTaskIds = ["rain-heavy", "rain-current", "rain-forecast"];

export function buildTodayTasks(context: PlanContext, bn: boolean): PlanTask[] {
  const lang = bn ? 0 : 1;
  const day = context.cropDay;
  type CardId = keyof typeof fieldCards;
  let ids: CardId[] = ["general-check", "soil-observe", "field-record"];
  if (day !== undefined && day <= 14) ids = ["emergence", "soil-observe", "field-record"];
  else if (day !== undefined ? day <= 30 : context.band === "lt30") ids = ["early-weeds", "soil-observe", "leaf-check"];
  else if (day !== undefined && day <= 45) ids = ["tuber-set", "ridge-cover", "leaf-check"];
  else if (day !== undefined && day <= 70) ids = ["tuber-bulking", "ridge-cover", "leaf-check"];
  else if (day !== undefined || context.band === "gt90") ids = ["harvest-check", "ridge-cover", "field-record"];
  else if (context.band === "30to60" || context.band === "60to90") ids = ["soil-observe", "ridge-cover", "leaf-check"];

  const tasks = ids.map(id => {
    const [title, method, reason] = fieldCards[id];
    return { id, text: title[lang], how: method[lang], why: reason[lang] };
  });
  if (!context.rainMode || !rainTaskIds.includes(`rain-${context.rainMode}`)) return tasks;

  const rainTasks = {
    heavy: [
      ["বৃষ্টির আগে পানি বের হওয়ার নালা খোলা আছে কি না দেখুন।", "Check that the drainage outlet is clear before the rain."],
      ["জমির নিচু দিকের নালার মুখ দেখুন। আবহাওয়া নিরাপদ থাকলে জমে থাকা পাতা বা আলগা মাটি সরান।", "Check the outlet at the low end of the field. Clear loose leaves or soil while conditions are safe."],
      ["ভারী বৃষ্টির সম্ভাবনা আছে।", "Heavy rain is forecast."],
    ],
    current: [
      ["বৃষ্টি থামলে জমির নিচু অংশে পানি জমেছে কি না দেখুন।", "After the rain stops, check low spots for standing water."],
      ["আবহাওয়া নিরাপদ হলে নিচু সারি আর নালার মুখ দেখুন। পানি দাঁড়িয়ে থাকলে আর সেচ দেবেন না।", "When conditions are safe, look at low rows and the drainage outlet. Hold off on irrigation if water is standing."],
      ["এলাকার আবহাওয়ার তথ্যে বৃষ্টি দেখা যাচ্ছে।", "The local weather feed indicates rain."],
    ],
    forecast: [
      ["বৃষ্টি হওয়ার পর গোড়ার মাটি দেখে সেচ ঠিক করুন।", "Check root-zone moisture after the expected rain before irrigating."],
      ["কয়েক সারির ওপরের মাটি সরিয়ে নিচে দেখুন। ভেতরে ভেজা থাকলে সেচের জন্য অপেক্ষা করুন।", "Check below the surface in several rows. Wait to irrigate if the soil underneath is still moist."],
      ["আজ এলাকায় বৃষ্টির সম্ভাবনা আছে।", "Rain is forecast for your area today."],
    ],
  };
  const [title, method, reason] = rainTasks[context.rainMode];
  const remaining = tasks.filter(task => !["soil-observe", "tuber-set", "tuber-bulking"].includes(task.id));
  const [record, recordMethod, recordReason] = fieldCards["field-record"];
  if (remaining.length < 2 && !remaining.some(task => task.id === "field-record")) {
    remaining.push({ id: "field-record", text: record[lang], how: recordMethod[lang], why: recordReason[lang] });
  }
  return [{ id: `rain-${context.rainMode}`, text: title[lang], how: method[lang], why: reason[lang] }, ...remaining.slice(0, 2)];
}
