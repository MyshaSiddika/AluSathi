const storageKey='alusathi-buyer-budget-v1';
export const expenseFields=[
  ['transport','গাড়ি / পরিবহন','Truck / transport'],['labour','শ্রমিক','Labour'],['loading','ওঠানো / নামানো','Loading / unloading'],
  ['toll','সেতু / টোল','Bridge / toll'],['phone','ফোন / যোগাযোগ','Phone / communication'],['other','অন্যান্য খরচ','Other costs'],
];
export function budgetNumber(value) {
  const raw=String(value??'').trim().replace(/[০-৯]/g,d=>String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/,/g,'');
  return /^\d+(?:\.\d{1,2})?$/.test(raw)&&Number(raw)<=100000000?Number(raw):null;
}
export function calculateBudget(values,available=Infinity) {
  const budget=budgetNumber(values.budget),quantity=budgetNumber(values.quantity),price=budgetNumber(values.price);
  const costs=Object.fromEntries(expenseFields.map(([key])=>[key,budgetNumber(values[key])])),missing=Object.keys(costs).filter(key=>costs[key]===null);
  const invalid=!(budget>0)||!(quantity>0)||quantity>1000000||!(price>0)||price>10000||quantity>available;
  const round=n=>Math.round(n*100)/100,potatoes=quantity>0&&price>0?round(quantity*price):null;
  const subtotal=round((potatoes??0)+Object.values(costs).reduce((sum,n)=>sum+(n??0),0));
  const complete=!invalid&&!missing.length,total=complete?subtotal:null,remaining=complete?round(budget-total):null;
  const rawResale=budgetNumber(values.resale),resale=rawResale!==null&&rawResale<=10000?rawResale:null,revenue=complete&&resale!==null?round(quantity*resale):null;
  return {budget,quantity,price,costs,missing,invalid,potatoes,subtotal,complete,total,remaining,unitCost:complete?round(total/quantity):null,revenue,profit:revenue!==null?round(revenue-total):null};
}
function savedBudget() { try { const value=JSON.parse(localStorage.getItem(storageKey)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}; }catch{return {};}}
export function budgetContent({t,h,lot,available,requestedQuantity}) {
  const saved=savedBudget(),value=key=>typeof saved[key]==='string'&&saved[key].length<=24?saved[key]:'';
  const asking=Number(lot?.askingPriceKg??lot?.priceKg),price=asking>0&&Number.isFinite(asking)?String(asking):value('price');
  const input=(key,bn,en,initial=value(key))=>`<label>${t(bn,en)}<input name="${key}" inputmode="decimal" maxlength="24" value="${h(initial)}" autocomplete="off"></label>`;
  return `<section class="buyer-budget" aria-labelledby="budget-title"><header><p class="budget-eyebrow">${t('কেনার আগে হিসাব','Plan before buying')}</p><h2 id="budget-title">${t('খরচ ও লাভ','Cost & profit')}</h2><p>${t('আপনার বাজেট আর জানা খরচ দিয়ে দেখুন কত টাকা বাকি থাকবে।','Enter your budget and known costs to see what remains.')}</p>${lot?`<p class="budget-lot">${h(lot.variety)} · ${h(lot.farmerName||'')} · ${h(String(available))} ${t('কেজি পাওয়া যাবে','kg available')}</p>`:''}</header>
  <form data-budget-form novalidate><div class="budget-main-fields">${input('budget','আপনার বাজেট কত? (৳)','Your budget (৳)')}${input('quantity','কত কেজি কিনবেন?','How many kg will you buy?',requestedQuantity>0?String(requestedQuantity):lot?String(Math.min(200,available)):value('quantity'))}${input('price','আলুর দাম / কেজি (৳)','Potato price per kg (৳)',price)}</div>
  <fieldset><legend>${t('আলাদা খরচ লিখুন','Enter separate expenses')}</legend><p>${t('যে খরচ নেই, ০ লিখুন। ফাঁকা ঘর মানে খরচ জানা নেই। একই খরচ দুবার লিখবেন না।','Enter 0 if there is no charge. Blank means unknown. Do not enter the same cost twice.')}</p><div class="budget-expenses">${expenseFields.map(([key,bn,en])=>input(key,bn+' (৳)',en+' (৳)')).join('')}</div><p>${t('বস্তা, ওজন মাপা, বাজারের ফি বা হিমাগারের খরচ থাকলে অন্যান্য খরচে যোগ করুন।','Include sacks, weighing, market fees or storage charges under Other costs.')}</p></fieldset>
  <details class="budget-resale"><summary>${t('সম্ভাব্য বিক্রির হিসাব (ঐচ্ছিক)','Expected sales (optional)')}</summary>${input('resale','সম্ভাব্য বিক্রির দাম / কেজি (৳)','Expected selling price per kg (৳)')}<p>${t('কেনা সব কেজি একই দামে বিক্রি হবে ধরে হিসাব। আলু বাদ গেলে বা নতুন খরচ হলে ফল বদলাবে।','Assumes all bought kg are sold at this price. Rejections or more costs will change the result.')}</p></details>
  <button class="button button-green" type="submit">${t('খরচ দেখুন','Show costs')}</button><p class="budget-save-status" role="status"></p></form><div class="budget-results" data-budget-results aria-live="polite"></div></section>`;
}
export function mountBudget(root,{t,h,money,lot,available=Infinity,lots=[]}) {
  const form=root.querySelector('[data-budget-form]'),output=root.querySelector('[data-budget-results]');let submitted=false;
  const bar=(label,value,max,kind='')=>`<li><div><span>${h(label)}</span><strong>${money(value)}</strong></div><span class="budget-bar-track"><i class="${kind}" style="width:${Math.max(0,Math.min(100,max?value/max*100:0))}%"></i></span></li>`;
  const draw=()=>{
    const values=Object.fromEntries(new FormData(form)),r=calculateBudget(values,lot?available:Infinity);
    try {localStorage.setItem(storageKey,JSON.stringify(values));root.querySelector('.budget-save-status').textContent='';}catch{root.querySelector('.budget-save-status').textContent=t('এই ব্রাউজারে সেভ হয়নি। হিসাবটি নিচে আছে।','Not saved in this browser. The result is shown below.');}
    if(r.invalid){output.innerHTML=`<p class="budget-incomplete" role="alert">${t('সঠিক বাজেট, কেজি ও আলুর দাম লিখুন। লটে যত কেজি আছে, তার বেশি দেওয়া যাবে না।','Check budget, kg and potato price. Quantity cannot exceed this lot’s available kg.')}</p>`;return;}
    const lines=[[t('আলু কেনা','Potato purchase'),r.potatoes],...expenseFields.map(([key,bn,en])=>[t(bn,en),r.costs[key]])];
    output.innerHTML=`<div class="budget-total ${r.remaining<0?'over-budget':''}"><span>${r.complete?t(r.remaining<0?'বাজেটের চেয়ে বেশি':'বাকি টাকা',r.remaining<0?'Over budget':'Remaining balance'):t('হিসাব অসম্পূর্ণ','Calculation incomplete')}</span><strong>${r.complete?money(Math.abs(r.remaining)):'—'}</strong><p>${r.complete?t('এটি বাজেটের বাকি টাকা, লাভ নয়।','This is your remaining budget, not profit.'):t('সব খরচ জানা হলে বাকি টাকা দেখা যাবে। ফাঁকা খরচকে শূন্য ধরা হয়নি।','Remaining balance needs all costs. Blank expenses were not counted as zero.')}</p></div>
    <dl class="budget-breakdown"><div><dt>${t('আপনার বাজেট','Your budget')}</dt><dd>${money(r.budget)}</dd></div>${lines.map(([label,amount])=>`<div><dt>${h(label)}</dt><dd>${amount===null?t('জানা নেই','Unknown'):'−'+money(amount)}</dd></div>`).join('')}<div class="budget-sum"><dt>${r.complete?t('মোট খরচ','Total expenses'):t('এখন পর্যন্ত জানা খরচ','Known expenses so far')}</dt><dd>${money(r.subtotal)}</dd></div>${r.complete?`<div><dt>${t('প্রতি কেজির মোট খরচ','Total cost per kg')}</dt><dd>${money(r.unitCost)}</dd></div>`:''}</dl>
    <section class="budget-chart"><h3>${t('কোন খাতে কত খরচ','Where your money goes')}</h3><ul>${lines.filter(([,n])=>n!==null).map(([label,n])=>bar(label,n,Math.max(...lines.map(([,n])=>n??0)))).join('')}</ul></section>
    ${r.complete?`<section class="budget-chart"><h3>${t('বাজেট ও খরচের তুলনা','Budget and expenses')}</h3><ul>${bar(t('বাজেট','Budget'),r.budget,Math.max(r.budget,r.total),'budget-available')}${bar(t('সব খরচ','All expenses'),r.total,Math.max(r.budget,r.total))}</ul></section>`:''}
    ${r.profit!==null?`<section class="budget-chart"><h3>${t('সম্ভাব্য লাভ / লোকসান','Estimated profit / loss')}</h3><p>${t('সম্ভাব্য বিক্রির টাকা','Expected sale value')}: ${money(r.revenue)}</p><strong class="${r.profit<0?'budget-loss':''}">${money(Math.abs(r.profit))} ${r.profit<0?t('আনুমানিক লোকসান','estimated loss'):r.profit===0?t('লাভ বা লোকসান নেই','no profit or loss'):t('আনুমানিক লাভ','estimated profit')}</strong><ul>${bar(t('বিক্রির টাকা','Sale value'),r.revenue,Math.max(r.revenue,r.total),'budget-available')}${bar(t('খরচ','Expenses'),r.total,Math.max(r.revenue,r.total))}</ul></section>`:''}`;
    const comparable=lots.filter(l=>Number.isFinite(Number(l.askingPriceKg??l.priceKg))&&Number(l.askingPriceKg??l.priceKg)>0&&l.available>=r.quantity).slice(0,4);
    if(comparable.length>1){const prices=comparable.map(l=>({label:l.variety+' · '+l.district,value:Number(l.askingPriceKg??l.priceKg)*r.quantity})),max=Math.max(...prices.map(p=>p.value));output.insertAdjacentHTML('beforeend',`<section class="budget-chart"><h3>${t('একই কেজির আলুর দামের তুলনা','Potato prices for the same kg')}</h3><p>${t('শুধু তালিকার আলুর দাম; গাড়িভাড়া ও অন্য খরচ বাদ।','Listing prices only. Transport and other expenses are excluded.')}</p><ul>${prices.map(p=>bar(p.label,p.value,max)).join('')}</ul></section>`);}
  };
  form.addEventListener('submit',event=>{event.preventDefault();submitted=true;draw();output.scrollIntoView({block:'nearest',behavior:'smooth'});});
  form.addEventListener('input',()=>{if(submitted)draw();});
}
export function openBudget(context) {
  document.querySelector('.buyer-budget-modal')?.remove();
  const dialog=document.createElement('dialog');dialog.className='buyer-budget-modal';dialog.setAttribute('aria-labelledby','budget-title');
  dialog.innerHTML=`<button type="button" class="budget-close" aria-label="${context.t('বন্ধ করুন','Close')}">×</button>${budgetContent(context)}`;
  document.body.append(dialog);mountBudget(dialog,context);dialog.querySelector('.budget-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
