export const todayPlus = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const catalogueListings = () => Array.from({length: 15}, (_, i) => {
  const places = [["Rangpur", "Pirganj"], ["Bogura", "Shibganj"], ["Dinajpur", "Sadar"], ["Rajshahi", "Paba"], ["Munshiganj", "Sadar"]];
  const varieties = ["Diamant", "Cardinal", "Granola", "Asterix", "Lady Rosetta"];
  const [district, upazila] = places[i % places.length];
  const photo = `/marketplace/listing-photos/potato-0${i % 3 + 1}.webp`;
  return {id: `illustrative-lot-${i + 1}`, sample: true, district, upazila, variety: varieties[i % varieties.length],
    farmerName: `Illustrative seller ${i + 1}`, purpose: "table", quantityKg: 1000 + i * 100,
    askingPriceKg: 22 + i % 6, priceKg: 22 + i % 6, readyDate: "2026-01-01", createdAt: "2026-01-01T00:00:00.000Z",
    notes: "Illustrative listing; crop and seller have not been verified.", photo, photos: [0, 1, 2].map(offset => ({src: `/marketplace/listing-photos/potato-0${(i + offset) % 3 + 1}.webp`}))};
});

export const initialData = () => ({
  listings: catalogueListings(),
  offers: [
    { id: "sample-local", sample: true, lotId: "sample-lot", buyer: "Local trader", district: "Rangpur", quantityKg: 2000, priceKg: 22, acceptedPercent: 100, transport: 0, handling: 0, fee: 0, pickup: "buyer", paymentDays: 0, terms: "Buyer collects; final weight confirmed at pickup.", expires: todayPlus(7), createdAt: new Date().toISOString() },
    { id: "sample-remote", sample: true, lotId: "sample-lot", buyer: "District wholesaler", district: "Dinajpur", quantityKg: 2000, priceKg: 27, acceptedPercent: 95, transport: 8000, handling: 2000, fee: 0, pickup: "farmer", paymentDays: 2, terms: "Estimated 5% grade rejection; confirm before dispatch.", expires: todayPlus(7), createdAt: new Date().toISOString() },
    { id: "sample-partial", sample: true, lotId: "sample-lot", buyer: "Potato processor", district: "Bogura", quantityKg: 1500, priceKg: 26, acceptedPercent: 100, transport: 2500, handling: 500, fee: 0, pickup: "farmer", paymentDays: 1, terms: "Only 1,500 kg requested; the rest remains unsold.", expires: todayPlus(7), createdAt: new Date().toISOString() },
  ],
  deals: [],
  quotes: [],
});

export function estimateOffer(offer, quantityKg = offer.quantityKg) {
  const offeredKg = Math.max(0, Number(quantityKg) || 0);
  const acceptedPercent = Math.min(100, Math.max(0, Number(offer.acceptedPercent) || 0));
  const acceptedKg = Math.floor(offeredKg * acceptedPercent / 100);
  const gross = acceptedKg * Math.max(0, Number(offer.priceKg) || 0);
  const costs = [offer.transport, offer.handling, offer.fee].reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  return { offeredKg, acceptedKg, rejectedKg: offeredKg - acceptedKg, gross, costs, net: gross - costs };
}

export function availableKg(listing, deals) {
  if (listing.archivedAt) return 0;
  const committed = deals.filter(deal => deal.lotId === listing.id).reduce((sum, deal) => sum + (deal.status === "collected" || deal.status === "payment_pending" || deal.status === "paid" ? deal.actualAcceptedKg : deal.quantityKg), 0);
  return Math.max(0, listing.quantityKg - committed);
}

export function storageBreakEven({ quantityKg, priceKg, months, feeKgMonth, oneTimeCost, lossPercent }) {
  const kg = Math.max(0, Number(quantityKg) || 0);
  const saleableKg = kg * (1 - Math.min(99, Math.max(0, Number(lossPercent) || 0)) / 100);
  if (!saleableKg) return null;
  const todayValue = kg * Math.max(0, Number(priceKg) || 0);
  const storageCost = kg * Math.max(0, Number(months) || 0) * Math.max(0, Number(feeKgMonth) || 0) + Math.max(0, Number(oneTimeCost) || 0);
  return { todayValue, storageCost, saleableKg, futurePriceKg: (todayValue + storageCost) / saleableKg };
}
