import { Cloud, CloudLightning, CloudRain, Droplets, MapPin, Sun, WifiOff } from "lucide-react";
import type { WeatherData } from "@/lib/api";

export default function TodayWeather({ weather, rainNote, loading, district, bn, online }: {
  weather: WeatherData | null; rainNote?: string; loading: boolean; district: string; bn: boolean; online: boolean;
}) {
  const t = (b: string, e: string) => bn ? b : e;
  const number = (value: number) => Number.isFinite(value) ? value.toLocaleString(bn ? "bn-BD" : "en-GB", {maximumFractionDigits:1}) : "—";
  const condition = !weather ? "unknown" : weather.weather === "Storms" ? "storm" : weather.rainfall > 0 || weather.weather === "Rain" ? "rain" : weather.weather === "Cloudy" ? "cloud" : weather.weather === "Clear" ? "sun" : "unknown";
  const Icon = condition === "storm" ? CloudLightning : condition === "rain" ? CloudRain : condition === "cloud" || condition === "unknown" ? Cloud : Sun;
  const label = ({sun:t("এখন আকাশ পরিষ্কার","Clear skies now"),cloud:t("এখন আকাশ মেঘলা","Cloudy now"),rain:t("এখন বৃষ্টি","Raining now"),storm:t("ঝড়ো আবহাওয়া","Stormy"),unknown:t("অবস্থার তথ্য নেই","Weather details not available")})[condition];
  return <aside className="today-utility-rail today-weather-card" data-weather={condition} aria-label={t("আবহাওয়া","Weather")} aria-busy={loading}>
    <header><h2>{t("আবহাওয়া","Weather")}</h2><span><MapPin size={15}/>{district}</span></header>
    <div className="weather-current" aria-live="polite"><div><strong>{weather ? `${number(Math.round(weather.temperature))}°` : "—"}</strong><p>{weather ? label : loading ? t("আবহাওয়া আসছে…","Loading weather…") : t("আবহাওয়া পাওয়া যায়নি","Weather not available")}</p></div><div className="weather-art" aria-hidden="true"><Icon size={76} strokeWidth={1.5}/>{(condition === "rain" || condition === "storm") && <div className="weather-rain"><i/><i/><i/></div>}</div></div>
    {rainNote && <p className="today-weather-reason" role="status">{rainNote}</p>}
    {weather && <><dl className="weather-readings"><div><dt><Droplets size={15}/>{t("আর্দ্রতা","Humidity")}</dt><dd>{number(Math.round(weather.humidity))}%</dd></div><div><dt><CloudRain size={15}/>{t("এখন বৃষ্টি","Current rain")}</dt><dd>{number(weather.rainfall)} mm</dd></div></dl>
    </>}
    {!online && <p className="offline-status" role="status"><WifiOff size={16}/>{t("ইন্টারনেট নেই—আগের তথ্য দেখছেন।","Offline—showing saved information.")}</p>}
  </aside>;
}
