import { potatoProducts } from "./potato-products.mjs";

const types = [
  ["regular", "সাদা / সাধারণ আলু", "Regular white", "#176049"],
  ["diamond", "ডায়মন্ড আলু", "Diamond", "#a15e17"],
  ["red", "লাল আলু", "Red potato", "#a64066"],
];
const shopNames = {
  Chaldal: "চালডাল",
  Agora: "আগোরা",
  "Meena Bazar · Elite Center": "মীনা বাজার",
  Shwapno: "স্বপ্ন",
};
const dayKey = date => new Date(date).toLocaleDateString("sv-SE", {timeZone:"Asia/Dhaka"});
const historyKey = "alusathi-retail-potato-observations-v1";
const validPrice = value => Number.isFinite(value) && value > 0 && value <= 1000;

function readHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(historyKey) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([date, prices]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && prices && typeof prices === "object" && !Array.isArray(prices)));
  } catch { return {}; }
}

export function mountRetailPrices(root, { group, t, h }) {
  const products = potatoProducts.filter(product => product.group === group);
  const status = root.querySelector("[role=status]");
  const readout = root.querySelector(".retail-readout");
  const refreshButton = root.querySelector(".retail-refresh");
  const number = new Intl.NumberFormat(t("bn-BD", "en-GB"), {maximumFractionDigits:2});
  const priceLabel = value => t(number.format(value) + " টাকা", number.format(value) + " taka");
  const shopLabel = product => t(shopNames[product.shop] || product.shop, product.shop);
  const shopLink = product => `<a class="retail-shop-link" href="${h(product.url)}" target="_blank" rel="noopener noreferrer">${h(shopLabel(product))} <span aria-hidden="true">↗</span><span class="retail-link-hint">${t("নতুন ট্যাবে খুলুন", "Opens in a new tab")}</span></a>`;
  const shortDate = date => new Date(date + "T12:00:00+06:00").toLocaleDateString(t("bn-BD","en-GB"), {timeZone:"Asia/Dhaka", day:"numeric",month:"short"});
  let history = readHistory();
  let date = dayKey(Date.now());
  let current = history[date] || {};
  let pending = false;

  function checkedLabel(checkedAt) {
    const checked = new Date(checkedAt);
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone:"Asia/Dhaka", hour:"2-digit",minute:"2-digit",hourCycle:"h23",
    }).formatToParts(checked).map(part => [part.type,part.value]));
    const hour = Number(parts.hour);
    const period = hour < 6 ? "রাত" : hour < 12 ? "সকাল" : hour < 16 ? "দুপুর" : hour < 19 ? "বিকেল" : "রাত";
    return t(`আজ ${period} ${number.format(hour % 12 || 12)}:${parts.minute.replace(/\d/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)])}`,
      "Today " + checked.toLocaleTimeString("en-GB", {timeZone:"Asia/Dhaka",hour:"2-digit",minute:"2-digit"}));
  }

  function draw() {
    const start = new Date(date + "T00:00:00Z");
    start.setUTCDate(start.getUTCDate() - 6);
    const first = start.toISOString().slice(0, 10);
    const dates = Object.keys(history).filter(day => day >= first && day <= date).sort();
    const series = types.map(([key, bn, en, color]) => {
      const points = dates.flatMap(day => {
        const prices = products.filter(product => product.type === key).map(product => history[day]?.[product.id]).filter(validPrice);
        return prices.length ? [[day, prices.reduce((a,b) => a+b, 0) / prices.length]] : [];
      });
      return {key, name:t(bn,en),color,points};
    });
    const eligibleSeries = series.filter(item => item.points.length >= 3);
    const values = eligibleSeries.flatMap(item => item.points.map(([,price]) => price));
    let chart = "";
    if (eligibleSeries.length) {
      const padding = Math.max(1, (Math.max(...values) - Math.min(...values)) * 0.15);
      const low = Math.max(0, Math.floor(Math.min(...values) - padding));
      const high = Math.ceil(Math.max(...values) + padding);
      const x = day => 90 + ((Date.parse(day) - Date.parse(first)) / 86400000) / 6 * 825;
      const y = value => 190 - (value - low) / (high - low) * 155;
      chart = `<div class="retail-legend">${eligibleSeries.map(({name,color}) => `<span style="--series:${color}">${name}</span>`).join("")}</div>
        <svg viewBox="0 0 960 224" role="img" aria-label="${t("গত সাত দিনের আলুর দাম", "Potato prices over the last seven days")}">
          ${[0,1,2,3,4].map(i => {
            const value = low + (high-low)*i/4;
            return `<path d="M90 ${y(value)}H915" stroke="#dce8e2"/><text x="78" y="${y(value)+5}" text-anchor="end">${priceLabel(value)}</text>`;
          }).join("")}
          ${eligibleSeries.map(({name,color,points}) => `<polyline fill="none" stroke="${color}" stroke-width="3" points="${points.map(([day,value]) => x(day)+","+y(value)).join(" ")}"/>${points.map(([day,value]) => `<circle cx="${x(day)}" cy="${y(value)}" r="4" fill="${color}"><title>${name} · ${shortDate(day)} · ${priceLabel(value)}</title></circle>`).join("")}`).join("")}
          <text x="90" y="216">${shortDate(first)}</text><text x="915" y="216" text-anchor="end">${shortDate(date)}</text>
        </svg>`;
    }

    const rows = [...products];
    if (group === "online") rows.push({id:"shwapno-regular",type:"regular",shop:"Shwapno",url:"https://www.shwapno.com/"});
    readout.innerHTML = `
      <table class="retail-shop-table"><thead><tr><th scope="col">${t("দোকান","Shop")}</th><th scope="col">${t("আলুর ধরন","Potato type")}</th><th scope="col">${t("টাকা/কেজি","taka/kg")}</th></tr></thead><tbody>
        ${rows.map(product => {
          const assumed = !validPrice(current[product.id]);
          return `<tr><th scope="row">${shopLink(product)}</th><td>${series.find(item => item.key === product.type).name}</td><td class="retail-price-cell"><strong>${number.format(assumed ? 28 : current[product.id])}</strong><span>${t("টাকা/কেজি","taka/kg")}</span></td></tr>`;
        }).join("")}</tbody></table>
      ${chart ? `<div class="retail-history-chart">${chart}</div>` : ""}`;
  }

  async function refresh() {
    if (pending) return;
    pending = true;
    refreshButton.disabled = true;
    refreshButton.setAttribute("aria-busy", "true");
    refreshButton.innerHTML = `<span class="retail-spinner" aria-hidden="true"></span>${t("দর দেখা হচ্ছে…","Checking prices…")}`;
    status.textContent = t("দর দেখা হচ্ছে…", "Checking prices…");
    let refreshed = false;
    try {
      const response = await fetch("/api/retail-potato-prices", {cache:"no-store", signal:AbortSignal.timeout(16000)});
      if (!response.ok) throw new Error("price response");
      const feed = await response.json();
      date = dayKey(Date.now());
      const checkedTime = Date.parse(feed.checkedAt);
      const fresh = Number.isFinite(checkedTime) && checkedTime <= Date.now() + 60000 && dayKey(checkedTime) === date;
      current = fresh ? Object.fromEntries(products.flatMap(({id}) => {
        const price = feed.prices?.[id];
        return validPrice(price) ? [[id,price]] : [];
      })) : {};
      history = readHistory();
      refreshed = Object.keys(current).length > 0;
      current = {...history[date], ...current};
      history[date] = current;
      try { localStorage.setItem(historyKey, JSON.stringify(Object.fromEntries(Object.entries(history).sort(([a],[b]) => a.localeCompare(b)).slice(-366)))); } catch {}
      status.textContent = refreshed ? checkedLabel(checkedTime) : t("আজকের দাম পাওয়া যায়নি।","Today’s prices could not be checked.");
    } catch {
      date = dayKey(Date.now());
      current = readHistory()[date] || {};
      status.textContent = t("এখন দাম দেখা যাচ্ছে না।","Prices are temporarily unavailable.");
    } finally {
      pending = false;
      refreshButton.disabled = false;
      refreshButton.setAttribute("aria-busy", "false");
      refreshButton.textContent = t("লাইভ দর দেখুন","View live prices");
      draw();
    }
  }
  refreshButton.addEventListener("click", refresh);
  draw();
  refresh();
}
