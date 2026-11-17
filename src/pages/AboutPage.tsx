import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteTheme } from "@/hooks/useSiteTheme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AboutPage() {
  const { language } = useLanguage();
  const theme = useSiteTheme();
  const bn = language === "bn";
  const { hash } = useLocation();
  const navigate = useNavigate();

  return (
    <div className={`farmer-v2 min-h-screen ${bn ? "font-bangla" : ""}`} data-home-theme={theme}>
      <main className="app-shell py-12">
        <Link to="/" className="text-button">← {bn ? "মূল পাতায় ফিরুন" : "Back to home"}</Link>
        <h1 className="my-4 text-3xl font-bold">{bn ? "আমাদের প্রকল্প" : "Our Project"}</h1>
        <Tabs value={hash === "#project" ? "project" : "team"} onValueChange={value => navigate(`/about#${value}`, { replace: true })}>
          <TabsList aria-label={bn ? "আমাদের প্রকল্প" : "Our Project"}>
            <TabsTrigger value="team">{bn ? "আমাদের সম্পর্কে" : "About Us"}</TabsTrigger>
            <TabsTrigger value="project">{bn ? "প্রকল্প সম্পর্কে" : "About This Project"}</TabsTrigger>
          </TabsList>
          <TabsContent value="team" className="mt-6">
            <p>{bn ? "দলের সদস্যদের পরিচিতি শিগগিরই এখানে পাওয়া যাবে।" : "Team profiles will be available here."}</p>
          </TabsContent>
          <TabsContent value="project" className="mt-6">
            <p className="max-w-2xl text-lg">{bn
              ? "আলুসাথী বাংলাদেশের আলুচাষিদের জন্য তৈরি। আলু লাগানো থেকে ফসল তোলা পর্যন্ত জমির কাজ গুছিয়ে রাখতে আর পরে ক্রেতাদের কাছে আলুর তথ্য পৌঁছে দিতে এটি সাহায্য করে।"
              : "AluSathi is built for potato farmers in Bangladesh. It helps them keep track of fieldwork from planting through harvest and share information about their potatoes with buyers."}</p>
            <div className="mt-8 grid max-w-4xl grid-cols-2 gap-5">
              <section className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-soft)] p-5" aria-labelledby="about-growing">
                <h2 id="about-growing" className="mb-2 text-xl font-bold">{bn ? "জমির কাজ এক জায়গায়" : "Keep track of fieldwork"}</h2>
                <p>{bn
                  ? "আজকের কাজ দেখুন, মৌসুমের ধাপ বুঝুন, আর জমির কাজ ও খরচ খাতায় লিখে রাখুন।"
                  : "Check today’s tasks, see what comes next in the season, and record fieldwork and expenses in the ledger."}</p>
              </section>
              <section className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-soft)] p-5" aria-labelledby="about-market">
                <h2 id="about-market" className="mb-2 text-xl font-bold">{bn ? "কৃষক ও ক্রেতার সরাসরি যোগাযোগ" : "Connect farmers and buyers"}</h2>
                <p>{bn
                  ? "কৃষক আলুর তালিকা দেন। ক্রেতা সেই তালিকা দেখে কৃষকের সঙ্গে কথা বলেন এবং আলু সংগ্রহের ব্যবস্থা ঠিক করেন।"
                  : "Farmers list their potatoes. Buyers browse the listings, contact farmers directly, and arrange pickup with them."}</p>
              </section>
            </div>
            <section className="mt-8 max-w-4xl" aria-labelledby="about-evaluation">
              <h2 id="about-evaluation" className="mb-2 text-xl font-bold">{bn ? "প্রকল্পের পরিসংখ্যান" : "Project Statistics"}</h2>
              <p>{bn ? "আলুর পাতার ছবি শনাক্তকরণের পরীক্ষায় পাওয়া ফল।" : "Results from testing the potato leaf classifier."}</p>
              <dl className="my-4 grid grid-cols-3 gap-5">
                <div className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-soft)] p-5">
                  <dt>{bn ? "আঞ্চলিক পরীক্ষার ছবি" : "Regional test images"}</dt>
                  <dd className="mt-1 text-2xl font-bold">{bn ? "১৩,৮০০" : "13,800"}</dd>
                </div>
                <div className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-soft)] p-5">
                  <dt>{bn ? "PlantVillage পরীক্ষার নির্ভুলতা" : "PlantVillage test accuracy"}</dt>
                  <dd className="mt-1 text-2xl font-bold">{bn ? "৯৫.৯৮%" : "95.98%"}</dd>
                </div>
                <div className="rounded-2xl border border-[var(--home-line)] bg-[var(--home-soft)] p-5">
                  <dt>{bn ? "আঞ্চলিক পরীক্ষার নির্ভুলতা" : "Regional test accuracy"}</dt>
                  <dd className="mt-1 text-2xl font-bold">{bn ? "৫১.১৯%" : "51.19%"}</dd>
                </div>
              </dl>
              <p>{bn
                ? "আঞ্চলিক পরীক্ষায় বাংলাদেশ, উত্তর প্রদেশ ও পশ্চিমবঙ্গের এমন ছবি ব্যবহার করা হয়েছে, যেগুলো দিয়ে মডেলটি প্রশিক্ষণ দেওয়া হয়নি। মাঠে রোগ নির্ণয়ের জন্য যাচাই এখনো বাকি।"
                : "The regional test used images from Bangladesh, Uttar Pradesh, and West Bengal that were excluded from training. Field validation for disease diagnosis is pending."}</p>
            </section>
            <section className="mt-8 max-w-4xl" aria-labelledby="about-field-plan">
              <h2 id="about-field-plan" className="mb-2 text-xl font-bold">{bn ? "পুরো মৌসুমে মাঠ পর্যবেক্ষণ" : "Full-season field observations"}</h2>
              <p>{bn
                ? "পরবর্তী আলুর মৌসুম শুরু হলে রোপণ থেকে ফসল তোলা পর্যন্ত মাঠ পর্যবেক্ষণ এবং বিভিন্ন ধাপে ছবি ও নোট সংগ্রহের পরিকল্পনা আছে। নতুন তথ্য দিয়ে মাঠের ছবিতে মডেলটির ফল যাচাই করা হবে।"
                : "When the next potato season begins, we plan to observe crops from planting through harvest and collect photos and notes at each stage. We’ll use the new observations to check how the model performs on field images."}</p>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
