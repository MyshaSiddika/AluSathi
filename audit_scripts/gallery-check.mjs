import { chromium } from 'playwright';
import { initialData } from '../public/marketplace/market.mjs';

const photos = [1,2,3].map(n=>`/marketplace/listing-photos/potato-0${n}.webp`).concat('/marketplace/potato-harvest.png');
const data=initialData();
data.listings.unshift(...[0,1,2,3,4].map(n=>({id:`audit-${n}`,sample:false,district:'Rangpur',upazila:'Pirganj',variety:'Diamant',farmerName:`Gallery case ${n}`,quantityKg:900,askingPriceKg:22,readyDate:'2026-11-10',notes:'Photo count test',photos:photos.slice(0,n).map(src=>({src})),photo:photos[0]})));
// For the zero-photo case, avoid a separate cover image too.
data.listings.find(l=>l.id==='audit-0').photo='';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const out=[];
for(const width of [390,1365]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.addInitScript(payload=>{localStorage.setItem('alusathi-lang','en');localStorage.setItem('alusathi-marketplace-pilot-v1',JSON.stringify(payload));},data);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/marketplace/buyer.html');
  for(const n of [0,1,2,3,4]){
    const button=page.locator(`button[data-action="view-lot"][data-id="audit-${n}"]`);
    const card=button.locator('xpath=ancestor::article');
    const row=await card.locator('.catalogue-row-gallery-slide img').evaluateAll(imgs=>imgs.map(img=>({src:new URL(img.src).pathname,loaded:img.complete&&img.naturalWidth>0})));
    await button.click();
    const detail=await page.locator('.catalogue-detail-gallery').evaluate(el=>({image:new URL(el.querySelector('img').src).pathname,controls:!!el.querySelector('.catalogue-gallery-controls'),count:el.querySelector('.catalogue-gallery-controls span')?.textContent||'1'}));
    out.push({width,inputPhotoCount:n,row,detail});
    await page.locator('.catalogue-detail-dialog [data-action="close-lot"]').click();
  }
  out.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors});
  await context.close();
}
await browser.close();console.log(JSON.stringify(out,null,2));
