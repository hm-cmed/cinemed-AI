const videos=window.CINEMED_VIDEOS||[];
const cards=document.querySelector("#cards"),search=document.querySelector("#search"),setting=document.querySelector("#setting-filter"),system=document.querySelector("#system-filter"),type=document.querySelector("#type-filter"),theme=document.querySelector("#theme-filter"),count=document.querySelector("#result-count"),empty=document.querySelector("#empty");
const detail=document.querySelector("#detail-dialog"),videoFrame=document.querySelector("#detail-video");
const languageDialog=document.querySelector("#language-dialog"),languageFilters=document.querySelectorAll("[data-language-filter]"),languageChoices=document.querySelectorAll("[data-language-choice]");
let activeVideo=null;
let activeLanguage=sessionStorage.getItem("cinemed-language")||"all";

[...new Set(videos.map(v=>v.system))].sort().forEach(x=>system.insertAdjacentHTML("beforeend",`<option>${x}</option>`));
[...new Set(videos.flatMap(v=>v.themes))].sort().forEach(x=>theme.insertAdjacentHTML("beforeend",`<option>${x}</option>`));
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function render(){
  const q=search.value.trim().toLowerCase();
  const filtered=videos.filter(v=>(activeLanguage==="all"||v.contentLanguage===activeLanguage||v.contentLanguage==="und")&&(!setting.value||v.setting===setting.value)&&(!system.value||v.system===system.value)&&(!type.value||v.type===type.value)&&(!theme.value||v.themes.includes(theme.value))&&(!q||[v.id,v.sourceId,v.title,v.en,v.summary,v.prompt,v.setting,v.system,v.type,v.contentLanguage,v.catalogStatus,v.sourcePage,...v.themes].join(" ").toLowerCase().includes(q)));
  count.textContent=`${filtered.length}本`;
  empty.hidden=filtered.length>0;
  cards.innerHTML=filtered.map(v=>`<button class="card" data-id="${v.id}" aria-label="${escapeHtml(v.title)}の詳細を開く">
    <div class="card-visual"><strong>${escapeHtml(v.type.slice(0,1))}</strong><span>${v.id} · ${escapeHtml(v.type)}</span></div>
    <div class="card-body"><h2>${escapeHtml(v.title)}</h2><div class="en">${escapeHtml(v.en)}</div><p>${escapeHtml(v.summary)}</p>
    <div class="tags"><span class="tag language-tag">${languageLabel(v.contentLanguage)}</span><span class="tag ${v.setting==="救急"?"urgent":""}">${v.setting}</span><span class="tag">${v.system}</span></div></div></button>`).join("");
}

function languageLabel(language){return ({ja:"日本語",en:"English",und:"言語未確認"})[language]||"言語未確認"}
function setLanguage(language,{remember=true,close=true}={}){
  activeLanguage=["ja","en","all"].includes(language)?language:"all";
  if(remember)sessionStorage.setItem("cinemed-language",activeLanguage);
  languageFilters.forEach(button=>{const selected=button.dataset.languageFilter===activeLanguage;button.classList.toggle("active",selected);button.setAttribute("aria-pressed",String(selected))});
  render();
  if(close&&languageDialog.open)languageDialog.close();
}

function openDetail(id){
  const v=videos.find(x=>x.id===id); if(!v)return; activeVideo=v;
  const sourceNote=v.sourceId&&v.sourceId!==v.id?` · Looker元ID ${v.sourceId}`:"";
  document.querySelector("#detail-id").textContent=`${v.id}${sourceNote} · ${v.catalogStatus}`;
  document.querySelector("#detail-title").textContent=v.title;
  document.querySelector("#detail-en").textContent=v.en;
  document.querySelector("#detail-summary").textContent=v.summary;
  document.querySelector("#detail-prompt").textContent=v.prompt;
  document.querySelector("#detail-tags").innerHTML=[languageLabel(v.contentLanguage),v.type,v.system,v.setting,v.catalogStatus,...v.themes].map(x=>`<span class="tag ${v.setting==="救急"&&x===v.setting?"urgent":""}">${escapeHtml(x)}</span>`).join("");
  document.querySelector("#drive-link").href=`https://drive.google.com/file/d/${v.driveId}/view`;
  videoFrame.src=`https://drive.google.com/file/d/${v.driveId}/preview`;
  detail.showModal();
}
function closeDetail(){detail.close();videoFrame.src="";activeVideo=null}

cards.addEventListener("click",e=>{const card=e.target.closest(".card");if(card)openDetail(card.dataset.id)});
[search,setting,system,type,theme].forEach(el=>el.addEventListener(el===search?"input":"change",render));
document.querySelector("#reset").addEventListener("click",()=>{search.value="";[setting,system,type,theme].forEach(x=>x.value="");render();search.focus()});
document.querySelector("[data-close]").addEventListener("click",closeDetail);
detail.addEventListener("click",e=>{if(e.target===detail)closeDetail()});
document.querySelector("#copy-prompt").addEventListener("click",async e=>{if(!activeVideo)return;await navigator.clipboard.writeText(activeVideo.prompt);const old=e.target.textContent;e.target.textContent="コピーしました";setTimeout(()=>e.target.textContent=old,1400)});

const info=document.querySelector("#info-dialog");
const panels={
 submit:{kicker:"CONTRIBUTE",title:"教材を登録する",text:"制作者情報、動画共有リンク、生成プロンプト、教育目的、権利確認を受け付け、運営で審査してから掲載します。",fields:["動画タイトル","閲覧可能な動画共有リンク","生成プロンプト","学習目標・活用場面","権利・個人情報の確認"]},
 usage:{kicker:"USE REPORT",title:"利用事例を報告する",text:"授業や研修での利用方法を共有してください。今後の改善と利用実績の可視化に活用します。",fields:["動画ID（自動入力）","参加人数","授業・研修での使用方法","学習者の反応","改善案"]}
};
function openInfo(type){const p=panels[type];document.querySelector("#info-kicker").textContent=p.kicker;document.querySelector("#info-title").textContent=p.title;document.querySelector("#info-text").textContent=p.text;document.querySelector("#info-fields").innerHTML=p.fields.map((x,i)=>`<div class="mock-field">${i+1}. ${x}${type==="usage"&&i===0&&activeVideo?`：${activeVideo.id}`:""}</div>`).join("");info.showModal()}
document.querySelectorAll("[data-open-panel]").forEach(b=>b.addEventListener("click",()=>{if(detail.open)closeDetail();openInfo(b.dataset.openPanel)}));
document.querySelectorAll("[data-info-close]").forEach(b=>b.addEventListener("click",()=>info.close()));
info.addEventListener("click",e=>{if(e.target===info)info.close()});
languageChoices.forEach(button=>button.addEventListener("click",()=>setLanguage(button.dataset.languageChoice)));
languageFilters.forEach(button=>button.addEventListener("click",()=>setLanguage(button.dataset.languageFilter)));
languageDialog.addEventListener("cancel",event=>{event.preventDefault();setLanguage("all")});
setLanguage(activeLanguage,{remember:false,close:false});
if(!sessionStorage.getItem("cinemed-language"))languageDialog.showModal();
