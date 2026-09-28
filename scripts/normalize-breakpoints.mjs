// 斷點統一：把散落的 20 個 @media max-width 值收斂到 4 檔標準
//   640 (sm)  / 768 (md)  / 1024 (lg)  / 1280 (xl)
// 規則：一律「向下取整」映射到最近的標準檔，讓切換點只會提早、不會延後，
//       避免原本在 700px 生效的規則變成 768px 後而漏掉 700–768 之間的版面。
//
// 用法: node scripts/normalize-breakpoints.mjs [--dry]
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");

// 由小到大的收斂目標
const MAP = {
  // → sm 640
  360: 640, 380: 640, 390: 640, 400: 640, 410: 640, 414: 640, 420: 640, 440: 640, 460: 640, 480: 640, 490: 640, 510: 640, 520: 640, 550: 640,
  // → md 768
  560: 768, 570: 768, 580: 768, 590: 768, 600: 768, 610: 768, 620: 768, 630: 768, 650: 768, 680: 768, 690: 768, 700: 768, 720: 768, 740: 768, 760: 768,
  // → lg 1024
  780: 1024, 820: 1024, 840: 1024, 850: 1024, 860: 1024, 880: 1024, 900: 1024, 920: 1024, 960: 1024, 980: 1024, 996: 1024,
  // → xl 1280
  1040: 1280, 1080: 1280, 1100: 1280, 1120: 1280, 1180: 1280, 1220: 1280, 1240: 1280,
};

// 已經是標準值的，直接略過（但仍記錄）
const CANON = new Set([640, 768, 1024, 1280]);

const files = execSync(
  `grep -rl '@media' client/src --include='*.css' || true`,
  { encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);

let totalChanged = 0;
const perFile = [];
const minChanges = [];

for (const file of files) {
  const src = await readFile(file, "utf8");
  let changed = 0;
  let minChanged = 0;

  // 只替換 @media 條件裡的 max-width，不動一般屬性
  let out = src.replace(
    /(@media[^{]{0,120}?max-width:\s*)(\d+)(px)/g,
    (full, prefix, num, unit) => {
      const n = Number(num);
      if (CANON.has(n)) return full;
      const target = MAP[n];
      if (!target) return full;
      changed++;
      return `${prefix}${target}${unit}`;
    },
  );

  // min-width 必須連動：min-width:651px 配 max-width:650px 只差 1px，
  // 若只把 max 映射到 768 而 min 留在 651，651–768 區間兩個條件都不成立。
  // min-width:N 的語意等同 max-width:(N-1)，故查 MAP[N-1] 再 +1。
  out = out.replace(
    /(@media[^{]{0,120}?min-width:\s*)(\d+)(px)/g,
    (full, prefix, num, unit) => {
      const n = Number(num);
      const target = MAP[n - 1];
      if (!target) return full;
      minChanged++;
      minChanges.push(`${file}: min-width:${n}px → ${target + 1}px`);
      return `${prefix}${target + 1}${unit}`;
    },
  );

  if (changed > 0 || minChanged > 0) {
    totalChanged += changed + minChanged;
    perFile.push({ file, changed: changed + minChanged });
    if (!DRY) await writeFile(file, out, "utf8");
  }
}

console.log(DRY ? "[DRY] 將變更：" : "已套用：");
for (const p of perFile) console.log(`  ${String(p.changed).padStart(3)}  ${p.file}`);
console.log(`\n合計替換 ${totalChanged} 處 / ${perFile.length} 個檔案`);
console.log(`目標斷點：640 / 768 / 1024 / 1280`);
if (minChanges.length) {
  console.log(`\nmin-width 連動調整（避免與 max-width 脫節）：`);
  for (const m of minChanges) console.log(`  ${m}`);
}
