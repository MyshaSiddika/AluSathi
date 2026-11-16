import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteTheme } from "@/hooks/useSiteTheme";

const privacy = [
  ["আপনার দেওয়া তথ্য", "Information you provide", "আপনি যে ছবি, জমির নোট ও আলুর তালিকার তথ্য দেন, আলুসাথী সেগুলো সংশ্লিষ্ট সুবিধায় ব্যবহার করে।", "AluSathi uses the photos, field notes, and listing details you provide to run the features you use."],
  ["তালিকায় যা দেখা যায়", "What buyers can see", "আপনি আলুর তালিকা প্রকাশ করলে ক্রেতারা সেই তালিকায় দেওয়া তথ্য দেখতে পারেন। যোগাযোগের তথ্য দেওয়ার আগে দেখে নিন কী শেয়ার করছেন।", "When you publish a potato listing, buyers can see the information you include. Check what you’re sharing before adding contact details."],
];

const usage = [
  ["তালিকার তথ্য", "Listing information", "আলুর সঠিক তথ্য দিন এবং শুধু আপনার ব্যবহারের অধিকার আছে এমন ছবি প্রকাশ করুন।", "Describe your potatoes accurately and share only photos you have permission to use."],
  ["সরাসরি যোগাযোগ", "Direct contact", "আলুসাথী কৃষক ও ক্রেতার পরিচয় করিয়ে দেয়। সংগ্রহের ব্যবস্থা তাঁরা সরাসরি ঠিক করেন।", "AluSathi connects farmers and buyers. They arrange pickup directly with each other."],
];

export default function PolicyPage({ terms = false }: { terms?: boolean }) {
  const { language } = useLanguage();
  const theme = useSiteTheme();
  const bn = language === "bn";
  const title = terms ? (bn ? "ব্যবহারের শর্ত" : "Terms of Use") : (bn ? "তথ্য সুরক্ষা" : "Privacy");

  return (
    <div className={`farmer-v2 min-h-screen ${bn ? "font-bangla" : ""}`} data-home-theme={theme}>
      <main className="app-shell py-12">
        <Link to="/" className="text-button">← {bn ? "মূল পাতায় ফিরুন" : "Back to home"}</Link>
        <h1 className="my-4 text-3xl font-bold">{title}</h1>
        <div className="max-w-2xl space-y-6">
          <p>{bn ? "খসড়া" : "Draft"}</p>
          {(terms ? usage : privacy).map(([headingBn, headingEn, bodyBn, bodyEn]) => (
            <section key={headingEn}>
              <h2 className="mb-2 text-xl font-bold">{bn ? headingBn : headingEn}</h2>
              <p>{bn ? bodyBn : bodyEn}</p>
            </section>
          ))}
          <Link to="/contact" className="text-button">{bn ? "যোগাযোগ" : "Contact"}</Link>
        </div>
      </main>
    </div>
  );
}
