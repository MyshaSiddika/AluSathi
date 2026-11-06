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
