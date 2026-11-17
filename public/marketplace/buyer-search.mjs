export const searchText=value=>String(value??'').normalize('NFC').toLowerCase().replace(/[০-৯]/g,d=>String('০১২৩৪৫৬৭৮৯'.indexOf(d))).trim();
export function parsePotatoRequest(query,{varieties,districts,places=[]}) {
  const raw=searchText(query).replace(/(\d),(?=\d{3}(?:\D|$))/g,'$1');
  let quantity=raw.match(/(\d+(?:\.\d+)?)\s*(?:kg\b|kgs\b|kilos?\b|কেজি|কিলোগ্রাম)/i)?.[1];
  if(!quantity){const words={'একশ':100,'দুইশ':200,'তিনশ':300,'চারশ':400,'পাঁচশ':500,'পাঁচশো':500,'ছয়শ':600,'ছয়শ':600,'সাতশ':700,'আটশ':800,'নয়শ':900,'নয়শ':900,'এক হাজার':1000,'দুই হাজার':2000,'পাঁচ হাজার':5000};const word=Object.keys(words).sort((a,b)=>b.length-a.length).find(w=>new RegExp(w+'\\s*(?:কেজি|কিলোগ্রাম)').test(raw));if(word)quantity=words[word];}
  const variety=varieties.find(([en,bn])=>[en,bn,...(en==='Diamant'?['diamond','ডায়মন্ড','ডায়মন্ড']:[])].some(name=>raw.includes(searchText(name))))?.[0]||'';
  const district=districts.find(([en,bn])=>[en,bn].filter(Boolean).some(name=>raw.includes(searchText(name))))?.[0]||'';
  const place=places.find(p=>p.upazila&&raw.includes(searchText(p.upazila))&&(!district||p.district===district));
  return {quantity:quantity?Number(quantity):'',variety,district:district||place?.district||'',upazila:place?.upazila||''};
}
export function startPotatoVoice(button,input,status,{bn,onResult}) {
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){status.textContent=bn?'এই ব্রাউজারে কথা থেকে লেখা হয় না। নিচে লিখে খুঁজুন।':'Voice input is not available here. Type your request below.';input.focus();return ()=>{};}
  const recognition=new Recognition();recognition.lang=bn?'bn-BD':'en-GB';recognition.interimResults=false;recognition.continuous=false;
  button.disabled=true;button.setAttribute('aria-pressed','true');status.textContent=bn?'বলুন—জাত, কেজি আর এলাকা।':'Say the variety, kg and area.';
  recognition.onresult=event=>{const words=event.results?.[0]?.[0]?.transcript||'';input.value=words.slice(0,240);status.textContent=bn?'লেখাটি মিলিয়ে নিয়ে খুঁজুন চাপুন।':'Check the text, then press Search.';onResult?.();};
  recognition.onerror=()=>{status.textContent=bn?'কথা শোনা যায়নি। মাইক্রোফোনের অনুমতি দেখে আবার বলুন, অথবা লিখুন।':'Could not hear you. Check microphone access, try again or type.';};
  recognition.onend=()=>{button.disabled=false;button.setAttribute('aria-pressed','false');};
  try{recognition.start();}catch{recognition.onend();recognition.onerror();}
  return ()=>recognition.abort();
}
