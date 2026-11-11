import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Phone, Sprout, UserRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DISTRICT_NAMES } from "@/lib/district-names";
import { PROFILE_CHANGED } from "@/lib/farmer-profile";
import { phoneLink, preparePhoto } from "@/lib/farmer-market";
import "@/farmer-profile.css";

const key = "alusathi-farmer-profile-v1";
type Profile = { name?: string; photo?: string; district?: string; upazila?: string; village?: string; phone?: string; whatsapp?: string; land?: string; landUnit?: string; tenure?: string; preferredLanguage?: string; contactSharingEnabled?: boolean };
function readProfile(): Profile {
  try {
    const value=JSON.parse(localStorage.getItem(key) || "{}");
    if(!value||typeof value!=="object"||Array.isArray(value))return {};
    for(const field of ["name","district","upazila","village","phone","whatsapp","land","landUnit","tenure","preferredLanguage"])if(typeof value[field]!=="string")delete value[field];
    if(typeof value.contactSharingEnabled!=="boolean")delete value.contactSharingEnabled;
    if(typeof value.photo!=="string" || value.photo.length>180000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.photo))delete value.photo;
    return value;
  } catch { return {}; }
}

export default function FarmerProfile() {
  const { language, setLanguage } = useLanguage();
  const bn = language === "bn";
  const [profile, setProfile] = useState<Profile>(readProfile);
  const [status, setStatus] = useState("");
  const [failed,setFailed]=useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const photoRequest = useRef(0);
  const location=useLocation();
  useEffect(()=>{photoRequest.current++;setPhotoPending(false);if(location.hash==="#profile"){setProfile(readProfile());setStatus("");}},[location.key,location.hash]);
  const text = (bengali: string, english: string) => bn ? bengali : english;
  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const request = ++photoRequest.current;
    setPhotoPending(true);
    try {
      const {src} = await preparePhoto(file, 256);
      if (request === photoRequest.current) setProfile(current => ({ ...current, photo: src }));
    } catch {
      if (request === photoRequest.current) {
        setFailed(true);
        setStatus(text("২ MB-এর মধ্যে একটি পরিষ্কার JPG, PNG বা WebP ছবি বাছুন।", "Choose a valid JPG, PNG or WebP photo up to 2 MB."));
      }
    } finally { if (request === photoRequest.current) setPhotoPending(false); }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photoPending) return;
    const form = new FormData(event.currentTarget);
    const next = Object.fromEntries(["name", "district", "upazila", "village", "phone", "whatsapp", "land", "landUnit", "tenure", "preferredLanguage"].map(field => [field, String(form.get(field) || "").trim().slice(0, field === "phone" || field === "whatsapp" ? 25 : 100)])) as Profile;
    next.contactSharingEnabled = form.get("contactSharingEnabled") === "on";
    next.photo = profile.photo;
    setFailed(true);
    if(next.district&&!DISTRICT_NAMES[next.district]){setStatus(text("তালিকা থেকে জেলা বাছুন।", "Choose a listed district."));return;}
    for(const field of ["phone","whatsapp"] as const){
      const value=(next[field]||"").replace(/[০-৯]/g,d=>String("০১২৩৪৫৬৭৮৯".indexOf(d)));
      if(value&&!phoneLink(value)){setStatus(text("ফোন বা WhatsApp নম্বরটি ঠিক করে লিখুন।", "Enter a valid phone or WhatsApp number."));return;}
      next[field]=value?phoneLink(value):"";
    }
    if(next.contactSharingEnabled&&!next.phone&&!next.whatsapp){setStatus(text("যোগাযোগ দেখাতে আগে ফোন বা WhatsApp নম্বর দিন।", "Add a phone or WhatsApp number before sharing contact details."));return;}
    if(next.land)next.land=next.land.replace(/[০-৯]/g,d=>String("০১২৩৪৫৬৭৮৯".indexOf(d)));
    const land = next.land ? Number(next.land) : null;
    if (land !== null && (!/^\d+(?:\.\d+)?$/.test(next.land!) || !Number.isFinite(land) || land <= 0 || land > 100000 || !["decimal","acre","bigha","hectare"].includes(next.landUnit||""))) { setStatus(text("জমির পরিমাণ ঠিক করে দিন।", "Enter a valid land area.")); return; }
    try { const saved = {...readProfile(), ...next}; localStorage.setItem(key, JSON.stringify(saved)); window.dispatchEvent(new Event(PROFILE_CHANGED)); setProfile(saved); setFailed(false); if(next.preferredLanguage==="bn"||next.preferredLanguage==="en")setLanguage(next.preferredLanguage); setStatus(next.preferredLanguage==="en"?"Profile saved.":"প্রোফাইল সেভ হয়েছে।"); }
    catch { setStatus(text("সেভ হয়নি। ব্রাউজারে জায়গা খালি করে আবার চেষ্টা করুন।", "Could not save. Free browser storage and try again.")); }
  }
  const labelClass = "farmer-profile-field";
  return <section className="app-shell farmer-profile-page"><header><span className="profile-avatar">{profile.photo ? <img src={profile.photo} alt={text("প্রোফাইল ছবি", "Profile photo")} /> : <UserRound size={30} aria-hidden="true" />}</span><div><p className="section-kicker">{text("প্রোফাইল", "PROFILE")}</p><h1>{text("আপনার তথ্য", "Your profile")}</h1><p>{text("একবার সেভ করুন—জমির হিসাব ও আলুর লটে কাজে লাগবে। সব তথ্য ঐচ্ছিক।", "Save once for field calculations and your listings. All fields are optional.")}</p></div></header><form className="farmer-profile-form" onSubmit={save} onChange={()=>setStatus("")}>
    <fieldset><legend><MapPin size={21}/>{text("নাম ও এলাকা", "Name and location")}</legend><p>{text("আপনার জেলা অনুযায়ী আবহাওয়া ও হিমাগারের তালিকা দেখাব।", "Your district is used for weather and the storage directory.")}</p>
    <div className="profile-photo-controls">
      <label className="secondary-main"><input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={photoPending} onChange={choosePhoto} />{photoPending ? text("ছবি তৈরি হচ্ছে…", "Preparing photo…") : profile.photo ? text("ছবি বদলান", "Change photo") : text("প্রোফাইল ছবি দিন", "Add profile photo")}</label>
      {profile.photo && <button type="button" className="text-button" disabled={photoPending} onClick={() => { setProfile(current => ({...current, photo: undefined})); setStatus(""); }}>{text("ছবি সরান", "Remove photo")}</button>}
    </div><div className="profile-fields">
    <label className={labelClass}>{text("নাম", "Name")}<input name="name" maxLength={100} value={profile.name || ""} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label>
    <label className={labelClass}>{text("জেলা", "District")}<select name="district" value={profile.district || ""} onChange={e => setProfile({ ...profile, district: e.target.value })}><option value="">—</option>{Object.entries(DISTRICT_NAMES).map(([id, name]) => <option key={id} value={id}>{bn ? name : id}</option>)}</select></label>
    <label className={labelClass}>{text("উপজেলা", "Upazila")}<input name="upazila" maxLength={80} value={profile.upazila || ""} onChange={e => setProfile({ ...profile, upazila: e.target.value })} /></label>
    <label className={labelClass}>{text("গ্রাম (ঐচ্ছিক)", "Village (optional)")}<input name="village" maxLength={80} value={profile.village || ""} onChange={e => setProfile({ ...profile, village: e.target.value })} /></label>
    </div></fieldset>
    <fieldset><legend><Phone size={21}/>{text("ক্রেতারা যেভাবে যোগাযোগ করবেন", "How buyers can contact you")}</legend><p>{text("নম্বর দেখাবেন কি না, নিচে নিজেই বেছে নিন।", "Choose below whether to show your numbers with your lots.")}</p><div className="profile-fields">
    <label className={labelClass}>{text("ফোন (ঐচ্ছিক)", "Phone (optional)")}<input name="phone" inputMode="tel" maxLength={25} value={profile.phone || ""} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label>
    <label className={labelClass}>{text("WhatsApp (ঐচ্ছিক)", "WhatsApp (optional)")}<input name="whatsapp" inputMode="tel" maxLength={25} value={profile.whatsapp || ""} onChange={e => setProfile({ ...profile, whatsapp: e.target.value })} /></label>
    </div><label className="profile-sharing"><input name="contactSharingEnabled" type="checkbox" checked={Boolean(profile.contactSharingEnabled)} onChange={e => setProfile({ ...profile, contactSharingEnabled: e.target.checked })} /><span>{text("আলুর লটের সঙ্গে আমার ফোন ও WhatsApp দেখান", "Show my phone and WhatsApp with my potato lots")}<small>{text("ক্রেতা সরাসরি কথা বলবেন। কেনাবেচা আলুসাথীর বাইরে হবে।", "Buyers contact you directly. Buying and selling happen outside AluSathi.")}</small></span></label></fieldset>
    <fieldset><legend><Sprout size={21}/>{text("জমির তথ্য", "Your land")}</legend><p>{text("আজকের কাজের সারের হিসাব এই মাপ ব্যবহার করবে।", "Today's work uses this area for fertiliser calculations.")}</p><div className="profile-fields">
    <label className={labelClass}>{text("চাষের জমি", "Cultivated land")}<input name="land" inputMode="decimal" maxLength={12} value={profile.land || ""} onChange={e => setProfile({ ...profile, land: e.target.value })} /></label>
    <label className={labelClass}>{text("জমির একক", "Land unit")}<select name="landUnit" value={profile.landUnit || "decimal"} onChange={e => setProfile({ ...profile, landUnit: e.target.value })}><option value="decimal">{text("শতক", "Shotok")}</option><option value="acre">{text("একর", "Acres")}</option><option value="bigha">{text("বিঘা", "Bigha")}</option><option value="hectare">{text("হেক্টর", "Hectares")}</option></select></label>
    <label className={labelClass}>{text("নিজস্ব / ইজারা", "Owned / leased")}<select name="tenure" value={profile.tenure || ""} onChange={e => setProfile({ ...profile, tenure: e.target.value })}><option value="">—</option><option value="owned">{text("নিজস্ব", "Owned")}</option><option value="leased">{text("ইজারা", "Leased")}</option><option value="mixed">{text("দুই ধরনের", "Both")}</option></select></label>
    <label className={labelClass}>{text("পছন্দের ভাষা", "Preferred language")}<select name="preferredLanguage" value={profile.preferredLanguage || language} onChange={e => setProfile({ ...profile, preferredLanguage: e.target.value })}><option value="bn">বাংলা</option><option value="en">English</option></select></label>
    </div><Link className="secondary-main profile-calculators" to="/farmer#tools">{text("জমির হিসাব", "Field calculators")}</Link></fieldset>
    <div className="farmer-profile-actions"><button className="main-button" type="submit" disabled={photoPending}>{text("সেভ করুন", "Save profile")}</button><Link className="secondary-main" to="/farmer#my-listings">{text("আমার আলুর লট", "My potato listings")}</Link><span>{text("এই ব্রাউজারেই তথ্য সেভ হবে।", "Saved in this browser only.")}</span></div>{status && <p role={failed?"alert":"status"} className="farmer-profile-status">{status}</p>}
  </form></section>;
}
