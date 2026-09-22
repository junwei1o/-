/**
 * 國小數學補充課程（洋蔥學院 200 堂擴充計畫：一、國小新增 50 堂／數學 14 堂）。
 * 內容由 docs/onion-200-plan.md 的課表驅動；每一堂都是 7 幀步驟分鏡＋5 題闖關。
 *
 * 設計原則（見 docs/onion-200-plan.md）：
 *  - 一步一觀念：7 幀＝7 步，順序固定在動機→觀念→提問→動手算→易錯→統整→口訣。
 *  - 圖解真的畫得出概念；教具（bars/pie/pies/balance/flow/shape/text）裡的數字一定和字幕一致。
 *  - 中途提問放在學生最容易卡住的地方，提示指方向不直接給答案。
 *  - 闖關 5 題：2 基本 → 2 應用 → 1 易錯/跨概念；詳解寫「為什麼」。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

/* ========================================================================
 * 課程 1 — 小數的乘法（五上）
 * 核心：小數乘法先當整數算，再數小數位點小數點。圖解：text → bars → flow
 * ======================================================================== */
const EL_MATH_DECIMAL_MULTIPLY: OnionLesson = {
  id: "el-math-decimal-multiply",
  title: "小數的乘法：先當整數再點小數點",
  subject: "數學",
  topic: "小數的乘法",
  grade: "五上",
  stages: ["國小"],
  desc: "小數乘法先當整數算，再數小數位點小數點，洋蔥用長條圖帶你一眼看懂。",
  takeaways: ["先把小數當整數相乘", "兩個乘數的小數位數相加＝結果的小數位數", "從右邊數對位數再點小數點", "小數位數不夠時，要在積前面補 0 補齊位數"],
  frames: [
    { step: "步驟 1：用小數乘法引起動機", id: 1, caption: "嗨！一顆糖 0.3 元，買 0.2 顆要多少錢？小數乘法其實很簡單！", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：先遮住小數點當整數算", id: 2, caption: "先不管小數點，把它們想成 3 和 2：3 × 2 = 6。", action: "point", prop: { kind: "text", text: "0.3 × 0.2 → 先算 3 × 2 = 6", sub: "先當整數算，3×2=6", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：數出小數共有幾位", id: 3, caption: "0.3 有 1 位小數、0.2 也有 1 位，合起來共 2 位小數。", ask: { prompt: "0.3 和 0.2 乘起來共有幾位小數？", options: ["2 位", "1 位", "3 位", "0 位"], answer: 0, hint: "0.3 有 1 位、0.2 有 1 位，1+1=2 位。" }, action: "think", prop: { kind: "bars", items: [{ label: "0.3", value: 0.3 }, { label: "0.2", value: 0.2 }], unit: "元" }, duration: 3600 },
    { step: "步驟 4：從右邊點小數點", id: 4, caption: "把 6 從右邊數 2 位，點上小數點，就得到 0.06。", action: "point", prop: { kind: "flow", steps: ["先算整數積 6", "數小數位數 2 位", "從右邊點小數點"], active: 2 }, duration: 3600 },
    { step: "步驟 5：位數不夠要前面補 0", id: 5, caption: "再提醒一次：位數不夠要在前面補 0，例如 6 只有 1 位、要數 2 位就寫成 0.06。", action: "point", prop: { kind: "text", text: "位數不夠 → 前面補 0", sub: "例：6 要 2 位 → 0.06", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你動手算 0.4 × 0.3", id: 6, caption: "輪到你：0.4 × 0.3，先算 4 × 3 = 12，兩個小數共 2 位，答案？", ask: { prompt: "0.4 × 0.3 等於多少？", options: ["0.12", "1.2", "0.012", "12"], answer: 0, hint: "先算 4×3=12；兩個乘數各 1 位小數，共 2 位，從右點 2 位。" }, action: "think", prop: { kind: "text", text: "0.4 × 0.3：4×3=12，2位→0.12", sub: "先整數後點小數點", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰 0.5 × 0.6", id: 7, caption: "再挑戰：0.5 × 0.6，先算 5 × 6 = 30，兩個小數共 2 位，答案是多少？", ask: { prompt: "0.5 × 0.6 等於多少？", options: ["0.30", "3.0", "0.030", "30"], answer: 0, hint: "先算 5×6=30；兩數共 2 位小數，從右點 2 位得 0.30。" }, action: "think", prop: { kind: "text", text: "0.5 × 0.6：5×6=30，2位→0.30", sub: "積末尾的 0 也先保留", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：找出常見錯誤", id: 8, caption: "常見錯誤：忘記數小數位，直接寫 12；其實 0.3×0.2 應該是 0.06。", action: "jump", prop: { kind: "bars", items: [{ label: "忘記點(錯)", value: 12 }, { label: "正確", value: 0.06 }], unit: "元" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：先當整數算、數清小數位、再點小數點。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-decimal-multiply-1", prompt: "0.5 × 0.4 等於多少？", options: ["0.20", "2.0", "0.02", "20"], answer: 0, hints: ["先算 5×4=20", "兩數各 1 位小數，共 2 位，從右點 2 位"], explanation: "先算 5×4=20，兩數各有 1 位小數共 2 位，20 從右數 2 位點成 0.20（即 0.2）。" },
    { id: "el-math-decimal-multiply-2", prompt: "0.2 × 0.5 等於多少？", options: ["0.10", "1.0", "0.01", "10"], answer: 0, hints: ["2×5=10", "共 2 位小數"], explanation: "2×5=10，共 2 位小數，得 0.10（即 0.1）。" },
    { id: "el-math-decimal-multiply-3", prompt: "一條繩子每公尺 0.7 元，買 0.6 公尺要多少錢？", options: ["0.42 元", "4.2 元", "0.042 元", "42 元"], answer: 0, hints: ["0.7×0.6", "7×6=42，共 2 位小數"], explanation: "0.7×0.6：先算 7×6=42，兩數共 2 位小數，得 0.42 元。" },
    { id: "el-math-decimal-multiply-4", prompt: "0.12 × 0.3 等於多少？（0.12 有 2 位、0.3 有 1 位）", options: ["0.036", "0.36", "0.0036", "3.6"], answer: 0, hints: ["12×3=36", "共 3 位小數，從右點 3 位"], explanation: "12×3=36，0.12 有 2 位、0.3 有 1 位共 3 位小數，36 從右數 3 位得 0.036。" },
    { id: "el-math-decimal-multiply-5", prompt: "下面哪一個算式的結果最大？", options: ["0.1×0.1", "0.2×0.3", "0.4×0.2", "0.5×0.1"], answer: 2, hints: ["分別算出：0.01、0.06、0.08、0.05", "比較這四個小數"], explanation: "0.1×0.1=0.01，0.2×0.3=0.06，0.4×0.2=0.08，0.5×0.1=0.05，最大的是 0.08（0.4×0.2）。" },
    { id: "el-math-decimal-multiply-6", prompt: "一塊布長 0.8 公尺、寬 0.5 公尺，面積多少平方公尺？", options: ["0.40 平方公尺", "4.0 平方公尺", "0.04 平方公尺", "40 平方公尺"], answer: 0, hints: ["0.8×0.5", "8×5=40，兩數共 2 位小數"], explanation: "0.8×0.5：先算 8×5=40，兩數共 2 位小數，得 0.40 平方公尺（即 0.4）。" },
    { id: "el-math-decimal-multiply-7", prompt: "0.25 × 0.4 等於多少？（0.25 有 2 位、0.4 有 1 位）", options: ["0.100", "1.00", "0.0100", "100"], answer: 0, hints: ["25×4=100", "共 3 位小數，從右點 3 位"], explanation: "25×4=100，0.25 有 2 位、0.4 有 1 位共 3 位小數，100 從右數 3 位得 0.100（即 0.1）。" },
  ],
};

/* ========================================================================
 * 課程 2 — 小數的除法（五下）
 * 核心：除數是小數時先放大成整數。圖解：flow → balance
 * ======================================================================== */
const EL_MATH_DECIMAL_DIVIDE: OnionLesson = {
  id: "el-math-decimal-divide",
  title: "小數的除法：除數變整數再除",
  subject: "數學",
  topic: "小數的除法",
  grade: "五下",
  stages: ["國小"],
  desc: "除數是小數時，先把它放大成整數再除，洋蔥用天平與流程圖教你秘訣。",
  takeaways: ["除數是小數→除數和被除數同乘 10 的倍數", "除數變整數後照整數除法算", "商的小數點和被除數對齊", "除數有幾位小數，就同乘幾個 10 把它變整數"],
  frames: [
    { step: "步驟 1：用分裝情境引入", id: 1, caption: "嗨！12.6 公斤糖，每 0.3 公斤裝一袋，一共能裝幾袋？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：先看除數是小數的困難", id: 2, caption: "問題來了：除數 0.3 是小數，直接除不好算，我們先想辦法把它變整數。", action: "think", prop: { kind: "text", text: "12.6 ÷ 0.3：除數 0.3 是小數", sub: "先把除數變成整數", tone: "warn" }, duration: 3400 },
    { step: "步驟 3：把除數放大成整數", id: 3, caption: "同時把除數 0.3 和被除數 12.6 都乘 10：變成 126 ÷ 3，除數就變整數了！", ask: { prompt: "12.6 ÷ 0.3 同乘 10 後變成？", options: ["126 ÷ 3", "12.6 ÷ 3", "126 ÷ 0.3", "12.6 ÷ 30"], answer: 0, hint: "除數 0.3×10=3，被除數 12.6×10=126。" }, action: "point", prop: { kind: "flow", steps: ["除數 0.3 ×10", "被除數 12.6 ×10", "變成 126 ÷ 3", "照整數除法算"], active: 2 }, duration: 3600 },
    { step: "步驟 4：用天平確認等式不變", id: 4, caption: "天平左邊 12.6 ÷ 0.3，右邊 126 ÷ 3，因為兩邊同乘 10，商保持不變。", action: "point", prop: { kind: "balance", left: "12.6 ÷ 0.3", right: "126 ÷ 3", tip: "同乘 10，商不變" }, duration: 3600 },
    { step: "步驟 5：為什麼同乘商不變", id: 5, caption: "記住道理：被除數和除數同乘同一個數，商不變，所以兩邊才會相等。", action: "point", prop: { kind: "text", text: "被除數、除數同乘一數 → 商不變", sub: "這就是可以放大的原因", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你動手算 8.4 ÷ 0.4", id: 6, caption: "輪到你：8.4 ÷ 0.4，兩邊同乘 10 變 84 ÷ 4，答案等於多少？", ask: { prompt: "8.4 ÷ 0.4 等於多少？", options: ["21", "2.1", "0.21", "210"], answer: 0, hint: "兩邊同乘 10：84 ÷ 4，你想想 84 裡有幾個 4。" }, action: "think", prop: { kind: "text", text: "8.4 ÷ 0.4 → 同×10 → 84 ÷ 4 = 21", sub: "除數先變整數", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰 2.4 ÷ 0.6", id: 7, caption: "再挑戰：2.4 ÷ 0.6，兩邊同乘 10 變 24 ÷ 6，答案是多少？", ask: { prompt: "2.4 ÷ 0.6 等於多少？", options: ["4", "0.4", "40", "0.04"], answer: 0, hint: "同乘 10：24 ÷ 6，24 裡有幾個 6。" }, action: "think", prop: { kind: "text", text: "2.4 ÷ 0.6 → 同×10 → 24 ÷ 6 = 4", sub: "除數先變整數", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：找出沒放大的錯誤", id: 8, caption: "常見錯誤：只把除數 0.4 乘 10，卻忘了 8.4 也要乘，算出 2.1 就錯了！", action: "jump", prop: { kind: "text", text: "錯：只把 0.4×10 → 8.4÷4=2.1 ✗", sub: "除數被除數要一起乘", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：除數是小數，兩邊同乘變整數，再照整數除法算。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-decimal-divide-1", prompt: "算 4.8 ÷ 0.2，要先同乘幾？", options: ["乘 10", "乘 100", "乘 5", "不用乘"], answer: 0, hints: ["除數 0.2 是 1 位小數", "乘 10 讓 0.2 變 2"], explanation: "除數 0.2 有 1 位小數，兩邊同乘 10 變成 48 ÷ 2。" },
    { id: "el-math-decimal-divide-2", prompt: "6.3 ÷ 0.7 等於多少？", options: ["9", "0.9", "90", "0.09"], answer: 0, hints: ["同乘 10 → 63 ÷ 7", "63 裡有幾個 7"], explanation: "同乘 10：63 ÷ 7 = 9。" },
    { id: "el-math-decimal-divide-3", prompt: "一瓶果汁 0.5 公升，3.5 公升能倒滿幾瓶？", options: ["7 瓶", "70 瓶", "0.7 瓶", "35 瓶"], answer: 0, hints: ["3.5 ÷ 0.5", "同乘 10 → 35 ÷ 5"], explanation: "3.5 ÷ 0.5，同乘 10 變 35 ÷ 5 = 7，能倒滿 7 瓶。" },
    { id: "el-math-decimal-divide-4", prompt: "14.4 ÷ 0.06 等於多少？", options: ["240", "24", "2.4", "0.24"], answer: 0, hints: ["除數 0.06 有 2 位小數，同乘 100", "1440 ÷ 6"], explanation: "同乘 100：1440 ÷ 6 = 240。" },
    { id: "el-math-decimal-divide-5", prompt: "下面哪一個和 9.6 ÷ 0.4 的商相同？", options: ["96 ÷ 4", "9.6 ÷ 4", "0.96 ÷ 4", "96 ÷ 0.4"], answer: 0, hints: ["0.4 是 1 位小數，同乘 10", "9.6×10=96，0.4×10=4"], explanation: "9.6 ÷ 0.4 同乘 10 變 96 ÷ 4 = 24；只有 96 ÷ 4 與它商相同。" },
    { id: "el-math-decimal-divide-6", prompt: "一條緞帶 7.2 公尺，每 0.8 公尺剪一段，可剪成幾段？", options: ["9 段", "0.9 段", "90 段", "8 段"], answer: 0, hints: ["7.2 ÷ 0.8", "同乘 10 → 72 ÷ 8"], explanation: "7.2 ÷ 0.8，同乘 10 變 72 ÷ 8 = 9，可剪成 9 段。" },
    { id: "el-math-decimal-divide-7", prompt: "6 ÷ 0.2 等於多少？（除數比 1 小）", options: ["30", "3", "0.3", "12"], answer: 0, hints: ["0.2 是 1 位小數，同乘 10 → 60 ÷ 2", "60 ÷ 2"], explanation: "6 ÷ 0.2，同乘 10 變 60 ÷ 2 = 30；除數比 1 小時，商反而比被除數大。" },
  ],
};

/* ========================================================================
 * 課程 3 — 分數除以整數（六上）
 * 核心：除以 n 等於乘以 1/n。圖解：pie → pies → text
 * ======================================================================== */
const EL_MATH_FRACTION_DIVIDE: OnionLesson = {
  id: "el-math-fraction-divide",
  title: "分數除以整數：分成幾份就好",
  subject: "數學",
  topic: "分數除以整數",
  grade: "六上",
  stages: ["國小"],
  desc: "分數除以整數就是平均分成幾份，洋蔥用圓餅切一切，告訴你其實等於乘以 1/n。",
  takeaways: ["分數 ÷ n ＝ 把這塊平均分成 n 份", "也等於 分子不動、分母 × n", "或想成 乘以 1/n", "分子剛好被 n 整除時，也可直接把分子除以 n"],
  frames: [
    { step: "步驟 1：用半塊蛋糕引入", id: 1, caption: "嗨！你有 1/2 塊蛋糕，要平分給 3 個人，每人分到多少？", action: "wave", prop: { kind: "pie", a: 1, b: 2, label: "1/2" }, duration: 3200 },
    { step: "步驟 2：把圓餅切成 3 等份", id: 2, caption: "把這 1/2 塊再平均分成 3 份，每份就是 1/6 塊。", ask: { prompt: "1/2 塊蛋糕平分給 3 人，每人多少？", options: ["1/6", "1/5", "1/3", "2/3"], answer: 0, hint: "把 1/2 分成 3 份，分母 2×3=6，得 1/6。" }, action: "point", prop: { kind: "pie", a: 1, b: 6, label: "1/6" }, duration: 3400 },
    { step: "步驟 3：用兩個圓餅對照", id: 3, caption: "左邊 1/2 除以 3，右邊 1/2 分成 3 份得 1/6，兩邊一樣！", action: "think", prop: { kind: "pies", left: { a: 1, b: 2 }, right: { a: 1, b: 2 }, result: { a: 1, b: 6 } }, duration: 3600 },
    { step: "步驟 4：記住規則：除以 n ＝ 乘 1/n", id: 4, caption: "規則：分數除以 3，就是乘以 1/3。1/2 × 1/3 = 1/6。", action: "point", prop: { kind: "text", text: "1/2 ÷ 3 = 1/2 × 1/3 = 1/6", sub: "除以 n 等於乘以 1/n", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：分子剛好整除的小訣竅", id: 5, caption: "補充：如果分子剛好能被除數整除，也可直接除分子，像 4/5 ÷ 2 就等於 2/5。", action: "point", prop: { kind: "text", text: "分子能整除：4/5 ÷ 2 = 2/5", sub: "或分母×2 得 4/10 再約分", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你動手算 2/5 ÷ 4", id: 6, caption: "試試 2/5 ÷ 4：把 2/5 分成 4 份，每份是 2/20，也就是 1/10。", ask: { prompt: "2/5 ÷ 4 等於多少？", options: ["1/10", "2/9", "8/5", "4/5"], answer: 0, hint: "分母 5 × 4 = 20，分子 2 不動，得 2/20 再約分。" }, action: "think", prop: { kind: "pie", a: 1, b: 10, label: "1/10" }, duration: 3600 },
    { step: "步驟 7：再挑戰 3/4 ÷ 6", id: 7, caption: "再挑戰：3/4 ÷ 6，分母 4×6=24、分子 3 不動，得到 3/24 也就是 1/8。", ask: { prompt: "3/4 ÷ 6 等於多少？", options: ["3/24", "18/4", "3/10", "24/3"], answer: 0, hint: "分母 4×6=24，分子 3 不動，得 3/24（即 1/8）。" }, action: "think", prop: { kind: "pie", a: 3, b: 24, label: "3/24" }, duration: 3600 },
    { step: "步驟 8：對照錯誤：去除分子", id: 8, caption: "常見錯誤：去把分子 2 除以 4，那就錯了！要讓分母 × 4，分子保持 2。", action: "jump", prop: { kind: "text", text: "錯：2/5 ÷ 4 = (2÷4)/5 = 錯", sub: "分子不動，分母×4", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：分數除以 n，分母乘 n、分子不動（或乘 1/n）。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-fraction-divide-1", prompt: "1/3 ÷ 2 等於多少？", options: ["1/6", "1/5", "2/3", "1/2"], answer: 0, hints: ["分母 3×2=6，分子 1 不動", "或想成 1/3 × 1/2"], explanation: "1/3 ÷ 2 = 1/(3×2) = 1/6。" },
    { id: "el-math-fraction-divide-2", prompt: "3/4 ÷ 3 等於多少？", options: ["1/4", "3/12", "9/4", "1/3"], answer: 0, hints: ["分母 4×3=12，分子 3 → 3/12", "3/12 = 1/4"], explanation: "3/4 ÷ 3 = 3/(4×3) = 3/12 = 1/4。" },
    { id: "el-math-fraction-divide-3", prompt: "一瓶水有 3/5 公升，平分給 3 人，每人幾公升？", options: ["1/5 公升", "3/15 公升", "1/3 公升", "3/8 公升"], answer: 0, hints: ["3/5 ÷ 3", "分母 5×3=15，分子 3 → 3/15 = 1/5"], explanation: "3/5 ÷ 3 = 3/(5×3) = 3/15 = 1/5 公升。" },
    { id: "el-math-fraction-divide-4", prompt: "2/7 ÷ 5 等於多少？", options: ["2/35", "10/7", "2/12", "7/10"], answer: 0, hints: ["分母 7×5=35，分子 2 不動", "2/7 × 1/5"], explanation: "2/7 ÷ 5 = 2/(7×5) = 2/35。" },
    { id: "el-math-fraction-divide-5", prompt: "下面哪一個等於 4/9 ÷ 2？", options: ["4/18 = 2/9", "8/9", "4/7", "2/9 ÷ 2"], answer: 0, hints: ["分母 9×2=18，分子 4 → 4/18", "4/18 約分是 2/9"], explanation: "4/9 ÷ 2 = 4/(9×2) = 4/18 = 2/9，選第一項。" },
    { id: "el-math-fraction-divide-6", prompt: "一條繩子 6/7 公尺，平分剪成 3 段，每段幾公尺？", options: ["2/7 公尺", "18/7 公尺", "6/4 公尺", "3/7 公尺"], answer: 0, hints: ["6/7 ÷ 3", "分子 6÷3=2，得 2/7"], explanation: "6/7 ÷ 3：分子 6 剛好被 3 整除，得 2/7 公尺。" },
    { id: "el-math-fraction-divide-7", prompt: "1/2 ÷ 4 和 1/2 × 1/4，兩個結果？", options: ["相等", "1/2÷4 較大", "1/2×1/4 較大", "無法比較"], answer: 0, hints: ["除以 4 就是乘以 1/4", "兩個算式相等"], explanation: "除以 n 等於乘以 1/n，所以 1/2÷4 = 1/2×1/4 = 1/8，兩者相等。" },
  ],
};

/* ========================================================================
 * 課程 4 — 百分比與打折（六上）
 * 核心：百分率＝部分÷全部；打折＝原價×折扣。圖解：bars → text
 * ======================================================================== */
const EL_MATH_PERCENT: OnionLesson = {
  id: "el-math-percent",
  title: "百分比與打折：每一百有幾個",
  subject: "數學",
  topic: "百分比與打折",
  grade: "六上",
  stages: ["國小"],
  desc: "百分率就是「每一百裡有幾個」，打折就是原價乘折扣，洋蔥用長條圖算得清清楚楚。",
  takeaways: ["百分率 ＝ 部分 ÷ 全部 × 100%", "打 8 折 ＝ 原價 × 0.8", "打折後價格 ＝ 原價 × 折扣", "打幾折就是付原價的百分之幾（8 折＝80%）"],
  frames: [
    { step: "步驟 1：用全班人數引入百分率", id: 1, caption: "嗨！全班 40 人裡有 10 人戴眼鏡，這佔百分之幾？我們用長條圖看！", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：把班級畫成兩段長條", id: 2, caption: "全班 40 人：戴眼鏡 10 人、沒戴 30 人，先記下這兩個數字。", action: "point", prop: { kind: "bars", items: [{ label: "戴眼鏡", value: 10 }, { label: "沒戴", value: 30 }], unit: "人" }, duration: 3400 },
    { step: "步驟 3：算百分率 部分÷全部", id: 3, caption: "百分率＝部分÷全部：10 ÷ 40 = 0.25 = 25%，沒戴的 30 人就是 75%。", ask: { prompt: "10 ÷ 40 的百分率是多少？", options: ["25%", "40%", "10%", "4%"], answer: 0, hint: "10÷40=0.25，0.25×100%=25%。" }, action: "think", prop: { kind: "bars", items: [{ label: "戴眼鏡%", value: 25 }, { label: "沒戴%", value: 75 }], unit: "%" }, duration: 3600 },
    { step: "步驟 4：記住百分率公式", id: 4, caption: "公式記起來：百分率 ＝ 部分 ÷ 全部 × 100%。10 ÷ 40 × 100% = 25%。", action: "point", prop: { kind: "text", text: "百分率 ＝ 部分 ÷ 全部 × 100%", sub: "10 ÷ 40 × 100% = 25%", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：小數和百分率互換", id: 5, caption: "觀念：百分率就是小數乘 100%，所以 0.25 就是 25%、0.1 就是 10%。", action: "point", prop: { kind: "text", text: "小數↔百分率：0.25 = 25%", sub: "小數 × 100% 得百分率", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你動手算打 8 折", id: 6, caption: "書包原價 500 元，打 8 折等於乘以 0.8，要付多少錢？", ask: { prompt: "原價 500 元打 8 折，要付多少？", options: ["400 元", "40 元", "450 元", "80 元"], answer: 0, hint: "打 8 折＝原價 × 0.8，500 × 0.8 是多少？" }, action: "think", prop: { kind: "text", text: "原價 500 元，打 8 折 = 500 × 0.8", sub: "500 × 0.8 = 400 元", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰打 9 折", id: 7, caption: "再挑戰：原價 300 元打 9 折，等於乘以 0.9，要付多少錢？", ask: { prompt: "原價 300 元打 9 折，要付多少？", options: ["270 元", "27 元", "30 元", "90 元"], answer: 0, hint: "打 9 折＝原價 × 0.9，300 × 0.9 是多少？" }, action: "think", prop: { kind: "text", text: "300 × 0.9 = 270 元", sub: "9 折就是原價的 90%", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照打折與減價的錯誤", id: 8, caption: "常見錯誤：把打 8 折當成減 8 元。其實是 500 × 0.8 = 400 元！", action: "jump", prop: { kind: "bars", items: [{ label: "原價", value: 500 }, { label: "打折後", value: 400 }], unit: "元" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：百分率＝部分÷全部×100%；打折＝原價×折扣。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-percent-1", prompt: "20 人中有 5 人遲到，百分率是？", options: ["25%", "20%", "5%", "75%"], answer: 0, hints: ["5 ÷ 20 = 0.25", "0.25 × 100% = 25%"], explanation: "5 ÷ 20 = 0.25 = 25%。" },
    { id: "el-math-percent-2", prompt: "打 9 折等於乘以多少？", options: ["0.9", "0.09", "9", "0.1"], answer: 0, hints: ["幾折就是十分之幾", "9 折 = 9/10 = 0.9"], explanation: "打 9 折＝原價 × 0.9。" },
    { id: "el-math-percent-3", prompt: "原價 200 元打 7 折，售價多少？", options: ["140 元", "70 元", "130 元", "14 元"], answer: 0, hints: ["200 × 0.7", "7 折 = 0.7"], explanation: "200 × 0.7 = 140 元。" },
    { id: "el-math-percent-4", prompt: "班上有 50 人，20 人喜歡紅色，百分率多少？", options: ["40%", "20%", "25%", "50%"], answer: 0, hints: ["20 ÷ 50 = 0.4", "0.4 × 100% = 40%"], explanation: "20 ÷ 50 = 0.4 = 40%。" },
    { id: "el-math-percent-5", prompt: "下面哪一句對「打 8 折」的描述正確？", options: ["是原價的 80%", "是原價減 80 元", "是原價的 8%", "付原價再加上 8 元"], answer: 0, hints: ["8 折 = 8/10 = 0.8", "也就是原價的 80%"], explanation: "打 8 折＝原價 × 0.8，也就是付原價的 80%。" },
    { id: "el-math-percent-6", prompt: "一件衣服原價 800 元，打 75 折要付多少元？", options: ["600 元", "75 元", "60 元", "725 元"], answer: 0, hints: ["800 × 0.75", "75 折 = 0.75"], explanation: "打 75 折＝原價 × 0.75，800 × 0.75 = 600 元。" },
    { id: "el-math-percent-7", prompt: "全班 50 人，考試及格 45 人，及格率是多少？", options: ["90%", "45%", "9%", "5%"], answer: 0, hints: ["45 ÷ 50 = 0.9", "0.9 × 100% = 90%"], explanation: "及格率＝及格人數÷全班×100%＝45÷50=0.9=90%。" },
  ],
};

/* ========================================================================
 * 課程 5 — 比與比值（六下）
 * 核心：前項：後項、比值＝前項÷後項。圖解：balance → text
 * ======================================================================== */
const EL_MATH_RATIO: OnionLesson = {
  id: "el-math-ratio",
  title: "比與比值：前項除以後項",
  subject: "數學",
  topic: "比與比值",
  grade: "六下",
  stages: ["國小"],
  desc: "比就像天平兩邊的重量，洋蔥用天平教你前項、後項和比值，一看就懂誰比誰多。",
  takeaways: ["比寫成 前項：後項", "比值 ＝ 前項 ÷ 後項", "同乘同除比值不變", "比的前後項順序不能顛倒，誰比誰要看清楚"],
  frames: [
    { step: "步驟 1：用蘋果橘子引入", id: 1, caption: "嗨！盤子裡有 6 顆蘋果、4 顆橘子，蘋果和橘子的比是多少？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：用天平擺出 6 比 4", id: 2, caption: "天平左邊放 6 顆蘋果、右邊放 4 顆橘子，蘋果：橘子 ＝ 6 ：4。", action: "point", prop: { kind: "balance", left: "蘋果 6", right: "橘子 4", tip: "前項：後項 = 6：4" }, duration: 3400 },
    { step: "步驟 3：把比化簡成 3：2", id: 3, caption: "6 和 4 都能除以 2，所以 6：4 可以化成簡單的 3：2。", ask: { prompt: "6：4 可以化成最簡比？", options: ["3：2", "2：3", "6：4", "1：2"], answer: 0, hint: "同除以 2：6÷2=3、4÷2=2。" }, action: "think", prop: { kind: "text", text: "6：4 = (6÷2)：(4÷2) = 3：2", sub: "同除以 2", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：算比值 前項÷後項", id: 4, caption: "比值就是「前項 ÷ 後項」：3 ÷ 2 ＝ 1.5，所以比值是 1.5。", action: "point", prop: { kind: "balance", left: "比值 = 前項 ÷ 後項", right: "3 ÷ 2 ＝ 1.5", tip: "比值是一個數" }, duration: 3600 },
    { step: "步驟 5：比的順序不能顛倒", id: 5, caption: "觀念：順序不能顛倒，蘋果：橘子＝6：4，倒過來 4：6 意思就不一樣。", action: "point", prop: { kind: "text", text: "順序很重要：6：4 ≠ 4：6", sub: "誰比誰要看清楚", tone: "warn" }, duration: 3400 },
    { step: "步驟 6：輪到你算 8：2 的比值", id: 6, caption: "輪到你：男生 8 人、女生 2 人，男生：女生的比值是 8 ÷ 2 ＝ 多少？", ask: { prompt: "男生 8 人、女生 2 人，比值是多少？", options: ["4", "6", "8", "2"], answer: 0, hint: "比值＝前項 ÷ 後項：8 ÷ 2。" }, action: "think", prop: { kind: "text", text: "8：2 → 比值 = 8 ÷ 2 = 4", sub: "前項除後項", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰糖與水的比", id: 7, caption: "再挑戰：糖 2 公克、水 8 公克，糖：水可以化成最簡比多少？", ask: { prompt: "糖 2、水 8，糖：水的最簡比是？", options: ["1：4", "4：1", "2：8", "1：8"], answer: 0, hint: "2：8 同除以 2，得 1：4。" }, action: "think", prop: { kind: "text", text: "2：8 = (2÷2)：(8÷2) = 1：4", sub: "同除以最大公因數", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照比和比值的不同", id: 8, caption: "別搞混：3：2 是一個「比」，而 1.5 是它的「比值」，兩者不一樣喔！", action: "jump", prop: { kind: "text", text: "比 3：2 ≠ 比值 1.5", sub: "比是兩數關係，比值是單一數", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：比寫前項：後項，比值是前項÷後項。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-ratio-1", prompt: "比 10：5 化成最簡比是？", options: ["2：1", "5：10", "1：2", "10：5"], answer: 0, hints: ["10 和 5 同除以 5", "10÷5=2，5÷5=1"], explanation: "10：5 同除以 5 得 2：1。" },
    { id: "el-math-ratio-2", prompt: "比 3：6 的比值是多少？", options: ["0.5", "2", "3", "6"], answer: 0, hints: ["比值＝前項÷後項", "3 ÷ 6 = 0.5"], explanation: "3 ÷ 6 = 0.5，所以比值是 0.5。" },
    { id: "el-math-ratio-3", prompt: "紅球 4 個、白球 8 個，紅：白的比是多少？", options: ["1：2", "2：1", "4：8", "1：4"], answer: 0, hints: ["4：8 再同除以 4", "4÷4=1，8÷4=2"], explanation: "4：8 同除以 4 化成最簡比 1：2。" },
    { id: "el-math-ratio-4", prompt: "比值是 2.5，前項 10，後項多少？", options: ["4", "25", "2.5", "10"], answer: 0, hints: ["後項＝前項÷比值", "10 ÷ 2.5 = 4"], explanation: "後項 ＝ 前項 ÷ 比值 ＝ 10 ÷ 2.5 = 4。" },
    { id: "el-math-ratio-5", prompt: "下面哪一組比的比值相同？", options: ["2：3 和 4：6", "2：3 和 3：2", "4：6 和 6：4", "3：1 和 1：3"], answer: 0, hints: ["比值分別算：2/3、4/6", "4/6 約分後也是 2/3"], explanation: "2：3 比值 2/3，4：6 比值 4/6 = 2/3，兩者比值相同；選 2：3 和 4：6。" },
    { id: "el-math-ratio-6", prompt: "男生 12 人、女生 16 人，男：女的最簡比是？", options: ["3：4", "4：3", "12：16", "2：3"], answer: 0, hints: ["12：16", "同除以 4 → 3：4"], explanation: "12：16 同除以最大公因數 4，得 3：4。" },
    { id: "el-math-ratio-7", prompt: "比 3：5 的比值是多少？", options: ["3/5", "5/3", "1.5", "8"], answer: 0, hints: ["比值＝前項÷後項", "3 ÷ 5"], explanation: "比值＝前項÷後項＝3÷5＝3/5。" },
  ],
};

/* ========================================================================
 * 課程 6 — 平行四邊形與梯形面積（五上）
 * 核心：平行四邊形＝底×高；梯形＝（上底＋下底）×高÷2。圖解：shape
 * ======================================================================== */
const EL_MATH_POLYGON_AREA: OnionLesson = {
  id: "el-math-polygon-area",
  title: "平行四邊形與梯形面積",
  subject: "數學",
  topic: "平行四邊形與梯形面積",
  grade: "五上",
  stages: ["國小"],
  desc: "把平行四邊形變長方形、梯形變兩個三角形，洋蔥用幾何形告訴你面積公式怎麼來。",
  takeaways: ["平行四邊形面積 ＝ 底 × 高", "梯形面積 ＝（上底＋下底）× 高 ÷ 2", "公式都來自「割補」成學過的圖形", "梯形公式的 ÷2 來自「兩個梯形拼成一個平行四邊形」"],
  frames: [
    { step: "步驟 1：用農地引入平行四邊形", id: 1, caption: "嗨！這塊平行四邊形農地，底 6 公尺、高 4 公尺，面積怎麼算呢？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：割補成長方形", id: 2, caption: "左邊三角形切下補到右邊，變成底 6、高 4 的長方形。", action: "point", prop: { kind: "shape", shape: "rect", base: 6, height: 4, label: "底6 高4" }, duration: 3400 },
    { step: "步驟 3：平行四邊形面積公式", id: 3, caption: "平行四邊形面積＝底 × 高。底 6 乘高 4 等於 24 平方公尺。", ask: { prompt: "平行四邊形面積怎麼算？", options: ["底×高", "（上底＋下底）×高÷2", "邊長×4", "底＋高"], answer: 0, hint: "從長方形而來，面積＝底×高。" }, action: "think", prop: { kind: "text", text: "平行四邊形面積 ＝ 底 × 高", sub: "6 × 4 ＝ 24 平方公尺", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：看梯形並標出上下底", id: 4, caption: "梯形可拼成寬 4、高 4 的長方形來想。", action: "point", prop: { kind: "shape", shape: "rect", base: 4, height: 4, label: "（3＋5）÷2＝4" }, duration: 3400 },
    { step: "步驟 5：梯形為什麼要除以 2", id: 5, caption: "想通了嗎？兩個完全一樣的梯形，上下顛倒拼成一個平行四邊形，所以要除以 2。", action: "point", prop: { kind: "text", text: "2 個梯形拼成 1 個平行四邊形", sub: "所以梯形面積要 ÷2", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：梯形面積公式", id: 6, caption: "梯形面積＝（上底 3 ＋ 下底 5）× 高 4 ÷ 2，先加再乘高最後除以 2。", ask: { prompt: "上底 3、下底 5、高 4 的梯形，面積多少？", options: ["16", "8", "32", "24"], answer: 0, hint: "（3＋5）×4＝32，再 ÷2 ＝ 16。" }, action: "think", prop: { kind: "text", text: "梯形面積＝（上底＋下底）×高÷2", sub: "（3＋5）×4÷2＝16", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰平行四邊形", id: 7, caption: "再挑戰：平行四邊形底 8、高 5，面積是多少？", ask: { prompt: "平行四邊形底 8、高 5，面積多少？", options: ["40", "13", "30", "45"], answer: 0, hint: "面積＝底×高：8×5。" }, action: "think", prop: { kind: "text", text: "底8 × 高5 = 40", sub: "平行四邊形面積＝底×高", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照常見錯誤", id: 8, caption: "常見錯誤：把梯形當平行四邊形直接底×高，忘記（上底＋下底）和除以 2！", action: "jump", prop: { kind: "text", text: "錯：梯形直接 底×高（忘了÷2）", sub: "梯形要（上底＋下底）×高÷2", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：平行四邊形底×高；梯形（上底＋下底）×高÷2。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-polygon-area-1", prompt: "平行四邊形底 5、高 3，面積？", options: ["15", "8", "1.5", "10"], answer: 0, hints: ["面積＝底×高", "5 × 3"], explanation: "5 × 3 = 15。" },
    { id: "el-math-polygon-area-2", prompt: "梯形上底 2、下底 4、高 3，面積？", options: ["9", "6", "18", "3"], answer: 0, hints: ["（2＋4）×3÷2", "6×3÷2=9"], explanation: "（2＋4）×3÷2 = 6×3÷2 = 9。" },
    { id: "el-math-polygon-area-3", prompt: "平行四邊形底 7 高 6，面積多少平方公尺？", options: ["42", "13", "26", "48"], answer: 0, hints: ["7 × 6", "底×高"], explanation: "7 × 6 = 42 平方公尺。" },
    { id: "el-math-polygon-area-4", prompt: "梯形上底 6、下底 10、高 5，面積？", options: ["40", "16", "80", "30"], answer: 0, hints: ["（6＋10）=16", "16×5÷2=40"], explanation: "（6＋10）×5÷2 = 16×5÷2 = 40。" },
    { id: "el-math-polygon-area-5", prompt: "兩個完全一樣的梯形可以拼成什麼，幫助記公式？", options: ["平行四邊形", "三角形", "圓形", "長條圖"], answer: 0, hints: ["兩個梯形上下顛倒拼", "底變成（上底＋下底）"], explanation: "兩個相同梯形可拼成一個平行四邊形，其底為（上底＋下底），所以梯形面積＝（上底＋下底）×高÷2。" },
    { id: "el-math-polygon-area-6", prompt: "平行四邊形底 10、高 7，面積多少？", options: ["70", "17", "35", "7"], answer: 0, hints: ["10 × 7", "底×高"], explanation: "平行四邊形面積＝底×高＝10×7=70。" },
    { id: "el-math-polygon-area-7", prompt: "梯形上底 4、下底 6、高 4，面積多少？", options: ["20", "40", "10", "24"], answer: 0, hints: ["（4＋6）×4÷2", "10×4÷2=20"], explanation: "（4＋6）×4÷2 = 10×4÷2 = 20。" },
  ],
};

/* ========================================================================
 * 課程 7 — 比例尺與縮放圖（六上）
 * 核心：比例尺 1:100 的意義。圖解：text → flow
 * ======================================================================== */
const EL_MATH_SCALE_DRAWING: OnionLesson = {
  id: "el-math-scale-drawing",
  title: "比例尺與縮放圖：圖上 1 代表多少",
  subject: "數學",
  topic: "比例尺與縮放圖",
  grade: "六上",
  stages: ["國小"],
  desc: "比例尺 1：100 就是圖上 1 公分代表實際 100 公分，洋蔥用流程圖教你放大縮小不迷路。",
  takeaways: ["比例尺 1：n ＝ 圖上 1 單位代表實際 n 單位", "實際長 ＝ 圖上長 × 比例尺後項", "圖上長 ＝ 實際長 ÷ 比例尺後項", "換算前先把圖上和實際的單位化成一樣"],
  frames: [
    { step: "步驟 1：用地圖引入比例尺", id: 1, caption: "嗨！這張地圖寫著 1：100，圖上 1 公分到底代表真實多少？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：讀懂比例尺 1：100", id: 2, caption: "比例尺 1：100 表示：圖上 1 公分，等於實際距離 100 公分。", action: "point", prop: { kind: "text", text: "比例尺 1：100", sub: "圖上 1 公分 ＝ 實際 100 公分", tone: "ok" }, duration: 3400 },
    { step: "步驟 3：圖上長換實際長", id: 3, caption: "想知道實際多長？把圖上長乘以 100：圖上 3 公分 × 100 ＝ 300 公分。", ask: { prompt: "圖上 3 公分 × 100 實際多少？", options: ["300 公分", "3 公分", "30 公分", "100 公分"], answer: 0, hint: "圖上長 × 後項 100：3 × 100。" }, action: "think", prop: { kind: "flow", steps: ["看圖上長 3", "乘比例尺後項 100", "得到實際 300"], active: 1 }, duration: 3600 },
    { step: "步驟 4：實際長換圖上長", id: 4, caption: "反過來，實際 500 公分要畫多長？500 ÷ 100 ＝ 5 公分。", action: "point", prop: { kind: "flow", steps: ["看實際長 500", "除以比例尺後項 100", "得到圖上 5"], active: 1 }, duration: 3600 },
    { step: "步驟 5：前後單位要一樣", id: 5, caption: "觀念：比例尺前後單位要一樣，圖上 1 公分對應實際 100 公分，差了 100 倍。", action: "point", prop: { kind: "text", text: "圖上：實際 = 1：100", sub: "兩邊單位要先化成一樣", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你動手算圖上 4 公分", id: 6, caption: "輪到你：圖上量到 4 公分，實際是 4 × 100 ＝ 多少公分？", ask: { prompt: "比例尺 1：100，圖上 4 公分等於實際幾公分？", options: ["400 公分", "4 公分", "100 公分", "40 公分"], answer: 0, hint: "圖上長 × 後項 100：4 × 100。" }, action: "think", prop: { kind: "text", text: "圖上 4 公分 × 100 ＝ 400 公分", sub: "圖上×後項得實際", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰比例尺 1：50", id: 7, caption: "再挑戰：比例尺 1：50，圖上量到 6 公分，實際是多少公分？", ask: { prompt: "比例尺 1：50，圖上 6 公分實際多少？", options: ["300 公分", "6 公分", "50 公分", "60 公分"], answer: 0, hint: "圖上長 × 後項 50：6 × 50。" }, action: "think", prop: { kind: "text", text: "圖上 6 公分 × 50 ＝ 300 公分", sub: "圖上×後項得實際", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照忘記換算的錯誤", id: 8, caption: "常見錯誤：直接把圖上 4 公分當成實際 4 公分，記得要乘 100 才對！", action: "jump", prop: { kind: "text", text: "錯：圖上 4 公分就寫 4 公分", sub: "要乘 100 才是實際", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：圖上×後項得實際，實際÷後項得圖上。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-scale-drawing-1", prompt: "比例尺 1：50，圖上 1 公分代表實際？", options: ["50 公分", "5 公分", "1 公分", "500 公分"], answer: 0, hints: ["後項就是實際倍數", "圖上 1 × 50"], explanation: "1：50 表示圖上 1 公分＝實際 50 公分。" },
    { id: "el-math-scale-drawing-2", prompt: "圖上 2 公分、比例尺 1：100，實際幾公分？", options: ["200 公分", "2 公分", "100 公分", "20 公分"], answer: 0, hints: ["2 × 100", "圖上×後項"], explanation: "2 × 100 = 200 公分。" },
    { id: "el-math-scale-drawing-3", prompt: "實際 600 公分、比例尺 1：100，圖上幾公分？", options: ["6 公分", "60 公分", "600 公分", "0.6 公分"], answer: 0, hints: ["600 ÷ 100", "實際÷後項"], explanation: "600 ÷ 100 = 6 公分。" },
    { id: "el-math-scale-drawing-4", prompt: "比例尺 1：20，圖上 5 公分實際多少公分？", options: ["100 公分", "5 公分", "20 公分", "25 公分"], answer: 0, hints: ["5 × 20", "圖上×後項"], explanation: "5 × 20 = 100 公分。" },
    { id: "el-math-scale-drawing-5", prompt: "比例尺 1：100 和 1：50，哪一個圖「放大得比較大」？", options: ["1：50", "1：100", "一樣大", "無法比較"], answer: 0, hints: ["後項越小，同圖上長代表實際越短", "1：50 的實際是 1：100 的一半，所以圖較大"], explanation: "後項越小，縮放倍率越小、同樣圖上長對應的實際越短，表示圖放大得比較大，所以 1：50 比 1：100 放大得多。" },
    { id: "el-math-scale-drawing-6", prompt: "比例尺 1：200，圖上 3 公分代表實際幾公分？", options: ["600 公分", "3 公分", "200 公分", "60 公分"], answer: 0, hints: ["3 × 200", "圖上×後項"], explanation: "3 × 200 = 600 公分。" },
    { id: "el-math-scale-drawing-7", prompt: "實際 800 公分、比例尺 1：100，圖上要畫幾公分？", options: ["8 公分", "80 公分", "800 公分", "0.8 公分"], answer: 0, hints: ["800 ÷ 100", "實際÷後項"], explanation: "800 ÷ 100 = 8 公分。" },
  ],
};

/* ========================================================================
 * 課程 8 — 年月日與日期計算（三上）
 * 核心：大月小月、平年閏年、日期相差。圖解：text → flow
 * ======================================================================== */
const EL_MATH_CALENDAR: OnionLesson = {
  id: "el-math-calendar",
  title: "年月日與日期計算：算相差幾天",
  subject: "數學",
  topic: "年月日與日期計算",
  grade: "三上",
  stages: ["國小"],
  desc: "一三五七八十臘，三十一天永不差！洋蔥用歌訣和流程圖教你算日期相差幾天。",
  takeaways: ["大月 31 天、小月 30 天、二月特殊", "平年 365 天、閏年 366 天", "算相差天數要逐月加總", "跨月算相差天數，要先算前月剩幾天再加後月幾天"],
  frames: [
    { step: "步驟 1：用生日引入年月日", id: 1, caption: "嗨！一年有幾個月？每個月天數一樣嗎？今天我們來搞懂日曆。", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：記大月小月歌訣", id: 2, caption: "歌訣：一三五七八十臘，三十一天（31）永不差；小月 30 天，二月 28 或 29。", action: "point", prop: { kind: "text", text: "一三五七八十臘，31 天永不差", sub: "其餘 30 天，二月 28 或 29", tone: "ok" }, duration: 3600 },
    { step: "步驟 3：認識平年閏年", id: 3, caption: "平年 365 天、閏年 366 天。通常年份除以 4 能整除就是閏年，二月多 1 天。", ask: { prompt: "平年有多少天？", options: ["365 天", "366 天", "364 天", "360 天"], answer: 0, hint: "閏年 366，平年少 1 天。" }, action: "think", prop: { kind: "text", text: "平年 365 天，閏年 366 天", sub: "年份÷4 整除（且非百年）為閏年", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：用流程算日期相差", id: 4, caption: "算相差天數：從起月加到終月，把中間整月的天數加起來。", action: "point", prop: { kind: "flow", steps: ["看起月", "加滿月天數", "加不足月天數", "得相差天數"], active: 1 }, duration: 3600 },
    { step: "步驟 5：跨月要分月相加", id: 5, caption: "看跨月：3 月 30 日到 4 月 2 日，先算 3 月剩 1 天、再加 4 月 2 天，共 3 天。", action: "point", prop: { kind: "text", text: "3/30 → 4/2：1 天 + 2 天 = 3 天", sub: "跨月要分月相加", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你算 3 月 1 到 3 月 10", id: 6, caption: "輪到你：3 月 1 日到 3 月 10 日，中間差幾天？（不含首日）", ask: { prompt: "3 月 1 日到 3 月 10 日相差幾天？", options: ["9 天", "10 天", "11 天", "8 天"], answer: 0, hint: "10 − 1 ＝ 9，不算第一天自己。" }, action: "think", prop: { kind: "text", text: "3/1 → 3/10：10 − 1 ＝ 9 天", sub: "同月相減即可", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰 7 月 15 到 7 月 20", id: 7, caption: "再挑戰：7 月 15 日到 7 月 20 日，相差幾天？（不含首日）", ask: { prompt: "7 月 15 日到 7 月 20 日相差幾天？", options: ["5 天", "6 天", "7 天", "4 天"], answer: 0, hint: "20 − 15 ＝ 5，不算第一天自己。" }, action: "think", prop: { kind: "text", text: "7/15 → 7/20：20 − 15 = 5 天", sub: "同月相減即可", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照跨月忘加天數", id: 8, caption: "常見錯誤：跨月時忘記把舊月剩下的天數加上，才會算錯！", action: "jump", prop: { kind: "text", text: "錯：3/30 → 4/2 只算 2 天", sub: "要加 3 月剩 1 天＋4 月 2 天", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：大月 31、小月 30、二月最特別；算相差，整月相加別漏天。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-calendar-1", prompt: "下列哪一個月是大月（31 天）？", options: ["三月", "四月", "六月", "九月"], answer: 0, hints: ["一三五七八十臘是大月", "三月排第三，是大月"], explanation: "三月是大月，有 31 天；四、六、九月是小月 30 天。" },
    { id: "el-math-calendar-2", prompt: "平年二月有幾天？", options: ["28 天", "29 天", "30 天", "31 天"], answer: 0, hints: ["平年比閏年少 1 天", "平年 365 天"], explanation: "平年二月 28 天，閏年二月 29 天。" },
    { id: "el-math-calendar-3", prompt: "閏年一年有幾天？", options: ["366 天", "365 天", "364 天", "367 天"], answer: 0, hints: ["平年 365 加閏日 1 天", "二月多 1 天"], explanation: "閏年二月 29 天，全年 366 天。" },
    { id: "el-math-calendar-4", prompt: "4 月 5 日到 4 月 12 日相差幾天？", options: ["7 天", "12 天", "6 天", "5 天"], answer: 0, hints: ["12 − 5 ＝ 7", "不含首日"], explanation: "12 − 5 = 7 天。" },
    { id: "el-math-calendar-5", prompt: "下面哪一個年份是閏年？", options: ["2024 年", "2023 年", "2025 年", "1900 年"], answer: 0, hints: ["年份÷4 能整除", "2024 ÷ 4 = 506 整除"], explanation: "2024 ÷ 4 = 506 能整除，是閏年；2023、2025 不能整除；1900 是百年且÷400 不整除，不是閏年。" },
    { id: "el-math-calendar-6", prompt: "6 月 8 日到 6 月 15 日相差幾天？", options: ["7 天", "8 天", "6 天", "5 天"], answer: 0, hints: ["15 − 8 = 7", "不含首日"], explanation: "15 − 8 = 7 天。" },
    { id: "el-math-calendar-7", prompt: "下列哪一個月是小月（30 天）？", options: ["四月", "三月", "一月", "十二月"], answer: 0, hints: ["一三五七八十臘是大月", "四月不在大月裡"], explanation: "四月是小月 30 天；三、一、十二月都是大月 31 天。" },
  ],
};

/* ========================================================================
 * 課程 9 — 重量與容量（三下）
 * 核心：公斤／公克、公升／毫升的換算。圖解：bars → flow
 * ======================================================================== */
const EL_MATH_WEIGHT_CAPACITY: OnionLesson = {
  id: "el-math-weight-capacity",
  title: "重量與容量：公斤公克、公升毫升",
  subject: "數學",
  topic: "重量與容量",
  grade: "三下",
  stages: ["國小"],
  desc: "1 公斤等於 1000 公克，1 公升等於 1000 毫升，洋蔥用長條圖讓單位換算一目了然。",
  takeaways: ["1 公斤 = 1000 公克", "1 公升 = 1000 毫升", "大換小用乘 1000，小換大用除 1000", "不滿 1000 時用複名數，如 2500 公克 ＝ 2 公斤 500 公克"],
  frames: [
    { step: "步驟 1：用水果重量引入", id: 1, caption: "嗨！一顆西瓜 2 公斤，等於幾公克？重量單位怎麼換算呢？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：看公斤與公克的長條", id: 2, caption: "1 公克很小，1000 個 1 公克才拼成 1 公斤，所以 1 公斤 = 1000 公克。", action: "point", prop: { kind: "bars", items: [{ label: "1公克", value: 1 }, { label: "1公斤", value: 1000 }], unit: "公克" }, duration: 3400 },
    { step: "步驟 3：大換小用乘法", id: 3, caption: "西瓜 2 公斤換公克：2 × 1000 ＝ 2000 公克，大換小用乘。", ask: { prompt: "2 公斤換成公克是？", options: ["2000 公克", "200 公克", "2 公克", "20 公克"], answer: 0, hint: "大換小×1000：2 × 1000。" }, action: "think", prop: { kind: "bars", items: [{ label: "2公斤", value: 2000 }, { label: "1公斤", value: 1000 }], unit: "公克" }, duration: 3600 },
    { step: "步驟 4：公升與毫升的換算", id: 4, caption: "容量也一樣：1 公升 = 1000 毫升，換算和重量用同一招。", action: "point", prop: { kind: "flow", steps: ["1公升", "= 1000毫升", "大換小×1000", "小換大÷1000"], active: 1 }, duration: 3600 },
    { step: "步驟 5：不剛好時用複名數", id: 5, caption: "觀念：不剛好滿 1000 時用複名數，2500 公克就是 2 公斤 500 公克。", action: "point", prop: { kind: "text", text: "2500 公克 = 2 公斤 500 公克", sub: "1000 公克 = 1 公斤", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你動手算 3 公升", id: 6, caption: "輪到你：3 公升的果汁等於幾毫升？大換小要怎麼算？", ask: { prompt: "3 公升等於幾毫升？", options: ["3000 毫升", "300 毫升", "3 毫升", "30 毫升"], answer: 0, hint: "公升換毫升是大換小，乘 1000：3 × 1000。" }, action: "think", prop: { kind: "text", text: "3 公升 = 3 × 1000 = 3000 毫升", sub: "大換小乘 1000", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰 4000 公克", id: 7, caption: "再挑戰：4000 公克等於幾公斤？小換大要怎麼算？", ask: { prompt: "4000 公克等於幾公斤？", options: ["4 公斤", "40 公斤", "400 公斤", "0.4 公斤"], answer: 0, hint: "小換大÷1000：4000 ÷ 1000。" }, action: "think", prop: { kind: "text", text: "4000 ÷ 1000 = 4 公斤", sub: "小換大除 1000", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照小換大的錯誤", id: 8, caption: "反過來 5000 公克換公斤：5000 ÷ 1000 ＝ 5 公斤，小換大用除。", action: "jump", prop: { kind: "bars", items: [{ label: "5000公克", value: 5000 }, { label: "5公斤", value: 5 }], unit: "公斤" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：公斤對公克、公升對毫升，都是 ×1000／÷1000。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-weight-capacity-1", prompt: "4 公斤等於幾公克？", options: ["4000 公克", "400 公克", "40 公克", "4 公克"], answer: 0, hints: ["1 公斤=1000 公克", "4×1000"], explanation: "4 × 1000 = 4000 公克。" },
    { id: "el-math-weight-capacity-2", prompt: "2000 毫升等於幾公升？", options: ["2 公升", "20 公升", "200 公升", "0.2 公升"], answer: 0, hints: ["小換大用除 1000", "2000÷1000"], explanation: "2000 ÷ 1000 = 2 公升。" },
    { id: "el-math-weight-capacity-3", prompt: "一瓶水 1500 毫升，等於幾公升幾毫升？", options: ["1 公升 500 毫升", "15 公升", "1 公升 50 毫升", "150 公升"], answer: 0, hints: ["1500÷1000=1 餘 500", "1000 毫升=1 公升"], explanation: "1500 毫升 = 1000 + 500 = 1 公升 500 毫升。" },
    { id: "el-math-weight-capacity-4", prompt: "5 公升的桶裝水有幾毫升？", options: ["5000 毫升", "500 毫升", "50 毫升", "5 毫升"], answer: 0, hints: ["5 × 1000", "大換小乘 1000"], explanation: "5 × 1000 = 5000 毫升。" },
    { id: "el-math-weight-capacity-5", prompt: "下面哪一個最重？", options: ["3 公斤", "2500 公克", "1 公升", "200 公克"], answer: 0, hints: ["都換成公克再比", "3 公斤=3000 公克最大"], explanation: "3 公斤 = 3000 公克，比 2500、200 公克都重；公升是容量不是重量不能直接比。" },
    { id: "el-math-weight-capacity-6", prompt: "6 公升等於幾毫升？", options: ["6000 毫升", "600 毫升", "6 毫升", "60 毫升"], answer: 0, hints: ["6 × 1000", "大換小乘 1000"], explanation: "6 × 1000 = 6000 毫升。" },
    { id: "el-math-weight-capacity-7", prompt: "7000 公克等於幾公斤？", options: ["7 公斤", "70 公斤", "7 公斤 700 公克", "700 公斤"], answer: 0, hints: ["7000 ÷ 1000 = 7", "剛好是整數公斤"], explanation: "7000 ÷ 1000 = 7 公斤，剛好沒有零頭。" },
  ],
};

/* ========================================================================
 * 課程 10 — 錢幣與找錢（三上）
 * 核心：付錢、找錢、單位換算。圖解：bars → text
 * ======================================================================== */
const EL_MATH_MONEY: OnionLesson = {
  id: "el-math-money",
  title: "錢幣與找錢：付剛好與算找零",
  subject: "數學",
  topic: "錢幣與找錢",
  grade: "三上",
  stages: ["國小"],
  desc: "買東西怎麼付錢最剛好、怎麼算找錢？洋蔥用長條圖和字卡教你錢幣的加減。",
  takeaways: ["1、5、10、50 元等面額組合付款", "找錢 ＝ 付款 − 售價", "付剛好要選合適面額", "付款必須等於或大於售價，老闆才有錢可找"],
  frames: [
    { step: "步驟 1：用買文具引入付錢", id: 1, caption: "嗨！一枝筆 12 元，你拿 50 元去買，老闆要找你多少錢？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：看錢幣面額長條", id: 2, caption: "錢幣有 1、5、10、50 元等面額。50 元硬幣比 10 元大很多。", action: "point", prop: { kind: "bars", items: [{ label: "10元", value: 10 }, { label: "50元", value: 50 }], unit: "元" }, duration: 3400 },
    { step: "步驟 3：算找錢 付款−售價", id: 3, caption: "找錢＝付款減售價：你付 50 元、筆 12 元，50 − 12 ＝ 38 元。", ask: { prompt: "付 50 元買 12 元東西，找回多少？", options: ["38 元", "12 元", "50 元", "28 元"], answer: 0, hint: "找錢＝付款−售價：50 − 12。" }, action: "think", prop: { kind: "bars", items: [{ label: "付款", value: 50 }, { label: "售價", value: 12 }], unit: "元" }, duration: 3600 },
    { step: "步驟 4：記住找錢公式", id: 4, caption: "公式記好：找錢 ＝ 付款 − 售價。付多少減多少，就是老闆找回的。", action: "point", prop: { kind: "text", text: "找錢 ＝ 付款 − 售價", sub: "50 − 12 ＝ 38 元", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：付款要夠才能找", id: 5, caption: "生活觀念：付款一定要等於或大於售價，老闆才有錢可以找給你。", action: "point", prop: { kind: "text", text: "付款 ≥ 售價，才找得回錢", sub: "錢不夠不能成交", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你付 100 找多少", id: 6, caption: "輪到你：一本書 35 元，你付 100 元，應找回多少？", ask: { prompt: "書 35 元付 100 元，找回多少？", options: ["65 元", "35 元", "75 元", "100 元"], answer: 0, hint: "找錢＝付款−售價：100 − 35。" }, action: "think", prop: { kind: "text", text: "100 − 35 ＝ 65 元", sub: "付款減售價", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰付 200 找多少", id: 7, caption: "再挑戰：一個玩具 75 元，你付 200 元，老闆要找回多少？", ask: { prompt: "玩具 75 元付 200 元，找回多少？", options: ["125 元", "75 元", "135 元", "275 元"], answer: 0, hint: "找錢＝付款−售價：200 − 75。" }, action: "think", prop: { kind: "text", text: "200 − 75 = 125 元", sub: "付款減售價", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照少減的錯誤", id: 8, caption: "常見錯誤：位數沒對齊，把 100 − 35 算成 75。其實 100 − 35 ＝ 65 元！", action: "jump", prop: { kind: "text", text: "錯：100 − 35 算成 75", sub: "100 − 35 = 65 才對（小心借位）", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：找錢＝付款−售價，付剛好要挑對面額。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-money-1", prompt: "鉛筆 8 元，付 20 元找回？", options: ["12 元", "8 元", "20 元", "10 元"], answer: 0, hints: ["找錢＝付款−售價", "20 − 8"], explanation: "20 − 8 = 12 元。" },
    { id: "el-math-money-2", prompt: "橡皮 5 元，付 10 元找回？", options: ["5 元", "10 元", "15 元", "0 元"], answer: 0, hints: ["10 − 5", "付款減售價"], explanation: "10 − 5 = 5 元。" },
    { id: "el-math-money-3", prompt: "糖果 15 元，付 50 元找回？", options: ["35 元", "15 元", "50 元", "25 元"], answer: 0, hints: ["50 − 15", "付款減售價"], explanation: "50 − 15 = 35 元。" },
    { id: "el-math-money-4", prompt: "一本本子 28 元，付 100 元找回？", options: ["72 元", "28 元", "88 元", "70 元"], answer: 0, hints: ["100 − 28", "小心借位"], explanation: "100 − 28 = 72 元。" },
    { id: "el-math-money-5", prompt: "下面哪一種付法「剛好」付 37 元？", options: ["20+10+5+1+1 元", "50 元", "20+20 元", "10+10+10+10 元"], answer: 0, hints: ["把面額加起來看是否等於 37", "20+10+5+1+1"], explanation: "20+10+5+1+1 = 37 元，剛好付 37 元；其他都不是 37。" },
    { id: "el-math-money-6", prompt: "一個水壺 88 元，付 100 元找回？", options: ["12 元", "22 元", "88 元", "112 元"], answer: 0, hints: ["100 − 88", "小心借位"], explanation: "100 − 88 = 12 元。" },
    { id: "el-math-money-7", prompt: "下面哪一種付法「剛好」付 54 元？", options: ["50+1+1+1+1 元", "100 元", "50+5 元", "20+20+20 元"], answer: 0, hints: ["把面額加起來看是否等於 54", "50+1+1+1+1"], explanation: "50+1+1+1+1 = 54 元，剛好付 54；其他都不是 54。" },
  ],
};

/* ========================================================================
 * 課程 11 — 三角形的角度和（四上）
 * 核心：三角形內角和 180 度。圖解：shape → bars
 * ======================================================================== */
const EL_MATH_TRIANGLE_ANGLES: OnionLesson = {
  id: "el-math-triangle-angles",
  title: "三角形的角度和：永遠 180 度",
  subject: "數學",
  topic: "三角形的角度和",
  grade: "四上",
  stages: ["國小"],
  desc: "把三角形的三個角剪下來拼成一個平角，剛好 180 度！洋蔥用圖形和長條圖證明給你看。",
  takeaways: ["三角形內角和一定是 180 度", "已知兩角可求第三角：180−已知兩角", "每個角都必須是小於 180 的正角", "直角三角形的兩個銳角加起來一定是 90 度"],
  frames: [
    { step: "步驟 1：用三角板引入內角和", id: 1, caption: "嗨！三角形的三個角加起來是多少？不管什麼三角形都一樣喔！", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：畫出三角形並標角", id: 2, caption: "這個三角形有三個角，我們把它們剪下來拼拼看。", action: "point", prop: { kind: "shape", shape: "triangle", base: 5, height: 4, label: "三個角" }, duration: 3400 },
    { step: "步驟 3：三個角拼成平角 180", id: 3, caption: "把三個角剪下拼在一起，剛好湊成 180 度的平角！", action: "think", prop: { kind: "text", text: "三個角拼起來 ＝ 180 度（平角）", sub: "任何三角形都一樣", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：用長條圖看三個角", id: 4, caption: "像這個等角三角形，三個角各 60 度，加起來 60＋60＋60＝180 度。", ask: { prompt: "三個 60 度角加起來多少？", options: ["180 度", "60 度", "120 度", "360 度"], answer: 0, hint: "60+60+60，想想三個 60。" }, action: "point", prop: { kind: "bars", items: [{ label: "角一", value: 60 }, { label: "角二", value: 60 }, { label: "角三", value: 60 }], unit: "度" }, duration: 3600 },
    { step: "步驟 5：直角三角形的小發現", id: 5, caption: "觀念：直角三角形有一個 90 度直角，另兩個角加起來一定是 90 度。", action: "point", prop: { kind: "text", text: "直角三角形：另兩角和 = 90 度", sub: "因為 180 − 90 = 90", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你算缺的一角", id: 6, caption: "已知兩角 70 度和 50 度，第三角＝ 180 − 70 − 50 ＝ 60 度。", ask: { prompt: "三角形兩角為 70 度、50 度，第三角多少？", options: ["60 度", "80 度", "70 度", "100 度"], answer: 0, hint: "三內角和 180：180 − 70 − 50。" }, action: "think", prop: { kind: "bars", items: [{ label: "角一", value: 70 }, { label: "角二", value: 50 }, { label: "角三", value: 60 }], unit: "度" }, duration: 3600 },
    { step: "步驟 7：再挑戰直角三角形", id: 7, caption: "再挑戰：直角三角形兩個角是 90 度和 45 度，第三角是多少？", ask: { prompt: "直角三角形兩角 90、45，第三角多少？", options: ["45 度", "135 度", "90 度", "55 度"], answer: 0, hint: "180 − 90 − 45 = 45。" }, action: "think", prop: { kind: "text", text: "180 − 90 − 45 = 45 度", sub: "內角和 180", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照忘記減的錯誤", id: 8, caption: "常見錯誤：把兩角相加 70＋50＝120 就當成第三角，其實要用 180 去減！", action: "jump", prop: { kind: "text", text: "錯：70+50=120 就當答案", sub: "要 180−120=60", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：三角形內角和 180，求第三角用 180 減另兩角。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-triangle-angles-1", prompt: "等邊三角形每個角幾度？", options: ["60 度", "90 度", "45 度", "30 度"], answer: 0, hints: ["三内角和 180", "180÷3"], explanation: "180 ÷ 3 = 60 度。" },
    { id: "el-math-triangle-angles-2", prompt: "三角形兩角 90、30，第三角？", options: ["60 度", "90 度", "30 度", "120 度"], answer: 0, hints: ["180−90−30", "直角三角"], explanation: "180 − 90 − 30 = 60 度。" },
    { id: "el-math-triangle-angles-3", prompt: "三角形兩角 40、75，第三角？", options: ["65 度", "115 度", "40 度", "75 度"], answer: 0, hints: ["180−40−75", "先加 40+75=115"], explanation: "180 − 40 − 75 = 65 度。" },
    { id: "el-math-triangle-angles-4", prompt: "等腰三角形兩底角各 50，頂角？", options: ["80 度", "50 度", "100 度", "130 度"], answer: 0, hints: ["兩底角共 100", "180−100=80"], explanation: "50 + 50 = 100，180 − 100 = 80 度。" },
    { id: "el-math-triangle-angles-5", prompt: "下面哪一組三個角「不能」組成三角形？", options: ["90、45、45", "60、60、60", "100、50、40", "90、90、10"], answer: 3, hints: ["三個角相加要等於 180", "90+90+10=190 超過"], explanation: "三角形內角和必須正好 180 度；90＋90＋10＝190，超過 180，不能組成三角形。" },
    { id: "el-math-triangle-angles-6", prompt: "三角形兩角 80、60，第三角多少？", options: ["40 度", "140 度", "20 度", "30 度"], answer: 0, hints: ["180 − 80 − 60", "先加 80+60=140"], explanation: "180 − 80 − 60 = 40 度。" },
    { id: "el-math-triangle-angles-7", prompt: "直角三角形一個銳角 35 度，另一個銳角多少？", options: ["55 度", "145 度", "35 度", "65 度"], answer: 0, hints: ["兩銳角和 90", "90 − 35"], explanation: "直角三角形兩銳角和 90，90 − 35 = 55 度。" },
  ],
};

/* ========================================================================
 * 課程 12 — 線對稱圖形（四下）
 * 核心：對稱軸、對稱點的距離相等。圖解：shape → text
 * ======================================================================== */
const EL_MATH_SYMMETRY: OnionLesson = {
  id: "el-math-symmetry",
  title: "線對稱圖形：對摺重合就對稱",
  subject: "數學",
  topic: "線對稱圖形",
  grade: "四下",
  stages: ["國小"],
  desc: "對摺後兩邊完全重合的圖形叫線對稱，洋蔥用蝴蝶和幾何形教你找對稱軸。",
  takeaways: ["對摺後兩邊完全重合＝線對稱圖形", "對稱軸是那條折痕", "對稱點到對稱軸的距離相等", "對稱軸數目因圖形而不同（長方形 2 條、等腰三角形 1 條）"],
  frames: [
    { step: "步驟 1：用蝴蝶圖案引入", id: 1, caption: "嗨！蝴蝶左右兩邊好像鏡子照的一樣，這就是線對稱喔！", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：對摺看完全重合", id: 2, caption: "把圖形沿中線對摺，左右兩半完全疊在一起，就是線對稱。", action: "point", prop: { kind: "shape", shape: "rect", base: 8, height: 4, label: "對摺重合" }, duration: 3400 },
    { step: "步驟 3：認識對稱軸", id: 3, caption: "那條對摺的折痕叫做「對稱軸」。正方形有 4 條，圓形有無限多條。", ask: { prompt: "正方形有幾條對稱軸？", options: ["4 條", "2 條", "1 條", "無限多條"], answer: 0, hint: "上下左右＋兩條對角線共 4 種折法。" }, action: "think", prop: { kind: "text", text: "對稱軸＝那條對摺的折痕", sub: "正方形 4 條，圓形無限多條", tone: "ok" }, duration: 3600 },
    { step: "步驟 4：對稱點距離相等", id: 4, caption: "對稱軸兩側的點，到軸的距離一樣遠，叫做對稱點。", action: "point", prop: { kind: "shape", shape: "triangle", base: 6, height: 4, label: "對稱點等距" }, duration: 3400 },
    { step: "步驟 5：不同圖形軸數不同", id: 5, caption: "數一數：長方形有 2 條對稱軸，等腰三角形只有 1 條。", action: "point", prop: { kind: "text", text: "長方形 2 條、等腰三角形 1 條", sub: "不同圖形軸數不同", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你找另一半", id: 6, caption: "如果左邊的點離對稱軸 3 格，右邊的對稱點也要離軸 3 格才對稱。", ask: { prompt: "對稱軸左邊一點離軸 3 格，右邊對稱點離軸幾格？", options: ["3 格", "6 格", "0 格", "1 格"], answer: 0, hint: "對稱點到軸距離相等：右邊也要 3 格。" }, action: "think", prop: { kind: "text", text: "左側距軸 3，右側對稱點也距軸 3", sub: "對稱點等距", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰離軸 5 格", id: 7, caption: "再挑戰：對稱軸右邊一點離軸 5 格，左邊對稱點要離軸幾格？", ask: { prompt: "右邊一點離軸 5 格，左邊對稱點離軸幾格？", options: ["5 格", "10 格", "0 格", "2 格"], answer: 0, hint: "對稱點到軸距離相等：左邊也要 5 格。" }, action: "think", prop: { kind: "text", text: "右側距軸 5，左側對稱點也距軸 5", sub: "對稱點等距", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照畫歪的錯誤", id: 8, caption: "常見錯誤：把另一半畫得比原來遠或近，兩側距離不等就不對稱了！", action: "jump", prop: { kind: "text", text: "錯：兩側距離不等就不對稱", sub: "要左右一樣遠", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：對摺重合是線對稱，對稱軸是折痕、對稱點等距。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-symmetry-1", prompt: "對摺後兩邊完全疊合，這圖形是？", options: ["線對稱圖形", "圓形", "長條圖", "天平"], answer: 0, hints: ["關鍵是對摺重合", "線對稱的定義"], explanation: "對摺後兩邊完全重合的圖形稱為線對稱圖形。" },
    { id: "el-math-symmetry-2", prompt: "對摺的那條折痕叫做？", options: ["對稱軸", "對稱點", "底邊", "高線"], answer: 0, hints: ["它是軸", "兩側對稱的基準線"], explanation: "那條對摺的折痕叫做對稱軸。" },
    { id: "el-math-symmetry-3", prompt: "正方形有幾條對稱軸？", options: ["4 條", "2 條", "1 條", "無限多條"], answer: 0, hints: ["可對摺成上下、左右、兩斜", "共 4 種折法"], explanation: "正方形有 4 條對稱軸（橫、直、兩條對角線）。" },
    { id: "el-math-symmetry-4", prompt: "圓形有幾條對稱軸？", options: ["無限多條", "1 條", "4 條", "0 條"], answer: 0, hints: ["過圓心任意直線都對稱", "所以無限多"], explanation: "通過圓心的任意一條直線都是對稱軸，因此圓形有無限多條。" },
    { id: "el-math-symmetry-5", prompt: "下面哪一個「不是」線對稱圖形？", options: ["平行四邊形（一般）", "正方形", "圓形", "等腰三角形"], answer: 0, hints: ["平行四邊形對摺不重合", "除非是菱形或長方形"], explanation: "一般的平行四邊形對摺後兩邊不會重合，不是線對稱圖形；正方形、圓形、等腰三角形都是。" },
    { id: "el-math-symmetry-6", prompt: "長方形有幾條對稱軸？", options: ["2 條", "4 條", "1 條", "無限多條"], answer: 0, hints: ["上下、左右對摺", "共 2 種折法"], explanation: "長方形有橫、直 2 條對稱軸（正方形才有 4 條）。" },
    { id: "el-math-symmetry-7", prompt: "等腰三角形有幾條對稱軸？", options: ["1 條", "3 條", "2 條", "0 條"], answer: 0, hints: ["只有頂角到底邊中線那一條", "對摺成兩個直角三角形"], explanation: "等腰三角形只有沿頂角與底邊中點連線那 1 條對稱軸。" },
  ],
};

/* ========================================================================
 * 課程 13 — 平均數（六上）
 * 核心：平均＝總和÷個數，用來代表整體。圖解：bars → text
 * ======================================================================== */
const EL_MATH_AVERAGE: OnionLesson = {
  id: "el-math-average",
  title: "平均數：總和除以筆數",
  subject: "數學",
  topic: "平均數",
  grade: "六上",
  stages: ["國小"],
  desc: "平均數是把多筆資料「拉平」成同樣高，洋蔥用長條圖教你總和除以個數。",
  takeaways: ["平均數 ＝ 總和 ÷ 筆數", "平均用來代表一整組資料的中心", "有一筆特別大會把平均拉高", "平均一定介於這組資料的最小值和最大值之間"],
  frames: [
    { step: "步驟 1：用小考成績引入", id: 1, caption: "嗨！這週小考考了 80、90、70 三分，平均大概是幾分？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：把分數畫成長條", id: 2, caption: "三次分數 80、90、70，長條有高有低，我們把它們拉平。", action: "point", prop: { kind: "bars", items: [{ label: "第一次", value: 80 }, { label: "第二次", value: 90 }, { label: "第三次", value: 70 }], unit: "分" }, duration: 3400 },
    { step: "步驟 3：先算總和", id: 3, caption: "先把三次加起來：80 ＋ 90 ＋ 70 ＝ 240 分，共有 3 次。", ask: { prompt: "80+90+70 的總和是多少？", options: ["240", "240 分", "170", "270"], answer: 0, hint: "80+90=170，170+70=240。" }, action: "think", prop: { kind: "bars", items: [{ label: "總和", value: 240 }, { label: "筆數", value: 3 }], unit: "分/次" }, duration: 3600 },
    { step: "步驟 4：總和÷筆數得平均", id: 4, caption: "平均數＝總和÷筆數：240 ÷ 3 ＝ 80 分，這就是平均分數。", action: "point", prop: { kind: "text", text: "平均 ＝ 240 ÷ 3 ＝ 80 分", sub: "總和 ÷ 筆數", tone: "ok" }, duration: 3600 },
    { step: "步驟 5：平均落在最大最小之間", id: 5, caption: "觀念：平均一定比最大的小、比最小的大，不會超出這組數的範圍。", action: "point", prop: { kind: "text", text: "最小 ≤ 平均 ≤ 最大", sub: "平均落在中間", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你算四次平均", id: 6, caption: "輪到你：四次成績 60、80、100、40，總和除以 4，平均幾分？", ask: { prompt: "60、80、100、40 的平均數是多少？", options: ["70", "80", "75", "65"], answer: 0, hint: "先加總 60+80+100+40=280，再 ÷4。" }, action: "think", prop: { kind: "text", text: "60+80+100+40=280，÷4=70", sub: "總和÷筆數", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰五次點數", id: 7, caption: "再挑戰：五次點數 10、20、30、40、50，平均是多少？", ask: { prompt: "10、20、30、40、50 的平均數是多少？", options: ["30", "25", "40", "150"], answer: 0, hint: "總和 150，再除以 5。" }, action: "think", prop: { kind: "text", text: "10+20+30+40+50=150，÷5=30", sub: "總和÷筆數", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照漏算一筆的錯誤", id: 8, caption: "常見錯誤：漏掉一筆沒加進總和，或筆數數錯，平均就會算歪！", action: "jump", prop: { kind: "text", text: "錯：只加三筆就除", sub: "要全部加完再除筆數", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：平均＝總和÷筆數，拉平長條就是它。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-average-1", prompt: "三數 10、20、30 的平均？", options: ["20", "30", "10", "60"], answer: 0, hints: ["總和 60", "60÷3"], explanation: "（10+20+30）÷3 = 60÷3 = 20。" },
    { id: "el-math-average-2", prompt: "兩數 50、70 的平均？", options: ["60", "50", "70", "120"], answer: 0, hints: ["50+70=120", "120÷2"], explanation: "（50+70）÷2 = 60。" },
    { id: "el-math-average-3", prompt: "四天零用錢 20、30、40、50，平均多少？", options: ["35", "40", "30", "25"], answer: 0, hints: ["總和 140", "140÷4"], explanation: "（20+30+40+50）÷4 = 140÷4 = 35。" },
    { id: "el-math-average-4", prompt: "五次測驗平均 80，總分多少？", options: ["400", "80", "160", "320"], answer: 0, hints: ["總分＝平均×筆數", "80×5"], explanation: "總分 ＝ 平均 × 筆數 ＝ 80 × 5 = 400。" },
    { id: "el-math-average-5", prompt: "一組平均 70，加入一個 100 後，平均會？", options: ["變高", "變低", "不變", "變成 0"], answer: 0, hints: ["100 比原平均 70 大", "大於平均會把平均拉高"], explanation: "加入的數（100）大於原平均（70），會把整組平均拉高。" },
    { id: "el-math-average-6", prompt: "三數 4、6、8 的平均是多少？", options: ["6", "18", "5", "7"], answer: 0, hints: ["總和 18", "18 ÷ 3"], explanation: "（4+6+8）÷3 = 18÷3 = 6。" },
    { id: "el-math-average-7", prompt: "一組平均 50，加入一個 10 後，平均會？", options: ["變低", "變高", "不變", "變成 0"], answer: 0, hints: ["10 比原平均 50 小", "小於平均會把平均拉低"], explanation: "加入的數（10）小於原平均（50），會把整組平均拉低。" },
  ],
};

/* ========================================================================
 * 課程 14 — 兩步驟應用問題（四上）
 * 核心：先算什麼、再算什麼（拆題）。圖解：flow
 * ======================================================================== */
const EL_MATH_TWO_STEP: OnionLesson = {
  id: "el-math-two-step",
  title: "兩步驟應用問題：先算什麼再算什麼",
  subject: "數學",
  topic: "兩步驟應用問題",
  grade: "四上",
  stages: ["國小"],
  desc: "一題要算兩次？洋蔥教你把題目拆成「先算…再算…」，用流程圖一步步解決。",
  takeaways: ["先讀題找出要算的兩件事", "第一步的結果是第二步的線索", "算完要回題目檢查問的是什麼", "兩步題要先把「每份多少乘數量」算完，才能做下一步加減"],
  frames: [
    { step: "步驟 1：用買水果題引入", id: 1, caption: "嗨！蘋果一顆 10 元、橘子一顆 5 元，各買 3 顆，一共要多少錢？", action: "wave", prop: { kind: "none" }, duration: 3000 },
    { step: "步驟 2：拆題先算蘋果", id: 2, caption: "先算第一步：蘋果 10 元 × 3 顆 ＝ 30 元。", ask: { prompt: "蘋果 10 元×3 顆多少？", options: ["30 元", "10 元", "3 元", "13 元"], answer: 0, hint: "10×3=30。" }, action: "point", prop: { kind: "flow", steps: ["蘋果 10×3", "橘子 5×3", "兩者相加"], active: 0 }, duration: 3600 },
    { step: "步驟 3：再算橘子", id: 3, caption: "第二步：橘子 5 元 × 3 顆 ＝ 15 元。", action: "think", prop: { kind: "flow", steps: ["蘋果 10×3=30", "橘子 5×3=15", "相加得總價"], active: 1 }, duration: 3600 },
    { step: "步驟 4：兩次結果相加", id: 4, caption: "最後把兩步結果加起來：30 ＋ 15 ＝ 45 元，就是總價。", action: "point", prop: { kind: "flow", steps: ["30 元", "＋ 15 元", "＝ 45 元"], active: 2 }, duration: 3600 },
    { step: "步驟 5：先乘後加不能亂", id: 5, caption: "觀念：兩步題有先後順序，要先把「每份多少、乘數量」算完，才能相加。", action: "point", prop: { kind: "text", text: "順序：先各乘數量，再相加", sub: "不能顛倒順序", tone: "ok" }, duration: 3400 },
    { step: "步驟 6：輪到你拆一題", id: 6, caption: "輪到你：鉛筆一盒 2 元買 4 盒、橡皮 3 元買 2 個，一共多少錢？", ask: { prompt: "鉛筆 2 元×4、橡皮 3 元×2，共多少？", options: ["14 元", "8 元", "6 元", "20 元"], answer: 0, hint: "先算 2×4=8、3×2=6，再 8+6。" }, action: "think", prop: { kind: "text", text: "鉛筆 2×4=8，橡皮 3×2=6，共 14", sub: "先各算再相加", tone: "ok" }, duration: 3600 },
    { step: "步驟 7：再挑戰便當加飲料", id: 7, caption: "再挑戰：便當一個 45 元買 2 個、飲料 15 元買 1 杯，一共多少？", ask: { prompt: "便當 45×2、飲料 15×1，共多少？", options: ["105 元", "60 元", "90 元", "45 元"], answer: 0, hint: "先算 45×2=90、15×1=15，再 90+15。" }, action: "think", prop: { kind: "text", text: "45×2=90，15×1=15，共 105", sub: "先各算再相加", tone: "ok" }, duration: 3600 },
    { step: "步驟 8：對照只算一步的錯誤", id: 8, caption: "常見錯誤：只把單價 10＋5 就當答案，忘了要先各乘數量再相加！", action: "jump", prop: { kind: "text", text: "錯：只算 10+5 就停", sub: "要先各乘數量再相加", tone: "warn" }, duration: 3600 },
    { step: "步驟 9：背口訣準備闖關", id: 9, caption: "口訣：兩步題先拆「先算什麼、再算什麼」，一步步來。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 2800 },
  ],
  questions: [
    { id: "el-math-two-step-1", prompt: "糖 3 元買 2 包、餅 4 元買 3 包，共？", options: ["18 元", "6 元", "12 元", "7 元"], answer: 0, hints: ["3×2=6，4×3=12", "6+12"], explanation: "3×2=6，4×3=12，6+12=18 元。" },
    { id: "el-math-two-step-2", prompt: "書 25 元買 2 本、筆 5 元買 4 支，共？", options: ["70 元", "50 元", "30 元", "45 元"], answer: 0, hints: ["25×2=50，5×4=20", "50+20"], explanation: "25×2=50，5×4=20，50+20=70 元。" },
    { id: "el-math-two-step-3", prompt: "弟有 30 元、妹有 20 元，合買 8 元橡皮，剩？", options: ["42 元", "50 元", "8 元", "22 元"], answer: 0, hints: ["先算共有 30+20=50", "再減 8"], explanation: "30+20=50，50−8=42 元。" },
    { id: "el-math-two-step-4", prompt: "一盒蛋 6 顆，買 3 盒，吃掉 4 顆剩？", options: ["14 顆", "18 顆", "4 顆", "9 顆"], answer: 0, hints: ["先算 6×3=18 顆", "再減 4"], explanation: "6×3=18，18−4=14 顆。" },
    { id: "el-math-two-step-5", prompt: "下面哪一題「不是」兩步驟問題？", options: ["直接問 5＋3 的答案", "先買再打折", "先算總量再平分", "先各算再相加"], answer: 0, hints: ["兩步題要先算一結果再算下一結果", "5+3 一步就夠"], explanation: "5＋3 只要一步就算完，不屬於兩步驟應用問題；其餘都要分兩步。" },
    { id: "el-math-two-step-6", prompt: "牛奶一瓶 30 元買 2 瓶、麵包 20 元買 3 個，共多少？", options: ["120 元", "60 元", "80 元", "50 元"], answer: 0, hints: ["30×2=60，20×3=60", "60+60"], explanation: "30×2=60，20×3=60，60+60=120 元。" },
    { id: "el-math-two-step-7", prompt: "姐姐有 50 元，買 2 個 15 元的蘋果，還剩多少？", options: ["20 元", "35 元", "65 元", "30 元"], answer: 0, hints: ["先算 15×2=30", "再 50−30"], explanation: "15×2=30，50−30=20 元。" },
  ],
};

export default [
  EL_MATH_DECIMAL_MULTIPLY,
  EL_MATH_DECIMAL_DIVIDE,
  EL_MATH_FRACTION_DIVIDE,
  EL_MATH_PERCENT,
  EL_MATH_RATIO,
  EL_MATH_POLYGON_AREA,
  EL_MATH_SCALE_DRAWING,
  EL_MATH_CALENDAR,
  EL_MATH_WEIGHT_CAPACITY,
  EL_MATH_MONEY,
  EL_MATH_TRIANGLE_ANGLES,
  EL_MATH_SYMMETRY,
  EL_MATH_AVERAGE,
  EL_MATH_TWO_STEP,
];
