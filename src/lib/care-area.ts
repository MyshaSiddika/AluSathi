import type { AreaUnit } from "./farmer-tools";

export type CareArea = { value: string; unit: AreaUnit; bigha: string; example: boolean };
export function readCareArea(): CareArea {
  try {
    const saved = JSON.parse(localStorage.getItem("alusathi-care-area") || "null");
    const profile = JSON.parse(localStorage.getItem("alusathi-farmer-profile-v1") || "{}");
    const value = profile?.land || saved?.value;
    const unit = profile?.land ? profile.landUnit : saved?.unit;
    const bigha = Number(saved?.bigha);
    if (Number(value) > 0 && Number.isFinite(Number(value)) && ["decimal", "acre", "hectare", "bigha"].includes(unit))
      return { value: String(value), unit, bigha: Number.isFinite(bigha) && bigha > 0 ? String(bigha) : "33", example: false };
  } catch { /* No saved area: show an explicitly labelled example. */ }
  return { value: "1", unit: "acre", bigha: "33", example: true };
}
