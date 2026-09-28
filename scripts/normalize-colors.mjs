// 色碼收斂（安全子集）：只處理「數值上等價於 color-mix(brand, X%, transparent)」的 rgba()
// 與「等值於既有 token」的 hex。不做任何猜測性替換。
//
// 為什麼只做這一小撮：全站 1201 處 rgba / 810 種 hex 中，真正等於既有 brand token
// 的只有 6 處；其餘都是各自頁面刻意挑的色值（例：#176579 與 --tidal 色相 192° vs 195°，
// 是「同一個潮藍的不同明度」，不是同一個值）。硬替會改色。
// 這些色值要跟著主題走，正確做法是**新增語意 token**（如 --tidal-700）再逐步遷移，
// 屬需要逐頁目檢的工作，不在機械收斂範圍。
//
// 用法: node scripts/normalize-colors.mjs [--dry]
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");

/** 既有 brand token（index.css :root 的值）。 */
const TOK = {
  "#0b6e8e": "--tidal",
  "#07516a": "--tidal-deep",
  "#e8754a": "--coral",
  "#c25b36": "--coral-deep",
  "#5e8577": "--moss",
  "#e3b54c": "--yellow",
  "#16303a": "--ink",
  "#587079": "--muted",
  "#cbd8db": "--line",
  "#eaf1f2": "--paper",
  "#dce7e9": "--paper-deep",
  "#fcfefe": "--white",
};

const hex2rgb = (h) => {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};

/** 預先算出每個 token 的 (r,g,b) */
const TOK_RGB = Object.fromEntries(Object.entries(TOK).map(([h, t]) => [h, { token: t, rgb: hex2rgb(h) }]));

let total = 0;
const perFile = [];
const samples = [];

const files = execSync(`grep -rlE '#[0-9a-fA-F]{3,6}|rgba\\(' client/src --include='*.css' || true`, {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

for (const file of files) {
  const src = await readFile(file, "utf8");
  let changed = 0;

  // ⚠️ token「定義區」必須完全跳過：:root { --tidal:#0B6E8E } 與
  // :root[data-theme="..."] { --tidal:#D0932B } 裡的 hex 換成 var(--tidal)
  // 會變成 --tidal: var(--tidal) 的自我引用，主題功能直接壞掉。
  // 因此逐段處理：把 CSS 切成「宣告區塊」與「規則區塊」，
  // 只有規則區塊（非 :root / 非[data-theme] 選擇器）才做替換。
  const BLOCK = /([^{}]+)\{([^{}]*)\}/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = BLOCK.exec(src))) {
    const [, selRaw, body] = m;
    // 選擇器擷取會連帶抓到前面的註解與換行，必須取最後一行並 trim 後再判斷。
    const sel = selRaw.trim().split("\n").pop().trim();
    const isTokenDecl =
      /^:root\b/.test(sel) || /data-theme\s*=/.test(sel) || /^:host\b/.test(sel);
    out += src.slice(last, m.index);
    last = m.index + m[0].length;

    if (isTokenDecl || !/#[0-9a-fA-F]{3,6}\b|rgba\(/.test(body)) {
      out += m[0];
      continue;
    }

    let body2 = body;
    // 1) 等值 hex → var(--token)
    body2 = body2.replace(/#([0-9a-fA-F]{6})\b/g, (mm, hex) => {
      const hit = TOK_RGB["#" + hex.toLowerCase()];
      if (!hit) return mm;
      changed++;
      if (samples.length < 20) samples.push(`${file}: #${hex} → var(${hit.token})`);
      return `var(${hit.token})`;
    });
    // 3 位 hex（#fff → #ffffff 比對）
    body2 = body2.replace(/#([0-9a-fA-F]{3})\b/g, (mm, hex) => {
      const full = "#" + hex.split("").map((c) => c + c).join("").toLowerCase();
      const hit = TOK_RGB[full];
      if (!hit) return mm;
      changed++;
      return `var(${hit.token})`;
    });
    // 2) rgba(r,g,b,a) 且 rgb 命中 brand token → color-mix(token, a*100%, transparent)
    body2 = body2.replace(
      /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g,
      (mm, r, g, b, a) => {
        const key =
          "#" + [r, g, b].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
        const hit = TOK_RGB[key];
        if (!hit) return mm;
        const pct = Math.round(Number(a) * 100);
        if (pct === 0 || pct === 100) return mm;
        changed++;
        if (samples.length < 20)
          samples.push(`${file}: ${mm} → color-mix(in srgb, var(${hit.token}) ${pct}%, transparent)`);
        return `color-mix(in srgb, var(${hit.token}) ${pct}%, transparent)`;
      },
    );
    // 必须用 selRaw（含选择器前方的注释/换行），用裁剪过的 sel 会吃掉注释
    out += `${selRaw}{${body2}}`;
  }
  out += src.slice(last);

  if (changed > 0) {
    total += changed;
    perFile.push({ file, changed });
    if (!DRY) await writeFile(file, out, "utf8");
  }
}

console.log(DRY ? "[DRY] 將替換：" : "已套用：");
for (const p of perFile) console.log(`  ${String(p.changed).padStart(3)}  ${p.file}`);
console.log(`\n合計 ${total} 處 / ${perFile.length} 檔`);
if (DRY && samples.length) {
  console.log("\n抽樣：");
  for (const s of samples) console.log("  " + s);
}
console.log(
  "\n註：其餘色值不屬等值替換範圍——需新增語意 token 並逐頁目檢，見 docs/design-tokens.md。",
);
