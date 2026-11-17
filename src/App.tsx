import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import PotatoLifeCycle from "@/pages/PotatoLifeCycle";
import ColdStoragePage from "@/pages/ColdStoragePage";
import SellingPreparationDetails from "@/pages/SellingPreparationDetails";
import { DemoProvider, DemoEntry } from "@/contexts/DemoContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import SupportPage from "@/pages/SupportPage";
import AboutPage from "@/pages/AboutPage";
import PolicyPage from "@/pages/PolicyPage";
import Footer from "@/components/Footer";

function PageTitle() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  useEffect(() => {
    const titles: Record<string, [string, string]> = {
      "/": ["আলুসাথী — বাংলাদেশের আলুচাষির ডিজিটাল সাথী", "AluSathi — Practical help for potato farmers"],
      "/farmer": ["আমার পাতা — আলুসাথী", "Farmer dashboard — AluSathi"],
      "/auth": ["কৃষক নাকি ক্রেতা — আলুসাথী", "Farmer or buyer — AluSathi"],
      "/account": ["আমার অ্যাকাউন্ট — আলুসাথী", "My account — AluSathi"],
      "/contact": ["যোগাযোগ — আলুসাথী", "Contact — AluSathi"],
      "/about": ["আমাদের প্রকল্প — আলুসাথী", "Our Project — AluSathi"],
      "/privacy": ["তথ্য সুরক্ষা — আলুসাথী", "Privacy — AluSathi"],
      "/terms": ["ব্যবহারের শর্ত — আলুসাথী", "Terms of Use — AluSathi"],
      "/help": ["সহায়তা কেন্দ্র — আলুসাথী", "Help Center — AluSathi"],
      "/life-cycle": ["আলুর জীবন — আলুসাথী", "Potato life cycle — AluSathi"],
      "/selling-preparation": ["বিক্রির প্রস্তুতি — আলুসাথী", "Prepare to sell — AluSathi"],
      "/selling-preparation/details": ["পথ ও গাড়ি — আলুসাথী", "Route and transport — AluSathi"],
    };
    document.title = titles[pathname]?.[language === "bn" ? 0 : 1] || "AluSathi";
  }, [pathname, language]);
  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider><DemoProvider><BrowserRouter>
        <PageTitle />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/farmer" element={<Index farmerHome />} />
          <Route path="/auth" element={<DemoEntry />} />
          <Route path="/account" element={<Auth />} />
          <Route path="/contact" element={<SupportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PolicyPage />} />
          <Route path="/terms" element={<PolicyPage terms />} />
          <Route path="/help" element={<SupportPage help />} />
          <Route path="/life-cycle" element={<PotatoLifeCycle />} />
          <Route path="/selling-preparation" element={<ColdStoragePage />} />
          <Route path="/selling-preparation/details" element={<SellingPreparationDetails />} />
          <Route path="/cold-storage" element={<Navigate to="/selling-preparation" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter></DemoProvider></AuthProvider>
    </LanguageProvider>
  );
}
