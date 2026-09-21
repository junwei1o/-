/**
 * 國中數學 12 堂（junior-math-add.ts）
 *
 * 課程表來自 docs/onion-200-plan.md →「數學 12 堂」（id: jh-math-*）。
 * 每堂課 7 幀分鏡（步驟標籤、字幕、action、prop、duration，至少 2 幀有 ask）
 * ＋ 5 題闖關（含 2 級提示與詳解）＋ 3 條 takeaways。
 * 圖解依各課核心概念選用 numberLine（負數與不等式）、flow（程序與樹狀圖）、
 * text（公式與口訣）、bars（統計與根號估算）、shape（幾何）、balance（天平移項）。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ===================== 1. 七上 — 整數的四則運算 ===================== */
const JH_MATH_INTEGER_OPS: OnionLesson = {
  id: "jh-math-integer-ops",
  title: "整數的四則運算：負數怎麼算？",
  subject: "數學",
  topic: "整數四則運算",
  grade: "七上",
  stages: ["國中"],
  desc: "負數加減乘除與括號一次搞懂：數線走路想運算，負負得正不再怕。",
  takeaways: [
    "負數加法＝數線往右走、減法往左走",
    "負負得正、一正一負相乘得負",
    "有括號先算括號裡面的部分",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識正負整數", caption: "嗨！整數除了 1、2、3，還有 −1、−2、−3 這些負數喔。", action: "wave", prop: { kind: "numberLine", from: -5, to: 5, marks: [{ at: -3, label: "−3" }, { at: -2, label: "−2" }, { at: -1, label: "−1" }, { at: 0, label: "0" }] }, duration: 3200 },
    { id: 2, step: "步驟 2：負數加法想數線", caption: "負數加法像在數線走路：−2 ＋ 3 是從 −2 往右走 3 格到 1。", action: "walk", prop: { kind: "numberLine", from: -5, to: 5, marks: [{ at: -2, label: "起點" }, { at: 1, label: "終點" }], cursor: 1 }, duration: 3600 },
    { id: 3, step: "步驟 3：減法也是往左走", caption: "減法往左走：−1 − 4 是從 −1 往左 4 格，最後停在 −5。", action: "walk", prop: { kind: "numberLine", from: -5, to: 5, marks: [{ at: -1, label: "起點" }, { at: -5, label: "終點" }], cursor: -5 }, duration: 3600 },
    { id: 4, step: "步驟 4：試算負數加法", caption: "來試試看：−3 ＋ 5 會停在數線上的哪裡呢？", action: "think", prop: { kind: "numberLine", from: -5, to: 5, marks: [{ at: -3, label: "起點" }, { at: 2, label: "終點" }], cursor: 2 }, duration: 3600, ask: { prompt: "−3 ＋ 5 ＝ ？", options: ["2", "−2", "8", "−8"], answer: 0, hint: "從 −3 往右走 5 格：−3 ＋ 5 ＝ 2。" } },
    { id: 5, step: "步驟 5：正負相乘看符號", caption: "乘法抓符號：正×正得正、負×負得正、一正一負得負。", action: "point", prop: { kind: "text", text: "正×正＝正\n負×負＝正\n正×負＝負", sub: "符號先看、再算數字", tone: "ok" }, duration: 3600 },
    { id: 6, step: "步驟 6：試算負數乘法", caption: "負負得正：−4 × −3 應該等於多少呢？", action: "think", prop: { kind: "text", text: "−4 × −3 ＝ ？", sub: "負×負＝正", tone: "ok" }, duration: 3600, ask: { prompt: "−4 × −3 ＝ ？", options: ["12", "−12", "7", "−7"], answer: 0, hint: "負負得正，4 × 3 ＝ 12，所以答案是 ＋12。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：數線右加左減；負負得正、異號得負。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-integer-ops-1", prompt: "−3 ＋ 5 ＝ ？", options: ["2", "−8", "8", "−2"], answer: 0, hints: ["負數加法往數線右邊走", "從 −3 往右 5 格到 2"], explanation: "−3 ＋ 5 ＝ 2：從 −3 往右數 5 格，停在 2。" },
    { id: "jh-math-integer-ops-2", prompt: "−4 × −3 ＝ ？", options: ["12", "−12", "−1", "7"], answer: 0, hints: ["先看符號：負×負得正", "再算 4 × 3 ＝ 12"], explanation: "負負得正，4 × 3 ＝ 12，所以 −4 × −3 ＝ 12。" },
    { id: "jh-math-integer-ops-3", prompt: "7 − 10 ＝ ？", options: ["−3", "3", "17", "−17"], answer: 0, hints: ["減法想成往左走", "7 往左 10 格到 −3"], explanation: "7 − 10 ＝ −3：從 7 往左數 10 格，停在 −3。" },
    { id: "jh-math-integer-ops-4", prompt: "(−2) × 6 ＝ ？", options: ["−12", "12", "4", "−4"], answer: 0, hints: ["一正一負相乘得負", "2 × 6 ＝ 12，再加負號"], explanation: "一正一負相乘得負，2 × 6 ＝ 12，所以 (−2) × 6 ＝ −12。" },
    { id: "jh-math-integer-ops-5", prompt: "先算括號：−3 × (2 − 5) ＝ ？", options: ["9", "−9", "3", "−3"], answer: 0, hints: ["先算括號內：2 − 5 ＝ −3", "再算 −3 × (−3)，負負得正"], explanation: "括號內 2 − 5 ＝ −3，再算 −3 × (−3) ＝ 9（負負得正）。" },
  ],
};

/* ===================== 2. 七上 — 分數的四則運算 ===================== */
const JH_MATH_FRACTION_OPS: OnionLesson = {
  id: "jh-math-fraction-ops",
  title: "分數的四則運算：通分與約分",
  subject: "數學",
  topic: "分數四則運算",
  grade: "七上",
  stages: ["國中"],
  desc: "分數通分、約分與乘除，用切披薩的方式看懂，分數四則從此不卡關。",
  takeaways: [
    "同分母相加：分母不變、分子相加",
    "異分母相加：先通分再算",
    "分數乘法上下各乘、最後約分",
  ],
  frames: [
    { id: 1, step: "步驟 1：分數的意義", caption: "分數是分成幾份拿幾份：二分之一就是一個東西切成 2 等份拿 1 份。", action: "wave", prop: { kind: "pie", a: 1, b: 2 }, duration: 3200 },
    { id: 2, step: "步驟 2：同分母先加分子", caption: "同分母分數相加最簡單：分母不變，只要把分子相加就好。", action: "point", prop: { kind: "pies", left: { a: 1, b: 4 }, right: { a: 2, b: 4 }, result: { a: 3, b: 4 } }, duration: 3600 },
    { id: 3, step: "步驟 3：不同分母先通分", caption: "分母不同要先通分：二分之一加三分之一，都變成六等分再相加。", action: "think", prop: { kind: "flow", steps: ["找 2 和 3 的公倍數 6", "1/2 化為 3/6", "1/3 化為 2/6", "3/6 ＋ 2/6 ＝ 5/6"], active: 3 }, duration: 3800 },
    { id: 4, step: "步驟 4：試算通分加法", caption: "動動腦：三分之一加二分之一，通分成六等分後是多少？", action: "think", prop: { kind: "pies", left: { a: 1, b: 3 }, right: { a: 1, b: 2 }, result: { a: 5, b: 6 } }, duration: 3600, ask: { prompt: "1/3 ＋ 1/2 ＝ ？（先通分）", options: ["5/6", "1/6", "2/5", "5/12"], answer: 0, hint: "通分到 6：1/3 ＝ 2/6，1/2 ＝ 3/6，2/6 ＋ 3/6 ＝ 5/6。" } },
    { id: 5, step: "步驟 5：乘法直接交錯乘", caption: "分數乘法最輕鬆：分子乘分子、分母乘分母，最後再約分。", action: "point", prop: { kind: "text", text: "½ × ⅓ ＝ (1×1)/(2×3) ＝ ⅙", sub: "上下各乘、再約分", tone: "ok" }, duration: 3600 },
    { id: 6, step: "步驟 6：試算分數乘法", caption: "分數乘法來挑戰：二分之一乘三分之二等於多少？", action: "think", prop: { kind: "text", text: "½ × ⅔ ＝ ？", sub: "分子×分子、分母×分母", tone: "ok" }, duration: 3600, ask: { prompt: "1/2 × 2/3 ＝ ？", options: ["1/3", "1/6", "2/5", "3/4"], answer: 0, hint: "分子 1×2 ＝ 2，分母 2×3 ＝ 6，得 2/6 約分成 1/3。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：同分母加分子、異分母先通分；乘法上下各乘、再約分。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-fraction-ops-1", prompt: "1/4 ＋ 2/4 ＝ ？", options: ["3/4", "3/8", "1/3", "5/4"], answer: 0, hints: ["分母相同，分母保持不變", "分子 1 ＋ 2 ＝ 3"], explanation: "同分母相加：分母 4 不變，分子 1 ＋ 2 ＝ 3，答案是 3/4。" },
    { id: "jh-math-fraction-ops-2", prompt: "1/2 × 1/3 ＝ ？", options: ["1/6", "1/5", "2/5", "1/3"], answer: 0, hints: ["分子乘分子、分母乘分母", "1×1 ＝ 1，2×3 ＝ 6"], explanation: "分數乘法：分子 1×1 ＝ 1，分母 2×3 ＝ 6，答案是 1/6。" },
    { id: "jh-math-fraction-ops-3", prompt: "1/3 ＋ 1/2 ＝ ？", options: ["5/6", "1/6", "2/5", "5/12"], answer: 0, hints: ["先通分到 6", "1/3 ＝ 2/6，1/2 ＝ 3/6"], explanation: "通分到 6：1/3 ＝ 2/6，1/2 ＝ 3/6，2/6 ＋ 3/6 ＝ 5/6。" },
    { id: "jh-math-fraction-ops-4", prompt: "3/4 × 2/3 ＝ ？", options: ["1/2", "1/4", "5/12", "6/7"], answer: 0, hints: ["分子 3×2 ＝ 6，分母 4×3 ＝ 12", "6/12 約分後是 1/2"], explanation: "3/4 × 2/3 ＝ (3×2)/(4×3) ＝ 6/12 ＝ 1/2（約分）。" },
    { id: "jh-math-fraction-ops-5", prompt: "2/3 ÷ 1/6 ＝ ？", options: ["4", "2/18", "2/9", "1/4"], answer: 0, hints: ["除以分數＝乘它的倒數", "2/3 × 6/1 ＝ 12/3 ＝ 4"], explanation: "除以分數等於乘其倒數：2/3 ÷ 1/6 ＝ 2/3 × 6/1 ＝ 12/3 ＝ 4。" },
  ],
};

/* ===================== 3. 七下 — 一元一次不等式 ===================== */
const JH_MATH_INEQUALITY: OnionLesson = {
  id: "jh-math-inequality",
  title: "一元一次不等式：乘除負數要變號",
  subject: "數學",
  topic: "一元一次不等式",
  grade: "七下",
  stages: ["國中"],
  desc: "一元一次不等式：移項、乘除負數變號，把大於小於畫在數線上。",
  takeaways: [
    "不等式移項和方程式一樣要變號",
    "兩邊同乘或同除負數，方向要反轉",
    "解畫在數線上是一整段區間",
  ],
  frames: [
    { id: 1, step: "步驟 1：什麼是不等式", caption: "不等式用 ＜、＞、≦、≧ 表示大小關係，不像方程式用等號。", action: "wave", prop: { kind: "text", text: "＜ 小於\n＞ 大於\n≦ 小於等於\n≧ 大於等於", sub: "比較大小的符號", tone: "ok" }, duration: 3200 },
    { id: 2, step: "步驟 2：用天平想不等式", caption: "把不等式想成天平：左邊 x 比右邊 5 輕，就是 x ＜ 5 的感覺。", action: "point", prop: { kind: "balance", left: "x", right: "5", tip: "左輕右重 → x ＜ 5" }, duration: 3400 },
    { id: 3, step: "步驟 3：移項先搬常數", caption: "解 x ＋ 3 ＜ 8：把 ＋3 移到右邊變 −3，得到 x ＜ 5。", action: "think", prop: { kind: "balance", left: "x", right: "5", tip: "兩邊同減 3" }, duration: 3600 },
    { id: 4, step: "步驟 4：試算移項", caption: "來試試：x − 2 ＞ 4，把 −2 移到右邊變 ＋2，x ＞ 6 對嗎？", action: "think", prop: { kind: "balance", left: "x", right: "4＋2", tip: "−2 移到右邊變 ＋2" }, duration: 3600, ask: { prompt: "x − 2 ＞ 4，移項後 x ＞ ？", options: ["6", "2", "4", "8"], answer: 0, hint: "−2 移到右邊變 ＋2：4 ＋ 2 ＝ 6，所以 x ＞ 6。" } },
    { id: 5, step: "步驟 5：乘除負數要變號", caption: "關鍵！不等式兩邊同乘或同除負數時，大於小於要反過來。", action: "point", prop: { kind: "text", text: "−2x ＜ 6\n同除 −2\nx ＞ −3（變號！）", sub: "乘或除負數就翻轉", tone: "warn" }, duration: 3800 },
    { id: 6, step: "步驟 6：試算變號", caption: "小心變號：−3x ≦ 9，兩邊同除 −3 後，x 和多少比大小？", action: "think", prop: { kind: "balance", left: "x", right: "−3", tip: "同除負數，≦ 變 ≧" }, duration: 3800, ask: { prompt: "−3x ≦ 9，兩邊同除 −3，得到 x ？", options: ["x ≧ −3", "x ≦ −3", "x ＝ 3", "x ≧ 3"], answer: 0, hint: "同除負數方向反轉：9 ÷ (−3) ＝ −3，≦ 變 ≧，所以 x ≧ −3。" } },
    { id: 7, step: "步驟 7：畫在數線上", caption: "最後把答案畫在數線：x ＞ −3 就是 −3 右邊那一整段（不含 −3）。", action: "point", prop: { kind: "numberLine", from: -6, to: 2, marks: [{ at: -3, label: "空心圈", tone: "warn" }], cursor: -3 }, duration: 3600 },
  ],
  questions: [
    { id: "jh-math-inequality-1", prompt: "x ＋ 3 ＜ 8，x ？", options: ["x ＜ 5", "x ＞ 5", "x ＜ 11", "x ＝ 5"], answer: 0, hints: ["把 ＋3 移項到右邊變 −3", "8 − 3 ＝ 5"], explanation: "移項：＋3 變 −3，x ＜ 8 − 3，所以 x ＜ 5。" },
    { id: "jh-math-inequality-2", prompt: "x − 2 ＞ 4，x ？", options: ["x ＞ 6", "x ＜ 6", "x ＞ 2", "x ＝ 6"], answer: 0, hints: ["−2 移過去變 ＋2", "4 ＋ 2 ＝ 6"], explanation: "−2 移到右邊變 ＋2：x ＞ 4 ＋ 2，所以 x ＞ 6。" },
    { id: "jh-math-inequality-3", prompt: "−2x ＜ 6，x ？", options: ["x ＞ −3", "x ＜ −3", "x ＜ 3", "x ＝ −3"], answer: 0, hints: ["兩邊同除 −2，要變號", "6 ÷ (−2) ＝ −3，＜ 變 ＞"], explanation: "兩邊同除負數 −2：6 ÷ (−2) ＝ −3，方向反轉，x ＞ −3。" },
    { id: "jh-math-inequality-4", prompt: "3x − 1 ≦ 8，x ？", options: ["x ≦ 3", "x ≧ 3", "x ≦ 9", "x ＞ 3"], answer: 0, hints: ["先移項：−1 變 ＋1", "3x ≦ 9，再除 3"], explanation: "移項：3x ≦ 8 ＋ 1 ＝ 9；再除 3：x ≦ 3。" },
    { id: "jh-math-inequality-5", prompt: "−4x ＋ 5 ＞ 1，x ？", options: ["x ＜ 1", "x ＞ 1", "x ＜ −1", "x ＞ −1"], answer: 0, hints: ["先移項：5 變 −5", "−4x ＞ −4，同除 −4 要變號"], explanation: "移項：−4x ＞ 1 − 5 ＝ −4；同除負數 −4，方向反轉：x ＜ 1。" },
  ],
};

/* ===================== 4. 八上 — 平方根與根號化簡 ===================== */
const JH_MATH_SQUARE_ROOT: OnionLesson = {
  id: "jh-math-square-root",
  title: "平方根與根號化簡：√ 是什麼？",
  subject: "數學",
  topic: "平方根與根號化簡",
  grade: "八上",
  stages: ["國中"],
  desc: "平方根的意義、根號化簡與估算範圍，√ 不再是神祕符號。",
  takeaways: [
    "√a 是平方後等於 a 的非負數",
    "估算：把 a 夾在相鄰完全平方數之間",
    "化簡：先把完全平方因數提出根號",
  ],
  frames: [
    { id: 1, step: "步驟 1：平方根的意義", caption: "√a 是『哪個數平方後等於 a』：√9 ＝ 3，因為 3 平方是 9。", action: "wave", prop: { kind: "text", text: "√9 ＝ 3（3²＝9）\n√16 ＝ 4（4²＝16）", sub: "平方的相反操作", tone: "ok" }, duration: 3200 },
    { id: 2, step: "步驟 2：平方還原確認", caption: "想清楚：2 的平方是 4，所以 √4 ＝ 2；5 的平方是 25，√25 ＝ 5。", action: "point", prop: { kind: "text", text: "2²＝4 → √4＝2\n5²＝25 → √25＝5", sub: "平方與開根互為相反", tone: "ok" }, duration: 3400 },
    { id: 3, step: "步驟 3：估算在兩整數間", caption: "不完美平方怎麼估？√10 在 3 和 4 之間，因為 9＜10＜16。", action: "think", prop: { kind: "bars", items: [{ label: "3²=9", value: 9 }, { label: "√10", value: 10 }, { label: "4²=16", value: 16 }], active: 1 }, duration: 3600 },
    { id: 4, step: "步驟 4：試算估算範圍", caption: "動動腦：因為 16＜20＜25，√20 會落在哪兩個整數之間呢？", action: "think", prop: { kind: "bars", items: [{ label: "4²=16", value: 16 }, { label: "√20", value: 20 }, { label: "5²=25", value: 25 }], active: 1 }, duration: 3600, ask: { prompt: "√20 介於哪兩個整數之間？", options: ["4 和 5", "3 和 4", "5 和 6", "2 和 3"], answer: 0, hint: "16＜20＜25，開根後 4＜√20＜5，所以在 4 和 5 之間。" } },
    { id: 5, step: "步驟 5：根號化簡提因式", caption: "會化簡：√(4×9) ＝ √4 × √9 ＝ 2 × 3 ＝ 6。", action: "point", prop: { kind: "text", text: "√(4×9) ＝ √4 × √9 ＝ 2×3 ＝ 6", sub: "相乘可拆成分開開根", tone: "ok" }, duration: 3600 },
    { id: 6, step: "步驟 6：試算化簡", caption: "化簡挑戰：√50 可以提出哪個完全平方數來化簡呢？", action: "think", prop: { kind: "text", text: "√50 ＝ √(25 × 2)", sub: "25 是完全平方數", tone: "ok" }, duration: 3600, ask: { prompt: "√50 化簡後是下列哪一個？", options: ["5√2", "2√5", "25√2", "√5"], answer: 0, hint: "50 ＝ 25 × 2，√25 ＝ 5，提出來變 5√2。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：√a 是平方還原；估算夾在相鄰整數間；完全平方數先提出來。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-square-root-1", prompt: "√9 是幾的平方？", options: ["3", "9", "81", "±3"], answer: 0, hints: ["想哪個數平方等於 9", "3 × 3 ＝ 9"], explanation: "平方根取非負值：3² ＝ 9，所以 √9 ＝ 3。" },
    { id: "jh-math-square-root-2", prompt: "√25 是幾的平方？", options: ["5", "25", "±5", "2.5"], answer: 0, hints: ["想哪個數平方等於 25", "5 × 5 ＝ 25"], explanation: "5² ＝ 25，所以 √25 ＝ 5（取非負值）。" },
    { id: "jh-math-square-root-3", prompt: "√20 介於哪兩個連續整數之間？", options: ["4 和 5", "3 和 4", "5 和 6", "2 和 3"], answer: 0, hints: ["找夾住 20 的完全平方數", "16＜20＜25"], explanation: "因為 16＜20＜25，開根後 4＜√20＜5，介於 4 和 5 之間。" },
    { id: "jh-math-square-root-4", prompt: "√50 化簡後等於？", options: ["5√2", "2√5", "√10", "10"], answer: 0, hints: ["把 50 拆成 25 × 2", "√25 ＝ 5 提出來"], explanation: "√50 ＝ √(25×2) ＝ √25 × √2 ＝ 5√2。" },
    { id: "jh-math-square-root-5", prompt: "√8 化簡後等於？", options: ["2√2", "4√2", "√4", "8"], answer: 0, hints: ["8 ＝ 4 × 2", "√4 ＝ 2 提出來"], explanation: "√8 ＝ √(4×2) ＝ √4 × √2 ＝ 2√2。" },
  ],
};

/* ===================== 5. 八上 — 乘法公式與多項式 ===================== */
const JH_MATH_POLY_FORMULA: OnionLesson = {
  id: "jh-math-poly-formula",
  title: "乘法公式：完全平方與平方差",
  subject: "數學",
  topic: "乘法公式與多項式",
  grade: "八上",
  stages: ["國中"],
  desc: "完全平方公式與平方差公式，展開因式一看就懂，多項式運算好上手。",
  takeaways: [
    "(a＋b)² ＝ a²＋2ab＋b²（三項）",
    "(a−b)(a＋b) ＝ a²−b²（平方差）",
    "套公式比一項項硬乘更快更準",
  ],
  frames: [
    { id: 1, step: "步驟 1：完全平方公式長相", caption: "配方第一式：(a＋b)² ＝ a²＋2ab＋b²，完全平方展開有三項。", action: "wave", prop: { kind: "text", text: "(a＋b)² ＝ a²＋2ab＋b²", sub: "完全平方：首平方、尾平方、交叉兩倍", tone: "ok" }, duration: 3200 },
    { id: 2, step: "步驟 2：一步步展開", caption: "把 (a＋b)² 想成 (a＋b)(a＋b)，用分配律乘開就得到三項。", action: "point", prop: { kind: "flow", steps: ["(a＋b)(a＋b)", "a(a＋b)＋b(a＋b)", "a²＋ab＋ab＋b²", "a²＋2ab＋b²"], active: 3 }, duration: 3800 },
    { id: 3, step: "步驟 3：代入數字試", caption: "代入 a＝2、b＝3：(2＋3)² ＝ 25，而 4＋12＋9 也等於 25。", action: "think", prop: { kind: "text", text: "(2＋3)² ＝ 25\n2²＋2×2×3＋3² ＝ 4＋12＋9 ＝ 25", sub: "公式與硬算結果一樣", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：試算完全平方", caption: "來算算：(x＋4)² 展開後，中間的 2ab 項是多少？", action: "think", prop: { kind: "text", text: "(x＋4)² ＝ x² ＋ ? ＋ 16", sub: "中間是 2×x×4", tone: "ok" }, duration: 3600, ask: { prompt: "(x＋4)² 展開中間項（2ab）是多少？", options: ["8x", "4x", "2x", "16x"], answer: 0, hint: "2ab ＝ 2 × x × 4 ＝ 8x。" } },
    { id: 5, step: "步驟 5：平方差公式", caption: "第二式：(a−b)(a＋b) ＝ a²−b²，一減一加相乘變相減。", action: "point", prop: { kind: "text", text: "(a−b)(a＋b) ＝ a²−b²", sub: "平方差：同項平方相減", tone: "ok" }, duration: 3400 },
    { id: 6, step: "步驟 6：試算平方差", caption: "平方差來挑戰：(x−3)(x＋3) 展開後等於什麼？", action: "think", prop: { kind: "text", text: "(x−3)(x＋3) ＝ x² − ?", sub: "3² ＝ 9", tone: "ok" }, duration: 3600, ask: { prompt: "(x−3)(x＋3) 展開後是？", options: ["x²−9", "x²＋9", "x²−6x＋9", "x²−3"], answer: 0, hint: "平方差公式：x² − 3² ＝ x² − 9。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：完全平方展三項、平方差一減一加變相減。多練就熟！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-poly-formula-1", prompt: "(a＋b)² 展開等於？", options: ["a²＋2ab＋b²", "a²＋b²", "a²＋ab＋b²", "2a＋2b"], answer: 0, hints: ["完全平方有三項", "中間是 2ab"], explanation: "(a＋b)² ＝ (a＋b)(a＋b) ＝ a²＋2ab＋b²。" },
    { id: "jh-math-poly-formula-2", prompt: "(a−b)(a＋b) 展開等於？", options: ["a²−b²", "a²＋b²", "a²−2ab＋b²", "(a−b)²"], answer: 0, hints: ["一減一加相乘", "相同項平方相減"], explanation: "(a−b)(a＋b) ＝ a² − b²（平方差公式）。" },
    { id: "jh-math-poly-formula-3", prompt: "(x＋5)² 展開等於？", options: ["x²＋10x＋25", "x²＋25", "x²＋5x＋25", "x²＋10x＋5"], answer: 0, hints: ["中間項 2×x×5 ＝ 10x", "5² ＝ 25"], explanation: "(x＋5)² ＝ x² ＋ 2·x·5 ＋ 5² ＝ x²＋10x＋25。" },
    { id: "jh-math-poly-formula-4", prompt: "(x−2)(x＋2) 展開等於？", options: ["x²−4", "x²＋4", "x²−2x＋4", "x²−4x"], answer: 0, hints: ["平方差：x² − 2²", "2² ＝ 4"], explanation: "(x−2)(x＋2) ＝ x² − 2² ＝ x² − 4。" },
    { id: "jh-math-poly-formula-5", prompt: "(2x＋3)² 展開等於？", options: ["4x²＋12x＋9", "4x²＋9", "2x²＋12x＋9", "4x²＋6x＋9"], answer: 0, hints: ["(2x)² ＝ 4x²", "2×2x×3 ＝ 12x，3² ＝ 9"], explanation: "(2x＋3)² ＝ (2x)² ＋ 2·2x·3 ＋ 3² ＝ 4x²＋12x＋9。" },
  ],
};

/* ===================== 6. 九上 — 一元二次方程式公式解 ===================== */
const JH_MATH_QUADRATIC_FORMULA: OnionLesson = {
  id: "jh-math-quadratic-formula",
  title: "一元二次方程式公式解",
  subject: "數學",
  topic: "一元二次方程式公式解",
  grade: "九上",
  stages: ["國中"],
  desc: "一元二次方程式公式解：先算判別式，再套公式，解 x 有標準步驟。",
  takeaways: [
    "標準式 ax²＋bx＋c＝0（a≠0）",
    "判別式 D ＝ b²−4ac 決定解數",
    "公式解 x ＝ (−b ± √D) ÷ 2a",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識標準式", caption: "一元二次方程式長這樣：ax²＋bx＋c＝0，目標是求出 x 的值。", action: "wave", prop: { kind: "text", text: "ax²＋bx＋c ＝ 0（a≠0）", sub: "最高次方是 2 次", tone: "ok" }, duration: 3200 },
    { id: 2, step: "步驟 2：認識公式解", caption: "公式解：x ＝ (−b ± √(b²−4ac)) ÷ (2a)，背起來就能源源不絕算。", action: "point", prop: { kind: "text", text: "x ＝ (−b ± √(b²−4ac)) ÷ 2a", sub: "萬能解法", tone: "ok" }, duration: 3800 },
    { id: 3, step: "步驟 3：先算判別式", caption: "先算判別式 D ＝ b²−4ac，它決定有幾個解：D＞0 兩解、D＝0 一解。", action: "think", prop: { kind: "text", text: "D ＝ b² − 4ac\nD＞0：兩解\nD＝0：一解\nD＜0：無解", sub: "判別式是靈魂", tone: "ok" }, duration: 3800 },
    { id: 4, step: "步驟 4：帶入算判別式", caption: "練習：x²−5x＋6＝0，a＝1、b＝−5、c＝6，D 是多少？", action: "think", prop: { kind: "text", text: "D ＝ (−5)² − 4×1×6 ＝ ?", sub: "25 − 24 ＝ ?", tone: "ok" }, duration: 3800, ask: { prompt: "x²−5x＋6＝0 的判別式 D ＝ ？", options: ["1", "−1", "49", "11"], answer: 0, hint: "D ＝ (−5)² − 4×1×6 ＝ 25 − 24 ＝ 1。" } },
    { id: 5, step: "步驟 5：代入公式解", caption: "再把 D 代回公式：x ＝ (5 ± √1) ÷ 2，得到 x ＝ 3 或 2。", action: "point", prop: { kind: "flow", steps: ["x ＝ (5 ± √1) ÷ 2", "√1 ＝ 1", "x ＝ (5±1)÷2", "x ＝ 3 或 2"], active: 3 }, duration: 4000 },
    { id: 6, step: "步驟 6：試算公式解", caption: "再一題：2x²−4x−6＝0，代入公式解，x 會是多少？", action: "think", prop: { kind: "text", text: "x ＝ (4 ± √(16+48)) ÷ 4", sub: "D ＝ 64，√64 ＝ 8", tone: "ok" }, duration: 4000, ask: { prompt: "2x²−4x−6＝0，公式解 x ＝ ？", options: ["3 或 −1", "−3 或 1", "3 或 1", "2 或 −2"], answer: 0, hint: "D ＝ 16 − 4×2×(−6) ＝ 64，√64 ＝ 8，x ＝ (4 ± 8)÷4。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：先算 D 看解數，再套 x ＝(−b±√D)÷2a。判別式是靈魂！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-quadratic-formula-1", prompt: "x²−5x＋6＝0 的解是？", options: ["x＝3 或 2", "x＝3 或 −2", "x＝−3 或 2", "x＝6 或 1"], answer: 0, hints: ["想因式分解", "(x−3)(x−2)＝0"], explanation: "x²−5x＋6 ＝ (x−3)(x−2)，所以 x＝3 或 x＝2。" },
    { id: "jh-math-quadratic-formula-2", prompt: "x²−5x＋6＝0 的判別式 D ＝ ？", options: ["1", "−1", "25", "11"], answer: 0, hints: ["D ＝ b²−4ac", "b＝−5，c＝6，a＝1"], explanation: "D ＝ (−5)² − 4×1×6 ＝ 25 − 24 ＝ 1。" },
    { id: "jh-math-quadratic-formula-3", prompt: "2x²−4x−6＝0 的解是？", options: ["x＝3 或 −1", "x＝−3 或 1", "x＝3 或 1", "x＝2 或 −2"], answer: 0, hints: ["先算 D ＝ 16＋48 ＝ 64", "x ＝ (4 ± 8)÷4"], explanation: "D ＝ 16−4×2×(−6) ＝ 64，√64＝8，x ＝ (4±8)÷4 ＝ 3 或 −1。" },
    { id: "jh-math-quadratic-formula-4", prompt: "2x²−4x−6＝0 的判別式 D ＝ ？", options: ["64", "16", "48", "−48"], answer: 0, hints: ["b＝−4，a＝2，c＝−6", "D ＝ (−4)² − 4×2×(−6)"], explanation: "D ＝ (−4)² − 4×2×(−6) ＝ 16 ＋ 48 ＝ 64。" },
    { id: "jh-math-quadratic-formula-5", prompt: "x²＋4x＋4＝0 的解是？", options: ["x＝−2（重根）", "x＝2", "x＝−4 或 0", "x＝±2"], answer: 0, hints: ["這是 (x＋2)² ＝ 0", "D ＝ 16 − 16 ＝ 0 只有一解"], explanation: "x²＋4x＋4 ＝ (x＋2)² ＝ 0，所以 x＝−2（兩相等實根，重根）。" },
  ],
};

/* ===================== 7. 八下 — 三角形全等與幾何證明 ===================== */
const JH_MATH_CONGRUENCE: OnionLesson = {
  id: "jh-math-congruence",
  title: "三角形全等：SSS、SAS、ASA",
  subject: "數學",
  topic: "三角形全等與幾何證明",
  grade: "八下",
  stages: ["國中"],
  desc: "三角形全等 SSS／SAS／ASA／AAS：對應邊角比一比，證明有依據。",
  takeaways: [
    "SSS：三邊對應相等就全等",
    "SAS：兩邊及其夾角對應相等",
    "ASA：兩角及其夾邊對應相等",
  ],
  frames: [
    { id: 1, step: "步驟 1：什麼是全等", caption: "全等是兩個圖形一模一樣大、可以完全疊合，邊和角都對應相等。", action: "wave", prop: { kind: "shape", shape: "triangle", base: 4, height: 3, label: "△ABC" }, duration: 3200 },
    { id: 2, step: "步驟 2：SSS 邊邊邊", caption: "SSS：三邊對應相等，兩個三角形就全等，不用管擺的方向。", action: "point", prop: { kind: "shape", shape: "triangle", base: 5, height: 4, label: "三邊都標相等" }, duration: 3400 },
    { id: 3, step: "步驟 3：SAS 邊角邊", caption: "SAS：兩邊及其夾角對應相等，也能判定兩三角形全等。", action: "point", prop: { kind: "shape", shape: "triangle", base: 6, height: 4, label: "夾角相等" }, duration: 3400 },
    { id: 4, step: "步驟 4：試算判定", caption: "考考你：已知兩三角形三邊長都一樣，可以用哪個性質說全等？", action: "think", prop: { kind: "text", text: "AB＝A'B'、BC＝B'C'、CA＝C'A'", sub: "三組邊都一樣", tone: "ok" }, duration: 3600, ask: { prompt: "三邊對應相等，可判定全等的根據是？", options: ["SSS", "SAS", "ASA", "AAS"], answer: 0, hint: "三邊相等就是『邊邊邊』SSS。" } },
    { id: 5, step: "步驟 5：ASA 與 AAS", caption: "ASA 是兩角夾一邊，AAS 是兩角一邊（非夾角），都能判定全等。", action: "point", prop: { kind: "flow", steps: ["SSS：三邊", "SAS：兩邊夾角", "ASA：兩角夾邊", "AAS：兩角一邊"], active: 2 }, duration: 3600 },
    { id: 6, step: "步驟 6：試算判定二", caption: "再想：已知兩角及它們的夾邊都相等，該用哪個性質？", action: "think", prop: { kind: "text", text: "∠A＝∠A'、AB＝A'B'、∠B＝∠B'", sub: "兩角夾一邊", tone: "ok" }, duration: 3600, ask: { prompt: "兩角及其夾邊對應相等，判定依據是？", options: ["ASA", "SAS", "SSS", "RHS"], answer: 0, hint: "兩角『夾』一邊就是 ASA（角邊角）。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：SSS 三邊、SAS 夾角、ASA 夾邊、AAS 兩角一邊。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-congruence-1", prompt: "三邊對應相等，判定三角形全等用？", options: ["SSS", "SAS", "ASA", "AAS"], answer: 0, hints: ["三邊相等", "邊邊邊"], explanation: "三邊對應相等（SSS）即可判定兩三角形全等。" },
    { id: "jh-math-congruence-2", prompt: "兩邊及其夾角對應相等，判定用？", options: ["SAS", "SSS", "ASA", "AAS"], answer: 0, hints: ["兩邊加中間的角", "邊角邊"], explanation: "兩邊及其夾角對應相等（SAS）可判定全等。" },
    { id: "jh-math-congruence-3", prompt: "兩角及其夾邊對應相等，判定用？", options: ["ASA", "SAS", "SSS", "RHS"], answer: 0, hints: ["兩角中間夾一邊", "角邊角"], explanation: "兩角及其夾邊對應相等（ASA）可判定全等。" },
    { id: "jh-math-congruence-4", prompt: "直角三角形中斜邊和一股對應相等，可用？", options: ["RHS", "SAS", "SSS", "ASA"], answer: 0, hints: ["直角三角形專用", "斜邊—一股"], explanation: "直角三角形的斜邊與一股對應相等（RHS，斜邊一股）即可判定全等。" },
    { id: "jh-math-congruence-5", prompt: "只有兩個角對應相等，沒有邊對應相等，能判定全等嗎？", options: ["不能，還需要一邊", "可以，AA 就全等", "可以，兩角決定", "不一定，看形狀"], answer: 0, hints: ["只有角相等只能說相似", "要 ASA 或 AAS 才全等"], explanation: "只有角相等只能判定相似；必須再有一組邊對應相等（ASA 或 AAS）才能判定全等。" },
  ],
};

/* ===================== 8. 九上 — 圓的性質 ===================== */
const JH_MATH_CIRCLE: OnionLesson = {
  id: "jh-math-circle",
  title: "圓的性質：弦、切線、圓心角",
  subject: "數學",
  topic: "圓的性質",
  grade: "九上",
  stages: ["國中"],
  desc: "圓的弦、切線與圓心角、圓周角：看弧想角度，圓的性質一次理清。",
  takeaways: [
    "通過圓心的弦最長，叫做直徑",
    "切線垂直於過切點的半徑（90 度）",
    "同一弧：圓心角 ＝ 2 × 圓周角",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識圓的基本", caption: "圓上所有點到圓心距離都相等，那條線叫半徑；通過圓心的弦叫直徑。", action: "wave", prop: { kind: "shape", shape: "circle", base: 6, height: 6, label: "O 圓心、r 半徑" }, duration: 3400 },
    { id: 2, step: "步驟 2：弦與直徑", caption: "連接圓上兩點的線段叫弦；最長的弦通過圓心，就是直徑。", action: "point", prop: { kind: "shape", shape: "circle", base: 6, height: 6, label: "弦與直徑" }, duration: 3400 },
    { id: 3, step: "步驟 3：切線垂直半徑", caption: "切線只碰到圓一點，而且一定和過切點的半徑垂直，成 90 度。", action: "point", prop: { kind: "shape", shape: "circle", base: 6, height: 6, label: "切線⊥半徑" }, duration: 3600 },
    { id: 4, step: "步驟 4：試算切線性質", caption: "想想：過切點畫一條半徑，切線和這條半徑夾角是多少度？", action: "think", prop: { kind: "text", text: "切線 ⊥ 半徑", sub: "夾角是直角", tone: "ok" }, duration: 3600, ask: { prompt: "切線與過切點的半徑夾角為？", options: ["90 度", "180 度", "45 度", "60 度"], answer: 0, hint: "切線和半徑互相垂直，夾角是直角 90 度。" } },
    { id: 5, step: "步驟 5：圓心角與圓周角", caption: "同一段弧，圓心角是圓周角的兩倍：圓心角 ＝ 2 × 圓周角。", action: "point", prop: { kind: "shape", shape: "circle", base: 6, height: 6, label: "圓心角、圓周角" }, duration: 3600 },
    { id: 6, step: "步驟 6：試算角度關係", caption: "算算看：同一段弧的圓周角是 30 度，圓心角應該是多少度？", action: "think", prop: { kind: "text", text: "圓周角 30° → 圓心角 ？", sub: "圓心角＝2×圓周角", tone: "ok" }, duration: 3600, ask: { prompt: "圓周角 30 度，同一弧的圓心角是多少？", options: ["60 度", "30 度", "15 度", "90 度"], answer: 0, hint: "圓心角 ＝ 2 × 圓周角，30 × 2 ＝ 60。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：切線垂直半徑、圓心角等於圓周角的兩倍。看弧想角度！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-circle-1", prompt: "通過圓心、兩端在圓上的弦叫？", options: ["直徑", "半徑", "切線", "圓心角"], answer: 0, hints: ["是最長的弦", "通過圓心"], explanation: "通過圓心且兩端在圓上的弦最長，稱為直徑。" },
    { id: "jh-math-circle-2", prompt: "切線與過切點的半徑夾角為？", options: ["90 度", "180 度", "60 度", "45 度"], answer: 0, hints: ["切線和半徑互相垂直", "垂直就是直角"], explanation: "切線垂直於過切點的半徑，所以夾角是 90 度。" },
    { id: "jh-math-circle-3", prompt: "同一段弧，圓周角 40 度，圓心角多少？", options: ["80 度", "40 度", "20 度", "160 度"], answer: 0, hints: ["圓心角＝2×圓周角", "40 × 2 ＝ 80"], explanation: "同一弧的圓心角是圓周角的兩倍：40 × 2 ＝ 80 度。" },
    { id: "jh-math-circle-4", prompt: "同一段弧，圓心角 100 度，圓周角多少？", options: ["50 度", "100 度", "200 度", "25 度"], answer: 0, hints: ["圓周角＝圓心角÷2", "100 ÷ 2 ＝ 50"], explanation: "圓周角是圓心角的一半：100 ÷ 2 ＝ 50 度。" },
    { id: "jh-math-circle-5", prompt: "直徑所對的圓周角是多少？", options: ["90 度", "180 度", "60 度", "45 度"], answer: 0, hints: ["直徑對應圓心角 180 度", "圓周角再除以 2"], explanation: "直徑對應圓心角 180 度，圓周角為其一半 90 度（半圓上的圓周角是直角）。" },
  ],
};

/* ===================== 9. 九上 — 統計圖表與資料分析 ===================== */
const JH_MATH_STATISTICS: OnionLesson = {
  id: "jh-math-statistics",
  title: "統計圖表與資料分析",
  subject: "數學",
  topic: "統計圖表與資料分析",
  grade: "九上",
  stages: ["國中"],
  desc: "平均數、中位數、眾數、全距：用長條圖讀資料，統計不再霧煞煞。",
  takeaways: [
    "平均數 ＝ 總和 ÷ 筆數",
    "中位數：排序後中間那個數",
    "眾數出現最多次、全距＝最大−最小",
  ],
  frames: [
    { id: 1, step: "步驟 1：認識資料", caption: "先把數字排好：小華五次小考分別是 70、80、90、80、100 分。", action: "wave", prop: { kind: "bars", items: [{ label: "第1次", value: 70 }, { label: "第2次", value: 80 }, { label: "第3次", value: 90 }, { label: "第4次", value: 80 }, { label: "第5次", value: 100 }], active: 2 }, duration: 3600 },
    { id: 2, step: "步驟 2：算平均數", caption: "平均數 ＝ 總和 ÷ 筆數：(70＋80＋90＋80＋100) ÷ 5 ＝ 84 分。", action: "point", prop: { kind: "text", text: "平均 ＝ (70+80+90+80+100) ÷ 5\n＝ 420 ÷ 5 ＝ 84", sub: "把全部加起來再平分", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：找中位數", caption: "中位數先把資料由小排：70、80、80、90、100，中間那個 80 就是中位數。", action: "think", prop: { kind: "bars", items: [{ label: "70", value: 70 }, { label: "80", value: 80 }, { label: "80", value: 80 }, { label: "90", value: 90 }, { label: "100", value: 100 }], active: 2 }, duration: 3600 },
    { id: 4, step: "步驟 4：試算平均數", caption: "動動腦：這五個分數 70、80、90、80、100 的平均數是多少？", action: "think", prop: { kind: "text", text: "總和 420 ÷ 5 ＝ ?", sub: "先加總再平分", tone: "ok" }, duration: 3600, ask: { prompt: "70、80、90、80、100 的平均數是？", options: ["84", "80", "90", "420"], answer: 0, hint: "先加總 70+80+90+80+100 ＝ 420，再 ÷5 ＝ 84。" } },
    { id: 5, step: "步驟 5：找眾數", caption: "眾數看誰出現最多次：資料 70、80、80、90、100 裡，80 出現兩次最多。", action: "point", prop: { kind: "bars", items: [{ label: "70", value: 70 }, { label: "80", value: 80 }, { label: "80", value: 80 }, { label: "90", value: 90 }, { label: "100", value: 100 }], active: 1 }, duration: 3400 },
    { id: 6, step: "步驟 6：試算全距", caption: "再算：資料 70、80、90、80、100 中，最大 100、最小 70，全距是多少？", action: "think", prop: { kind: "text", text: "全距 ＝ 最大 − 最小 ＝ 100 − 70", sub: "看落差有多大", tone: "ok" }, duration: 3600, ask: { prompt: "資料 70、80、90、80、100 的全距是多少？", options: ["30", "100", "70", "20"], answer: 0, hint: "全距 ＝ 最大值 − 最小值 ＝ 100 − 70 ＝ 30。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：平均看總和、中位數排中間、眾數最多次、全距看落差。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-statistics-1", prompt: "資料 70、80、90、80、100 的平均數是？", options: ["84", "80", "90", "100"], answer: 0, hints: ["先加總再除以筆數", "70+80+90+80+100 ＝ 420"], explanation: "總和 420 ÷ 5 ＝ 84，所以平均數是 84。" },
    { id: "jh-math-statistics-2", prompt: "同一組資料的眾數是？", options: ["80", "70", "90", "100"], answer: 0, hints: ["看哪個數出現最多次", "80 出現了兩次"], explanation: "80 出現兩次，比其他數都多，所以眾數是 80。" },
    { id: "jh-math-statistics-3", prompt: "同一組資料的中位數是？", options: ["80", "90", "70", "100"], answer: 0, hints: ["先由小排到大", "中間那個就是中位數"], explanation: "排序 70、80、80、90、100，中間第 3 個是 80，中位數 80。" },
    { id: "jh-math-statistics-4", prompt: "同一組資料的全距是？", options: ["30", "100", "70", "20"], answer: 0, hints: ["全距＝最大−最小", "100 − 70 ＝ 30"], explanation: "全距 ＝ 最大值 100 − 最小值 70 ＝ 30。" },
    { id: "jh-math-statistics-5", prompt: "另一組資料 10、20、20、30、40，平均數與中位數分別是？", options: ["平均 24、中位 20", "平均 20、中位 24", "平均 24、中位 24", "平均 20、中位 20"], answer: 0, hints: ["平均＝總和÷5", "中位＝排序後中間那個"], explanation: "總和 120 ÷ 5 ＝ 24（平均）；排序後中間是 20（中位數）。" },
  ],
};

/* ===================== 10. 九下 — 樹狀圖與機率 ===================== */
const JH_MATH_PROBABILITY_TREE: OnionLesson = {
  id: "jh-math-probability-tree",
  title: "樹狀圖與機率：列出所有情形",
  subject: "數學",
  topic: "樹狀圖與機率",
  grade: "九下",
  stages: ["國中"],
  desc: "樹狀圖列出所有情形，再算機率：拋硬幣、抽球機率一看就懂。",
  takeaways: [
    "機率 ＝ 想要的情形 ÷ 全部情形",
    "先畫樹狀圖列出所有結果",
    "注意先後順序會產生不同情形",
  ],
  frames: [
    { id: 1, step: "步驟 1：什麼是機率", caption: "機率 ＝ 想要的情形 ÷ 所有可能的情形，先列出全部可能才不會漏。", action: "wave", prop: { kind: "text", text: "機率 ＝ 想要 ÷ 全部", sub: "一定是 0 到 1 之間", tone: "ok" }, duration: 3200 },
    { id: 2, step: "步驟 2：抛硬幣的樹", caption: "抛一枚硬幣：可能出現正面或反面，各 1 種，共 2 種可能。", action: "point", prop: { kind: "flow", steps: ["開始", "正面", "反面"], active: 0 }, duration: 3400 },
    { id: 3, step: "步驟 3：連拋兩次的樹", caption: "連拋兩次：正正、正反、反正、反反，用樹狀圖列出 4 種結果。", action: "think", prop: { kind: "flow", steps: ["第1次：正/反", "正正", "正反", "反正", "反反"], active: 1 }, duration: 3600 },
    { id: 4, step: "步驟 4：試算兩次組合", caption: "算算：連拋兩枚硬幣，恰好一正一反的情形有幾種？", action: "think", prop: { kind: "flow", steps: ["正正", "正反", "反正", "反反"], active: 1 }, duration: 3600, ask: { prompt: "兩枚硬幣恰好一正一反，有幾種情形？", options: ["2 種", "1 種", "3 種", "4 種"], answer: 0, hint: "一正一反包含『正反』和『反正』兩種順序。" } },
    { id: 5, step: "步驟 5：抽球樹狀圖", caption: "袋中有紅藍兩球，抽兩次不放回：紅藍、藍紅等，共 2 種排列。", action: "point", prop: { kind: "flow", steps: ["第1抽：紅/藍", "紅→藍", "藍→紅"], active: 1 }, duration: 3600 },
    { id: 6, step: "步驟 6：試算機率", caption: "挑戰：兩枚硬幣至少一面是正面，4 種裡有幾種符合呢？", action: "think", prop: { kind: "text", text: "正正、正反、反正、反反\n4 種中 3 種符合", sub: "除『反反』外都算", tone: "ok" }, duration: 3600, ask: { prompt: "兩枚硬幣『至少一正面』的機率是？", options: ["3/4", "1/2", "1/4", "2/3"], answer: 0, hint: "4 種裡除『反反』外都符合，共 3 種，機率 3/4。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：先畫樹狀圖列出全部，再數想要的有幾種，相除就是機率。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-probability-tree-1", prompt: "機率的計算方式是？", options: ["想要 ÷ 全部", "全部 ÷ 想要", "想要 × 全部", "全部 − 想要"], answer: 0, hints: ["看符合的佔全部幾分之幾", "分子是想要的"], explanation: "機率 ＝ 想要的情形數 ÷ 所有可能的情形數。" },
    { id: "jh-math-probability-tree-2", prompt: "抛一枚硬幣出正面的機率是？", options: ["1/2", "1", "0", "1/4"], answer: 0, hints: ["只有正面、反面兩種", "正面佔 1 種"], explanation: "兩種等可能結果中正面佔 1 種，機率 1/2。" },
    { id: "jh-math-probability-tree-3", prompt: "兩枚硬幣恰好一正一反的機率是？", options: ["1/2", "1/4", "3/4", "2/3"], answer: 0, hints: ["正反、反正共 2 種", "全部 4 種"], explanation: "一正一反有『正反、反正』2 種，共 4 種，機率 2/4 ＝ 1/2。" },
    { id: "jh-math-probability-tree-4", prompt: "兩枚硬幣至少一面是正面的機率是？", options: ["3/4", "1/2", "1/4", "2/3"], answer: 0, hints: ["只『反反』不符合", "符合的有 3 種"], explanation: "4 種中除『反反』外都符合，共 3 種，機率 3/4。" },
    { id: "jh-math-probability-tree-5", prompt: "擲一顆骰子，點數大於 4 的機率是？", options: ["1/3", "1/2", "2/3", "1/6"], answer: 0, hints: ["點數 1~6 共 6 種", "大於 4 是 5、6 兩種"], explanation: "6 種等可能中，5 和 6 兩種符合，機率 2/6 ＝ 1/3。" },
  ],
};

/* ===================== 11. 九上 — 相似三角形 ===================== */
const JH_MATH_SIMILAR: OnionLesson = {
  id: "jh-math-similar",
  title: "相似三角形：對應邊成比例",
  subject: "數學",
  topic: "相似三角形",
  grade: "九上",
  stages: ["國中"],
  desc: "相似三角形：對應角相等、對應邊成比例，借一邊算出全部邊長。",
  takeaways: [
    "相似三角形對應角相等",
    "對應邊的比值全都相同",
    "知道一邊就能用比例推算其他邊",
  ],
  frames: [
    { id: 1, step: "步驟 1：相似與全等差別", caption: "相似是形狀一樣但大小可能不同：對應角相等、對應邊成比例。", action: "wave", prop: { kind: "shape", shape: "triangle", base: 4, height: 3, label: "△ABC" }, duration: 3400 },
    { id: 2, step: "步驟 2：對應角相等", caption: "兩個相似三角形，三組對應角都一樣大，像放大縮小的照片。", action: "point", prop: { kind: "shape", shape: "triangle", base: 6, height: 4.5, label: "放大版" }, duration: 3400 },
    { id: 3, step: "步驟 3：對應邊成比例", caption: "對應邊的比值都相同：若邊長比是 2 比 3，那每組對應邊都差 1.5 倍。", action: "think", prop: { kind: "text", text: "對應邊比 2 ：3（都相同）", sub: "形狀同、大小不同", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：試算邊長比", caption: "考考你：小三角邊長 4、6，大三角對應邊是 8、？，比例是多少？", action: "think", prop: { kind: "text", text: "4 ：8 ＝ 6 ：?", sub: "比例是 2 倍", tone: "ok" }, duration: 3600, ask: { prompt: "對應邊成比例：4 對 8，那 6 對多少？", options: ["12", "10", "9", "14"], answer: 0, hint: "比例是 8 ÷ 4 ＝ 2 倍，6 × 2 ＝ 12。" } },
    { id: 5, step: "步驟 5：用比例求未知邊", caption: "相似可以借邊長：已知一邊，用比例就能算出另一個三角形的對應邊。", action: "point", prop: { kind: "shape", shape: "triangle", base: 8, height: 6, label: "對應放大" }, duration: 3600 },
    { id: 6, step: "步驟 6：試算應用", caption: "再算：兩相似三角形對應邊比 3 比 5，小三角形一邊 9，大的對應邊？", action: "think", prop: { kind: "text", text: "3 ：5 ＝ 9 ：?", sub: "9÷3 再 ×5", tone: "ok" }, duration: 3600, ask: { prompt: "對應邊比 3：5，小邊 9，大邊是多少？", options: ["15", "12", "10", "20"], answer: 0, hint: "9 ÷ 3 ＝ 3，再 × 5 ＝ 15。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：相似看對應角相等、對應邊成比例；知道一邊就能推算全部。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-similar-1", prompt: "相似三角形一定具備什麼？", options: ["對應角相等、對應邊成比例", "邊都相等", "角都不同", "面積相等"], answer: 0, hints: ["形狀相同大小可不同", "重點在對應"], explanation: "相似三角形對應角相等、對應邊成比例，但邊長不必相等。" },
    { id: "jh-math-similar-2", prompt: "對應邊比 2：3，小邊 4，大邊是多少？", options: ["6", "8", "5", "12"], answer: 0, hints: ["比例 4→大邊是 ×(3/2)", "4 × 3 ÷ 2 ＝ 6"], explanation: "對應邊比 2：3，大邊 ＝ 4 × 3 ÷ 2 ＝ 6。" },
    { id: "jh-math-similar-3", prompt: "對應邊比 3：5，小邊 9，大邊是多少？", options: ["15", "12", "10", "20"], answer: 0, hints: ["9 ÷ 3 ＝ 3", "3 × 5 ＝ 15"], explanation: "比例 3：5，大邊 ＝ 9 × 5 ÷ 3 ＝ 15。" },
    { id: "jh-math-similar-4", prompt: "小三角形邊 5、10，相似大三角形對應邊 15、？", options: ["30", "20", "25", "35"], answer: 0, hints: ["比例 15÷5 ＝ 3 倍", "10 × 3 ＝ 30"], explanation: "比例是 15 ÷ 5 ＝ 3 倍，所以另一對應邊 10 × 3 ＝ 30。" },
    { id: "jh-math-similar-5", prompt: "兩個三角形三組對應角都相等，是否一定相似？", options: ["一定相似", "不一定，還要邊成比例", "一定全等", "無關"], answer: 0, hints: ["AA 是相似的判定", "角相等形狀就相同"], explanation: "三組對應角相等（AA）就足以判定相似，因為形狀相同、邊長自然成比例。" },
  ],
};

/* ===================== 12. 八下 — 函數與直線圖形 ===================== */
const JH_MATH_LINEAR_FUNCTION: OnionLesson = {
  id: "jh-math-linear-function",
  title: "函數與直線圖形：y＝ax＋b",
  subject: "數學",
  topic: "函數與直線圖形",
  grade: "八下",
  stages: ["國中"],
  desc: "一次函數 y＝ax＋b 的圖形與斜率：代 x 算 y，連點畫出直線。",
  takeaways: [
    "y＝ax＋b 的圖形是一條直線",
    "b 是與 y 軸的交點（y 截距）",
    "a 是斜率：上升量 ÷ 前進量",
  ],
  frames: [
    { id: 1, step: "步驟 1：函數是什麼", caption: "函數像一台機器：給一個 x，就按規律吐出一個 y，每個 x 只對應一個 y。", action: "wave", prop: { kind: "text", text: "x → f → y（一對一）", sub: "輸入決定輸出", tone: "ok" }, duration: 3200 },
    { id: 2, step: "步驟 2：認識 y＝ax＋b", caption: "一次函數 y ＝ ax＋b 畫出來是直線：b 是和 y 軸交點，a 是斜率（斜度）。", action: "point", prop: { kind: "text", text: "y ＝ ax ＋ b\na：斜率   b：y 截距", sub: "一次函數＝直線", tone: "ok" }, duration: 3600 },
    { id: 3, step: "步驟 3：斜率的意義", caption: "斜率 a ＝ 上升量 ÷ 前進量：a 越大線越陡，a 為負則線往下走。", action: "think", prop: { kind: "text", text: "斜率 a ＝ 上升 ÷ 前進", sub: "每走 1 格升多少", tone: "ok" }, duration: 3600 },
    { id: 4, step: "步驟 4：試算 y 截距", caption: "想想：y ＝ 2x ＋ 3，當 x ＝ 0 時，這條線和 y 軸交在哪一點？", action: "think", prop: { kind: "text", text: "x＝0 → y ＝ 3", sub: "b 就是截距", tone: "ok" }, duration: 3600, ask: { prompt: "y ＝ 2x ＋ 3 與 y 軸的交點（y 截距）是？", options: ["3", "2", "0", "5"], answer: 0, hint: "x ＝ 0 代入：y ＝ 2×0 ＋ 3 ＝ 3。" } },
    { id: 5, step: "步驟 5：算幾個點畫線", caption: "取 x ＝ 0、1、2：y 分別是 3、5、7，把點連起來就是一條直線。", action: "point", prop: { kind: "flow", steps: ["x＝0 → y＝3", "x＝1 → y＝5", "x＝2 → y＝7", "連點成直線"], active: 2 }, duration: 3800 },
    { id: 6, step: "步驟 6：試算斜率", caption: "挑戰：從 (0,3) 走到 (2,7)，上升多少、前進多少，斜率 a 是多少？", action: "think", prop: { kind: "text", text: "a ＝ (7−3) ÷ (2−0)", sub: "上升 4、前進 2", tone: "ok" }, duration: 3800, ask: { prompt: "通過 (0,3) 和 (2,7) 的直線斜率 a ＝ ？", options: ["2", "4", "1", "7"], answer: 0, hint: "上升 7−3 ＝ 4，前進 2−0 ＝ 2，a ＝ 4 ÷ 2 ＝ 2。" } },
    { id: 7, step: "步驟 7：背起口訣", caption: "口訣：y＝ax＋b 是直線，b 是起步高度、a 是斜度。代 x 算 y 再連線！準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "jh-math-linear-function-1", prompt: "y ＝ 2x ＋ 3 的 y 截距（b）是？", options: ["3", "2", "0", "5"], answer: 0, hints: ["y 截距是 x＝0 時的 y", "2×0＋3 ＝ 3"], explanation: "y ＝ ax＋b 中 b 即 y 截距，這裡 b ＝ 3。" },
    { id: "jh-math-linear-function-2", prompt: "y ＝ −x ＋ 4 與 y 軸的交點是？", options: ["(0,4)", "(0,−1)", "(4,0)", "(0,0)"], answer: 0, hints: ["令 x＝0", "y ＝ −0 ＋ 4 ＝ 4"], explanation: "x ＝ 0 時 y ＝ 4，與 y 軸交於 (0,4)。" },
    { id: "jh-math-linear-function-3", prompt: "通過 (0,3) 和 (2,7) 的直線斜率 a ＝ ？", options: ["2", "4", "1", "7"], answer: 0, hints: ["a ＝ 上升 ÷ 前進", "(7−3) ÷ (2−0)"], explanation: "斜率 a ＝ (7−3) ÷ (2−0) ＝ 4 ÷ 2 ＝ 2。" },
    { id: "jh-math-linear-function-4", prompt: "y ＝ 2x ＋ 3，x ＝ 5 時 y ＝ ？", options: ["13", "10", "8", "15"], answer: 0, hints: ["代入 x＝5", "2×5＋3 ＝ 13"], explanation: "y ＝ 2×5 ＋ 3 ＝ 10 ＋ 3 ＝ 13。" },
    { id: "jh-math-linear-function-5", prompt: "y ＝ −3x ＋ 6，與 x 軸的交點（y＝0）是？", options: ["(2,0)", "(0,6)", "(−2,0)", "(6,0)"], answer: 0, hints: ["令 y＝0 解 x", "−3x＋6 ＝ 0"], explanation: "令 y ＝ 0：−3x ＋ 6 ＝ 0 → 3x ＝ 6 → x ＝ 2，交點 (2,0)。" },
  ],
};

export default [
  JH_MATH_INTEGER_OPS,
  JH_MATH_FRACTION_OPS,
  JH_MATH_INEQUALITY,
  JH_MATH_SQUARE_ROOT,
  JH_MATH_POLY_FORMULA,
  JH_MATH_QUADRATIC_FORMULA,
  JH_MATH_CONGRUENCE,
  JH_MATH_CIRCLE,
  JH_MATH_STATISTICS,
  JH_MATH_PROBABILITY_TREE,
  JH_MATH_SIMILAR,
  JH_MATH_LINEAR_FUNCTION,
];
