/**
 * 數學題產生器：答案是「算出來的」。
 *
 * 所有題目都由參數隨機產生、正確答案由程式計算，因此不會有答案寫錯的變態題；
 * 干擾項刻意模擬常見錯誤（忘記進位、分母相加、周長面積搞混、忘記除以 2…），
 * 讓選項具有鑑別度而不是亂數填充。
 */
import { randInt, pick, shuffle, buildChoice, buildTrueFalse, makeQuestion } from "./common.mjs";
import { JUNIOR_GENERATORS } from "./mathJunior.mjs";

/** 主題共用知識標籤。 */
const K = (topic) => [topic];

/** 每個產生器回傳一題 spec；呼叫端負責重複執行直到達到目標題數。 */
const GENERATORS = [
  // ── 三年級：加減乘除 ─────────────────────────────────────────────
  {
    topic: "加減運算",
    grades: [3, 4],
    difficulty: "基礎",
    gen(rng) {
      const a = randInt(rng, 128, 899);
      const b = randInt(rng, 105, 899);
      const correct = a + b;
      return {
        grade: 3,
        prompt: `計算 ${a} ＋ ${b} 的結果。`,
        correct,
        distractors: [correct + 100, correct - 100, a + b - 10],
        explanation: `直式加法：${a} ＋ ${b} ＝ ${correct}。個位、十位、百位分別相加，滿十進位。`,
        knowledge: K("加減運算"),
      };
    },
  },
  {
    topic: "減法運算",
    grades: [3, 4],
    difficulty: "基礎",
    gen(rng) {
      const a = randInt(rng, 400, 999);
      const b = randInt(rng, 100, a - 1);
      const correct = a - b;
      return {
        grade: 3,
        prompt: `計算 ${a} − ${b} 的結果。`,
        correct,
        distractors: [correct + 10, correct - 10, a + b],
        explanation: `直式減法：${a} − ${b} ＝ ${correct}。不夠減時向高位借位。`,
        knowledge: K("減法運算"),
      };
    },
  },
  {
    topic: "乘法運算",
    grades: [3, 4],
    difficulty: "基礎",
    gen(rng) {
      const a = randInt(rng, 12, 89);
      const b = randInt(rng, 3, 9);
      const correct = a * b;
      return {
        grade: 3,
        prompt: `計算 ${a} × ${b} 的結果。`,
        correct,
        distractors: [correct + a, correct - b, a * (b + 1)],
        explanation: `${a} × ${b} ＝ ${correct}。可拆成 ${a}×${b - 1} ＋ ${a} 驗算。`,
        knowledge: K("乘法運算"),
      };
    },
  },
  {
    topic: "除法運算",
    grades: [3, 4],
    difficulty: "基礎",
    gen(rng) {
      const b = randInt(rng, 3, 9);
      const correct = randInt(rng, 12, 99);
      const a = b * correct;
      return {
        grade: 3,
        prompt: `計算 ${a} ÷ ${b} 的結果。`,
        correct,
        distractors: [correct + 1, correct - 1, correct + 10],
        explanation: `${b} × ${correct} ＝ ${a}，所以 ${a} ÷ ${b} ＝ ${correct}。可用乘法驗算。`,
        knowledge: K("除法運算"),
      };
    },
  },

  // ── 四年級：四則混合、周長面積、單位換算 ───────────────────────
  {
    topic: "四則混合運算",
    grades: [4, 5],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 6, 15);
      const b = randInt(rng, 3, 9);
      const c = randInt(rng, 12, 60);
      const correct = a * b + c;
      return {
        grade: 4,
        prompt: `計算 ${a} × ${b} ＋ ${c} 的結果。`,
        correct,
        distractors: [a * (b + c), (a + c) * b, correct + 10],
        explanation: `先乘除後加減：${a} × ${b} ＝ ${a * b}，再加 ${c} 得到 ${correct}。`,
        knowledge: K("四則混合運算"),
      };
    },
  },
  {
    topic: "括號運算",
    grades: [4, 5],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 10, 40);
      const b = randInt(rng, 5, 30);
      const c = randInt(rng, 2, 9);
      const correct = (a + b) * c;
      return {
        grade: 4,
        prompt: `計算（${a} ＋ ${b}）× ${c} 的結果。`,
        correct,
        distractors: [a + b * c, a + b + c, correct - c],
        explanation: `括號先算：${a} ＋ ${b} ＝ ${a + b}，再 × ${c} ＝ ${correct}。`,
        knowledge: K("括號運算"),
      };
    },
  },
  {
    topic: "周長計算",
    grades: [4, 5],
    difficulty: "標準",
    gen(rng) {
      const w = randInt(rng, 5, 40);
      const h = randInt(rng, 5, 40);
      const correct = (w + h) * 2;
      return {
        grade: 4,
        prompt: `一個長方形的長是 ${w} 公分、寬是 ${h} 公分，它的周長是多少公分？`,
        correct,
        distractors: [w * h, w + h, (w + h) * 2 + 2],
        explanation: `周長＝（長＋寬）×2 ＝（${w}＋${h}）×2 ＝ ${correct} 公分。注意不是長×寬（那是面積）。`,
        knowledge: K("周長計算"),
      };
    },
  },
  {
    topic: "面積計算",
    grades: [4, 5],
    difficulty: "標準",
    gen(rng) {
      const w = randInt(rng, 6, 40);
      const h = randInt(rng, 6, 40);
      const correct = w * h;
      return {
        grade: 4,
        prompt: `一個長方形的長是 ${w} 公分、寬是 ${h} 公分，它的面積是多少平方公分？`,
        correct,
        distractors: [(w + h) * 2, w + h, w * h + 10],
        explanation: `面積＝長×寬 ＝ ${w}×${h} ＝ ${correct} 平方公分。注意不是周長（長＋寬）×2。`,
        knowledge: K("面積計算"),
      };
    },
  },
  {
    topic: "長度單位換算",
    grades: [3, 4],
    difficulty: "基礎",
    gen(rng) {
      const m = randInt(rng, 2, 40);
      const correct = m * 100;
      return {
        grade: 3,
        prompt: `${m} 公尺等於幾公分？`,
        correct,
        distractors: [m * 10, m * 1000, correct + 100],
        explanation: `1 公尺 = 100 公分，大換小用乘法：${m} × 100 ＝ ${correct} 公分。`,
        knowledge: K("長度單位換算"),
      };
    },
  },
  {
    topic: "重量單位換算",
    grades: [3, 4],
    difficulty: "基礎",
    gen(rng) {
      const kg = randInt(rng, 2, 30);
      const correct = kg * 1000;
      return {
        grade: 3,
        prompt: `${kg} 公斤等於幾公克？`,
        correct,
        distractors: [kg * 100, kg * 10, correct + 1000],
        explanation: `1 公斤 = 1000 公克，${kg} × 1000 ＝ ${correct} 公克。`,
        knowledge: K("重量單位換算"),
      };
    },
  },
  {
    topic: "時間計算",
    grades: [4, 5],
    difficulty: "標準",
    gen(rng) {
      const h = randInt(rng, 1, 9);
      const m = randInt(rng, 1, 50);
      const addMin = randInt(rng, 20, 90);
      const start = h * 60 + m;
      const end = start + addMin;
      const eh = Math.floor(end / 60) % 24;
      const em = end % 60;
      const correct = `${eh} 時 ${em} 分`;
      return {
        grade: 4,
        prompt: `一場電影從上午 ${h} 時 ${m} 分開始，放映 ${addMin} 分鐘，結束時是幾時幾分？`,
        correct,
        distractors: [`${h} 時 ${m + addMin} 分`, `${eh + 1} 時 ${em} 分`, `${eh} 時 ${em + 10} 分`],
        explanation: `${m} 分 + ${addMin} 分 = ${m + addMin} 分，滿 60 分進 1 小時，所以是 ${eh} 時 ${em} 分。`,
        knowledge: K("時間計算"),
      };
    },
  },

  // ── 五年級：分數、小數、因數倍數 ───────────────────────────────
  {
    topic: "同分母分數加減",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const b = pick(rng, [4, 5, 6, 8, 10, 12]);
      const a1 = randInt(rng, 1, b - 1);
      const a2 = randInt(rng, 1, b - 1);
      const correct = `${a1 + a2}/${b}`;
      return {
        grade: 5,
        prompt: `計算 ${a1}/${b} ＋ ${a2}/${b} 的結果。`,
        correct,
        distractors: [`${a1 + a2}/${b * 2}`, `${a1 * a2}/${b}`, `${a1 + a2}/${b + 1}`],
        explanation: `同分母相加，分母 ${b} 不變，分子 ${a1}＋${a2}＝${a1 + a2}，答案是 ${correct}。`,
        knowledge: K("分數加減"),
      };
    },
  },
  {
    topic: "異分母分數加減",
    grades: [6, 7],
    difficulty: "挑戰",
    gen(rng) {
      const b = pick(rng, [4, 6, 8, 10, 12]);
      const a1 = randInt(rng, 1, b / 2 - 1);
      const half = b / 2;
      const a2 = randInt(rng, 1, half - 1);
      const correct = `${a1 + a2 * 2}/${b}`;
      return {
        grade: 6,
        prompt: `計算 ${a1}/${b} ＋ ${a2}/${half} 的結果。`,
        correct,
        distractors: [`${a1 + a2}/${b}`, `${a1 + a2}/${b + half}`, `${a1 + a2 * 2}/${half}`],
        explanation: `先通分：${a2}/${half} ＝ ${a2 * 2}/${b}，再加 ${a1}/${b} ＝ ${correct}。`,
        knowledge: K("分數加減"),
      };
    },
  },
  {
    topic: "分數乘以整數",
    grades: [6, 7],
    difficulty: "標準",
    gen(rng) {
      const b = pick(rng, [3, 4, 5, 6, 8]);
      const a = randInt(rng, 1, b - 1);
      const n = randInt(rng, 2, 9);
      const correct = `${a * n}/${b}`;
      return {
        grade: 6,
        prompt: `計算 ${a}/${b} × ${n} 的結果。`,
        correct,
        distractors: [`${a}/${b * n}`, `${a * n}/${b * n}`, `${a + n}/${b}`],
        explanation: `分數乘以整數：只把分子乘以整數，${a}×${n}＝${a * n}，分母 ${b} 不變，答案是 ${correct}。`,
        knowledge: K("分數乘法"),
      };
    },
  },
  {
    topic: "小數加減",
    grades: [4, 5],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 12, 95) / 10;
      const b = randInt(rng, 12, 95) / 10;
      const correct = Math.round((a + b) * 10) / 10;
      return {
        grade: 4,
        prompt: `計算 ${a.toFixed(1)} ＋ ${b.toFixed(1)} 的結果。`,
        correct: correct.toFixed(1),
        distractors: [((a * 10 + b * 10) / 100).toFixed(2), (correct + 1).toFixed(1), (a * b).toFixed(1)],
        explanation: `小數點對齊再相加：${a.toFixed(1)} ＋ ${b.toFixed(1)} ＝ ${correct.toFixed(1)}。`,
        knowledge: K("小數加減"),
      };
    },
  },
  {
    topic: "小數乘法",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 12, 99) / 10;
      const n = randInt(rng, 2, 9);
      const correct = Math.round(a * n * 10) / 10;
      return {
        grade: 5,
        prompt: `計算 ${a.toFixed(1)} × ${n} 的結果。`,
        correct: correct.toFixed(1),
        distractors: [(correct / 10).toFixed(2), (correct + n).toFixed(1), (a + n).toFixed(1)],
        explanation: `先當整數相乘再點小數點：${a.toFixed(1)} × ${n} ＝ ${correct.toFixed(1)}。`,
        knowledge: K("小數乘法"),
      };
    },
  },
  {
    topic: "因數判斷",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const n = randInt(rng, 12, 99);
      const factors = [];
      for (let i = 2; i < n; i += 1) if (n % i === 0) factors.push(i);
      if (factors.length < 3) return null;
      const correct = pick(rng, factors);
      const wrongs = [];
      for (let i = 2; wrongs.length < 3; i += 1) {
        const cand = n + i;
        if (n % cand !== 0 && !wrongs.includes(cand)) wrongs.push(cand);
      }
      return {
        grade: 5,
        prompt: `下列哪一個數是 ${n} 的因數？`,
        correct,
        distractors: wrongs.slice(0, 3),
        explanation: `${n} ÷ ${correct} ＝ ${n / correct}，可以整除，所以 ${correct} 是 ${n} 的因數。`,
        knowledge: K("因數與倍數"),
      };
    },
  },
  {
    topic: "倍數判斷",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const base = pick(rng, [3, 4, 6, 7, 8, 9]);
      const k = randInt(rng, 3, 14);
      const correct = base * k;
      return {
        grade: 5,
        prompt: `下列哪一個數是 ${base} 的倍數？`,
        correct,
        distractors: [correct + 1, correct - 1, correct + 2],
        explanation: `${base} × ${k} ＝ ${correct}，所以 ${correct} 是 ${base} 的倍數。`,
        knowledge: K("因數與倍數"),
      };
    },
  },
  {
    topic: "最大公因數",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const g = randInt(rng, 3, 12);
      const m = randInt(rng, 2, 9);
      const n = randInt(rng, 2, 9);
      const a = g * m;
      const b = g * n;
      if (a === b) return null;
      const correct = (function gcd(x, y) {
        return y === 0 ? x : gcd(y, x % y);
      })(a, b);
      return {
        grade: 5,
        prompt: `${a} 和 ${b} 的最大公因數是多少？`,
        correct,
        distractors: [g * m * n, Math.max(a, b), correct * 2],
        explanation: `用短除法或列出因數，${a} 和 ${b} 共同最大的因數是 ${correct}。`,
        knowledge: K("最大公因數"),
      };
    },
  },
  {
    topic: "最小公倍數",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 3, 12);
      const b = randInt(rng, 3, 12);
      if (a === b) return null;
      const gcd = (function g(x, y) {
        return y === 0 ? x : g(y, x % y);
      })(a, b);
      const correct = (a * b) / gcd;
      return {
        grade: 5,
        prompt: `${a} 和 ${b} 的最小公倍數是多少？`,
        correct,
        distractors: [a * b, a + b, correct + a],
        explanation: `${a} 和 ${b} 的最小公倍數是 ${correct}（＝ ${a}×${b} ÷ 最大公因數 ${gcd}）。`,
        knowledge: K("最小公倍數"),
      };
    },
  },
  {
    topic: "質數判斷",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 33, 34, 35, 36, 38, 39, 40, 42, 44, 45, 46, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 60, 62, 63, 64, 65, 66, 68, 69, 70, 72, 74, 75, 76, 77, 78, 80, 81, 82, 84, 85, 86, 87, 88, 90, 91, 92, 93, 94, 95, 96, 98, 99];
      const correct = pick(rng, primes);
      const wrongs = pickCombo(rng, composites);
      return {
        grade: 5,
        prompt: `下列哪一個數是質數？`,
        correct,
        distractors: wrongs,
        explanation: `質數是大於 1 且只有 1 和自己兩個因數的數。${correct} 符合；其他選項都有别的因數。`,
        knowledge: K("質數"),
      };
    },
  },
  {
    topic: "三角形面積",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const base = randInt(rng, 4, 30);
      const height = randInt(rng, 4, 30);
      const correct = (base * height) / 2;
      return {
        grade: 5,
        prompt: `一個三角形的底是 ${base} 公分、高是 ${height} 公分，面積是多少平方公分？`,
        correct,
        distractors: [base * height, base * height * 2, base + height],
        explanation: `三角形面積＝底×高÷2 ＝ ${base}×${height}÷2 ＝ ${correct} 平方公分。`,
        knowledge: K("三角形面積"),
      };
    },
  },
  {
    topic: "平均數",
    grades: [5, 6],
    difficulty: "標準",
    gen(rng) {
      const n = pick(rng, [4, 5]);
      const avg = randInt(rng, 10, 90);
      const nums = [];
      let sum = 0;
      for (let i = 0; i < n - 1; i += 1) {
        const v = avg + randInt(rng, -9, 9);
        nums.push(v);
        sum += v;
      }
      nums.push(avg * n - sum);
      const correct = avg;
      return {
        grade: 5,
        prompt: `（${nums.join("、")}）這 ${n} 個數的平均數是多少？`,
        correct,
        distractors: [avg + 5, avg - 5, Math.max(...nums)],
        explanation: `平均數＝總和 ÷ 個數 ＝ ${nums.reduce((a, b) => a + b, 0)} ÷ ${n} ＝ ${correct}。`,
        knowledge: K("平均數"),
      };
    },
  },

  // ── 六年級：比率、百分率、圓、速度 ─────────────────────────────
  {
    topic: "百分率",
    grades: [6, 7],
    difficulty: "標準",
    gen(rng) {
      const percent = pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
      const total = pick(rng, [40, 60, 80, 100, 120, 150, 200, 240, 300]);
      const correct = (total * percent) / 100;
      if (!Number.isInteger(correct)) return null;
      return {
        grade: 6,
        prompt: `${total} 的 ${percent}% 是多少？`,
        correct,
        distractors: [total - correct, correct + 10, (total * percent) / 10],
        explanation: `${percent}% ＝ ${percent}/100，所以 ${total} × ${percent}/100 ＝ ${correct}。`,
        knowledge: K("百分率"),
      };
    },
  },
  {
    topic: "折扣計算",
    grades: [6, 7],
    difficulty: "標準",
    gen(rng) {
      const price = pick(rng, [80, 100, 120, 150, 200, 250, 300, 360, 400, 500]);
      const discount = pick(rng, [7, 75, 8, 85, 9, 6]);
      const correct = Math.round((price * discount) / 10);
      return {
        grade: 6,
        prompt: `一件定價 ${price} 元的商品打 ${discount} 折，售價是多少元？`,
        correct,
        distractors: [price - discount, Math.round((price * (100 - discount * 10)) / 100), price - correct],
        explanation: `${discount} 折＝定價 × ${discount}/10，${price} × ${discount}/10 ＝ ${correct} 元。`,
        knowledge: K("折扣與百分率"),
      };
    },
  },
  {
    topic: "圓周長",
    grades: [6, 7],
    difficulty: "標準",
    gen(rng) {
      const d = pick(rng, [4, 5, 6, 8, 10, 12, 15, 20, 25, 30]);
      const correct = Math.round(d * 3.14 * 10) / 10;
      return {
        grade: 6,
        prompt: `一個圓的直徑是 ${d} 公分，圓周長大約是多少公分？（圓周率用 3.14）`,
        correct,
        distractors: [Math.round(d * d * 3.14 * 10) / 10, d * 3.14 * 2, Math.round(d * 3.14 * 10) / 10 + 3.14],
        explanation: `圓周長＝直徑×圓周率 ＝ ${d}×3.14 ＝ ${correct} 公分。`,
        knowledge: K("圓周長"),
      };
    },
  },
  {
    topic: "圓面積",
    grades: [6, 7],
    difficulty: "挑戰",
    gen(rng) {
      const r = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
      const correct = Math.round(r * r * 3.14 * 10) / 10;
      return {
        grade: 6,
        prompt: `一個圓的半徑是 ${r} 公分，面積大約是多少平方公分？（圓周率用 3.14）`,
        correct,
        distractors: [Math.round(r * 2 * 3.14 * 10) / 10, Math.round(r * r * 3.14 * 2 * 10) / 10, Math.round(r * r * 10) / 10],
        explanation: `圓面積＝半徑×半徑×圓周率 ＝ ${r}×${r}×3.14 ＝ ${correct} 平方公分。`,
        knowledge: K("圓面積"),
      };
    },
  },
  {
    topic: "速度與距離",
    grades: [6, 7],
    difficulty: "標準",
    gen(rng) {
      const speed = pick(rng, [40, 50, 60, 65, 70, 75, 80, 90]);
      const time = pick(rng, [2, 3, 4, 5, 6]);
      const correct = speed * time;
      return {
        grade: 6,
        prompt: `一輛車以每小時 ${speed} 公里的速率行駛 ${time} 小時，共走多少公里？`,
        correct,
        distractors: [speed + time, Math.round((speed / time) * 10) / 10, correct + speed],
        explanation: `距離＝速率×時間 ＝ ${speed}×${time} ＝ ${correct} 公里。`,
        knowledge: K("速度與距離"),
      };
    },
  },
  {
    topic: "比例應用",
    grades: [6, 7],
    difficulty: "挑戰",
    gen(rng) {
      const ratio = pick(rng, [2, 3, 4, 5]);
      const unit = randInt(rng, 6, 40);
      const correct = ratio * unit;
      return {
        grade: 6,
        prompt: `甲、乙兩數的比是 1 ：${ratio}。若甲是 ${unit}，乙是多少？`,
        correct,
        distractors: [unit + ratio, Math.round((unit / ratio) * 10) / 10, correct + unit],
        explanation: `比 1：${ratio} 表示乙是甲的 ${ratio} 倍，${unit}×${ratio} ＝ ${correct}。`,
        knowledge: K("比例"),
      };
    },
  },

  // ── 七年級：負數、一元一次方程、代數 ───────────────────────────
  {
    topic: "負數加減",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, -20, -1);
      const b = randInt(rng, 3, 30);
      const correct = a + b;
      return {
        grade: 7,
        prompt: `計算 （${a}）＋ ${b} 的結果。`,
        correct,
        distractors: [Math.abs(a) + b, a - b, -(Math.abs(a) + b)],
        explanation: `數線上從 ${a} 往右 ${b} 格：${a} ＋ ${b} ＝ ${correct}。`,
        knowledge: K("負數運算"),
      };
    },
  },
  {
    topic: "負數大小比較",
    grades: [7, 8],
    difficulty: "基礎",
    gen(rng) {
      const a = -randInt(rng, 3, 30);
      const b = -randInt(rng, 3, 30);
      if (a === b) return null;
      const correct = a > b ? `${a} ＞ ${b}` : `${b} ＞ ${a}`;
      const wrong = a > b ? `${b} ＞ ${a}` : `${a} ＞ ${b}`;
      return {
        grade: 7,
        prompt: `下列哪一個大小關係正確？`,
        correct,
        distractors: [wrong, `${a} ＝ ${b}`, `${Math.abs(a)} ＜ ${Math.abs(b)}`],
        explanation: `數線上越右邊越大。負數離 0 越遠越小，因此 ${correct}。`,
        knowledge: K("負數與數線"),
      };
    },
  },
  {
    topic: "一元一次方程式",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 2, 9);
      const x = randInt(rng, 2, 15);
      const b = randInt(rng, 3, 40);
      const c = a * x + b;
      return {
        grade: 7,
        prompt: `解方程式 ${a}x ＋ ${b} ＝ ${c}，x 是多少？`,
        correct: x,
        distractors: [x + 1, x - 1, (c - b) / a + a],
        explanation: `移項：${a}x ＝ ${c} − ${b} ＝ ${c - b}，再除以 ${a} 得 x ＝ ${x}。`,
        knowledge: K("一元一次方程式"),
      };
    },
  },
  {
    topic: "代數式求值",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 12);
      const x = randInt(rng, 2, 12);
      const correct = a * x - b;
      return {
        grade: 7,
        prompt: `若 x ＝ ${x}，則 ${a}x − ${b} 的值是多少？`,
        correct,
        distractors: [a * x + b, a + x - b, a * (x - b)],
        explanation: `代入：${a}×${x} − ${b} ＝ ${a * x} − ${b} ＝ ${correct}。`,
        knowledge: K("代數式求值"),
      };
    },
  },
  {
    topic: "科學記號與大數",
    grades: [7, 8],
    difficulty: "挑戰",
    gen(rng) {
      const n = randInt(rng, 2, 9);
      const power = pick(rng, [3, 4, 5, 6]);
      const correct = `${n} × 10^${power}`;
      const value = n * 10 ** power;
      return {
        grade: 7,
        prompt: `把 ${value.toLocaleString("en-US")} 用科學記號表示，下列何者正確？`,
        correct,
        distractors: [`${n} × 10^${power - 1}`, `${n} × 10^${power + 1}`, `${n * 10} × 10^${power}`],
        explanation: `${value.toLocaleString("en-US")} ＝ ${n} × ${10 ** power} ＝ ${correct}。`,
        knowledge: K("科學記號"),
      };
    },
  },

  // ── 八年級：畢氏定理、平方根、聯立方程 ─────────────────────────
  {
    topic: "畢氏定理",
    grades: [8, 9],
    difficulty: "標準",
    gen(rng) {
      const triples = [
        [3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [10, 24, 26], [12, 16, 20],
      ];
      const [a, b, c] = pick(rng, triples);
      return {
        grade: 8,
        prompt: `直角三角形的兩股長分別為 ${a} 和 ${b}，斜邊長是多少？`,
        correct: c,
        distractors: [a + b, Math.round(Math.sqrt(a * a + b * b) * 10) / 10 + 1, Math.abs(a - b)],
        explanation: `畢氏定理：斜邊² ＝ ${a}² ＋ ${b}² ＝ ${a * a} ＋ ${b * b} ＝ ${a * a + b * b} ＝ ${c}²，所以斜邊是 ${c}。`,
        knowledge: K("畢氏定理"),
      };
    },
  },
  {
    topic: "平方根化簡",
    grades: [8, 9],
    difficulty: "標準",
    gen(rng) {
      const n = pick(rng, [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225]);
      const correct = Math.sqrt(n);
      return {
        grade: 8,
        prompt: `√${n} 的值是多少？`,
        correct,
        distractors: [n / 2, correct + 1, correct * 2],
        explanation: `${correct} × ${correct} ＝ ${n}，所以 √${n} ＝ ${correct}。`,
        knowledge: K("平方根"),
      };
    },
  },
  {
    topic: "二元一次聯立方程式",
    grades: [8, 9],
    difficulty: "挑戰",
    gen(rng) {
      const x = randInt(rng, 2, 12);
      const y = randInt(rng, 2, 12);
      if (x === y) return null;
      const correct = `x ＝ ${x}，y ＝ ${y}`;
      return {
        grade: 8,
        prompt: `解聯立方程式：x ＋ y ＝ ${x + y}，x − y ＝ ${x - y}（設 x ＞ y）。`,
        correct,
        distractors: [`x ＝ ${y}，y ＝ ${x}`, `x ＝ ${x + y}，y ＝ 0`, `x ＝ ${x - 1}，y ＝ ${y + 1}`],
        explanation: `兩式相加：2x ＝ ${2 * x}，x ＝ ${x}；代入得 y ＝ ${y}。`,
        knowledge: K("聯立方程式"),
      };
    },
  },
  {
    topic: "乘法公式",
    grades: [8, 9],
    difficulty: "挑戰",
    gen(rng) {
      const a = randInt(rng, 2, 12);
      const b = randInt(rng, 1, 9);
      const correct = a * a + 2 * a * b + b * b;
      return {
        grade: 8,
        prompt: `展開（${a} ＋ ${b}）² 的值是多少？`,
        correct,
        distractors: [a * a + b * b, a * a + 2 * a * b, (a + b) * 2],
        explanation: `（a＋b）² ＝ a² ＋ 2ab ＋ b² ＝ ${a * a} ＋ ${2 * a * b} ＋ ${b * b} ＝ ${correct}。`,
        knowledge: K("乘法公式"),
      };
    },
  },
  {
    topic: "統計量",
    grades: [6, 7],
    difficulty: "標準",
    gen(rng) {
      const nums = [];
      const n = 5;
      for (let i = 0; i < n; i += 1) nums.push(randInt(rng, 1, 20));
      const sorted = [...nums].sort((x, y) => x - y);
      const correct = sorted[2];
      return {
        grade: 6,
        prompt: `資料 ${nums.join("、")} 的中位數是多少？`,
        correct,
        distractors: [sorted[0], sorted[n - 1], Math.round((nums.reduce((a, b) => a + b, 0) / n) * 10) / 10],
        explanation: `由小到大排列：${sorted.join("、")}，正中間的數是 ${correct}。`,
        knowledge: K("統計量"),
      };
    },
  },
];

function pickCombo(rng, arr) {
  const out = [];
  const pool = [...arr];
  while (out.length < 3 && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/** 產生 target 題數學題；連續嘗試同主題失敗就換下一個主題。 */
export function generateMath(rng, collector, target, opts = {}) {
  const quota = opts.quota ?? null;
  let produced = 0;
  let guard = 0;
  while (produced < target && guard < target * 40) {
    guard += 1;
    const g = ALL_MATH_GENERATORS[Math.floor(rng() * ALL_MATH_GENERATORS.length)];
    const spec = g.gen(rng);
    if (!spec) continue;
    const question = buildChoice(rng, {
      subject: "數學",
      grade: spec.grade ?? g.grades[0],
      topic: g.topic,
      difficulty: g.difficulty,
      prompt: spec.prompt,
      correct: spec.correct,
      distractors: spec.distractors,
      explanation: spec.explanation,
      knowledge: spec.knowledge,
    });
    if (!question) continue;
    if (quota && !quota.take(question.grade)) continue;
    if (collector.add(question)) {
      produced += 1;
    } else if (quota) {
      quota.release(question.grade);
    }
  }
  return produced;
}

/**
 * 數學「跨單元組合題」：把四個不同單元的題目放進同一題比大小。
 *
 * 過去數學題一次只考一個單元，組合題只有文科有。這裡讓數學也能跨單元出題：
 * 四個選項各自是不同單元的題目，學生必須算完才比得出大小，等於一題練四個概念。
 * 答案同樣由程式算出，不會有算錯的變態題。
 */
export function generateMathCombo(rng, collector, target, opts = {}) {
  const quota = opts.quota ?? null;
  let produced = 0;
  let guard = 0;
  while (produced < target && guard < target * 60) {
    guard += 1;
    const picked = [];
    const usedTopics = new Set();
    let tries = 0;
    while (picked.length < 4 && tries < 60) {
      tries += 1;
      const g = ALL_MATH_GENERATORS[Math.floor(rng() * ALL_MATH_GENERATORS.length)];
      if (usedTopics.has(g.topic)) continue;
      const spec = g.gen(rng);
      if (!spec) continue;
      const value = Number(spec.correct);
      // 只收「答案是數字」且題目文字夠短的，選項才不會長到放不下。
      if (!Number.isFinite(value) || String(spec.prompt).length > 34) continue;
      usedTopics.add(g.topic);
      picked.push({ topic: g.topic, grade: spec.grade ?? g.grades[0], prompt: spec.prompt, value });
    }
    if (picked.length < 4) continue;
    const values = picked.map((p) => p.value);
    if (new Set(values).size !== values.length) continue;
    const wantMax = rng() < 0.5;
    const best = wantMax ? Math.max(...values) : Math.min(...values);
    const grade = Math.max(...picked.map((p) => p.grade));
    const letters = ["①", "②", "③", "④"];
    // 自己排選項：詳解裡的①②③④必須對應畫面上的順序，
    // 交給 buildChoice 洗牌會讓詳解的編號和選項對不起來。
    const entries = shuffle(rng, picked);
    const options = entries.map((e) => e.prompt);
    const answer = entries.findIndex((e) => e.value === best);
    const question = makeQuestion({
      subject: "數學",
      grade,
      topic: `跨單元比較（${picked.map((p) => p.topic).join("、")}）`,
      difficulty: "挑戰",
      prompt: pick(rng, [
        `下列四個題目中，哪一個的答案${wantMax ? "最大" : "最小"}？`,
        `四個題目都算完之後，哪一個的結果${wantMax ? "最大" : "最小"}？`,
        `下列哪一題算出來的數值${wantMax ? "最大" : "最小"}？`,
      ]),
      options,
      answer,
      explanation: `${entries
        .map((e, i) => `${letters[i]} ${e.prompt.replace("的結果。", "")} ＝ ${e.value}`)
        .join("；")}。因此答案${wantMax ? "最大" : "最小"}的是${letters[answer]}。`,
      knowledge: picked.map((p) => p.topic),
    });
    if (!question) continue;
    if (quota && !quota.take(question.grade)) continue;
    if (collector.add(question)) produced += 1;
    else if (quota) quota.release(question.grade);
  }
  return produced;
}

/** 國小＋國中產生器全部合在一起，隨機取用。 */
export const ALL_MATH_GENERATORS = [...GENERATORS, ...JUNIOR_GENERATORS];

export const MATH_GENERATOR_COUNT = ALL_MATH_GENERATORS.length;
