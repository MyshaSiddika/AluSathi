import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { language } = useLanguage();
  const bn = language === "bn";

  return (
    <footer className="project-footer">
      <div className="project-footer-inner">
        <div><Link to="/" className="project-footer-brand"><Leaf size={24} />{bn ? "আলুসাথী" : "AluSathi"}</Link><p>{bn ? "সহজ তথ্য, সিদ্ধান্ত আপনার।" : "Clear information. Your decision."}</p></div>
        <nav aria-label={bn ? "আমাদের প্রকল্প" : "Our project"}><strong>{bn ? "আমাদের প্রকল্প" : "Our project"}</strong><Link to="/about#team">{bn ? "আমাদের সম্পর্কে" : "About us"}</Link><Link to="/about#project">{bn ? "প্রকল্প সম্পর্কে" : "About the project"}</Link></nav>
        <nav aria-label={bn ? "সহায়তা" : "Support"}><strong>{bn ? "সহায়তা" : "Support"}</strong><Link to="/contact">{bn ? "যোগাযোগ" : "Contact"}</Link><Link to="/help">{bn ? "সহায়তা কেন্দ্র" : "Help centre"}</Link></nav>
        <nav aria-label={bn ? "নীতিমালা" : "Policies"}><Link to="/privacy">{bn ? "তথ্য সুরক্ষা" : "Privacy"}</Link><Link to="/terms">{bn ? "ব্যবহারের শর্ত" : "Terms"}</Link></nav>
      </div>
    </footer>
  );
};

export default Footer;
