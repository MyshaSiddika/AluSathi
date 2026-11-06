// Practice data stays separate from published lots and personal favourites.
export function buyerExamples(today) {
  return [
    ['diamant', 'Diamant', 'Rangpur', 'Pirganj', 22, 1200, 400],
    ['cardinal', 'Cardinal', 'Bogura', 'Shibganj', 24, 900, 300],
    ['granola', 'Granola', 'Dinajpur', 'Birganj', 25, 1500, 500],
  ].map(([id, variety, district, upazila, price, quantityKg, fare], index) => ({
    id: `practice-${id}`, practice: true, variety, district, upazila,
    askingPriceKg: price, quantityKg, readyDate: today, purpose: 'table',
    photo: `/marketplace/listing-photos/potato-0${index + 1}.webp`,
    photos: [0, 1, 2].map(offset => `/marketplace/listing-photos/potato-0${(index + offset) % 3 + 1}.webp`),
    notes: 'মাঝারি আকারের শুকনো আলু', practiceFare: String(fare),
    contactSharing: false,
  }));
}
