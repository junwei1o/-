// 對比度閘門：驗證語義色階 token 的 WCAG 2.1 對比度
// 用法: node scripts/contrast-check.mjs [--strict]
//   退出碼 0 = 全數通過；1 = 有項目不達標
//
// 檢查項目（見 docs/color-tokens.md §4.2/§4.3）：
//   1.  預設主題下 §4.2 的配對組合
//   1a. 語義色階文字 token × 四主題（2026-10-04 新增；修正實際用到的組合）
//   1b. focus ring 雙層環 × 四主題
//   1d. 原始 base token 被當文字色用（**警示，不計入失敗**）
//   2.  四個主題下每個類別的 600 檔白字 ≥ 4.5（§4.3）
//   3.  圖形元素用的 500 檔對 neutral-100 ≥ 3.0
//
// ⚠️ 界線：本腳本驗的是「**色階本身站得住**」，不是「CSS 有沒有真的用它」——
// 使用層的守門員是 axe 巡檢（scripts/axe-nightly），它才看得到實際渲染結果。
//
// 本腳本不動 CSS，只讀與驗算，可安全接在 CI。
import { readFile, readdir } from "node:fs/promises";

const STRICT = process.argv.includes("--strict");

/* ─── 色彩數學 ─── */
const s2l = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const l2s = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const hex2rgb = (h) => {
  const s = h.replace("#", "");
  const f = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const rgb2hex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();

function relLuminance([r, g, b]) {
  return 0.2126 * s2l(r) + 0.7152 * s2l(g) + 0.0722 * s2l(b);
}
function contrast(a, b) {
  const la = relLuminance(a), lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function rgb2oklch([r, g, b]) {
  const R = s2l(r), G = s2l(g), B = s2l(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(a, bb), H: (Math.atan2(bb, a) * 180) / Math.PI / 180 * 180 % 360 };
}
function rawLin(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180), bb = C * Math.sin((H * Math.PI) / 180);
  let l = L + 0.3963377774 * a + 0.2158037573 * bb;
  let m = L - 0.1055613458 * a - 0.0638541728 * bb;
  let s = L - 0.0894841775 * a - 1.2914855480 * bb;
  l **= 3; m **= 3; s **= 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
/** 模擬 color-mix(in oklch, base, black pct%)，含 gamut 壓縮 */
function mixBlack(baseRgb, pct) {
  const { L, C, H } = rgb2oklch(baseRgb);
  const k = 1 - pct / 100;
  let lo = 0, hi = Math.min(C * k, 0.37);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const rgb = rawLin(L * k, mid, H);
    if (rgb.every((c) => c >= -0.001 && c <= 1.001)) lo = mid; else hi = mid;
  }
  const lin = rawLin(L * k, lo, H);
  return lin.map((c) => Math.max(0, Math.min(1, l2s(Math.max(0, Math.min(1, c))))) * 255);
}
/** 模擬 color-mix(in srgb, base pct%, white) */
function mixWhite(baseRgb, pct) {
  const t = pct / 100;
  return baseRgb.map((c) => c * t + 255 * (1 - t));
}

/* ─── 設定（與 docs/color-tokens.md 對應，改動請同步）─── */
const WHITE = [255, 255, 255];
const INK = hex2rgb("16303A");
const PAPER = hex2rgb("EAF1F2");

/** 各類別在四主題下的基色（index.css 各 :root 的 --tidal / --moss / --yellow / --coral-deep / --coral） */
const CATEGORIES = {
  primary: { base: "#0B6E8E", themes: ["#0B6E8E", "#0B6E8E", "#4F6B52", "#D0932B"], black: { 600: 30, 700: 40, 800: 50, 900: 60 }, whiteMix: { 50: 6, 100: 15, 200: 30, 300: 50, 400: 72 } },
  success: { base: "#5E8577", themes: ["#5E8577", "#6C8460", "#6C8460", "#7A9058"], black: { 600: 22, 700: 32, 800: 42, 900: 52 }, whiteMix: { 50: 6, 100: 15, 200: 30, 300: 50, 400: 72 } },
  warning: { base: "#E3B54C", themes: ["#E3B54C", "#E8B84B", "#C99A3D", "#F0C14B"], black: { 600: 40, 700: 50, 800: 60, 900: 70 }, whiteMix: { 50: 6, 100: 15, 200: 30, 300: 50, 400: 72 } },
  danger:  { base: "#C25B36", themes: ["#C25B36", "#C25B36", "#934F2F", "#C25B36"], black: { 600: 14, 700: 24, 800: 34, 900: 44 }, whiteMix: { 50: 6, 100: 15, 200: 30, 300: 50, 400: 72 } },
  accent:  { base: "#E8754A", themes: ["#E8754A", "#E8754A", "#B0623A", "#E8754A"], black: { 600: 26, 700: 36, 800: 46, 900: 56 }, whiteMix: { 50: 6, 100: 15, 200: 30, 300: 50, 400: 72 } },
};
const THEME_NAMES = ["default", "festival", "exlibris", "sunny"];

/** §4.2 必須通過的配對組合 */
const PAIRS = [
  { label: "正文  neutral-900 / paper", fg: INK, bg: PAPER, min: 4.5 },
  { label: "次要  neutral-600 / paper", fg: hex2rgb("587079"), bg: PAPER, min: 4.5 },
  { label: "次標題 neutral-700 / paper", fg: hex2rgb("37505A"), bg: PAPER, min: 7 },
  { label: "實體  white / primary-600", fg: WHITE, bg: mixBlack(hex2rgb("#0B6E8E"), 30), min: 4.5 },
  { label: "成功  white / success-600", fg: WHITE, bg: mixBlack(hex2rgb("#5E8577"), 22), min: 4.5 },
  { label: "錯誤  white / danger-600",  fg: WHITE, bg: mixBlack(hex2rgb("#C25B36"), 14), min: 4.5 },
  { label: "CTA   white / accent-600",  fg: WHITE, bg: mixBlack(hex2rgb("#E8754A"), 26), min: 4.5 },
  { label: "警告亮 neutral-900 / warning-500", fg: INK, bg: hex2rgb("#E3B54C"), min: 4.5 },
  { label: "警告深 white / warning-600", fg: WHITE, bg: mixBlack(hex2rgb("#E3B54C"), 40), min: 4.5 },
  { label: "圖形  primary-500 / paper",  fg: hex2rgb("#0B6E8E"), bg: PAPER, min: 3 },
  { label: "圖形  success-500 / paper",  fg: hex2rgb("#5E8577"), bg: PAPER, min: 3 },
  { label: "圖形  danger-500 / paper",   fg: hex2rgb("#C25B36"), bg: PAPER, min: 3 },
  { label: "圖形  neutral-500 / paper",  fg: hex2rgb("#718690"), bg: PAPER, min: 3 },
];

/**
 * §4.2 focus ring（雙層環）：
 *   outline: var(--focus-ring)          → 外環，色 = 該主題的 --ink
 *   box-shadow: 0 0 0 2px var(--focus-ring-inner) → 內環，色 = 該主題的 --yellow
 *
 * 判準：對每一種相鄰背景，「兩環取較大者 ≥ 3:1」——因為雙環相鄰且對比懸殊，
 * 任一底色下至少有一環可辨（單環在所有情境都達標是不可能的，這正是雙環存在的理由）。
 *
 * ⚠️ 四個主題各有自己的 --ink / --yellow / --paper，因此**每個主題都要單獨重算**；
 * 只測 default 主題會漏掉 exlibris（黃較暗 2.18）與 sunny（黃最亮 1.56）的退化。
 */
const THEMES_RING = [
  { name: "default",  paper: "#EAF1F2", ink: "#16303A", yellow: "#E3B54C", tidal: "#0B6E8E", moss: "#5E8577" },
  { name: "festival", paper: "#F9F3E8", ink: "#1F3031", yellow: "#E8B84B", tidal: "#0B6E8E", moss: "#6C8460" },
  { name: "exlibris", paper: "#F1ECDD", ink: "#3A3326", yellow: "#C99A3D", tidal: "#4F6B52", moss: "#6C8460" },
  { name: "sunny",    paper: "#FBF6E7", ink: "#3A2E1B", yellow: "#F0C14B", tidal: "#D0932B", moss: "#7A9058" },
];

/** 每個主題的相鄰背景：紙底、純白卡面、深色主按鈕、深色成功按鈕 */
const ringBackgrounds = (t) => [
  ["paper 底", hex2rgb(t.paper)],
  ["white 卡面", WHITE],
  ["primary-600 按鈕", mixBlack(hex2rgb(t.tidal), 30)],
  ["success-600 按鈕", mixBlack(hex2rgb(t.moss), 22)],
];

let failures = [];
let checks = 0;

const check = (label, value, min, note = "") => {
  checks++;
  const ok = value >= min;
  if (!ok) failures.push({ label, value, min, note });
  const mark = ok ? "✓" : "✗";
  console.log(`  ${mark} ${label.padEnd(42)} ${value.toFixed(2)}:1 (需 ≥${min})${note}`);
  return ok;
};

console.log("═══ 檢查 1：預設主題配對組合（§4.2）═══");
for (const p of PAIRS) check(p.label, contrast(p.fg, p.bg), p.min);

console.log("\n═══ 檢查 1a：語義色階文字 token × 四主題（2026-10-04 新增）═══");
/*
 * 為什麼要加這一組：原本只驗「token 層的 §4.2 配對」，驗不到實際發生的錯誤——
 * 把 `*-500` 或原始 base token 當一般文字用。axe 巡檢因此在全站抓到 317 個
 * color-contrast 節點（見 docs/color-contrast-migration.md）。
 *
 * 這組就是 2026-10-04 修正實際用到的組合，且**逐主題重算**：
 * 色階是執行期由各主題基色派生的，只驗 default 會漏掉其他三個主題的退化。
 * 門檻一律 4.5（一般文字），因為這些都是 <18.66px 粗體的小字。
 */
const THEME_SURFACES = [
  { name: "default",  paper: "#EAF1F2", white: "#FCFEFE", muted: "#587079" },
  { name: "festival", paper: "#F9F3E8", white: "#FFFDF8", muted: "#5F6E6A" },
  { name: "exlibris", paper: "#F1ECDD", white: "#FBF7EC", muted: "#6B6350" },
  { name: "sunny",    paper: "#FBF6E7", white: "#FFFDF6", muted: "#7A6B4E" },
];
/** index.css 的 --color-neutral-700 是固定值（不隨主題派生） */
const NEUTRAL_700 = hex2rgb("37505A");

for (const s of THEME_SURFACES) {
  const i = THEME_NAMES.indexOf(s.name);
  const paper = hex2rgb(s.paper);
  const white = hex2rgb(s.white);
  const token = (cat, step) => mixBlack(hex2rgb(CATEGORIES[cat].themes[i]), CATEGORIES[cat].black[step]);
  const cases = [
    ["neutral-600（--muted）/ paper", hex2rgb(s.muted), paper],
    ["neutral-700 / paper", NEUTRAL_700, paper],
    ["success-600 / paper", token("success", 600), paper],
    ["success-600 / white", token("success", 600), white],
    ["warning-600 / paper", token("warning", 600), paper],
    ["danger-600 / paper", token("danger", 600), paper],
    ["accent-600 / paper", token("accent", 600), paper],
    ["accent-600 / white", token("accent", 600), white],
    ["primary-600 / paper", token("primary", 600), paper],
  ];
  for (const [label, fg, bg] of cases) check(`[${s.name}] ${label}`, contrast(fg, bg), 4.5);
}

console.log("\n═══ 檢查 1d：原始 base token 被當文字色用（警示，不計入失敗）═══");
/*
 * 「把 *-500／原始 base token 當一般文字」是 2026-10-04 那批違規的根因
 * （axe 巡檢在全站抓到 317 個 color-contrast 節點）。這道掃描補上 axe 的盲區：
 * 未涵蓋的路由、收合的區塊、以及還沒跑到巡檢的新程式碼。
 *
 * 只警示、不計入失敗：在**深色底**上使用它們是合法的，而靜態掃描看不到底色，
 * 硬性失敗會誤判。真正的判準仍是 axe 巡檢（scripts/axe-nightly）。
 */
/**
 * 真正**不能當一般文字**的原始 token（各主題底紙上實測都 <4.5）：
 *   --moss（success-500）3.60／--yellow（warning-500）1.91／
 *   --coral（accent-500）2.60／--coral-deep（danger-500）3.79／--bx-gold 2.0
 *
 * ⚠️ `--tidal`（primary-500）**不在名單內**：它對底紙 5.05 是達標的，
 * 列進來只會製造雜訊。
 */
const RAW_AS_TEXT = ["--yellow", "--moss", "--coral", "--coral-deep", "--bx-gold"];
async function walkCss(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist") continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) await walkCss(p, out);
    else if (e.name.endsWith(".css")) out.push(p);
  }
  return out;
}
const suspects = [];
for (const f of await walkCss("client/src")) {
  const lines = (await readFile(f, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const tok of RAW_AS_TEXT) {
      if (new RegExp(`(^|[;{\\s])color\\s*:\\s*var\\(${tok}\\)`).test(line)) suspects.push(`${f}:${i + 1}  color: var(${tok})`);
    }
  });
}
if (suspects.length) {
  console.log(`  ⚠ ${suspects.length} 處把原始 base token 當文字色（需人工確認該處底色深淺）：`);
  suspects.slice(0, 25).forEach((s) => console.log(`      ${s}`));
  if (suspects.length > 25) console.log(`      …另有 ${suspects.length - 25} 處`);
} else {
  console.log("  ✓ 未發現「color: var(--原始 base token)」的寫法");
}

console.log("\n═══ 檢查 1b：focus ring 雙層環 × 四主題 × 四種相鄰背景（§4.2）═══");
for (const t of THEMES_RING) {
  const outerRing = hex2rgb(t.ink);   // --focus-ring 外環 = 該主題 --ink
  // --focus-ring-inner = color-mix(in srgb, var(--yellow) 60%, var(--white))
  // 提亮 40% 是必需的：exlibris 的暗金 #C99A3D 直接對深綠 success-600 只有 2.77。
  const innerRing = mixWhite(hex2rgb(t.yellow), 60);
  for (const [bgName, bg] of ringBackgrounds(t)) {
    const outer = contrast(outerRing, bg);
    const inner = contrast(innerRing, bg);
    const best = Math.max(outer, inner);
    check(
      `focus @ ${t.name} / ${bgName}`,
      best, 3,
      `  外環ink ${outer.toFixed(2)} / 內環yellow ${inner.toFixed(2)}`,
    );
  }
}

console.log("\n═══ 檢查 2：四主題 × 600 檔白字（§4.3）═══");
for (const [cat, cfg] of Object.entries(CATEGORIES)) {
  const row = [];
  for (let i = 0; i < 4; i++) {
    const bg = mixBlack(hex2rgb(cfg.themes[i]), cfg.black[600]);
    const v = contrast(WHITE, bg);
    row.push(v);
  }
  const label = `${cat}-600 白字`;
  check(label, Math.min(...row), 4.5,
    `  [${row.map((v, i) => `${THEME_NAMES[i]} ${v.toFixed(1)}`).join(", ")}]`);
}

console.log("\n═══ 檢查 3：圖形 500 檔對 neutral-100 ≥3:1（§4.2）═══");
for (const [cat, cfg] of Object.entries(CATEGORIES)) {
  const v = contrast(hex2rgb(cfg.base), PAPER);
  // warning-500 與 accent-500 天生不足 3:1，規範已載明僅作背景，不列入圖形
  if (cat === "warning" || cat === "accent") {
    console.log(`  – ${cat}-500 / paper  ${v.toFixed(2)}:1  （規範：僅作背景，不當圖形）`);
    continue;
  }
  check(`${cat}-500 / paper`, v, 3);
}

console.log("\n═══ 檢查 4：900 檔 AAA（白字 ≥7:1）═══");
for (const [cat, cfg] of Object.entries(CATEGORIES)) {
  const bg = mixBlack(hex2rgb(cfg.base), cfg.black[900]);
  check(`${cat}-900 白字`, contrast(WHITE, bg), 7);
}

console.log(`\n═══ 結果 ═══`);
console.log(`  檢查項目 ${checks} 項，失敗 ${failures.length} 項`);
if (failures.length) {
  console.log("\n  失敗清單：");
  for (const f of failures) console.log(`    ✗ ${f.label}  ${f.value.toFixed(2)} < ${f.min}${f.note ? "  " + f.note : ""}`);
  console.log("\n  修復後請重新驗算 docs/color-tokens.md 對應表格。");
  process.exit(1);
}
console.log("  全數通過 ✓");
process.exit(0);
