type Copy = [bangla: string, english: string];
type FieldCard = [title: Copy, method: Copy, reason: Copy];

export const fieldCards = {
  "emergence": [
    ["চারা না ওঠা জায়গাগুলো চিহ্নিত করুন।", "Mark gaps where shoots have not emerged."],
    ["কয়েকটি সারি ধরে হাঁটুন। ফাঁকা জায়গার পাশে মাটি শক্ত হয়ে আছে বা পানি জমেছে কি না দেখুন। চারা খুঁড়ে দেখার দরকার নেই।", "Walk several rows. At each gap, check for crusted soil or standing water. Leave planted seed undisturbed."],
    ["রোপণের পর প্রথম দুই সপ্তাহে চারা ওঠার অবস্থা বুঝতে সাহায্য করবে।", "This helps you track emergence in the first two weeks."],
  ],
  "early-weeds": [
    ["সারির ফাঁকে ছোট আগাছা সরান।", "Remove small weeds between rows."],
    ["মাটি কাজ করার মতো থাকলে সারির ফাঁকে অগভীরভাবে আগাছা তুলুন। গাছের গোড়ার কাছে হাত দিয়ে তুলুন, যাতে শিকড়ে কোপ না লাগে।", "When soil is workable, weed shallowly between rows. Near stems, weed by hand to avoid cutting roots."],
    ["এই সময়ে ছোট আলুগাছের পাশে আগাছা বেড়ে উঠতে পারে।", "Weeds can compete with young potato plants at this stage."],
  ],
  "tuber-set": [
    ["আলু ধরার সময়ে গোড়ার মাটি দেখে সেচ ঠিক করুন।", "Check root-zone moisture as tubers start forming."],
    ["সারির শুরু, মাঝ ও শেষের দিকে ওপরের শুকনো মাটি সরিয়ে ভেতরের মাটি দেখুন। ভেতরে ভেজা থাকলে অপেক্ষা করুন। শুকনো থাকলে ও বৃষ্টি আসার সম্ভাবনা কম থাকলে, নালা দিয়ে সেচ দেন এমন জমিতে ধীরে পানি ছাড়ুন। নিচু অংশে পানি জমার আগেই বন্ধ করুন।", "Check below the surface at the start, middle and end of a row. If soil underneath is moist, wait. If it is dry and rain is unlikely, let water run gently along the furrows if you use furrow irrigation. Stop before water pools at the low end."],
    ["আলু ধরার সময় মাটিতে পানির ঘাটতি হলে ফলন কমতে পারে।", "Water stress during tuber formation can reduce yield."],
  ],
  "tuber-bulking": [
    ["আলু বড় হওয়ার সময়ে কয়েক সারির মাটির ভেজাভাব মিলিয়ে দেখুন।", "Compare soil moisture across rows while tubers are sizing up."],
    ["শেষ সেচের পর কোথায় আগে শুকিয়েছে দেখুন। কয়েক সারিতে গোড়ার নিচের মাটি শুকনো হলে ও বৃষ্টি আসার সম্ভাবনা কম থাকলে, নালা দিয়ে সেচ দেন এমন জমিতে ধীরে পানি ছাড়ুন। নিচু অংশ ভেজা থাকলে সেখানে আর পানি দেবেন না।", "Check which areas dried first after the last irrigation. If several rows are dry below the surface and rain is unlikely, let water run gently along existing irrigation furrows. Leave low spots that are still wet."],
    ["আলু বড় হওয়ার সময় মাটির ভেজাভাব স্থির রাখা দরকার।", "Steady soil moisture matters while tubers are gaining size."],
  ],
  "harvest-check": [
    ["তোলার আগে নমুনা আলুর খোসা দেখে নিন।", "Check a sample potato’s skin before harvesting."],
    ["গাছ স্বাভাবিকভাবে শুকিয়ে এলে একটি নমুনা আলু সাবধানে তুলে আঙুল দিয়ে খোসা ঘষুন। সহজে উঠে গেলে জাত ও জমির অবস্থা মিলিয়ে তারপর তোলার দিন ঠিক করুন।", "When plants are naturally dying back, lift a sample carefully and rub its skin with a finger. If the skin comes off easily, review the variety and field conditions before setting a harvest date."],
    ["আলু তোলার সময় জাত, খোসা ও জমির অবস্থার ওপর নির্ভর করে।", "Harvest readiness depends on variety, skin set and field conditions."],
  ],
  "soil-observe": [
    ["সেচের আগে মাটির ভেতরটা ভেজা কি না দেখুন।", "Check moisture below the soil surface before irrigating."],
    ["সারির শুরু, মাঝ ও শেষের দিকে ওপরের মাটি সরিয়ে নিচের মাটি হাতে দেখুন। নিচেও ভেজা থাকলে সেচের জন্য অপেক্ষা করুন।", "Move the surface soil aside and feel underneath at the start, middle and end of a row. Wait to irrigate if the soil below is still moist."],
    ["ওপরের মাটি শুকালেও নিচে ভেজা থাকতে পারে।", "The surface can look dry while the soil underneath is still moist."],
  ],
  "ridge-cover": [
    ["মাটির ওপর বেরিয়ে থাকা আলু ঢেকে দিন।", "Cover any tubers exposed above the soil."],
    ["সারির যেখানে মাটি সরে গেছে সেখানে দেখুন। আলু বেরিয়ে থাকলে আলতো করে মাটি টেনে ঢেকে দিন, যাতে কাণ্ডে আঘাত না লাগে।", "Look along rows where soil has washed away. Draw loose soil over exposed potatoes without damaging stems."],
    ["আলো লাগলে আলু সবুজ হতে পারে।", "Exposed tubers can turn green in the light."],
  ],
  "leaf-check": [
    ["আগে দাগ দেখেছিলেন যে গাছে, সেই গাছ আবার দেখুন।", "Recheck plants where you saw marks before."],
    ["আগের ছবি থাকলে একই পাতার সঙ্গে মিলিয়ে দেখুন। আগে দাগ না দেখে থাকলে কয়েক সারির নিচের পাতা উল্টে দেখুন। বদল দেখলে তারিখসহ খাতায় রাখুন।", "Compare the same leaf with your earlier photo if you have one. Otherwise, turn over lower leaves in several rows. Record any change and the date in Khata."],
    ["একই জায়গা আবার দেখলে দাগের পরিবর্তন বোঝা সহজ হয়।", "Rechecking the same spot makes changes easier to see."],
  ],
  "general-check": [
    ["জমির কিনারা আর মাঝের সারি মিলিয়ে দেখুন।", "Compare the field edge and the middle rows."],
    ["কিনারায় ও মাঝখানে কয়েকটি গাছের রং ও দাঁড়িয়ে থাকার ভঙ্গি দেখুন। কোনো জায়গায় গাছ হেলে বা ঢলে থাকলে সারিটি চিহ্নিত করে রাখুন।", "Compare leaf colour and posture on several plants at the edge and in the middle. Mark rows where plants are leaning or wilting."],
    ["কোনো সমস্যা এক জায়গায় হচ্ছে, নাকি ছড়াচ্ছে, বোঝা সহজ হবে।", "This helps you see whether a change is confined to one area."],
  ],
  "field-record": [
    ["নতুন পরিবর্তনের ছবি আর সারির জায়গা খাতায় রাখুন।", "Record a new change with a photo and row location."],
    ["পরিবর্তন দেখলে কোথায় দেখেছেন ও কবে দেখেছেন লিখুন। ছবি থাকলে একই জায়গা পরের বার খুঁজে পাওয়া সহজ হবে।", "If something changes, write where and when you found it. Add a photo if you have one so you can locate the same spot later."],
    ["আগের অবস্থা মনে করার চেয়ে তারিখসহ লেখা মিলিয়ে দেখা সহজ।", "A dated record makes later comparisons easier."],
  ],
} satisfies Record<string, FieldCard>;
