const storageKey='alusathi-buyer-budget-v1';
export const expenseFields=[
  ['transport','গাড়ি / পরিবহন','Truck / transport'],['labour','শ্রমিক','Labour'],['loading','ওঠানো / নামানো','Loading / unloading'],
  ['toll','সেতু / টোল','Bridge / toll'],['phone','ফোন / যোগাযোগ','Phone / communication'],['other','অন্যান্য খরচ','Other costs'],
  ['coldStorage','হিমাগার (ঐচ্ছিক)','Cold storage (optional)'],
];
// Planning fares for one trip to Dhaka, with the former capped defaults for migration.
const dhakaRoutes = {
  Rangpur: { fare: 14500, previousFare: 5500 },
  Bogura: { fare: 12000, previousFare: 5000 },
  Dinajpur: { fare: 15500, previousFare: 6000 },
};
const jamunaToll = 1000;
const workerCharge = 2 * 600;
export function routeExpenses(district) {
  if (!Object.hasOwn(dhakaRoutes, district)) return null;
  return {transport: String(dhakaRoutes[district].fare), labour: String(workerCharge),
    loading: '500', toll: String(jamunaToll), phone: '100', other: '0'};
}
export function budgetNumber(value) {
  const raw=String(value??'').trim().replace(/[০-৯]/g,d=>String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/,/g,'');
  return /^\d+(?:\.\d{1,2})?$/.test(raw)&&Number(raw)<=100000000?Number(raw):null;
}
export function calculateBudget(values,available=Infinity) {
  const budget=budgetNumber(values.budget),quantity=budgetNumber(values.quantity),price=budgetNumber(values.price);
  const costs=Object.fromEntries(expenseFields.map(([key])=>[key,budgetNumber(values[key])])),missing=Object.keys(costs).filter(key=>costs[key]===null&&(key!=='coldStorage'||String(values[key]??'').trim()!==''));
  const invalid=!(budget>0)||!(quantity>0)||quantity>1000000||!(price>0)||price>10000||quantity>available;
  const round=n=>Math.round(n*100)/100,potatoes=quantity>0&&price>0?round(quantity*price):null;
  const subtotal=round((potatoes??0)+Object.values(costs).reduce((sum,n)=>sum+(n??0),0));
  const complete=!invalid&&!missing.length,total=complete?subtotal:null,remaining=complete?round(budget-total):null;
  const rawResale=budgetNumber(values.resale),resale=rawResale!==null&&rawResale<=10000?rawResale:null,revenue=complete&&resale!==null?round(quantity*resale):null;
  return {budget,quantity,price,costs,missing,invalid,potatoes,subtotal,complete,total,remaining,unitCost:complete?round(total/quantity):null,revenue,profit:revenue!==null?round(revenue-total):null};
}
function budgetStorageKey(lot) { return lot ? `${storageKey}:${lot.id}` : storageKey; }
function savedBudget(lot) { try { const value=JSON.parse(localStorage.getItem(budgetStorageKey(lot))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}; }catch{return {};}}
export function budgetContent({t,h,lot,available,requestedQuantity}) {
  const saved=savedBudget(lot);
  const route = dhakaRoutes[lot?.district];
  const examples = routeExpenses(lot?.district) || {};
  if (route && saved.expenseMode !== 'manual' && !(saved.fareRevision >= 4) && saved.transport === String(route.previousFare)) delete saved.transport;
  if (route && saved.expenseMode !== 'manual' && !(saved.fareRevision >= 3) &&
      saved.loading === '0' && saved.phone === '0') {
    delete saved.loading;
    delete saved.phone;
  }
  const savedValue=key=>typeof saved[key]==='string'&&saved[key].length<=24?saved[key]:'';
  const value=key=>savedValue(key).trim()||examples[key]||'';
  const asking=Number(lot?.askingPriceKg??lot?.priceKg??lot?.askingPrice),price=asking>0&&Number.isFinite(asking)?String(asking):'';
  const quantity=requestedQuantity > 0 ? String(requestedQuantity) : value('quantity') || String(Math.min(200, available));
  const input=(key,bn,en,initial=value(key))=>`<label>${t(bn,en)}<input name="${key}" inputmode="decimal" maxlength="24" value="${h(initial)}" autocomplete="off"></label>`;
  return `<section class="buyer-budget" aria-labelledby="budget-title"><header><p class="budget-eyebrow">${t('কেনার আগে হিসাব','Plan before buying')}</p><h2 id="budget-title">${t('লাভের হিসাব','Estimate profit')}</h2><p>${t('বাজেট আর কত কেজি কিনবেন লিখে হিসাব দেখুন।','Enter your budget and how many kilos you want to buy.')}</p>${lot?`<p class="budget-lot">${h(lot.variety)} · ${h(lot.farmerName||'')} · ${h(String(available))} ${t('কেজি পাওয়া যাবে','kg available')}</p>`:''}</header>
  <form data-budget-form novalidate><div class="budget-main-fields">${input('budget','আপনার বাজেট কত? (৳)','Your budget (৳)')}${input('quantity','কত কেজি কিনবেন?','How many kg will you buy?',quantity)}${price ? `<div class="budget-listed-price"><span>${t('তালিকার আলুর দাম / কেজি','Listing price per kg')}</span><strong>৳${h(price)}</strong><input type="hidden" name="price" value="${h(price)}"></div>` : input('price','আলুর সম্মত দর / কেজি (৳)','Agreed potato price per kg (৳)')}</div>
  ${price ? '' : `<p>${t('তালিকায় কেজির দর নেই। কৃষকের সঙ্গে ঠিক করা দর লিখলে পুরো হিসাব দেখা যাবে।','This listing has no price per kg. Enter the price agreed with the farmer to see the full calculation.')}</p>`}
  <div class="budget-assumed" role="group" aria-label="${t('অন্যান্য খরচ','Other expenses')}"><span>${t('অন্যান্য খরচ','Other expenses')}</span>
    <button type="button" class="button button-outline" data-expense-mode="manual" aria-pressed="false">${t('নিজে লিখুন','Enter yourself')}</button>
    <button type="button" class="button button-outline" data-expense-mode="estimate" aria-pressed="false" aria-describedby="budget-estimate-method"><span aria-hidden="true">✦</span> ${t('AI দিয়ে হিসাব','Calculate with AI')}</button>
    <small id="budget-estimate-method">${t('এই হিসাব নির্ধারিত রুটের খরচ দিয়ে করা হয়।','Uses preset route costs.')}</small>
    <div class="budget-estimate-detail" data-estimate-detail hidden><output data-budget-assumed>—</output><dl class="budget-breakdown" data-estimate-lines></dl></div></div>

  <details class="budget-edit" hidden><summary>${t('আলাদা খরচ বদলান','Edit expenses')}</summary>
    ${route?`<p>${t('ঢাকা পর্যন্ত একবারের ছোট ট্রাক (সর্বোচ্চ ৫ টন), যমুনা সেতুর টোল এবং দুই শ্রমিকের খরচ ধরে হিসাব। এগুলো আনুমানিক খরচ। গাড়িভাড়ায় টোল ধরা থাকলে টোলের ঘরে ০ লিখুন।','Planning estimate for one small truck to Dhaka (up to 5 tonnes), the Jamuna Bridge toll, and two workers for loading and unloading. Enter 0 for the toll if it is already included in your truck quote.')}</p>
    <p><a href="https://bba.gov.bd/pages/static-pages/6922e0df933eb65569e28f60">${t('সেতুর টোল','Bridge toll')}</a> · <a href="https://chologari.com/truck-bhara-rate-chart">${t('শ্রমিকের খরচ','Loading cost benchmark')}</a></p>`:''}
  <fieldset><legend>${t('আলাদা খরচ লিখুন','Enter separate expenses')}</legend><p>${t('যে খরচ নেই, ০ লিখুন। ফাঁকা ঘর মানে খরচ জানা নেই। একই খরচ দুবার লিখবেন না।','Enter 0 if there is no charge. Blank means unknown. Do not enter the same cost twice.')}</p><div class="budget-expenses">${expenseFields.map(([key,bn,en])=>input(key,bn+' (৳)',en+' (৳)',saved.expenseMode==='manual'?examples[key]??'':value(key))).join('')}</div><p>${t('বস্তা, ওজন মাপা ও বাজারের ফি থাকলে অন্যান্য খরচে যোগ করুন। হিমাগারের খরচ চাইলে আলাদা করে লিখুন।','Use Other costs for sacks, weighing and market fees. Leave cold storage blank if it does not apply.')}</p></fieldset>
  </details>
  <details class="budget-resale"><summary>${t('সম্ভাব্য বিক্রির দাম (ঐচ্ছিক)','Expected resale price (optional)')}</summary>${input('resale','বিক্রির দাম / কেজি (৳)','Resale price per kg (৳)')}</details>
  <button class="button button-green" type="submit">${t('হিসাব করুন','Calculate')}</button>
  <p class="budget-save-status" role="status"></p><div class="budget-results" data-budget-results aria-live="polite"></div>
</form></section>`;
}
export function mountBudget(root,{t,h,money,lot,available=Infinity}) {
  const form=root.querySelector('[data-budget-form]'),output=root.querySelector('[data-budget-results]');let submitted=false;
  const editor = form.querySelector('.budget-edit');
  const estimateDetail = form.querySelector('[data-estimate-detail]');
  const total = estimateDetail.querySelector('[data-budget-assumed]');
  const estimateLines = estimateDetail.querySelector('[data-estimate-lines]');
  const choices = [...form.querySelectorAll('[data-expense-mode]')];
  const fields = expenseFields.map(([key]) => form.elements[key]);
  const saved = savedBudget(lot);
  const drafts = {
    estimate: fields.map(field => field.value),
    manual: fields.map(field => saved.expenseMode === 'manual' && typeof saved[field.name] === 'string' ? saved[field.name].slice(0, 24) : ''),
  };
  let expenseMode = '';
  let calculationTimer;
  const draw=()=>{
    const values=Object.fromEntries(new FormData(form)),r=calculateBudget(values,lot?available:Infinity);
    try {localStorage.setItem(budgetStorageKey(lot),JSON.stringify({...values, fareRevision: 4, expenseMode}));root.querySelector('.budget-save-status').textContent='';}catch{root.querySelector('.budget-save-status').textContent=t('এই ব্রাউজারে সেভ হয়নি। হিসাবটি নিচে আছে।','Not saved in this browser. The result is shown below.');}
    if (r.budget > 0 && r.quantity > 0 && r.quantity <= Math.min(available, 1000000) && !r.price && !values.price.trim() && !r.missing.length) {
      const balance = Math.round((r.budget - r.subtotal) * 100) / 100;
      output.innerHTML = `<div class="budget-total ${balance < 0 ? 'over-budget' : ''}">
        <span>${t('শুধু অন্যান্য খরচ','Other expenses only')}</span><strong>${money(r.subtotal)}</strong>
        <p>${balance < 0 ? t('আলু কেনার আগেই বাজেটের চেয়ে বেশি','Over budget before buying potatoes') : t('আলু কেনার আগে বাজেটে বাকি','Budget left before buying potatoes')} · ${money(Math.abs(balance))}</p>
      </div>`;
      return;
    }
    if(r.invalid){output.innerHTML=`<p class="budget-incomplete" role="alert">${t('সঠিক বাজেট, কেজি ও আলুর দাম লিখুন। লটে যত কেজি আছে, তার বেশি দেওয়া যাবে না।','Check budget, kg and potato price. Quantity cannot exceed this lot’s available kg.')}</p>`;return;}
    output.innerHTML=`${lot?.sample?`<p>${t('নমুনা খরচ · যাচাই করা দর নয়','Example expenses · confirm your actual quote')}</p>`:''}<div class="budget-total ${r.remaining<0?'over-budget':''}"><span>${r.complete?t(r.remaining<0?'বাজেটের চেয়ে বেশি':'বাকি টাকা',r.remaining<0?'Over budget':'Remaining balance'):t('হিসাব অসম্পূর্ণ','Calculation incomplete')}</span><strong>${r.complete?money(Math.abs(r.remaining)):'—'}</strong><p>${r.complete?t('এটি বাজেটের বাকি টাকা, লাভ নয়।','This is your remaining budget, not profit.'):t('সব খরচ জানা হলে বাকি টাকা দেখা যাবে। ফাঁকা খরচকে শূন্য ধরা হয়নি।','Remaining balance needs all costs. Blank expenses were not counted as zero.')}</p></div>
    ${r.profit === null ? '' : `<p class="budget-profit"><strong>${money(Math.abs(r.profit))} ${r.profit < 0 ? t('লোকসান','loss') : r.profit > 0 ? t('লাভ','profit') : t('লাভ-লোকসান নেই','break-even')}</strong></p>`}
    <dl class="budget-breakdown"><div class="budget-sum"><dt>${r.complete?t('মোট খরচ','Total expenses'):t('এখন পর্যন্ত জানা খরচ','Known expenses so far')}</dt><dd>${money(r.subtotal)}</dd></div>${r.complete?`<div><dt>${t('প্রতি কেজির মোট খরচ','Total cost per kg')}</dt><dd>${money(r.unitCost)}</dd></div>`:''}</dl>`;
  };
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if (!expenseMode) {
      output.textContent = t('অন্যান্য খরচের জন্য একটি পদ্ধতি বেছে নিন।','Choose how to enter other expenses.');
      choices[0].focus();
      return;
    }
    submitted=false;
    clearTimeout(calculationTimer);
    output.textContent = t('হিসাব করা হচ্ছে…','Calculating…');
    output.scrollIntoView({block:'nearest',behavior:'smooth'});
    calculationTimer = setTimeout(() => {
      if (!root.isConnected) return;
      submitted=true;
      draw();
    }, 900);
  });
  const updateAssumed = () => {
    const {costs,missing} = calculateBudget(Object.fromEntries(new FormData(form)));
    total.textContent = missing.length ? '—' : money(Object.values(costs).reduce((sum, cost) => sum + (cost ?? 0), 0));
    estimateLines.innerHTML = expenseFields
      .filter(([key]) => costs[key] > 0)
      .map(([key, bn, en]) => `<div><dt>${t(bn,en)}</dt><dd>${money(costs[key])}</dd></div>`)
      .join('');
  };
  for (const choice of choices) choice.addEventListener('click', () => {
    clearTimeout(calculationTimer);
    const needsQuote = choice.dataset.expenseMode === 'estimate' && !routeExpenses(lot?.district);
    const next = needsQuote ? 'manual' : choice.dataset.expenseMode;
    if (expenseMode) drafts[expenseMode] = fields.map(field => field.value);
    expenseMode = next;
    fields.forEach((field, i) => { field.value = drafts[next][i]; });
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.expenseMode === next)));
    editor.hidden = false;
    editor.dataset.mode = next;
    editor.open = next === 'manual';
    estimateDetail.hidden = next !== 'estimate';
    updateAssumed();
    if (submitted) draw();
    else output.replaceChildren();
    if (needsQuote) {
      form.querySelector('.budget-save-status').textContent = t('এই রুটের ভাড়া লিখে হিসাব করুন।', 'Enter the truck fare for this route to calculate your costs.');
      fields[0].focus();
    }
  });
  form.addEventListener('input',()=>{updateAssumed();if(submitted)draw();});
}
export function openBudget(context) {
  document.querySelector('.buyer-budget-modal')?.remove();
  const dialog=document.createElement('dialog');dialog.className='buyer-budget-modal';dialog.setAttribute('aria-labelledby','budget-title');
  dialog.innerHTML=`<button type="button" class="budget-close" aria-label="${context.t('বন্ধ করুন','Close')}">×</button>${budgetContent(context)}`;
  document.body.append(dialog);mountBudget(dialog,context);dialog.querySelector('.budget-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
