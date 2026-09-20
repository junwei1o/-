/**
 * 國中（七～九年級）數學產生器。
 *
 * 拆成獨立檔案的原因：七年級以上的教材（絕對值、指數律、一元二次、相似形、
 * 數列、機率、圓柱體積、直線斜率、根式）與國小的計算題差異很大，放在同一份
 * GENERATORS 陣列會讓檔案過長、難以維護。
 *
 * 規則與 math.mjs 相同：答案一律由程式算出來，干擾項模擬常見錯誤。
 */
import { randInt, pick } from "./common.mjs";

/** 主題共用知識標籤。 */
const K = (topic) => [topic];

/** 最大公因數（比的化簡、機率約分用）。 */
function gcd(x, y) {
  return y === 0 ? x : gcd(y, x % y);
}

export const JUNIOR_GENERATORS = [
  // ── 七年級補充 ───────────────────────────────────────────────────
  {
    topic: "絕對值",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 12, 48);
      const b = randInt(rng, a + 5, 96);
      const correct = b - a;
      return {
        grade: 7,
        prompt: `計算｜${a} − ${b}｜的值。`,
        correct,
        distractors: [a - b, a + b, correct + 10],
        explanation: `${a} − ${b} ＝ ${a - b}，取絕對值後為 ${correct}（絕對值一定是正數或 0）。`,
        knowledge: K("絕對值"),
      };
    },
  },
  {
    topic: "指數律",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const base = pick(rng, [2, 3, 5]);
      const m = randInt(rng, 2, 4);
      const n = randInt(rng, 2, 5);
      const correct = base ** (m + n);
      return {
        grade: 7,
        prompt: `計算 ${base} 的 ${m} 次方 × ${base} 的 ${n} 次方（同底數相乘）。`,
        correct,
        distractors: [base ** (m * n), base ** m + base ** n, base ** (m + n + 1)],
        explanation: `同底數相乘、指數相加：${base}^${m} × ${base}^${n} ＝ ${base}^${m + n} ＝ ${correct}。`,
        knowledge: K("指數律"),
      };
    },
  },
  {
    topic: "比的化簡",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const p = randInt(rng, 2, 9);
      let q = randInt(rng, 2, 9);
      if (q === p) q = p + 1;
      if (gcd(p, q) !== 1) return null;
      const g = randInt(rng, 2, 6);
      const a = p * g;
      const b = q * g;
      return {
        grade: 7,
        prompt: `將 ${a}：${b} 化為最簡單整數比。`,
        correct: `${p}：${q}`,
        distractors: [`${a / 2.0}：${b / 2.0}`, `${q}：${p}`, `${g}：${g}`],
        explanation: `${a} 與 ${b} 同除以最大公因數 ${g}，得到最簡比 ${p}：${q}。`,
        knowledge: K("比的化簡"),
      };
    },
  },
  // ── 八年級補充 ───────────────────────────────────────────────────
  {
    topic: "座標與距離",
    grades: [8, 9],
    difficulty: "標準",
    gen(rng) {
      const [dx, dy, dist] = pick(rng, [
        [3, 4, 5],
        [6, 8, 10],
        [5, 12, 13],
        [9, 12, 15],
      ]);
      const x1 = randInt(rng, -5, 5);
      const y1 = randInt(rng, -5, 5);
      const x2 = x1 + dx;
      const y2 = y1 + dy;
      return {
        grade: 8,
        prompt: `座標平面上，A（${x1}，${y1}）與 B（${x2}，${y2}）兩點的距離是多少？`,
        correct: dist,
        distractors: [dx + dy, dist + 2, Math.abs(dx - dy) + Math.min(dx, dy)],
        explanation: `橫向差 ${dx}、縱向差 ${dy}，距離 ＝ √（${dx}²＋${dy}²）＝ √${dx * dx + dy * dy} ＝ ${dist}。`,
        knowledge: K("座標與距離"),
      };
    },
  },
  {
    topic: "一次函數求值",
    grades: [8, 9],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, -4, 6) || 2;
      const b = randInt(rng, -5, 8);
      const x = randInt(rng, 1, 9);
      const correct = a * x + b;
      const sign = b < 0 ? "−" : "＋";
      return {
        grade: 8,
        prompt: `已知 y ＝ ${a}x ${sign} ${Math.abs(b)}，當 x ＝ ${x} 時，y 是多少？`,
        correct,
        distractors: [a * x - b, a + b * x, correct + a],
        explanation: `把 x ＝ ${x} 代入：y ＝ ${a}×${x} ${sign} ${Math.abs(b)} ＝ ${correct}。`,
        knowledge: K("一次函數求值"),
      };
    },
  },
  {
    topic: "多項式加減",
    grades: [8, 9],
    difficulty: "標準",
    gen(rng) {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 1, 9);
      const c = randInt(rng, 1, 8);
      const d = randInt(rng, 1, 9);
      return {
        grade: 8,
        prompt: `化簡（${a}x ＋ ${b}）＋（${c}x ＋ ${d}）。`,
        correct: `${a + c}x ＋ ${b + d}`,
        distractors: [`${a + c}x ＋ ${b - d}`, `${a - c}x ＋ ${b + d}`, `${a * c}x ＋ ${b + d}`],
        explanation: `同類項合併：x 項 ${a}＋${c} ＝ ${a + c}，常數項 ${b}＋${d} ＝ ${b + d}，所以是 ${a + c}x ＋ ${b + d}。`,
        knowledge: K("多項式加減"),
      };
    },
  },
  {
    topic: "平方根估算",
    grades: [7, 8],
    difficulty: "標準",
    gen(rng) {
      const k = randInt(rng, 3, 12);
      const n = k * k + randInt(rng, 1, 2 * k);
      return {
        grade: 8,
        prompt: `√${n} 的值介於哪兩個連續整數之間？`,
        correct: `${k} 與 ${k + 1}`,
        distractors: [`${k - 1} 與 ${k}`, `${k + 1} 與 ${k + 2}`, `${k} 與 ${k + 2}`],
        explanation: `${k}² ＝ ${k * k}，${k + 1}² ＝ ${(k + 1) ** 2}，而 ${k * k} ＜ ${n} ＜ ${(k + 1) ** 2}，所以 √${n} 介於 ${k} 與 ${k + 1} 之間。`,
        knowledge: K("平方根估算"),
      };
    },
  },
  {
    topic: "二元一次應用",
    grades: [8, 9],
    difficulty: "挑戰",
    gen(rng) {
      const rabbits = randInt(rng, 3, 15);
      const chickens = randInt(rng, 5, 20);
      const heads = rabbits + chickens;
      const legs = rabbits * 4 + chickens * 2;
      return {
        grade: 8,
        prompt: `籠子裡有雞與兔共 ${heads} 隻，腳共 ${legs} 隻，兔子有幾隻？`,
        correct: rabbits,
        distractors: [chickens, heads, Math.floor(legs / 4)],
        explanation: `設兔 r 隻、雞（${heads} − r）隻：4r ＋ 2（${heads} − r）＝ ${legs}，化簡得 2r ＝ ${legs - 2 * heads}，r ＝ ${rabbits}。`,
        knowledge: K("二元一次應用"),
      };
    },
  },
  // ── 九年級 ───────────────────────────────────────────────────────
  {
    topic: "一元二次方程式",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const r1 = randInt(rng, 1, 8);
      let r2 = randInt(rng, 1, 8);
      if (r1 === r2) r2 = r1 + randInt(rng, 1, 3);
      const s = r1 + r2;
      const p = r1 * r2;
      return {
        grade: 9,
        prompt: `方程式 x² − ${s}x ＋ ${p} ＝ 0 的兩根為何？`,
        correct: `x ＝ ${r1} 或 x ＝ ${r2}`,
        distractors: [`x ＝ ${r1} 或 x ＝ ${-r2}`, `x ＝ ${s} 或 x ＝ ${p}`, `x ＝ ${-r1} 或 x ＝ ${-r2}`],
        explanation: `因式分解：x² − ${s}x ＋ ${p} ＝（x − ${r1}）（x − ${r2}）＝ 0，所以 x ＝ ${r1} 或 x ＝ ${r2}。`,
        knowledge: K("一元二次方程式"),
      };
    },
  },
  {
    topic: "相似形",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const k = pick(rng, [2, 3, 4]);
      const ab = randInt(rng, 2, 9);
      const de = ab * k;
      const bc = randInt(rng, 3, 12);
      const correct = bc * k;
      return {
        grade: 9,
        prompt: `△ABC 與 △DEF 相似，AB ＝ ${ab}、DE ＝ ${de}、BC ＝ ${bc}，則 EF 是多少？`,
        correct,
        distractors: [Math.round(bc / k), bc + ab, bc + de],
        explanation: `對應邊成比例：DE ÷ AB ＝ ${de} ÷ ${ab} ＝ ${k}，所以 EF ＝ BC × ${k} ＝ ${bc} × ${k} ＝ ${correct}。`,
        knowledge: K("相似形"),
      };
    },
  },
  {
    topic: "圓周角與圓心角",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const half = randInt(rng, 20, 80);
      const center = half * 2;
      return {
        grade: 9,
        prompt: `同一弧所對的圓心角是 ${center} 度，則圓周角是多少度？`,
        correct: half,
        distractors: [center, center * 2, 180 - half],
        explanation: `同弧所對的圓周角等於圓心角的一半：${center} ÷ 2 ＝ ${half} 度。`,
        knowledge: K("圓周角與圓心角"),
      };
    },
  },
  {
    topic: "等差數列",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const a1 = randInt(rng, 2, 12);
      const d = randInt(rng, 2, 8);
      const n = randInt(rng, 6, 15);
      const correct = a1 + (n - 1) * d;
      return {
        grade: 9,
        prompt: `等差數列首項 ${a1}、公差 ${d}，第 ${n} 項是多少？`,
        correct,
        distractors: [a1 + n * d, a1 + (n - 1) * d * 2, a1 - (n - 1) * d],
        explanation: `第 n 項 ＝ 首項 ＋（n − 1）× 公差 ＝ ${a1} ＋ ${n - 1} × ${d} ＝ ${correct}。`,
        knowledge: K("等差數列"),
      };
    },
  },
  {
    topic: "等差級數和",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const a1 = randInt(rng, 1, 10);
      const d = randInt(rng, 1, 6);
      const n = pick(rng, [6, 8, 10, 12, 14]);
      const an = a1 + (n - 1) * d;
      const correct = (n * (a1 + an)) / 2;
      return {
        grade: 9,
        prompt: `等差數列首項 ${a1}、末項 ${an}、共 ${n} 項，總和是多少？`,
        correct,
        distractors: [n * (a1 + an), Math.round((a1 + an) / 2), correct + d],
        explanation: `總和 ＝（首項 ＋ 末項）× 項數 ÷ 2 ＝（${a1} ＋ ${an}）× ${n} ÷ 2 ＝ ${correct}。`,
        knowledge: K("等差級數和"),
      };
    },
  },
  {
    topic: "等比數列",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const a1 = randInt(rng, 1, 5);
      const r = pick(rng, [2, 3]);
      const n = pick(rng, [4, 5, 6]);
      const correct = a1 * r ** (n - 1);
      return {
        grade: 9,
        prompt: `等比數列首項 ${a1}、公比 ${r}，第 ${n} 項是多少？`,
        correct,
        distractors: [a1 * r ** n, a1 + (n - 1) * r, correct + r],
        explanation: `第 n 項 ＝ 首項 × 公比^(n−1) ＝ ${a1} × ${r}^${n - 1} ＝ ${correct}。`,
        knowledge: K("等比數列"),
      };
    },
  },
  {
    topic: "古典機率",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const red = randInt(rng, 2, 6);
      const blue = randInt(rng, 1, 5);
      const green = randInt(rng, 1, 4);
      const total = red + blue + green;
      const g = gcd(red, total);
      const correct = g === 1 ? `${red}/${total}` : `${red / g}/${total / g}`;
      return {
        grade: 9,
        prompt: `袋中有紅球 ${red} 顆、藍球 ${blue} 顆、綠球 ${green} 顆，任取一顆，取到紅球的機率是多少？`,
        correct,
        distractors: [`${red}/${blue + green}`, `${blue}/${total}`, `${red + green}/${total}`],
        explanation: `機率 ＝ 紅球數 ÷ 總球數 ＝ ${red} ÷ ${total} ＝ ${correct}。`,
        knowledge: K("古典機率"),
      };
    },
  },
  {
    topic: "圓柱體積",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const r = randInt(rng, 2, 9);
      const h = randInt(rng, 4, 15);
      const correct = Math.round(3.14 * r * r * h * 10) / 10;
      return {
        grade: 9,
        prompt: `底面半徑 ${r} 公分、高 ${h} 公分的圓柱，體積約是多少立方公分？（π ≈ 3.14）`,
        correct,
        distractors: [
          Math.round(2 * 3.14 * r * h * 10) / 10,
          Math.round(((3.14 * r * r * h) / 3) * 10) / 10,
          Math.round(3.14 * r * h * 10) / 10,
        ],
        explanation: `圓柱體積 ＝ 底面積 × 高 ＝ π × ${r}² × ${h} ＝ 3.14 × ${r * r} × ${h} ＝ ${correct} 立方公分。`,
        knowledge: K("圓柱體積"),
      };
    },
  },
  {
    topic: "直線斜率",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const m = pick(rng, [-3, -2, 2, 3, 4]);
      const x1 = randInt(rng, -4, 4);
      const y1 = randInt(rng, -4, 6);
      const dx = randInt(rng, 1, 4);
      const x2 = x1 + dx;
      const y2 = y1 + m * dx;
      return {
        grade: 9,
        prompt: `直線通過（${x1}，${y1}）與（${x2}，${y2}）兩點，斜率是多少？`,
        correct: m,
        distractors: [-m, y2 - y1, x2 - x1],
        explanation: `斜率 ＝（y 的差）÷（x 的差）＝（${y2} − ${y1}）÷（${x2} − ${x1}）＝ ${y2 - y1} ÷ ${dx} ＝ ${m}。`,
        knowledge: K("直線斜率"),
      };
    },
  },
  {
    topic: "根式加減",
    grades: [9],
    difficulty: "挑戰",
    gen(rng) {
      const k = pick(rng, [2, 3, 5]);
      const a = randInt(rng, 1, 6);
      const b = randInt(rng, 1, 6);
      return {
        grade: 9,
        prompt: `化簡 ${a}√${k} ＋ ${b}√${k}。`,
        correct: `${a + b}√${k}`,
        distractors: [`${a + b + k}√${k}`, `${a * b}√${k}`, `${a + b}√${k + 1}`],
        explanation: `同類方根可合併：${a}√${k} ＋ ${b}√${k} ＝（${a} ＋ ${b}）√${k} ＝ ${a + b}√${k}。`,
        knowledge: K("根式加減"),
      };
    },
  },
];
