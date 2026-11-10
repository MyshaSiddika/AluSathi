import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { initialData } from '../public/marketplace/market.mjs';
import { buyerExamples } from '../public/marketplace/buyer-examples.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = initialData();
const practice = buyerExamples('2026-11-10');
const farmerExamplesSource = await readFile(path.join(root,'src/lib/demo-buyer-interests.ts'),'utf8');
const photoCasesSource = await readFile(path.join(root,'src/lib/photo-demo-cases.ts'),'utf8');
const farmerExampleCount = [...farmerExamplesSource.matchAll(/id: "sample-[^"]+"/g)].length;
const photoCaseCount = [...photoCasesSource.matchAll(/id: "sample-[0-9]+"/g)].length;
const lots = [...data.listings, ...practice];
const paths = [...new Set(lots.flatMap(lot => (lot.photos || []).map(p => typeof p === 'string' ? p : p.src)))];
const count = values => Object.fromEntries([...new Set(values)].map(value => [String(value), values.filter(v => v === value).length]));
const stat = values => { const v = [...values].sort((a,b) => a-b); return { min:v[0], median:v.length % 2 ? v[(v.length-1)/2] : (v[v.length/2-1]+v[v.length/2])/2, max:v.at(-1) }; };
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless:true, executablePath:chrome });
const page = await browser.newPage();
const images = [];
for (const url of paths) {
  const relative = url.slice(1);
  const bytes = await readFile(path.join(root, 'public', relative));
  const dataUrl = `data:image/webp;base64,${bytes.toString('base64')}`;
  const visual = await page.evaluate(async src => {
    const img = new Image(); img.src = src; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width=9; canvas.height=8;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,9,8);
    const pixels=ctx.getImageData(0,0,9,8).data;
    let bits='';
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const lum = i => .299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2];
      bits += lum((y*9+x)*4)>lum((y*9+x+1)*4) ? '1':'0';
    }
    return { width:img.naturalWidth,height:img.naturalHeight,dhash:BigInt(`0b${bits}`).toString(16).padStart(16,'0') };
  }, dataUrl);
  images.push({ path:url, sha256:createHash('sha256').update(bytes).digest('hex'), ...visual,
    listings:lots.filter(lot => (lot.photos || []).some(p => (typeof p==='string'?p:p.src)===url)).map(lot=>lot.id) });
}
await browser.close();
const hamming=(a,b)=>{let n=BigInt(`0x${a}`)^BigInt(`0x${b}`),d=0;while(n){d+=Number(n&1n);n>>=1n;}return d;};
const photoPairs=[];
for(let i=0;i<images.length;i++)for(let j=i+1;j<images.length;j++) photoPairs.push({a:images[i].path,b:images[j].path,distance:hamming(images[i].dhash,images[j].dhash)});
const listingPhotoCounts=count(lots.map(l=>l.photos?.length || 0));
const missingImagePaths=lots.flatMap(l=>l.photos || []).map(p=>typeof p==='string'?p:p.src).filter(p=>!images.some(i=>i.path===p));
const duplicateInside=lots.filter(l=>new Set((l.photos||[]).map(p=>typeof p==='string'?p:p.src)).size<(l.photos||[]).length).map(l=>l.id);
const fields=['variety','district','upazila','farmerName','readyDate','purpose','notes','quality','grade','packaging'];
const distributions=Object.fromEntries(fields.map(f=>[f,count(lots.map(l=>l[f] ?? '(missing)'))]));
const numeric=Object.fromEntries(['quantityKg','askingPriceKg'].map(f=>[f,{distinct:new Set(lots.map(l=>l[f])).size,...stat(lots.map(l=>l[f]))}]));
const offerOrphans=data.offers.filter(o=>!data.listings.some(l=>l.id===o.lotId)).map(o=>({id:o.id,lotId:o.lotId}));
const summary={catalogueLots:data.listings.length,practiceLots:practice.length,offers:data.offers.length,farmerExampleCount,photoCaseCount,offerOrphans,listingPhotoCounts,missingImagePaths,duplicateInside,images,photoPairs,distributions,numeric,
  catalogue:{varieties:count(data.listings.map(l=>l.variety)),districts:count(data.listings.map(l=>l.district)),upazilas:count(data.listings.map(l=>l.upazila)),prices:count(data.listings.map(l=>l.askingPriceKg)),quantity:stat(data.listings.map(l=>l.quantityKg)),price:stat(data.listings.map(l=>l.askingPriceKg)),distinctPlaceVariety:new Set(data.listings.map(l=>`${l.district}/${l.upazila}/${l.variety}`)).size},
  contactableCatalogue:data.listings.filter(l=>l.contactSharingEnabled && (l.farmerPhone||l.farmerWhatsapp)).length,placeholderSellerCount:data.listings.filter(l=>/^Illustrative seller \d+$/.test(l.farmerName)).length,distinctPhotoSets:new Set(lots.map(l=>(l.photos||[]).map(p=>typeof p==='string'?p:p.src).sort().join('|'))).size,
  pricesByVariety:Object.fromEntries([...new Set(lots.map(l=>l.variety))].map(v=>[v,lots.filter(l=>l.variety===v).map(l=>l.askingPriceKg)])),today:'2026-11-10',pastReadyCount:lots.filter(l=>l.readyDate<'2026-11-10').length};
console.log(JSON.stringify(summary,null,2));
const csv=(v)=>`"${String(v??'').replaceAll('"','""')}"`;
const inventory=[
  ['catalogue lots','public/marketplace/market.mjs',data.listings.length,Object.keys(data.listings[0]).join('; '),'Buyer available potatoes; lot details; comparison; farmer sample view'],
  ['sample offers','public/marketplace/market.mjs',data.offers.length,Object.keys(data.offers[0]).join('; '),'Farmer offers when sales feature enabled'],
  ['practice comparison lots','public/marketplace/buyer-examples.mjs',practice.length,Object.keys(practice[0]).join('; '),'Buyer cost and compare practice'],
  ['farmer buyer-enquiry examples','src/lib/demo-buyer-interests.ts',farmerExampleCount,'name; nameBn; district; quantity; price; variety; neededInDays; note','Farmer buyer interest'],
  ['provider directory','public/marketplace/providers.json',JSON.parse(await readFile(path.join(root,'public/marketplace/providers.json'),'utf8')).length,'kind; name; nameBn; area; phone; source; verification; note','Transport and cold-storage directories'],
  ['photo demo cases','src/lib/photo-demo-cases.ts',photoCaseCount,'id; image; bn; en; advice','Farmer photo demo'],
  ['buyer requests','src/components/LocalBuyerRequests.tsx',0,'localStorage records only','Unmounted component; no current route'],
  ['selling estimates','src/components/SellingEstimate.tsx',0,'localStorage records only','Selling estimate history'],
  ['notebook entries','src/components/FarmerNotebook.tsx',0,'localStorage records only','Farmer notebook'],
  ['harvest demand matches','src/components/HarvestMarket.tsx',0,'localStorage records only','Harvest market'],
];
await writeFile(path.join(root,'demo_data_inventory.csv'),['dataset,file,count,fields,where_it_renders',...inventory.map(row=>row.map(csv).join(','))].join('\n')+'\n');
