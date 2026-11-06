export const nutrientReference = {
  title: "BARC · Handbook of Agricultural Technology (2013), p. 39",
  url: "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2024/12/053a0722429448d4903412ce683a7d06.pdf#page=54",
};
const seasonalRates = [
  { id: "manure", bn: "পচা গোবর", en: "Well-rotted manure", kgPerHa: 10000 },
  { id: "urea", bn: "ইউরিয়া", en: "Urea", kgPerHa: 350 },
  { id: "tsp", bn: "টিএসপি", en: "TSP", kgPerHa: 100 },
  { id: "potash", bn: "এমপি (পটাশ)", en: "MP (potash)", kgPerHa: 210 },
  { id: "gypsum", bn: "জিপসাম", en: "Gypsum", kgPerHa: 84 },
] as const;

export function seasonalNutrients(areaM2: number) {
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || areaM2 > 1e9) throw new Error("Enter a valid field area.");
  return seasonalRates.map(item => ({ ...item, amountKg: item.kgPerHa * areaM2 / 10000 }));
}

// BAMIS potato bulletin: one top dressing at 30–35 days, 160–175 kg urea/ha.
export function exampleTopDressing(areaM2: number) {
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || areaM2 > 1e9) throw new Error("Enter a valid field area.");
  return { minGrams: areaM2 * 16, maxGrams: areaM2 * 17.5 };
}
