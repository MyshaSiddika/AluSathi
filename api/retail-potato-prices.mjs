import { potatoProducts } from "../public/marketplace/potato-products.mjs";

const readablePrice = (html, product) => {
  if (product.shop === "Chaldal") {
    const offer = html.match(/itemprop="offers"[^>]*>([\s\S]{0,4000})/i)?.[1] ?? "";
    if (!/itemprop="availability"[^>]+\/InStock"/i.test(offer) || !/itemprop="priceCurrency" content="BDT"/i.test(offer)) return null;
    return Number(offer.match(/itemprop="price" content="(\d+(?:\.\d+)?)"/i)?.[1]) || null;
  }
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const match = product.name.exec(text);
  if (!match) return null;
  return Number(text.slice(match.index + match[0].length, match.index + match[0].length + 70).match(/^\s*৳\s*(\d+(?:\.\d+)?)\s*Add(?: To Cart)?\b/i)?.[1]) || null;
};

let cached;
let pending;
async function collect() {
  const urls = [...new Set(potatoProducts.map(product => product.url))];
  const html = new Map(await Promise.all(urls.map(async url => {
    try {
      const target = new URL(url);
      if (target.hostname === "chaldal.com") {
        target.searchParams.set("price-date", new Date().toLocaleDateString("sv-SE", {timeZone:"Asia/Dhaka"}));
      }
      const response = await fetch(target, { signal: AbortSignal.timeout(12000), redirect:"error" });
      return [url, response.ok ? await response.text() : ""];
    } catch { return [url, ""]; }
  })));
  return {
    checkedAt: new Date().toISOString(),
    prices: Object.fromEntries(potatoProducts.map(product => {
      const price = readablePrice(html.get(product.url), product);
      return [product.id, price === null ? null : Math.round(price / product.kg * 100) / 100];
    })),
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") { response.statusCode = 405; response.end(); return; }
  const maxAge = cached && Object.values(cached.prices).every(price => price !== null) ? 600000 : 60000;
  if (!cached || Date.now() - Date.parse(cached.checkedAt) > maxAge) {
    pending ??= collect().then(result => { cached = result; }).finally(() => { pending = undefined; });
    await pending;
  }
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(cached));
}
