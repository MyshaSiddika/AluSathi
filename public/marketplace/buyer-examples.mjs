// Practice data stays separate from published lots and personal favourites.
export function buyerExamples(today) {
  return [
    ['diamant', 'Diamant', 'Rangpur', 'Pirganj', 22, 1200, 400],
    ['cardinal', 'Cardinal', 'Bogura', 'Shibganj', 24, 900, 300],
    ['granola', 'Granola', 'Dinajpur', 'Birganj', 25, 1500, 500],
  ].map(([id, variety, district, upazila, price, quantityKg, fare]) => ({
    id: `practice-${id}`, practice: true, variety, district, upazila,
    askingPriceKg: price, quantityKg, readyDate: today, purpose: 'table',
    photos: [], notes: 'Dry, medium potatoes for comparison practice.', notesBn: 'তুলনার অনুশীলনের জন্য মাঝারি আকারের শুকনো আলু।', practiceFare: String(fare),
    contactSharing: false,
  }));
}
