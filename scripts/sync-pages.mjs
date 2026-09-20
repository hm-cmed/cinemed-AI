import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const dist=path.join(root,"dist");
const docs=path.join(root,"docs");

fs.mkdirSync(docs,{recursive:true});
for(const file of ["index.html","styles.css","app.js","data.js","firebase-config.js","firebase-public.js","admin.html","admin.js","admin.css"]){
  fs.copyFileSync(path.join(dist,file),path.join(docs,file));
}
if(!fs.existsSync(path.join(docs,".nojekyll"))) fs.writeFileSync(path.join(docs,".nojekyll"),"");
console.log("docs synchronized");
