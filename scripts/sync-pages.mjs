import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const dist=path.join(root,"dist");
const docs=path.join(root,"docs");
const files=["index.html","styles.css","app.js","data.js","firebase-config.js","firebase-public.js","admin.html","admin.js","admin.css","workshop.html","workshop.js","workshop.css"];

const promptsSource=path.join(root,"source","workshop-gems");
const promptsDist=path.join(dist,"prompts");
if(fs.existsSync(promptsSource)){
  fs.rmSync(promptsDist,{recursive:true,force:true});
  fs.cpSync(promptsSource,promptsDist,{recursive:true});
}

fs.mkdirSync(docs,{recursive:true});
for(const file of files){
  fs.copyFileSync(path.join(dist,file),path.join(docs,file));
}
const promptsDocs=path.join(docs,"prompts");
if(fs.existsSync(promptsDist)){
  fs.rmSync(promptsDocs,{recursive:true,force:true});
  fs.cpSync(promptsDist,promptsDocs,{recursive:true});
}
if(!fs.existsSync(path.join(docs,".nojekyll"))) fs.writeFileSync(path.join(docs,".nojekyll"),"");
if(!fs.existsSync(path.join(root,".nojekyll"))) fs.writeFileSync(path.join(root,".nojekyll"),"");
console.log("docs synchronized; root redirect files are maintained separately");
