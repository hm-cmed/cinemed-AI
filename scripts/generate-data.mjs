import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const scrapedBase=JSON.parse(fs.readFileSync(path.join(root,"source/google-sites-videos.json"),"utf8"));
const additional=readJson(path.join(root,"source/additional-videos.json"),[]);
const overrides=readJson(path.join(root,"source/manual-overrides.json"),{});
const scraped=[...scrapedBase,...additional];
const catalog=parseCsv(fs.readFileSync(path.join(root,"source/looker-catalog.csv"),"utf8"));

const TYPE_BY_PAGE=page=>page==="症候"?["症候","SYMP"]:page.startsWith("疾患")?["疾患","DISE"]:page.startsWith("医行為")?["手技","PROC"]:["コンピテンシー","COMP"];
const FALLBACK_MIDDLE={
  "症候":"未整理",
  "医行為（診察手技）":"診察手技",
  "医行為（処置）":"処置",
  "疾患1":"疾患（第1群）",
  "疾患2":"疾患（第2群）",
  "疾患3":"疾患（第3群）",
  "疾患4":"疾患（第4群）"
};
const SYMPTOM_ALIASES={
  "体重減少":"SYMP-184","体重増加":"SYMP-184","けいれん":"SYMP-191","痙攣":"SYMP-191",
  "吐血":"SYMP-204","黒色便":"SYMP-204","便秘":"SYMP-205","下痢":"SYMP-205",
  "腹部膨満膨隆":"SYMP-188","腹部膨満（膨隆）":"SYMP-188","血尿":"SYMP-213",
  "不安":"SYMP-215","運動麻痺":"SYMP-209","筋力低下":"SYMP-209"
};

const catalogByPrefix=Object.groupBy(catalog,row=>row["動画ID"].split("-")[0]);
const catalogById=new Map(catalog.map(row=>[row["動画ID"],row]));
const uniqueScraped=[...new Map(scraped.map(row=>[row.driveId,row])).values()];

const staged=uniqueScraped.map((row,index)=>{
  const [type,prefix]=TYPE_BY_PAGE(row.sourcePage);
  const parsed=parseSource(row);
  const aliasId=type==="症候"?SYMPTOM_ALIASES[parsed.title]:null;
  const candidates=(catalogByPrefix[prefix]||[]).map(meta=>({meta,score:similarity(parsed.title,meta["動画タイトル"])})).sort((a,b)=>b.score-a.score);
  const best=aliasId?{meta:catalogById.get(aliasId),score:1}:candidates[0];
  const second=aliasId?null:candidates[1];
  const confident=Boolean(best?.meta&&(aliasId||best.score>=0.85&&best.score-(second?.score||0)>=0.04));
  const meta=confident?best.meta:null;
  const competencyMiddle=row.sourcePage.includes("(")?row.sourcePage.match(/\(([^()]*)\)\s*$/)?.[1]:row.sourcePage;
  return {
    order:index+1,
    baseId:meta?.["動画ID"]||null,
    prefix,
    title:parsed.title||`名称未設定 ${index+1}`,
    en:parsed.en,
    driveId:row.driveId,
    contentLanguage:inferContentLanguage(row,parsed),
    setting:inferSetting(`${parsed.prompt} ${parsed.summary} ${parsed.title}`),
    system:meta?.["中分類・領域"]||FALLBACK_MIDDLE[row.sourcePage]||competencyMiddle||"未整理",
    type,
    themes:inferThemes(type,row.sourcePage,parsed),
    summary:parsed.summary||"元サイトに解説の登録がありません。",
    prompt:parsed.prompt||"元サイトに生成プロンプトの登録がありません。",
    catalogStatus:meta?"Looker照合済":"台帳未照合",
    sourceId:meta?.["動画ID"]||null,
    sourcePage:row.sourcePage,
    sourceUrl:row.sourceUrl,
    sourceFileName:row.fileName,
    evaluationUrl:/^https?:\/\//.test(meta?.["評価フォームURL"]||"")?meta["評価フォームURL"]:"",
    language:"日本語場面・英語プロンプト"
  };
});

const pendingCounters={SYMP:0,PROC:0,DISE:0,COMP:0};
const officialCounts=Object.create(null);
for(const row of staged) if(row.baseId) officialCounts[row.baseId]=(officialCounts[row.baseId]||0)+1;
const officialSeen=Object.create(null);

const videos=staged.map(row=>{
  let id;
  if(row.baseId){
    officialSeen[row.baseId]=(officialSeen[row.baseId]||0)+1;
    id=officialCounts[row.baseId]>1?`${row.baseId}-${String.fromCharCode(64+officialSeen[row.baseId])}`:row.baseId;
    if(officialCounts[row.baseId]>1) row.catalogStatus="統合項目・別動画";
  }else{
    pendingCounters[row.prefix]++;
    id=`PENDING-${row.prefix}-${String(pendingCounters[row.prefix]).padStart(3,"0")}`;
  }
  const {baseId,prefix,...clean}=row;
  const base={id,...clean};
  return {...base,...(overrides[id]||overrides[row.driveId]||{})};
});

fs.writeFileSync(path.join(root,"dist/data.js"),`window.CINEMED_VIDEOS = ${JSON.stringify(videos,null,2)};\n`);
fs.writeFileSync(path.join(root,"source/videos.normalized.json"),`${JSON.stringify(videos,null,2)}\n`);

const report={
  generatedAt:new Date().toISOString(),
  sourceEmbeds:scraped.length,
  uniqueVideos:videos.length,
  duplicateEmbedsRemoved:scraped.length-videos.length,
  catalogRows:catalog.length,
  matched:videos.filter(v=>v.catalogStatus!=="台帳未照合").length,
  unmatched:videos.filter(v=>v.catalogStatus==="台帳未照合").length,
  byType:Object.fromEntries(["疾患","手技","コンピテンシー","症候"].map(t=>[t,videos.filter(v=>v.type===t).length])),
  bySetting:Object.fromEntries(["外来","救急","病棟","その他"].map(t=>[t,videos.filter(v=>v.setting===t).length])),
  byLanguage:{ja:videos.filter(v=>v.contentLanguage==="ja").length,en:videos.filter(v=>v.contentLanguage==="en").length,und:videos.filter(v=>v.contentLanguage==="und").length}
};
fs.writeFileSync(path.join(root,"source/import-report.json"),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));

function parseSource(row){
  const context=(row.context||[]).map(x=>String(x).trim()).filter(Boolean);
  const labels=context.filter(x=>!isPrompt(x)&&!isSummary(x));
  let raw=labels.at(-1)||row.fileName.replace(/\.mp4$/i,"");
  if(/^download$/i.test(raw)) raw=labels.at(-1)||row.sourcePage;
  raw=raw.replace(/^\s*\d+[.．、)]\s*/,"").replace(/\s+修正必要\s*$/," ").trim();
  const fileBase=row.fileName.replace(/\.mp4$/i,"").replace(/^\s*\d+[.．、)]\s*/,"").trim();
  if(!labels.length&&!/^download$/i.test(fileBase)) raw=fileBase;
  let en="";
  const englishMatch=raw.match(/\s*[（(]([^()（）]*[A-Za-z][^()（）]*)[）)]\s*$/);
  if(englishMatch&&!/[ぁ-んァ-ヶ一-龯]/.test(englishMatch[1])){
    en=englishMatch[1].trim();
    raw=raw.slice(0,englishMatch.index).trim();
  }else{
    const fileMatch=fileBase.match(/\s*[（(]([^()（）]*[A-Za-z][^()（）]*)[）)]\s*\d*$/);
    if(fileMatch&&!/[ぁ-んァ-ヶ一-龯]/.test(fileMatch[1])) en=fileMatch[1].trim();
  }
  const prompt=context.filter(isPrompt).at(-1)?.replace(/^(?:プロンプト|Prompt)\s*[:：]\s*/i,"").trim()||"";
  const summary=context.filter(isSummary).at(-1)?.replace(/^解説\s*[:：]\s*/,"").trim()||(!prompt&&labels.length>1?labels.slice(1).join(" "):"");
  return {title:raw||fileBase,en,prompt,summary};
}

function isPrompt(value){return /^(?:プロンプト|Prompt)\s*[:：]/i.test(value)}
function isSummary(value){return /^解説\s*[:：]/.test(value)}

function inferSetting(text){
  if(/\b(?:ER|emergency|resuscitation)\b|救急|急変|外傷初療|蘇生/i.test(text)) return "救急";
  if(/\b(?:hospital bed|inpatient|ward|bedside)\b|病棟|入院中|病室|ナースステーション/i.test(text)) return "病棟";
  if(/\b(?:outpatient|clinic|consultation room)\b|外来|診察室/i.test(text)) return "外来";
  return "その他";
}

function inferContentLanguage(row,parsed){
  const file=row.fileName||"";
  if(/英語|english\s*version|(?:^|[-_. ])en(?:[-_. ]|$)/i.test(file)) return "en";
  if(/日本語|japanese\s*version|(?:^|[-_. ])ja(?:[-_. ]|$)|(?:^|[-_. ])jp(?:[-_. ]|$)/i.test(file)) return "ja";
  const [type]=TYPE_BY_PAGE(row.sourcePage);
  if(type!=="コンピテンシー") return "ja";
  const labels=(row.context||[]).filter(value=>!isPrompt(value)&&!isSummary(value)).join(" ");
  if(!labels) return "und";
  if(/[「」ぁ-んァ-ヶ一-龯]/.test(labels)) return "ja";
  if(/[A-Za-z]{3}/.test(labels)) return "en";
  return "und";
}

function inferThemes(type,page,parsed){
  if(type==="症候") return ["医療面接","臨床推論"];
  if(type==="手技") return [page.includes("診察")?"身体診察":"基本手技"];
  if(type==="疾患") return ["疾患理解","臨床推論"];
  const jp=page.match(/\(([^()]*)\)\s*$/)?.[1];
  return [jp||"コンピテンシー"];
}

function normalize(value){
  return String(value||"").normalize("NFKC").toLowerCase().replace(/修正必要|英語|日本語|動画/g,"").replace(/の医療面接.*$/,"").replace(/医療面接.*$/,"").replace(/[\s　・:：()（）「」『』【】\[\]\/／,，.。_\-+]/g,"");
}

function similarity(a,b){
  a=normalize(a);b=normalize(b);
  if(!a||!b) return 0;
  if(a===b) return 1;
  if(a.length>=3&&b.length>=3&&(a.includes(b)||b.includes(a))) return 0.9+0.09*Math.min(a.length,b.length)/Math.max(a.length,b.length);
  if(a.length<2||b.length<2) return 0;
  const grams=new Map();
  for(let i=0;i<a.length-1;i++){const g=a.slice(i,i+2);grams.set(g,(grams.get(g)||0)+1)}
  let hits=0;
  for(let i=0;i<b.length-1;i++){const g=b.slice(i,i+2),n=grams.get(g)||0;if(n){hits++;grams.set(g,n-1)}}
  return 2*hits/(a.length+b.length-2);
}

function parseCsv(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(quoted){
      if(char==='"'&&text[i+1]==='"'){field+='"';i++}
      else if(char==='"') quoted=false;
      else field+=char;
    }else if(char==='"') quoted=true;
    else if(char===","){row.push(field);field=""}
    else if(char==="\n"){row.push(field.replace(/\r$/,"").trim());rows.push(row);row=[];field=""}
    else field+=char;
  }
  if(field||row.length){row.push(field);rows.push(row)}
  const headers=rows.shift();
  return rows.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
}

function readJson(file,fallback){
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,"utf8")):fallback;
}
