import { useState } from "react";
import { ArrowUpRight, MessageCircle } from "lucide-react";

export default function PhotoFollowUp({ bn, nextCheck }: { bn: boolean; nextCheck: string }) {
  const [question, select] = useState<"check" | "record" | null>(null);
  const t = (bangla: string, english: string) => bn ? bangla : english;

  return <details className="photo-follow-up">
    <summary><MessageCircle size={17} aria-hidden="true" />{t("ছবির ফল নিয়ে প্রশ্ন", "Questions about this photo")}</summary>
    <div className="photo-follow-up-body">
      <div className="photo-follow-up-questions">
        <button type="button" aria-pressed={question === "check"} onClick={() => select("check")}>{t("এরপর কী দেখব?", "What should I check next?")}</button>
        <button type="button" aria-pressed={question === "record"} onClick={() => select("record")}>{t("খাতায় কী লিখব?", "What should I record?")}</button>
      </div>
      <div aria-live="polite">
        {question === "check" && <><p>{nextCheck}</p><p>{t("যা দেখলেন, ছবির তারিখসহ খাতায় লিখে রাখুন।", "Record what you see with the photo date.")}</p></>}
        {question === "record" && <><p>{t("দাগ কোথায়, দেখতে কেমন, আর আগের ছবির সঙ্গে কী বদলেছে, লিখে রাখুন।", "Record where the mark is, what it looks like, and what has changed since the previous photo.")}</p><a href="/farmer#diary">{t("খাতা খুলুন", "Open Khata")} <ArrowUpRight size={14} aria-hidden="true" /></a></>}
      </div>
    </div>
  </details>;
}
