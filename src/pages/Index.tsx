import { Helmet } from "react-helmet";
import { lazy, Suspense } from "react";
import PublicLanding from "@/components/PublicLanding";
import {useAuth} from "@/contexts/AuthContext";
import {useDemo} from "@/contexts/DemoContext";
import {Navigate, useLocation} from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const AluSathiDashboard = lazy(() => import("@/components/AluSathiDashboard"));

export default function Index({ farmerHome = false }: { farmerHome?: boolean }) {
  const {user}=useAuth();
  const {demo}=useDemo();
  const { hash } = useLocation();
  const { language } = useLanguage();
  if (farmerHome && !user && !demo) return <Navigate to="/auth" state={{ farmerHash: hash }} replace />;
  return (
    <>
      <Helmet>
        <meta name="description" content="Field care and potato trading tools for Farmers and Buyers in Bangladesh. Bangla comes first." />
        <meta name="theme-color" content="#112a20" />
      </Helmet>
      {farmerHome ? <Suspense fallback={<main className="app-shell" role="status">{language === "bn" ? "কৃষকের পাতা খুলছে…" : "Opening the farmer page…"}</main>}>
        <AluSathiDashboard key={`${user?.id || 'guest'}-${farmerHome}`} farmerHome />
      </Suspense> : <PublicLanding />}
    </>
  );
}
