import { localToday } from "./local-date";
import { DISTRICT_NAMES } from "./district-names";

export const PROFILE_CHANGED = "alusathi-farmer-profile-changed";
export function farmerDistrict() {
  try {
    const profile = JSON.parse(localStorage.getItem("alusathi-farmer-profile-v1") || "{}");
    if (typeof profile?.district === "string" && DISTRICT_NAMES[profile.district]) return profile.district as string;
  } catch { /* Keep the existing district if the profile is unreadable. */ }
  const saved = localStorage.getItem("alusathi-district") || "";
  return DISTRICT_NAMES[saved] ? saved : "Rangpur";
}

export function initializeFarmerAccount() {
  try {
    const read = (key: string): Record<string, unknown> => {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    };
    const profile = read("alusathi-farmer-profile-v1");
    const draft = read("alusathi-potato-sale-details-v1");
    // Demo defaults belong only to a new browser account, never saved farm data.
    if (Object.keys(profile).length || Object.keys(draft).length ||
        ["alusathi-planting-date", "alusathi-planting-age", "alusathi-care-area"].some(key => localStorage.getItem(key))) return;
    const variety = typeof profile.variety === "string" && profile.variety.trim()
      ? profile.variety : typeof draft.variety === "string" && draft.variety.trim() && draft.variety !== "Potatoes"
      ? draft.variety : "Diamant";
    const planting = new Date();
    planting.setDate(planting.getDate() - 7);
    localStorage.setItem("alusathi-planting-date", localToday(planting));
    localStorage.setItem("alusathi-planting-age", "lt30");
    localStorage.setItem("alusathi-planting-age-recorded", localToday());
    localStorage.setItem("alusathi-care-area", JSON.stringify({value:"1",unit:"acre",bigha:"33"}));
    localStorage.setItem("alusathi-potato-sale-details-v1", JSON.stringify({...draft,variety}));
    localStorage.setItem("alusathi-farmer-profile-v1", JSON.stringify({
      ...profile, name:"Zarif Ahmed", land:"1", landUnit:"acre", variety,
      district:profile.district || localStorage.getItem("alusathi-district") || "Rangpur",
      accountPreset:"zarif-v2",
    }));
    sessionStorage.setItem("alusathi-market-demo-farmer", "Zarif Ahmed");
  } catch { /* Keep the farmer page available when local storage is full. */ }
}
