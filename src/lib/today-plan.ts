import type { FieldAction } from "./field-actions";

export type PlanPhoto = { id: string; title: string; body: string; condition: "healthy" | "marks" | "unclear" };
export type PlanContext = { date: string; district: string; band: string; rain: boolean; humid: boolean; photo: PlanPhoto | null; lastTreatment?: string };
export type PlanTask = { id: string; text: string; why: string };
export function photoContext(actions: FieldAction[]): PlanPhoto | null {
  const item = actions.find(action => action.category === "photo" && action.kind === "observation");
  if (!item) return null;
  return { id: item.id, title: typeof item.title === "string" ? item.title.slice(0,200) : "", body: typeof item.body === "string" ? item.body.slice(0,600) : "", condition: item.advice === "healthy" ? "healthy" : item.advice ? "marks" : "unclear" };
}
export function readTodayPlan(fallback: PlanContext): PlanContext {
  try {
    const saved = JSON.parse(localStorage.getItem("alusathi-today-plan-v1") || "null");
    if (saved?.date === fallback.date && saved.district === fallback.district && ["", "lt30","30to60","60to90","gt90"].includes(saved.band) && typeof saved.rain === "boolean" && typeof saved.humid === "boolean" && (!saved.lastTreatment || typeof saved.lastTreatment === "string") && (saved.photo === null || (typeof saved.photo?.id === "string" && typeof saved.photo.title === "string" && typeof saved.photo.body === "string" && ["healthy","marks","unclear"].includes(saved.photo.condition)))) return saved;
  } catch { /* Invalid saved plans never replace current field context. */ }
  return fallback;
}
export function buildTodayTasks(context: PlanContext, bn: boolean): PlanTask[] {
  const t = (b:string,e:string) => bn ? b : e;
  const tasks: PlanTask[] = [];
  const add = (id:string,text:string,why:string) => tasks.push({id,text,why});
  if (context.photo?.condition === "healthy") add("photo-healthy",t("আলুটি ঘুরিয়ে নরম বা ভেজা অংশ আছে কি না দেখুন।","Turn the potato and check for soft or wet areas."),t("ছবিতে বড় দাগ না থাকলেও সব দিক ছবিতে দেখা যায় না। অকারণে স্প্রে নয়।","A photo does not show every surface. A normal-looking photo is not a reason to spray."));
  if (context.photo?.condition === "marks") add("photo-separate",t("দাগযুক্ত আলুটি আলাদা করে ক্ষতির জায়গা দেখুন।","Separate the marked potato and inspect the damaged area."),t("ছবির দাগের কারণ নিশ্চিত নয়। তোলা আলুর ক্ষতি দেখে দাঁড়ানো ফসলে ওষুধ নির্ধারণ করা যায় না।","The cause is unconfirmed. Damage on a harvested potato does not establish a field-spray treatment."));
  if (context.photo?.condition === "unclear") add("photo-retake",t("দিনের আলোয় একই আলুর অন্য দিকের ছবি দিন।","Take another side of the same potato in daylight."),t("অস্পষ্ট ফল দিয়ে রোগ বা ওষুধ বাছা ঠিক নয়।","An uncertain photo result cannot support a diagnosis or product choice."));
  if (context.band === "lt30") add("early-growth",t("অঙ্কুর ও ছোট গাছের বৃদ্ধি দেখুন।","Check emergence and young plant growth."),t("আপনার দেওয়া চাষের সময় এক মাসের কম।","Your recorded crop age is under one month."));
  else if (context.band === "30to60") add("growing-leaves",t("গাছের নিচের পাতায় নতুন দাগ আছে কি না দেখুন।","Look for new marks on lower leaves."),t("গাছের বৃদ্ধির এই পর্যায়ে নতুন পরিবর্তন লিখে রাখুন।","Record new changes during this growth stage."));
  else if (context.band === "60to90") add("soil-check",t("মাটির আর্দ্রতা ও গাছের অবস্থা দেখুন।","Check soil moisture and plant condition."),t("শুধু বয়স ধরে সেচ বা তোলার দিন ঠিক করবেন না।","Do not set irrigation or harvest solely from crop age."));
  else if (context.band === "gt90") add("harvest-check",t("পাতা শুকাচ্ছে কি না দেখে তোলার প্রস্তুতি যাচাই করুন।","Check foliage dieback when reviewing harvest readiness."),t("জাত ও জমির অবস্থা না দেখে বয়স থেকেই তোলার সিদ্ধান্ত নয়।","Age alone is not a harvest decision; variety and field conditions matter."));
  if (context.rain) add("drainage",t("জমিতে পানি জমেছে কি না দেখুন।","Check whether water is standing in the field."),t("সংরক্ষিত আবহাওয়ার তথ্যে বৃষ্টি আছে।","The weather context used for this plan includes rain."));
  else if (context.humid) add("humidity-check",t("কয়েকটি গাছের পাতার দুই পাশ দেখুন।","Inspect both sides of leaves on several plants."),t("আর্দ্রতা পর্যবেক্ষণের কারণ, রোগ নিশ্চিত হওয়ার প্রমাণ নয়।","Humidity is a reason to inspect, not evidence of a confirmed disease."));
  if (!tasks.length) add("general-check",t("জমির একই জায়গার কয়েকটি গাছ দেখে রাখুন।","Check a few plants in the same part of the field."),t("ছবি বা চাষের সময় না থাকলে সাধারণ পর্যবেক্ষণ দিয়ে শুরু করুন।","Start with general observation when photo or crop-age context is missing."));
  if (context.lastTreatment) add("treatment-review",t("আর কিছু দেওয়ার আগে আগের প্রয়োগের রেকর্ড মিলিয়ে নিন।","Review the previous application record before applying anything else."),t("আগের প্রয়োগ রাখা আছে। নতুন ছবি মানেই আবার সার বা স্প্রে দেওয়ার নির্দেশ নয়।","An application is already recorded. A new photo does not mean another fertiliser or spray application is due."));
  return tasks;
}
