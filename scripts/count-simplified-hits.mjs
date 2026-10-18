/**
 * 統計把 scripts/ 加進 check-traditional 的 ROOTS 會新增多少命中，
 * 並拆出「掃描器自身 self-match」與「其他腳本的既有簡體」。
 * 用途：擴大繁體閘門範圍前先量化影響，避免 CI 立刻變紅（見 05 的 E2h）。
 * 用法：node scripts/count-simplified-hits.mjs
 */
import fs from "node:fs";
import path from "node:path";
const src=fs.readFileSync("scripts/check-traditional.mjs","utf8");
const m=/const SIMPLIFIED = \{([\s\S]*?)\n\};/.exec(src);
const map=Object.fromEntries([...m[1].matchAll(/([^\s,{}:"]+):\s*"([^"]+)"/g)].map(x=>[x[1],x[2]]));
const pat=new RegExp(`[${Object.keys(map).join("")}]`,"g");
let self=0,other=0;const files={};
function walk(d){
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    if(e.name==="node_modules"||e.name.startsWith("."))continue;
    const p=path.join(d,e.name);
    if(e.isDirectory()){walk(p);continue;}
    if(!/\.(ts|tsx|mjs|mts|js|json)$/.test(e.name))continue;
    for(const ln of fs.readFileSync(p,"utf8").split("\n")){
      const f=[...ln.matchAll(pat)].length;
      if(!f)continue;
      if(p.includes("check-traditional"))self+=f;
      else{other+=f;files[p]=(files[p]||0)+f;}
    }
  }
}
walk("scripts");
console.log("self-match(掃描器自身):",self,"| 其他檔既有:",other,"| 合計:",self+other);
console.log("Top:",Object.entries(files).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k.replace("scripts/","")+":"+v).join(" "));
