# AluSathi demo vibrancy and consistency audit

Audited 2026-11-10 against GitHub `main` commit `e5aed8bfc6ac7a2bb8243a7cd226779fdac4a713`. The attached ZIP has the same project content. This is an audit of the **sample experience**, not a request for real transactions. The original audit did not change application files.

**Follow-up:** The findings and counting output below preserve the original audit baseline. The subsequent local fix now has 12 distinct catalogue lots, 13 unique assigned photos, 12 photo sets, no past ready dates, no numbered placeholder sellers, and no orphan sample offers. No upazila label appears on more than two catalogue lots; the added district/upazila pairs were checked against the [Bangladesh national upazila list](https://bangladesh.gov.bd/views/upazila-list/Upazilla-List/). Sample contact buttons prepare a clearly labelled example enquiry. The current `demo_data_inventory.csv` reflects the fixed working copy; `node tests/demo-vibrancy.cjs` checks its core behavior.

## Verdict

The Buyer page has enough cards to look populated at first glance (15 catalogue lots, six per page), but close inspection reveals five location/variety patterns repeated three times. The photos are good resolution and all load, yet every lot uses the same three pictures. All catalogue sellers have numbered placeholder names, all availability dates are the same past date, and none has a contact channel. The demo therefore looks busy but does not behave like a varied, contactable market.

## Findings, in priority order

| Priority | Evidence and exact values | What is wrong / demo recommendation |
|---|---|---|
| P1 | `public/marketplace/market.mjs:7-15`: 15 lots; five district/upazila/variety combinations each recur three times; names are `Illustrative seller 1` through `Illustrative seller 15`. `public/marketplace/app.js:354-358` renders them as individual cards. | A judge sees many cards but quickly notices the template. Give each sample lot a distinct, plausible seller identity and a different story (condition, packing, quantity, collection window). Retain the illustrative label. |
| P1 | `public/marketplace/market.mjs:12-15`: every one of 15 lots has `readyDate: "2026-01-01"`; audit date is 2026-11-10. `public/marketplace/app.js:372` converts every past date to `Ready now`. | All 15 cards show the same readiness state and never convey supply timing. Use relative dates generated from today, with a credible mix of ready now, next week, and later. |
| P1 | `public/marketplace/market.mjs:12-15`: none of the 15 catalogue lots includes a phone, WhatsApp, or enabled contact sharing. `public/marketplace/app.js:358` shows “Contact farmer”; `public/marketplace/app.js:664-681` then shows “Contact number not provided.” | The main action is a dead end on every sample card. For a safe demo, provide an explicitly fictional contact interaction or change the action to a sample conversation preview. Do not put real people's numbers in sample data. |
| P1 | `public/marketplace/market.mjs:14-15`: every lot has exactly three photos, drawn from `potato-01.webp`, `potato-02.webp`, `potato-03.webp`; each file appears in all 15 lots and all three practice lots. | 54 photo slots resolve to only three distinct files. Create more distinct sets tied to the lots, or show fewer genuine photos per sample lot. File hashes and image-to-listing map are in the script output below. |
| P1 | `public/marketplace/app.js:648-656`: the card pads missing photos with unrelated reference photos. Playwright injected 0/1/2/3/4-photo lots: **all five cards showed three photos**, while detail showed 0→generic harvest image, 1→one, 2→two, 3→three, 4→four. | The card implies images belong to a particular seller when they do not. Show only that lot's photos, or a clearly marked illustration. The detail should agree. Mobile 390 px and desktop 1365 px had no page errors or horizontal overflow in this check. |
| P2 | `public/marketplace/market.mjs:14-15`: `purpose: "table"` and the exact note `Illustrative listing; crop and seller have not been verified.` appear in all 15 lots. Grade, quality, and packaging are absent in all 15. `public/marketplace/app.js:684-693` renders the note as condition. | The detail view repeats a disclosure where buyers expect lot condition. Keep the disclosure in its own badge, and give each lot a short, specific condition/packing note. Do not invent a verified grade. |
| P2 | `public/marketplace/market.mjs:13-15`: catalogue quantity is 1,000–2,400 kg in exact 100 kg steps; asking prices are 22–27 BDT/kg, repeated with `22 + i % 6`. Same variety can have several prices without any differing quality or packing note (e.g. Diamant 22, 27, 26). | The numeric spread is real (not a ±2% cluster), but the formula is visible and price differences have no stated reason. Vary lot size less mechanically and explain price differences with stated condition, packaging or pickup terms. **UNVERIFIED:** whether any price is realistic in Bangladesh; this audit did not compare external prices. |
| P2 | `src/components/FarmerMarketPages.tsx:68-73`: three example buyers, 200/500/1,000 kg; all inherit the current farmer district and all get `price: 22`. `src/components/FarmerMarketPages.tsx:92-96` offers “All buyers” and displays those examples. | The buyer names are varied, but the “All buyers” example has only one area and one price. Use a small varied set and keep the example banner. |
| P2 | `public/marketplace/market.mjs:19-24`: three sample offers refer to `lotId: "sample-lot"`; `initialData().listings` contains only `illustrative-lot-1`…`15`. `public/marketplace/app.js:340-343` selects offers by matching lot ID. | All three seed offers are orphaned on a fresh browser, so they cannot make any listed lot feel active. Point them to a visible sample lot if that offer view is used in the demo. |

## Listing and image statistics

- Catalogue: 15 lots; five varieties, five districts, four upazila labels (`Sadar` appears in two districts). Five distinct district/upazila/variety combinations, each repeated three times.
- Catalogue quantity: min 1,000, median 1,700, max 2,400 kg. Price: min 22, median 24, max 27 BDT/kg; six distinct prices. No catalogue lot differs from another in ready date, intended use, note, or photo set.
- Photo counts: all 18 generated catalogue/practice lots have three listed photos. Zero broken paths and zero repeated image *within* a single listing. Three unique image files are reused *across* all 18 listings.
- Exact SHA-256 hashes differ. 64-bit difference-hash distances are 30, 34 and 40 bits, so no near-duplicate pair under a conservative threshold of 8 bits. Reuse, not near-duplicate processing, is the issue.
- The three listing photos are all 720×720. I opened each: `potato-01` and `potato-02` show light-skinned loose potatoes on burlap; `potato-03` shows a mixed pink/yellow pile. No obvious watermark or low-resolution failure. **Opinion:** the mixed-colour image weakens the claim that each lot is one named variety. Exact variety identification from these images is **UNVERIFIED**.
- I also opened all five 512×512 tuber demo photos in `public/demo-potatoes/`, plus the marketplace harvest fallback, farmer hero, and two buyer banners. The tuber images depict individual potatoes at different visible damage levels and are separate from sale listings. The illustrated banners and photographic listing images have different styles; whether to unify them is an **opinion**, not a defect.
- Name/place validity: `Pirganj/Rangpur`, `Shibganj/Bogura`, `Sadar/Dinajpur`, `Paba/Rajshahi`, `Sadar/Munshiganj` are the exact generated pairs. Their administrative correctness is **UNVERIFIED** here; no external gazetteer was used.
- Other internal prices: the historical chart in `public/marketplace/app.js:523-568` spans roughly 15–35 BDT/kg and is clearly marked as 2025 history, not a current quote. The sale estimate in `src/components/SellingEstimate.tsx:14-18` starts blank. I found no demonstrated numerical conflict with the 22–27 BDT/kg catalogue range. Cold storage has a provider directory, but no fixed sample tariff to compare.

## Photo-to-listing map

| Image | SHA-256 prefix | dHash | Used by |
|---|---|---|---|
| `public/marketplace/listing-photos/potato-01.webp` | `3e447e30d3618285` | `156ad4553a9465d2` | `illustrative-lot-1`…`15`; `practice-diamant`, `practice-cardinal`, `practice-granola` |
| `public/marketplace/listing-photos/potato-02.webp` | `df0723a013d9a9d7` | `78b2ab3867c92ecd` | Same 18 IDs |
| `public/marketplace/listing-photos/potato-03.webp` | `8bfa66985b79a0e7` | `911b526335e228b4` | Same 18 IDs |

## Coverage

Data inspected: `public/marketplace/market.mjs`, `buyer-examples.mjs`, `providers.json`, `buyer-workspace.mjs`, `buyer-transport.mjs`, `transport.mjs`, `demo-forms.mjs`, `src/lib/farmer-market.ts`, `harvest-market.ts`, `photo-demo-cases.ts`, and sample/default searches across `src/lib/`.

Rendering inspected: `public/marketplace/app.js`, `buyer.html`, `farmer.html`, `src/components/FarmerMarketPages.tsx`, `HarvestMarket.tsx`, `LocalBuyerRequests.tsx`, `SellingPreparationTools.tsx`, `SellingEstimate.tsx`, `ColdStorage.tsx`, `TodayAiDemo.tsx`, `FarmerNotebook.tsx`, `FarmerHisab.tsx`, `TuberScan.tsx`. `src/components/History.tsx` does not exist. `LocalBuyerRequests` is not mounted on any route, so its empty state is **not** a user-visible contradiction with the Farmer example enquiries. `HarvestMarket`, `SellingEstimate`, and `FarmerNotebook` read local records rather than shipping separate seeded lots. The inventory CSV gives dataset counts and render locations.

Visual files opened: all three `public/marketplace/listing-photos/` images; all five `public/demo-potatoes/` images; `public/marketplace/potato-harvest.png`, `farmer-hero.png`, `banners/buyer-market-living-v1/banner-still.png`, and `banners/buyer-purchases-street-v1/banner.png`. Other nonlisting decorative assets were not individually assessed; conclusions about them are **UNVERIFIED**.

Reproduce counts and hashes: `node audit_scripts/demo-vibrancy.mjs`. Reproduce card/detail gallery behavior with a local Vite preview on port 4175: `node audit_scripts/gallery-check.mjs`. The second script adds temporary records only inside an isolated Playwright browser context.

## Counting script output

```json
{
  "catalogueLots": 15,
  "practiceLots": 3,
  "offers": 3,
  "farmerExampleCount": 3,
  "photoCaseCount": 5,
  "offerOrphans": [
    {
      "id": "sample-local",
      "lotId": "sample-lot"
    },
    {
      "id": "sample-remote",
      "lotId": "sample-lot"
    },
    {
      "id": "sample-partial",
      "lotId": "sample-lot"
    }
  ],
  "listingPhotoCounts": {
    "3": 18
  },
  "missingImagePaths": [],
  "duplicateInside": [],
  "images": [
    {
      "path": "/marketplace/listing-photos/potato-01.webp",
      "sha256": "3e447e30d36182858eda76692c6340d1527fa91fb3c0ec99a28033958172ec08",
      "width": 720,
      "height": 720,
      "dhash": "156ad4553a9465d2",
      "listings": [
        "illustrative-lot-1",
        "illustrative-lot-2",
        "illustrative-lot-3",
        "illustrative-lot-4",
        "illustrative-lot-5",
        "illustrative-lot-6",
        "illustrative-lot-7",
        "illustrative-lot-8",
        "illustrative-lot-9",
        "illustrative-lot-10",
        "illustrative-lot-11",
        "illustrative-lot-12",
        "illustrative-lot-13",
        "illustrative-lot-14",
        "illustrative-lot-15",
        "practice-diamant",
        "practice-cardinal",
        "practice-granola"
      ]
    },
    {
      "path": "/marketplace/listing-photos/potato-02.webp",
      "sha256": "df0723a013d9a9d77c4e6577d0ed73dd70cdd8156a1469339257e8682817a785",
      "width": 720,
      "height": 720,
      "dhash": "78b2ab3867c92ecd",
      "listings": [
        "illustrative-lot-1",
        "illustrative-lot-2",
        "illustrative-lot-3",
        "illustrative-lot-4",
        "illustrative-lot-5",
        "illustrative-lot-6",
        "illustrative-lot-7",
        "illustrative-lot-8",
        "illustrative-lot-9",
        "illustrative-lot-10",
        "illustrative-lot-11",
        "illustrative-lot-12",
        "illustrative-lot-13",
        "illustrative-lot-14",
        "illustrative-lot-15",
        "practice-diamant",
        "practice-cardinal",
        "practice-granola"
      ]
    },
    {
      "path": "/marketplace/listing-photos/potato-03.webp",
      "sha256": "8bfa66985b79a0e7cc729aeecca6c404a57900e16528d87041f4b63655c56485",
      "width": 720,
      "height": 720,
      "dhash": "911b526335e228b4",
      "listings": [
        "illustrative-lot-1",
        "illustrative-lot-2",
        "illustrative-lot-3",
        "illustrative-lot-4",
        "illustrative-lot-5",
        "illustrative-lot-6",
        "illustrative-lot-7",
        "illustrative-lot-8",
        "illustrative-lot-9",
        "illustrative-lot-10",
        "illustrative-lot-11",
        "illustrative-lot-12",
        "illustrative-lot-13",
        "illustrative-lot-14",
        "illustrative-lot-15",
        "practice-diamant",
        "practice-cardinal",
        "practice-granola"
      ]
    }
  ],
  "photoPairs": [
    {
      "a": "/marketplace/listing-photos/potato-01.webp",
      "b": "/marketplace/listing-photos/potato-02.webp",
      "distance": 40
    },
    {
      "a": "/marketplace/listing-photos/potato-01.webp",
      "b": "/marketplace/listing-photos/potato-03.webp",
      "distance": 30
    },
    {
      "a": "/marketplace/listing-photos/potato-02.webp",
      "b": "/marketplace/listing-photos/potato-03.webp",
      "distance": 34
    }
  ],
  "distributions": {
    "variety": {
      "Diamant": 4,
      "Cardinal": 4,
      "Granola": 4,
      "Asterix": 3,
      "Lady Rosetta": 3
    },
    "district": {
      "Rangpur": 4,
      "Bogura": 4,
      "Dinajpur": 4,
      "Rajshahi": 3,
      "Munshiganj": 3
    },
    "upazila": {
      "Pirganj": 4,
      "Shibganj": 4,
      "Sadar": 6,
      "Paba": 3,
      "Birganj": 1
    },
    "farmerName": {
      "Illustrative seller 1": 1,
      "Illustrative seller 2": 1,
      "Illustrative seller 3": 1,
      "Illustrative seller 4": 1,
      "Illustrative seller 5": 1,
      "Illustrative seller 6": 1,
      "Illustrative seller 7": 1,
      "Illustrative seller 8": 1,
      "Illustrative seller 9": 1,
      "Illustrative seller 10": 1,
      "Illustrative seller 11": 1,
      "Illustrative seller 12": 1,
      "Illustrative seller 13": 1,
      "Illustrative seller 14": 1,
      "Illustrative seller 15": 1,
      "(missing)": 3
    },
    "readyDate": {
      "2026-01-01": 15,
      "2026-11-10": 3
    },
    "purpose": {
      "table": 18
    },
    "notes": {
      "Illustrative listing; crop and seller have not been verified.": 15,
      "মাঝারি আকারের শুকনো আলু": 3
    },
    "quality": {
      "(missing)": 18
    },
    "grade": {
      "(missing)": 18
    },
    "packaging": {
      "(missing)": 18
    }
  },
  "numeric": {
    "quantityKg": {
      "distinct": 16,
      "min": 900,
      "median": 1550,
      "max": 2400
    },
    "askingPriceKg": {
      "distinct": 6,
      "min": 22,
      "median": 24,
      "max": 27
    }
  },
  "catalogue": {
    "varieties": {
      "Diamant": 3,
      "Cardinal": 3,
      "Granola": 3,
      "Asterix": 3,
      "Lady Rosetta": 3
    },
    "districts": {
      "Rangpur": 3,
      "Bogura": 3,
      "Dinajpur": 3,
      "Rajshahi": 3,
      "Munshiganj": 3
    },
    "upazilas": {
      "Pirganj": 3,
      "Shibganj": 3,
      "Sadar": 6,
      "Paba": 3
    },
    "prices": {
      "22": 3,
      "23": 3,
      "24": 3,
      "25": 2,
      "26": 2,
      "27": 2
    },
    "quantity": {
      "min": 1000,
      "median": 1700,
      "max": 2400
    },
    "price": {
      "min": 22,
      "median": 24,
      "max": 27
    },
    "distinctPlaceVariety": 5
  },
  "contactableCatalogue": 0,
  "placeholderSellerCount": 15,
  "distinctPhotoSets": 1,
  "pricesByVariety": {
    "Diamant": [
      22,
      27,
      26,
      22
    ],
    "Cardinal": [
      23,
      22,
      27,
      24
    ],
    "Granola": [
      24,
      23,
      22,
      25
    ],
    "Asterix": [
      25,
      24,
      23
    ],
    "Lady Rosetta": [
      26,
      25,
      24
    ]
  },
  "today": "2026-11-10",
  "pastReadyCount": 15
}
```
