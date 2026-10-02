/**
 * 深思題產生器（2026-10-03）——200 題、五科各 40、每題作答上限 180 秒。
 *
 * ## 這批題與其他題的差別
 *
 * - `timeLimitSec: 180`：一般題 30 秒，這批給 3 分鐘，設計上就是**多步驟推理或
 *   綜合判斷**——不是把難題塞進來就好，而是題目本身需要「先想再答」。
 * - 三種命題角度刻意混排：
 *   1. **陷阱題**：針對易混淆觀念（周長 vs 面積、天氣 vs 氣候、much vs many），
 *      干擾項就是學生真的會選的「那個錯」。
 *   2. **變體題**：同一知識點反向出（已知平均求其中一數、磁鐵「吸不起來」的是什麼）。
 *   3. **高難度**：控制變因、題組推論、多步計算——考深度理解與細節掌握。
 * - `questionType` 維持「選擇題」：讓既有的 UI、計分、診斷**零改動**沿用，
 *   「特殊」只體現在時間上限（`timeLimitSec`）與題目本身的深度。
 *
 * 品質原則同 crossSubject：**情境與數字由程式產生、答案由程式算出**，
 * 同一配方換參數就長出不同的題目；干擾項是「合理的錯」。
 */
import { randInt, pick, shuffle, makeQuestion } from "./common.mjs";

/** 把正解與干擾項洗牌後回傳 { options, answer }。 */
function assemble(rng, correct, wrongs) {
  const options = shuffle(rng, [correct, ...wrongs]);
  return { options, answer: options.indexOf(correct) };
}

/* ==========================================================================
 * 數學（8 條配方）
 * ========================================================================== */
const MATH_RECIPES = [
  {
    id: "fence-vs-area",
    topic: "周長與面積的區別",
    difficulty: "基礎",
    grades: [4, 5, 6],
    knowledge: ["周長計算", "面積計算", "周長與面積的區別"],
    build(rng) {
      const a = randInt(rng, 5, 12);
      const b = randInt(rng, 3, a - 1);
      const area = a * b;
      const peri = 2 * (a + b);
      return {
        prompt: `一塊長 ${a} 公尺、寬 ${b} 公尺的長方形花圃，爸爸要沿著它的四邊圍上籬笆。妹妹先算出面積是 ${area} 平方公尺，接著問：這圈籬笆總共要多少公尺？`,
        correct: `${peri} 公尺，因為籬笆沿著邊走，算的是周長`,
        wrongs: [
          `${area} 公尺，因為籬笆的長度就等於面積`,
          `${a + b} 公尺，把長和寬加起來就是四邊總長`,
          `${area * 2} 公尺，面積乘以 2 就是周長`,
        ],
        explanation: `籬笆沿著四邊圍一圈，求的是周長：(${a}＋${b})×2＝${peri} 公尺。${area} 平方公尺是面積——鋪磁磚、種草皮才用面積，圍籬笆要用周長，這是兩種不同的量。`,
      };
    },
  },
  {
    id: "rate-two-leg",
    topic: "速率與平均速率",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["距離＝速率×時間", "平均速率的意義"],
    build(rng) {
      const v1 = pick(rng, [4, 5, 6]);
      const t1 = pick(rng, [2, 3]);
      const v2 = pick(rng, [8, 10, 12]);
      const t2 = pick(rng, [1, 2]);
      const d1 = v1 * t1;
      const d2 = v2 * t2;
      const total = d1 + d2;
      const hours = t1 + t2;
      const avg = total / hours;
      return {
        prompt: `小華先以每小時 ${v1} 公里走了 ${t1} 小時，休息後再用每小時 ${v2} 公里的速度騎了 ${t2} 小時到家。這一整趟的「平均速率」是每小時幾公里？`,
        correct: `${avg} 公里，要用總距離除以總時間`,
        wrongs: [
          `${(v1 + v2) / 2} 公里，把兩個速率相加除以 2`,
          `${avg + 1} 公里，用較快的那段當基準再校正`,
          `${total} 公里，總距離就是平均速率`,
        ],
        explanation: `前段 ${v1}×${t1}＝${d1} 公里，後段 ${v2}×${t2}＝${d2} 公里，總距離 ${total} 公里、總時間 ${hours} 小時，平均速率＝${total}÷${hours}＝${avg} 公里。把兩個速率直接平均是常見陷阱——各段花的時間不同，不能這樣算。`,
      };
    },
  },
  {
    id: "fraction-remainder",
    topic: "用分數表示剩下的量",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["分數乘法", "餘量的分數"],
    build(rng) {
      const n = pick(rng, [24, 36, 48, 60]);
      const first = n / 3;
      const rest1 = n - first;
      const second = rest1 / 4;
      const eaten = first + second;
      return {
        prompt: `一盒巧克力有 ${n} 顆。小明第一天吃掉全部的 1/3，第二天吃掉「剩下的」1/4。兩天總共吃掉幾顆？`,
        correct: `${eaten} 顆，第二天的 1/4 要用剩下的顆數來算`,
        wrongs: [
          `${first + n / 4} 顆，第二天也是吃全部的 1/4`,
          `${Math.round(n / 3 + n / 4)} 顆，把兩個 1/3 和 1/4 直接相加`,
          `${rest1} 顆，第二天把剩下的全部吃完了`,
        ],
        explanation: `第一天吃 ${n}÷3＝${first} 顆，剩 ${rest1} 顆；第二天的 1/4 是「剩下的」的 1/4：${rest1}÷4＝${second} 顆。兩天共 ${eaten} 顆。關鍵是「剩下的 1/4」的分母單位和第一題不同。`,
      };
    },
  },
  {
    id: "discount-freight",
    topic: "折扣與總價的兩步計算",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["折扣的意義", "兩步驟計算"],
    build(rng) {
      const p = pick(rng, [800, 1200, 1500, 2000]);
      const d = pick(rng, [7, 8, 9]);
      const f = pick(rng, [50, 80, 100]);
      const after = p * d / 10;
      const total = after + f;
      return {
        prompt: `一張書桌定價 ${p} 元，特價打 ${d} 折。網購還要另外加 ${f} 元運費。買下這張書桌總共要付多少元？`,
        correct: `${total} 元，先算打折後的價錢再加運費`,
        wrongs: [
          `${p * d / 10 - f} 元，運費要從打折價裡扣掉`,
          `${(p - f) * d / 10} 元，先扣運費再打折`,
          `${Math.round(p * (d / 10) * 0.9) + f} 元，打折後再打九折`,
        ],
        explanation: `打折是「先」算：${p}×${d / 10}＝${after} 元；運費是「另外加」：${after}＋${f}＝${total} 元。「先扣再折」或「折完再折」都不符合題意。`,
      };
    },
  },
  {
    id: "liter-milliliter",
    topic: "公升與毫升的換算",
    difficulty: "基礎",
    grades: [4, 5],
    knowledge: ["容量單位換算", "1公升=1000毫升"],
    build(rng) {
      const per = pick(rng, [250, 350, 480]);
      const bottles = randInt(rng, 4, 8);
      const totalMl = per * bottles;
      const potL = pick(rng, [2, 3]);
      const potMl = potL * 1000;
      const diff = Math.abs(potMl - totalMl);
      const fits = totalMl <= potMl;
      return {
        prompt: `每瓶果汁 ${per} 毫升，買了 ${bottles} 瓶，全部倒進一個容量 ${potL} 公升的水壺。這壺裝得下嗎？`,
        correct: fits
          ? `裝得下，還剩 ${diff} 毫升的空間`
          : `裝不下，會多出 ${diff} 毫升`,
        wrongs: [
          fits
            ? `裝不下，會多出 ${diff} 毫升`
            : `裝得下，還剩 ${diff} 毫升的空間`,
          `裝得下，因為 ${bottles} 瓶加起來不到 ${potL} 毫升（把 ${potL} 公升看成 ${potL * 100} 毫升）`,
          `剛剛好裝滿，一滴都不多不少`,
        ],
        explanation: `${bottles} 瓶共 ${per}×${bottles}＝${totalMl} 毫升；水壺 ${potL} 公升＝${potMl} 毫升。${fits ? `${potMl}−${totalMl}＝${diff}，還有空間。` : `${totalMl}−${potMl}＝${diff}，超過水壺容量。`}陷阱在於 1 公升＝1000 毫升，不是 100 毫升。`,
      };
    },
  },
  {
    id: "average-inverse",
    topic: "平均數的反向問題",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["平均數", "由平均反求總和"],
    build(rng) {
      const people = pick(rng, [4, 5]);
      const avg1 = pick(rng, [140, 150, 160]);
      const sum1 = people * avg1;
      const avg2 = avg1 + pick(rng, [2, 4, 5]);
      const sum2 = (people + 1) * avg2;
      const newcomer = sum2 - sum1;
      return {
        prompt: `${people} 位同學的身高平均是 ${avg1} 公分。後來加入一位新同學，${people + 1} 人的平均變成 ${avg2} 公分。新同學的身高是幾公分？`,
        correct: `${newcomer} 公分，用新的總和減掉原本的總和`,
        wrongs: [
          `${avg2 - avg1} 公分，平均增加幾公分身高就是幾公分`,
          `${avg2} 公分，新同學的身高就是新的平均`,
          `${sum2 - sum1 + avg1} 公分，把原平均也加進去`,
        ],
        explanation: `原本總和＝${avg1}×${people}＝${sum1} 公分；加入後總和＝${avg2}×${people + 1}＝${sum2} 公分。新同學身高＝${sum2}−${sum1}＝${newcomer} 公分。反向題的關鍵：先由平均還原成總和，再相減。`,
      };
    },
  },
  {
    id: "age-future-ratio",
    topic: "年齡問題的倍數關係",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["年齡差固定", "倍數關係解題"],
    build(rng) {
      const b = pick(rng, [6, 8, 10]);
      const k = pick(rng, [3, 4]);
      const x = randInt(rng, 2, 6);
      const a = k * (b + x) - x;
      const years = a - b;
      return {
        prompt: `今年爸爸 ${a} 歲、兒子 ${b} 歲。再過幾年，爸爸的年齡會剛好是兒子的 ${k} 倍？`,
        correct: `再過 ${x} 年，那時爸爸 ${a + x} 歲、兒子 ${b + x} 歲`,
        wrongs: [
          `再過 ${k} 年，倍數是 ${k} 就再等 ${k} 年`,
          `再過 ${Math.max(1, x - 1)} 年，用年齡差除以 3 估計`,
          `永遠不可能，倍數只會一直不變`,
        ],
        explanation: `設再過 x 年：${a}＋x＝${k}×(${b}＋x)。整理得 x＝(${a}−${k}×${b})÷${k - 1}＝${x} 年。檢驗：那時爸爸 ${a + x} 歲、兒子 ${b + x} 歲，${a + x}＝${k}×${b + x} ✓。年齡差永遠是 ${years} 歲，但倍數會隨時間變小。`,
      };
    },
  },
  {
    id: "pyramid-layers",
    topic: "數列規律與階梯求和",
    difficulty: "挑戰",
    grades: [4, 5, 6],
    knowledge: ["數列規律", "1到n的總和"],
    build(rng) {
      const n = pick(rng, [6, 7, 8]);
      const total = (n * (n + 1)) / 2;
      const top = 1;
      return {
        prompt: `用積木堆階梯金字塔：最上層 ${top} 塊，第二層 2 塊，第三層 3 塊……每層比上一層多 1 塊。堆到第 ${n} 層，總共需要幾塊積木？`,
        correct: `${total} 塊，把 1 加到 ${n}`,
        wrongs: [
          `${n * n} 塊，每一層都用 ${n} 塊來算`,
          `${2 * n} 塊，只算了最上層和最下層`,
          `${total + n} 塊，多算了一次最下層`,
        ],
        explanation: `總數＝1＋2＋…＋${n}＝${n}×(${n}＋1)÷2＝${total} 塊。常見錯法是每層都當 ${n} 塊（那是 ${n * n}），但階梯每層都在遞增。`,
      };
    },
  },
];

/* ==========================================================================
 * 自然（8 條配方）
 * ========================================================================== */
const SCIENCE_RECIPES = [
  {
    id: "weather-vs-climate",
    topic: "天氣與氣候的區別",
    difficulty: "基礎",
    grades: [3, 4, 5],
    knowledge: ["天氣", "氣候", "長期觀察與瞬間觀察"],
    build(rng) {
      const sets = [
        { c: "高雄", o: "夏天炎熱多雨、冬天較少雨，這是長年累月觀察出來的規律" },
        { c: "台北", o: "冬季吹東北季風，陰雨綿綿的日子特別多" },
        { c: "墾丁", o: "全年溫暖，即使冬天也很少低於攝氏 15 度" },
        { c: "阿里山", o: "海拔高所以終年涼爽，是著名的避暑勝地" },
        { c: "花蓮", o: "夏天常受颱風影響，是多年的平均現象" },
        { c: "台南", o: "每年五、六月有梅雨季，這是固定的季節規律" },
        { c: "基隆", o: "秋冬多雨是有名的特徵，年年如此" },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `下列哪一句話描述的是「氣候」，而不是「天氣」？`,
        correct: `${it.c}${it.o}`,
        wrongs: [
          `${it.c}現在正在下雨，出門要記得帶傘`,
          `氣象報導說${it.c}明天會轉涼，低溫下探 18 度`,
          `${it.c}今天下午起霧，高速公路能見度變差`,
        ],
        explanation: `氣候是**長時間、多年**觀察出來的穩定規律；天氣是**此刻或短期**的狀況。「正在下雨」「明天轉涼」「今天起霧」都是天氣；描述長年規律（夏雨冬乾、終年涼爽）才是氣候。`,
      };
    },
  },
  {
    id: "cloud-formation",
    topic: "水循環與雲的形成",
    difficulty: "標準",
    grades: [4, 5],
    knowledge: ["蒸發", "凝結", "水循環"],
    build(rng) {
      const cases = [
        { s: "水蒸氣升到高空遇冷，聚集在灰塵上變成小水滴，形成雲。", q: "這個「變成小水滴」的過程叫做什麼？", a: "凝結", w: ["蒸發", "沸騰", "逕流"], n: "氣態→液態是凝結。蒸發方向相反；沸騰是劇烈汽化；逕流是雨水在地表流動。" },
        { s: "天晴時，操場上的積水過了半天就不見了。", q: "積水「不見」的過程叫做什麼？", a: "蒸發", w: ["凝結", "逕流", "下滲"], n: "液態水變成水蒸氣散到空氣中，是蒸發。" },
        { s: "雲裡的小水滴越聚越大，最後掉落下來。", q: "掉落下來的東西是什麼？", a: "雨，液態的水", w: ["雪，固態的冰晶", "雹，一層層凍成的冰球", "霧，飄在空中的小水滴"], n: "雲中小水滴合併變大、落下來就是雨。" },
        { s: "雨落在山上，順著地勢流進小溪，再匯入大河。", q: "雨水沿地表流動的過程叫做什麼？", a: "逕流", w: ["蒸發", "凝結", "降水"], n: "雨水在地表流動叫逕流，它把水送回海洋，完成水循環。" },
        { s: "冰箱的冰塊拿出來一會兒，表面變成了一灘水。", q: "冰變成水的過程叫做什麼？", a: "融化", w: ["凝固", "凝結", "蒸發"], n: "固態→液態是融化；液態→固態才是凝固。別跟「凝結」（氣態→液態）搞混——這是最經典的陷阱。" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `${it.s}\n${it.q}`,
        correct: it.a,
        wrongs: it.w,
        explanation: it.n,
      };
    },
  },
  {
    id: "control-variables",
    topic: "對照實驗與變因控制",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["控制變因", "操縱變因", "對照實驗設計"],
    build(rng) {
      const cases = [
        { f: "陽光照射量", w: ["一盆放窗邊曬太陽、一盆放房間角落，但澆水量也不同", "兩盆都用不同品牌的土壤，比較陽光影響", "兩盆都曬太陽，只有一盆施肥，看長高速度"] },
        { f: "澆水量", w: ["一盆澆 100 毫升、一盆澆 200 毫升，但一盆曬太陽一盆不曬", "兩盆都放室內，但一盆用大盆一盆用小盆", "一盆每天澆水、一盆三天澆一次，土壤也換成不同的"] },
        { f: "土壤種類", w: ["一盆用壤土一盆用砂土，但澆水量也跟著不同", "兩盆土一樣，但一盆在陽台一盆在浴室", "一盆澆水一次澆很多、一盆少量多次"] },
        { f: "溫度", w: ["一盆放冰箱旁、一盆放暖爐邊，但澆水量也不同", "兩盆都用不同品種的豆苗種子", "一盆用自來水、一盆用雨水，溫度也不同"] },
        { f: "音樂（聽音樂會不會長更快）", w: ["一盆聽音樂、一盆不聽，但兩盆的陽光和澆水都相同", "一盆聽音樂也多澆水，一盆都不做", "兩盆都聽音樂，但品種不同"] },
        { f: "花盆顏色", w: ["一盆用黑盆、一盆用白盆，但黑盆那盆特別多澆水", "兩盆都種向日葵，但一品種不同", "一盆白天放室外、一盆整晚放室外"] },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `小美想知道「${it.f}」會不會影響豆苗生長的高度。她準備了兩盆同品種的豆苗。要成為公平的對照實驗，兩盆應該怎麼安排？`,
        correct: `除了${it.f}不同之外，澆水量、土壤、溫度、花盆大小等其他條件都要完全相同`,
        wrongs: it.w,
        explanation: `對照實驗只能有**一個操縱變因**（這裡是${it.f}），其他所有可能影響結果的變因都必須**控制相同**，這樣才能把高度的差異歸因給${it.f}。題目選項裡「同時改兩個條件」的安排都是陷阱——差異將無法歸因。`,
      };
    },
  },
  {
    id: "moon-phase-sequence",
    topic: "月相變化的順序",
    difficulty: "標準",
    grades: [4, 5, 6],
    knowledge: ["月相變化", "農曆與月相對應"],
    build(rng) {
      const cases = [
        { t: "滿月（農曆十五）", a: `下弦月，亮面在左半邊（開始變缺）`, w: [`上弦月，亮面在右半邊`, `新月，完全看不見`, `滿月，繼續維持圓形`] },
        { t: "新月（農曆初一）", a: `上弦月，亮面在右半邊（慢慢變圓）`, w: [`下弦月，亮面在左半邊`, `滿月，直接變成滿月`, `殘月，越來越細`] },
        { t: "上弦月（農曆初七、八）", a: `滿月，亮面繼續變大到整圓`, w: [`新月，回到看不見`, `下弦月，直接變成左亮`, `殘月，開始變細`] },
        { t: "下弦月（農曆二十二、三）", a: `殘月，亮面越來越細直到消失`, w: [`滿月，又變回圓形`, `上弦月，回到右半邊亮`, `新月後立刻滿月`] },
        { t: "殘月（農曆二十六、七）", a: `新月，一輪循環結束重新開始`, w: [`滿月，月底一定滿月`, `上弦月，直接跳回上半月`, `永遠停留在殘月`] },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `今晚的月亮是${it.t}。依照月相變化的規律，大約再過 7 天，會看到哪一種月相？`,
        correct: it.a,
        wrongs: it.w,
        explanation: `月相約每 7 天換一個階段：新月→上弦月→滿月→下弦月→新月，一個週期約 29.5 天。${it.t}再過約 7 天就是循環中的下一階段。滿月到下一個滿月要等完整一個週期，不是 7 天。`,
      };
    },
  },
  {
    id: "magnet-inverse",
    topic: "磁鐵能吸什麼",
    difficulty: "基礎",
    grades: [3, 4],
    knowledge: ["磁鐵吸引鐵製品", "不被磁鐵吸引的材料"],
    build(rng) {
      const cases = [
        { q: `小翊拿磁鐵去吸教室裡的東西。下列哪一個東西**吸不起來**？`, a: `不鏽鋼湯匙（主要成分不含會被磁吸的鐵）`, w: [`鐵製的釘書針`, `迴紋針`, `鐵製的圖釘`], n: `磁鐵吸引**鐵、鈷、鎳**。釘書針、迴紋針、圖釘多是鐵製品會被吸住；不鏽鋼或銅製湯匙吸不起來。` },
        { q: `磁鐵隔著一張紙，還能吸住底下的迴紋針嗎？`, a: `能，磁力可以穿過紙張等非金屬薄層`, w: [`不能，只要隔著東西就完全失效`, `只能隔著金屬片才吸得到`, `要把磁鐵貼上去才吸得到`], n: `磁力能穿過紙、玻璃、水等非磁性物質（隔太厚或太遠才會減弱）。金屬片中只有鐵鈷鎳會被磁化而擋住磁力線。` },
        { q: `一根磁棒從中間切斷，每一半還有 N 極和 S 極嗎？`, a: `有，每一半都會各自變成完整的磁鐵（各有 N、S 極）`, w: [`一半只剩 N 極，另一半只剩 S 極`, `切斷後就失去磁性，兩半都不吸了`, `只有靠 N 極的那半有磁性`], n: `磁極永遠成對存在，切斷後每一段都重新長出 N、S 兩極，**不可能有單極磁鐵**——這是磁性的重要特性。` },
        { q: `兩個條形磁鐵的 N 極互相靠近，會發生什麼事？`, a: `互相排斥，推開彼此`, w: [`互相吸引，緊緊黏住`, `沒有任何反應`, `先吸後斥`], n: `同名極相斥、異名極相吸。N 對 N 是同名極，所以互相排斥。` },
      ];
      const it = pick(rng, cases);
      return {
        prompt: it.q,
        correct: it.a,
        wrongs: it.w,
        explanation: it.n,
      };
    },
  },
  {
    id: "reflection-angle",
    topic: "光的反射與角度",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["光的反射", "入射角等於反射角"],
    build(rng) {
      const deg = pick(rng, [15, 20, 25, 30, 40, 50, 60, 70]);
      const wrong1 = 90 - deg;
      const wrong2 = deg * 2;
      return {
        prompt: `一面鏡子平放在桌上，一道光以和鏡面夾 ${deg} 度的方向射向鏡面。反射光線與鏡面的夾角會是幾度？`,
        correct: `${deg} 度，反射角等於入射角`,
        wrongs: [
          `${wrong1} 度，用 90 度減去入射角`,
          `${wrong2} 度，把入射角乘以 2`,
          `${Math.max(10, deg - 10)} 度，反射時角度會變小`,
        ],
        explanation: `反射定律：**反射角等於入射角**。這裡的角度都是「與鏡面的夾角」，所以反射光與鏡面也是 ${deg} 度。${wrong1} 度是把它當成「與法線的夾角」再換算——這是讀題時最常掉的陷阱。`,
      };
    },
  },
  {
    id: "heat-conduction",
    topic: "熱的傳導與材料差異",
    difficulty: "標準",
    grades: [4, 5],
    knowledge: ["熱傳導", "導熱快慢與材料"],
    build(rng) {
      const cases = [
        { q: `冬天用同一鍋熱水攪拌，摸鐵湯匙覺得燙，摸木頭筷子卻不燙。為什麼？`, a: `鐵導熱比木頭快，手上的熱很快被鐵傳走，所以覺得燙`, w: [`鐵湯匙的溫度本來就比木頭筷子高`, `木頭筷子把熱完全隔絕，熱一點都進不去`, `鐵湯匙比較重，重的東西溫度比較高`], n: `兩支泡在同一鍋熱水，溫度趨近相同。差別在**導熱速度**：鐵是良導體，很快把熱傳到你手上；木頭導熱慢。` },
        { q: `冰塊用棉被包起來和放在桌上，哪一個融得比較慢？`, a: `包在棉被裡融得慢，因為棉被隔熱，外面的熱不容易傳進來`, w: [`放在桌上融得慢，因為空氣流通`, `兩個一樣快，融化的速度只看冰塊大小`, `包棉被融得快，因為棉被會發熱`], n: `棉被是**隔熱**材料，減緩熱傳遞（不管是保熱還是保冷）。冰不會「因為棉被發熱」而融得快——棉被不會自己生熱。` },
        { q: `燒開水時，壺裡的水是怎麼整鍋變熱的？（只靠鍋底加熱）`, a: `底部的水受熱後上升、上面的冷水下沉，不斷循環對流，整鍋慢慢變熱`, w: [`熱用跳躍的方式直接飛到壺頂`, `只有鍋底那層會熱，上面永遠是冷的`, `壺壁把熱用閃電一樣的速度傳上去`], n: `液體主要靠**對流**傳熱：受熱的水變輕上升、冷水下沉填補，形成循環。固體才是靠傳導。` },
        { q: `太陽的熱穿過太空真空傳到地球，靠的是哪一種方式？`, a: `輻射，不需要介質就能傳熱`, w: [`傳導，真空裡空氣幫忙傳`, `對流，太空裡的氣體循環`, `以上三種都要有才能傳到地球`], n: `太空中沒有物質，傳導與對流都需要介質，**只有輻射**（像光一樣的電磁波）能穿過真空。這是三種傳熱方式中唯一不用介質的。` },
      ];
      const it = pick(rng, cases);
      return {
        prompt: it.q,
        correct: it.a,
        wrongs: it.w,
        explanation: it.n,
      };
    },
  },
  {
    id: "food-chain-effect",
    topic: "食物鏈與數量變動推論",
    difficulty: "標準",
    grades: [4, 5, 6],
    knowledge: ["食物鏈", "生物數量的連鎖變動"],
    build(rng) {
      const cases = [
        { q: `一片稻田裡有：「稻子 → 蝗蟲 → 青蛙 → 蛇」。如果青蛙被大量捕殺，短時間內最可能發生什麼事？`, a: `蝗蟲因為少了天敵而大量增加，稻子被啃食得更嚴重`, w: [`蝗蟲會跟著一起減少`, `蛇會改吃稻子，所以稻子沒有影響`, `食物鏈會倒過來，變成蛇吃蝗蟲`], n: `青蛙是蝗蟲的天敵。天敵消失→蝗蟲暴增→稻子更慘，這是**連鎖效應**。蛇不會改吃稻子（蛇是肉食性），食物鏈也不會倒轉。` },
        { q: `同樣那條食物鏈：「稻子 → 蝗蟲 → 青蛙 → 蛇」。如果農夫噴藥把蝗蟲全部殺光，青蛙會怎樣？`, a: `青蛙失去主要食物，數量會減少或遷徙離開`, w: [`青蛙改吃稻子，長得更肥`, `青蛙數量先增加再減少`, `蛇會變多，因為青蛙變多了`], n: `蝗蟲是青蛙的食物來源。食物來源消失→捕食者餓死或遷走。青蛙不會改吃稻子；蛇變多的推論也錯——青蛙變少，蛇反而更少。` },
        { q: `食物鏈中「稻子 → 蝗蟲」這一段，稻子扮演的角色是什麼？`, a: `生產者，行光合作用自己製造養分`, w: [`消費者，靠吃別的生物維生`, `分解者，把落葉分解成養分`, `清除者，把環境裡的殘渣清掉`], n: `綠色植物行光合作用自製養分，是食物鏈的**起點＝生產者**；蝗蟲之後全是消費者；分解者是細菌、真菌這類。` },
      ];
      const it = pick(rng, cases);
      return {
        prompt: it.q,
        correct: it.a,
        wrongs: it.w,
        explanation: it.n,
      };
    },
  },
];

/* ==========================================================================
 * 社會（8 條配方）
 * ========================================================================== */
const SOCIAL_RECIPES = [
  {
    id: "map-scale-multi",
    topic: "地圖比例尺的換算",
    difficulty: "挑戰",
    grades: [4, 5, 6],
    knowledge: ["比例尺", "距離換算"],
    build(rng) {
      const km = pick(rng, [2, 5, 10]);
      const cm = randInt(rng, 3, 9);
      const real = km * cm;
      return {
        prompt: `一張地圖的比例尺是「圖上 1 公分＝實際 ${km} 公里」。小威用尺量出兩地在地圖上相距 ${cm} 公分。兩地的實際距離是多少公里？`,
        correct: `${real} 公里，用圖上距離乘以比例尺`,
        wrongs: [
          `${cm + km} 公里，把圖上距離和比例尺相加`,
          `${real} 公尺，單位沒有換算`,
          `${Math.round(cm / km * 10) / 10} 公里，把比例尺倒過來除`,
        ],
        explanation: `實際距離＝圖上距離×比例尺：${cm} 公分 × ${km} 公里/公分＝${real} 公里。反向題：若實際 ${real} 公里，圖上就是 ${cm} 公分。陷阱常在「公里誤當公尺」或把比例尺當加法。`,
      };
    },
  },
  {
    id: "typhoon-stage-order",
    topic: "颱風警報的階段與應變",
    difficulty: "標準",
    grades: [4, 5, 6],
    knowledge: ["海上警報", "陸上警報", "防災準備時機"],
    build(rng) {
      return {
        prompt: `颱風接近台灣時，氣象署通常會先發布海上颱風警報。哪一個做法才是正確的防災觀念？`,
        correct: `海上警報發布時就開始檢查門窗、儲備飲水食物，不要等陸上警報才動作`,
        wrongs: [
          `反正還只是海上警報，等陸上警報發布再去買東西也來得及`,
          `陸上警報解除後才是最危險的時候，這時才要做防災`,
          `颱風警報只是提醒漁船，一般家庭不用理會`,
        ],
        explanation: `防災的核心是**提前準備**：海上警報代表颱風已在附近海域，超市物資會被搶購、門窗檢查需要時間，等到陸上警報才動作常常太晚。警報解除後仍可能有豪雨或土石流風險，但「解除後才防災」的順序是錯的。`,
      };
    },
  },
  {
    id: "festival-original-meaning",
    topic: "節慶習俗的原意",
    difficulty: "基礎",
    grades: [3, 4, 5],
    knowledge: ["端午節", "習俗的由來"],
    build(rng) {
      return {
        prompt: `端午節時，家家戶戶會在門口掛艾草和菖蒲。這個習俗最原始的用意是什麼？`,
        correct: `端午前後天氣濕熱、病媒滋生，古人用這些植物的氣味驅蟲避疫`,
        wrongs: [
          `為了慶祝稻米豐收，把收成掛在門口展示`,
          `跟中秋賞月一樣，只是觀賞植物的香味`,
          `讓屈原回家時認得自己的家門`,
        ],
        explanation: `五月天氣潮濕悶熱，容易流行疾病，古人發現艾草、菖蒲的氣味能驅蟲，於是掛在門口**驅邪避疫**——這是最原始的公共衛生意義。紀念屈原是端午節的另一層意義，但掛艾草的做法比投江傳說更早，是生活經驗而來。`,
      };
    },
  },
  {
    id: "terrain-transport",
    topic: "地形與交通的關係",
    difficulty: "標準",
    grades: [4, 5],
    knowledge: ["台灣地形", "中央山脈", "交通建設"],
    build(rng) {
      return {
        prompt: `台灣東部與西部之間的交通建設比較困難、發展也比較慢。最主要的地形原因是什麼？`,
        correct: `中央山脈南北縱貫全島，東西之間隔著高聳的山脈`,
        wrongs: [
          `台灣的河川都是東西向，把島切成南北兩半`,
          `東部全部是沙漠，鐵公路很難通過`,
          `台灣四周都是深海，船隻無法靠岸`,
        ],
        explanation: `中央山脈由北到南縱貫，多座超過三千公尺的高山，讓東西向的交通必須開鑿隧道或繞行，工程困難、成本高。台灣的河川多為東西向短急河川，反而**不是**東西交通障礙的主因；台灣也沒有沙漠。`,
      };
    },
  },
  {
    id: "history-order",
    topic: "台灣歷史時期排序",
    difficulty: "挑戰",
    grades: [4, 5, 6],
    knowledge: ["台灣歷史分期", "年代先後"],
    build(rng) {
      return {
        prompt: `下列哪一個順序正確表示台灣近代統治者（或治理政權）出現的先後？`,
        correct: `荷蘭西班牙 → 鄭氏時期 → 清朝 → 日本`,
        wrongs: [
          `鄭氏時期 → 荷蘭西班牙 → 日本 → 清朝`,
          `清朝 → 荷蘭西班牙 → 鄭氏時期 → 日本`,
          `日本 → 清朝 → 鄭氏時期 → 荷蘭西班牙`,
        ],
        explanation: `順序是：1624 年起荷蘭（南部）、西班牙（北部）→ 1662 年鄭氏 → 1683 年清朝 → 1895 年日本 → 1945 年中華民國。記憶法：先有歐洲人來貿易，再來鄭成功趕走荷蘭人，之後清朝納入版圖，甲午戰爭割讓給日本。`,
      };
    },
  },
  {
    id: "government-branches",
    topic: "政府組織的分工",
    difficulty: "基礎",
    grades: [5, 6],
    knowledge: ["五院職權", "行政立法司法分工"],
    build(rng) {
      const role = pick(rng, [
        { act: "制定法律", org: "立法院" },
        { act: "執行法律、推動政策", org: "行政院" },
        { act: "審理訴訟、解釋法律", org: "司法院" },
      ]);
      return {
        prompt: `國家的事情需要分工。下列哪一個單位負責「${role.act}」？`,
        correct: role.org,
        wrongs: [
          role.org === "立法院" ? "行政院" : "立法院",
          "考試院",
          "監察院",
        ].filter((o, i, arr) => arr.indexOf(o) === i && o !== role.org).slice(0, 3),
        explanation: `五院分工：立法院**制定法律**；行政院**執行法律、推動政策**；司法院**審理訴訟、解釋法律**；考試院負責公務人員考選銓敘；監察院負責糾舉彈劾。分工的目的在於權力互相制衡，不讓單一機關獨大。`,
      };
    },
  },
  {
    id: "population-density",
    topic: "人口密度的計算",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["人口密度", "單位面積人口數"],
    build(rng) {
      const wan = pick(rng, [30, 45, 60, 80]);
      const km2 = pick(rng, [20, 25, 40, 50]);
      const density = Math.round((wan * 10000) / km2);
      return {
        prompt: `某縣市人口約 ${wan} 萬人，土地面積約 ${km2} 平方公里。這個縣市的人口密度大約是每平方公里多少人？`,
        correct: `約 ${density.toLocaleString()} 人，人口數除以面積`,
        wrongs: [
          `${Math.round(wan / km2).toLocaleString()} 人，忘了把「萬」換成實際人數`,
          `${(wan * km2).toLocaleString()} 人，把除法看成乘法`,
          `${density.toLocaleString()} 人／平方公里，但要再乘以 1000 才對`,
        ],
        explanation: `人口密度＝人口÷面積。${wan} 萬＝${(wan * 10000).toLocaleString()} 人，除以 ${km2} 平方公里＝約 ${density.toLocaleString()} 人/平方公里。最常見的陷阱是「萬」忘記換算成實際人數。`,
      };
    },
  },
  {
    id: "water-management",
    topic: "水資源與環境的決策",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["台灣河川特性", "水資源利用"],
    build(rng) {
      return {
        prompt: `台灣的河川大多短而湍急，下大雨時水很快流進海裡。政府想讓民眾在乾季也有水可用，下列哪一個做法最合理？`,
        correct: `在適當地點興建水庫與攔河堰，把雨季的水留存下來`,
        wrongs: [
          `挖運河把海水引進來給大家使用，反正海水很多`,
          `鼓勵大家多挖地下水井，需要多少就抽多少`,
          `把所有河川都加蓋變成道路，水就流不走也浪費不掉`,
        ],
        explanation: `河川短急代表雨水很快入海，**儲存**是關鍵——水庫與攔河堰就是雨季蓄水、乾季使用的設施。海水不能飲用也不能灌溉（鹹水）；過量抽取地下水會造成地層下陷；河川加蓋反而失去排洪功能，容易淹水。`,
      };
    },
  },
];

/* ==========================================================================
 * 國語（8 條配方）
 * ========================================================================== */
const CHINESE_RECIPES = [
  {
    id: "near-synonym-nuance",
    topic: "近義詞的語感分辨",
    difficulty: "標準",
    grades: [4, 5, 6],
    knowledge: ["近義詞辨析", "語境與用詞"],
    build(rng) {
      const sets = [
        { s: "這個祕密你要好好__，絕對不能說出去。", a: "保守", w: ["保留", "保存", "保管"], note: "「保守祕密」是固定搭配；「保存」用於物品，保管用於物件寄放。" },
        { s: "博物館正在__這批出土的青銅器。", a: "保存", w: ["保守", "保護", "保留"], note: "文物用「保存」（維持原狀不被破壞）。" },
        { s: "他在報告裡__了自己的想法，沒有照抄資料。", a: "提出", w: ["提起", "提升", "提攜"], note: "「提出」想法、意見；「提起」用於回憶或訴訟；「提升」「提攜」與語境不合。" },
        { s: "颱風過後，大家一起__被吹倒的路樹。", a: "整理", w: ["整齊", "清算", "調整"], note: "「整理」雜亂的東西使恢復秩序；「整齊」是形容詞；「清算」用於帳目或鬥爭。" },
        { s: "遇到困難時，他總能__解決問題的方法。", a: "想出", w: ["想通", "想起", "想念"], note: "「想出」＝創造性地找到（方法）；「想起」是回憶起；「想通」是理解。" },
        { s: "這場大雨__了溪水暴漲，請勿靠近河床。", a: "造成", w: ["做成", "製造麻煩的", "組成"], note: "「造成」＋負面結果是固定搭配；「組成」用於整體與部分。" },
        { s: "班長把老師的話__地傳達給全班。", a: "確實", w: ["確定", "正確", "現實"], note: "「確實」地傳達＝忠實無誤；「確定」表示不再改變；「正確」多半當形容答案。" },
        { s: "弟弟把玩具__得一地都是。", a: "丟得", w: ["丟的", "丟到得", "丟了"], note: "「丟得」＋結果補語；「的／得」混用是小學最常見錯誤之一。" },
      ];
      const it = pick(rng, sets);
      const prompt = it.s.replace("__", "（　）");
      return {
        prompt: `下面句子中的（　）應該填入哪一個詞最恰當？\n${prompt}`,
        correct: it.a,
        wrongs: it.w.filter((w) => w !== it.a).slice(0, 3),
        explanation: it.note,
      };
    },
  },
  {
    id: "typo-spotting",
    topic: "常見錯別字辨識",
    difficulty: "標準",
    grades: [3, 4, 5, 6],
    knowledge: ["錯別字", "字形辨識"],
    build(rng) {
      const sets = [
        { a: "迫不得已", w: ["迫不急待", "穿流不息", "委屈求全"], note: "「迫不得已」正確。「迫不急待」應為「及」；「穿流不息」應為「川」；「委屈求全」應為「曲」。" },
        { a: "川流不息", w: ["穿流不息", "一如即往", "委屈求全"], note: "「川流不息」像河川連續不斷。「穿流不息」應為「川」；「一如即往」應為「既」；「委屈求全」應為「曲」。" },
        { a: "一如既往", w: ["一如即往", "迫不急待", "穿流不息"], note: "「一如既往」的「既」表示已經。錯誤選項分別誤用「即」「急」「穿」。" },
        { a: "記憶猶新", w: ["記憶尤新", "記憶由新", "記意猶新"], note: "「猶」＝還、仍；「尤」是特別，「由」是從。" },
        { a: "舉例說明", w: ["講例說明", "舉列說明", "舉例子明"], note: "「舉例」是提出例子；「列」是排列，舉列是錯的。" },
        { a: "名列前茅", w: ["明列前茅", "名列前矛", "名例前茅"], note: "「茅」是茅草（古時行軍的旗幟用茅），「矛」是武器，不能混用。" },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `下列哪一個詞語**完全沒有**錯別字？`,
        correct: it.a,
        wrongs: it.w.slice(0, 3),
        explanation: `正確寫法是「${it.a}」。${it.note}`,
      };
    },
  },
  {
    id: "rhetoric-identify",
    topic: "修辭法的辨識",
    difficulty: "基礎",
    grades: [4, 5, 6],
    knowledge: ["擬人", "誇飾", "譬喻", "排比"],
    build(rng) {
      const sets = [
        { s: "花兒在風中向路人點頭打招呼。", a: "擬人", w: ["譬喻", "誇飾", "排比"], note: "把花當成人來寫（點頭、打招呼），是擬人。" },
        { s: "他的心眼比針眼還小。", a: "誇飾", w: ["擬人", "譬喻", "排比"], note: "故意誇大形容器量小，是誇飾。" },
        { s: "時間就像一條河，不停地往前流。", a: "譬喻", w: ["擬人", "誇飾", "排比"], note: "有「像」，把時間比喻成河，是譬喻。" },
        { s: "讀書使人充實，討論使人機敏，寫作使人精確。", a: "排比", w: ["擬人", "譬喻", "誇飾"], note: "三個結構相同的句子連用，是排比。" },
        { s: "教室裡安靜得連一根針掉在地上都聽得見。", a: "誇飾", w: ["擬人", "譬喻", "排比"], note: "誇大安靜的程度，是誇飾。" },
        { s: "春風輕輕地撫摸著每個人的臉頰。", a: "擬人", w: ["譬喻", "誇飾", "排比"], note: "春風會「撫摸」，把風當人寫，是擬人。" },
        { s: "妹妹的臉蛋紅得像一顆蘋果。", a: "譬喻", w: ["擬人", "誇飾", "排比"], note: "有「像」，臉蛋比作蘋果，是譬喻。" },
        { s: "他的力氣大得可以舉起一座山。", a: "誇飾", w: ["擬人", "譬喻", "排比"], note: "人不可能舉起山，誇大形容力氣，是誇飾。" },
        { s: "太陽公公下班了，月亮阿姨來值班。", a: "擬人", w: ["譬喻", "誇飾", "排比"], note: "太陽公公、月亮阿姨、下班值班，都是把天體當人。" },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `「${it.s}」這句話使用了哪一種修辭法？`,
        correct: it.a,
        wrongs: it.w,
        explanation: it.note,
      };
    },
  },
  {
    id: "polysemy-guang",
    topic: "一字多義的判斷",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「光」是「只、僅」的意思？`,
        correct: `你不要光說不做，答應的事情要做到。`,
        wrongs: [
          `月光灑在湖面上，像鋪了一層銀子。`,
          `這幅畫把光影的變化畫得非常好。`,
          `他把頭髮剃得精光，涼爽多了。`,
        ],
        explanation: `「光說不做」的「光」＝**只、僅**，是副詞。其他三句：「月光」「光影」是光線的意思，「精光」是全部沒有、一點不剩——同一個字在不同語境字義不同，要靠上下文判斷。`,
      };
    },
  },
  {
    id: "polysemy-zhong",
    topic: "一字多義的判斷（重）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「重」是「再、又」的意思？`,
        correct: `老師把重點重新講了一遍，這次大家聽懂了。`,
        wrongs: [
          `這個包裹足足有五公斤重。`,
          `爺爺的身體經過休養已經痊癒，家裡的氣氛不再沉重。`,
          `他很重視這次比賽，每天都練習。`,
        ],
        explanation: `「重新」的「重」讀作 ㄔㄨㄥˊ，是「再、又」的意思。包裹的「重」（ㄓㄨㄥˋ）是重量；「沉重」是程度深；「重視」是看重。多音字要連讀音一起判斷。`,
      };
    },
  },
  {
    id: "polysemy-dadao",
    topic: "一字多義的判斷（打）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「打」是「購買」的意思？`,
        correct: `媽媽請我下楼去打一瓶醬油。`,
        wrongs: [
          `他打開窗戶讓新鮮空氣進來。`,
          `我們打電話向警察局報案。`,
          `弟弟打電動打到忘記寫功課。`,
        ],
        explanation: `「打一瓶醬油」的「打」＝**購買**（打油、打醬油是傳統說法）。打開、打電話、打電動各有不同字義。「打」是國語中字義最多的字之一，全靠上下文。`,
      };
    },
  },
  {
    id: "polysemy-suan",
    topic: "一字多義的判斷（算）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「算」是「認定、當作」的意思？`,
        correct: `你能主動幫忙，也算盡了一份心力。`,
        wrongs: [
          `他用筆算出了這道應用題的答案。`,
          `這筆帳要一項一項算清楚才行。`,
          `比賽還沒結束，現在輸贏還說不算。`,
        ],
        explanation: `「也算盡了一份心力」的「算」＝**當作、認定**。其他是「計算」的意思。一字多義的判斷只有一個方法：把候選字義代回句子，看哪個讓句子通順合理。`,
      };
    },
  },
  {
    id: "polysemy-pofu",
    topic: "一字多義的判斷（深）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「深」是「時間久」的意思？`,
        correct: `夜已經很深了，巷口的麵攤還亮著燈。`,
        wrongs: [
          `這口井非常深，丟石頭好久才聽到聲音。`,
          `他對天文學有深厚的興趣。`,
          `這道題目太深了，全班只有三個人答對。`,
        ],
        explanation: `「夜深」的「深」＝時間久（夜色已濃）。井深是垂直距離；興趣深厚是程度；題目深是困難。同一個「深」，量的是完全不同的東西。`,
      };
    },
  },
  {
    id: "polysemy-gaung2",
    topic: "一字多義的判斷（開）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「開」是「舉辦、召開」的意思？`,
        correct: `學校将在下週三開運動會。`,
        wrongs: [
          `請幫我開一下窗戶，房間裡好熱。`,
          `爸爸每天開車送我上學。`,
          `這條新路是上個月才開通的。`,
        ],
        explanation: `「開運動會」＝**舉辦**。開窗是使關閉的打開；開車是駕駛；開通是使通行。「開」也星多義字，語境決定字義。`,
      };
    },
  },
  {
    id: "polysemy-hua",
    topic: "一字多義的判斷（花）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「花」是「花費、消耗」的意思？`,
        correct: `他花了整整兩個小時才把報告寫完。`,
        wrongs: [
          `院子裡的花開了，紅的紫的都有。`,
          `他的視力模糊，看東西眼都花了。`,
          `這塊布的花色很特別。`,
        ],
        explanation: `「花了兩個小時」＝**消耗**時間。院子裡的花是植物；眼花是模糊；花色是圖案花樣。「花」從植物延伸出「花費」，因為錢和時間像花一樣「散出去」。`,
      };
    },
  },
  {
    id: "polysemy-ming",
    topic: "一字多義的判斷（明）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「明」是「清楚、瞭解」的意思？`,
        correct: `聽老師解說之後，大家才明白題目的用意。`,
        wrongs: [
          `明天下雨的機率很高，記得帶傘。`,
          `這盏燈非常明亮，照亮了整個房間。`,
          `事實證明他說的是真的，這已經很明白了。`,
        ],
        explanation: `「明白」＝**清楚、瞭解**。「明天」是「下一個」；「明亮」是光線充足；「證明」的「明」是使清楚。同一個「明」：明亮、明白、明天、證明，各有細微差異。`,
      };
    },
  },
  {
    id: "polysemy-sheng",
    topic: "一字多義的判斷（生）",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["一字多義", "上下文判斷字義"],
    build(rng) {
      return {
        prompt: `下列哪一句話裡的「生」是「陌生、不熟悉」的意思？`,
        correct: `這條巷子好生僻，導航都找不到。`,
        wrongs: [
          `媽媽生了一個可愛的妹妹。`,
          `生米煮成熟飯，事情已經無法改變了。`,
          `他生病了，今天請假在家休息。`,
        ],
        explanation: `「生僻」的「生」＝**陌生、不常見**（注意：題幹用「生僻」把「生」和「僻」合起來考）。媽媽「生」妹妹是生產；「生米」是沒煮過的；「生病」是得到疾病。`,
      };
    },
  },
  {
    id: "sentence-reorder",
    topic: "句子重組",
    difficulty: "挑戰",
    grades: [4, 5, 6],
    knowledge: ["語序", "句子結構"],
    build(rng) {
      const sets = [
        { parts: ["每天早上", "在公園裡", "爺爺", "打太極拳"], a: "每天早上，爺爺在公園裡打太極拳。" },
        { parts: ["為了準備", "很認真地", "小美", "明天的考試", "複習功課"], a: "為了準備明天的考試，小美很認真地複習功課。" },
        { parts: ["放學後", "在操場上", "同學們", "開心地", "打籃球"], a: "放學後，同學們在操場上開心地打籃球。" },
        { parts: ["因為", "今天風很大", "所以", "風箏", "飛得特別高"], a: "因為今天風很大，所以風箏飛得特別高。" },
        { parts: ["一邊", "聽音樂", "一邊", "寫功課", "姐姐喜歡"], a: "姐姐喜歡一邊聽音樂，一邊寫功課。" },
        { parts: ["只要", "每天練習", "就能", "彈得越來越好", "鋼琴"], a: "只要每天練習鋼琴，就能彈得越來越好。" },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `下列詞語排序後，哪一個是通順正確的句子？\n「${it.parts.join("／")}」`,
        correct: it.a,
        wrongs: [
          it.parts.slice(1).concat(it.parts[0]).join("") + "。",
          it.parts.slice().reverse().join("") + "。",
          it.parts.slice(2).concat(it.parts.slice(0, 2)).join("") + "。",
        ],
        explanation: `正確語序是「${it.a}」——時間詞在最前面，主詞接在後，再接地點或動作。中文語序原則：時間→主詞→地點→動作。`,
      };
    },
  },
  {
    id: "punctuation-semicolon",
    topic: "標點符號的使用",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["分號", "頓號", "標點用法"],
    build(rng) {
      return {
        prompt: `下列哪一個句子中的標點符號使用**正確**？`,
        correct: `山上的空氣清新；夜晚的星空燦爛，吸引許多遊客造訪。`,
        wrongs: [
          `山上的空氣清新，夜晚的星空燦爛；吸引許多遊客造訪。`,
          `山上的空氣清新、夜晚的星空燦爛、吸引許多遊客造訪。`,
          `山上的空氣清新；夜晚的星空燦爛；吸引許多遊客造訪。`,
        ],
        explanation: `「空氣清新」與「星空燦爛」是兩個並列的子句，之間用**分號**；分號後的「吸引許多遊客造訪」是總結，前面用**逗號**即可。頓號（、）只用來分隔句中並列的**詞語**，不能拿來連接子句。`,
      };
    },
  },
  {
    id: "reading-inference",
    topic: "短文的推論理解",
    difficulty: "挑戰",
    grades: [4, 5, 6],
    knowledge: ["推論理解", "線索整合"],
    build(rng) {
      const sets = [
        { s: `小杰一進家門就把書包丟在沙發上，打開冰箱喝了一罐汽水，然後躺在床上一句話也不說。媽媽問他話，他只是聳聳肩。`, q: `從這段描述推論，小杰最可能的心情是什麼？`, a: `悶悶不樂，可能在外面遇到了不順心的事`, w: [`非常興奮，急著要跟媽媽分享`, `全身放鬆，享受悠閒的下午`, `餓壞了，所以先喝汽水`] },
        { s: `爺爺把報紙摺得整整齊齊，收進一個箱子。箱子上寫著「1998」，裡面已經塞滿了同樣摺法的舊報紙。`, q: `由這段文字推論，爺爺收藏報紙的習慣持續多久了？`, a: `很久了，至少好幾年以上`, w: [`才剛開始，因為只有一箱`, `正好一年，箱子標著年份`, `無法判斷，因為沒有提到日期`] },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `${it.s}\n\n${it.q}`,
        correct: it.a,
        wrongs: it.w,
        explanation: `推論題的答案**不在字面上**，要從細節整合：動作（丟書包、不說話、聳肩）指向情緒，數量（塞滿一箱＋標年份）指向時間長度。逐字找不會找到答案，要讀出「字裡行間」。`,
      };
    },
  },
  {
    id: "word-class",
    topic: "詞性與句子功能的判斷",
    difficulty: "基礎",
    grades: [5, 6],
    knowledge: ["詞性判斷", "動詞與形容詞"],
    build(rng) {
      const sets = [
        { a: "他把房間打掃得乾乾淨淨。", w: ["這個問題非常簡單。", "她的笑容很溫暖。", "天空一片蔚藍。"], note: "「打掃」是動作，是動詞；「簡單」「溫暖」「蔚藍」都在描述狀態，是形容詞。" },
        { a: "妹妹小心翼翼地捧著碗。", w: ["妹妹的步伐十分小心。", "碗裡的湯非常燙。", "她的動作很輕巧。"], note: "「捧著」是動作（動詞）；「小心」「燙」「輕巧」都是描述狀態的形容詞。" },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `下列哪一句話中畫引號的詞是**動詞**（表示動作）？\nA「${it.a}」\nB「${it.w[0]}」\nC「${it.w[1]}」\nD「${it.w[2]}」`,
        correct: "A",
        wrongs: ["B", "C", "D"],
        explanation: it.note,
      };
    },
  },
];

/* ==========================================================================
 * 英語（8 條配方）
 * ========================================================================== */
const ENGLISH_RECIPES = [
  {
    id: "much-vs-many",
    topic: "much 與 many 的使用",
    difficulty: "基礎",
    grades: [3, 4, 5],
    knowledge: ["much/many", "可數與不可數名詞"],
    build(rng) {
      const cases = [
        { n: "water", q: "much", w: ["many", "some more", "a"], zh: "水（不可數）" },
        { n: "apples", q: "many", w: ["much", "a", "little"], zh: "蘋果（可數複數）" },
        { n: "milk", q: "much", w: ["many", "few", "a"], zh: "牛奶（不可數）" },
        { n: "books", q: "many", w: ["much", "little", "a"], zh: "書（可數複數）" },
        { n: "rice", q: "much", w: ["many", "few", "a"], zh: "米飯（不可數）" },
        { n: "eggs", q: "many", w: ["much", "little", "a"], zh: "蛋（可數複數）" },
        { n: "sugar", q: "much", w: ["many", "few", "a"], zh: "糖（不可數）" },
        { n: "chairs", q: "many", w: ["much", "little", "a"], zh: "椅子（可數複數）" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `How ___ ${it.n} do you drink every day?（你每天喝多少${it.zh}？）\n填入正確的疑問詞：`,
        correct: it.q,
        wrongs: it.w,
        explanation: `不可數名詞（water、milk）用 **much**；可數名詞複數（apples、books）用 **many**。判斷關鍵：能不能一個一個數。「${it.n}」是${it.zh}，所以用 ${it.q}。`,
      };
    },
  },
  {
    id: "tense-time-marker",
    topic: "時態與時間詞的對應",
    difficulty: "標準",
    grades: [4, 5, 6],
    knowledge: ["過去式", "現在式", "未來式"],
    build(rng) {
      const cases = [
        { s: "yesterday", v: "went", w: ["goes", "will go", "is going"], hint: "yesterday＝昨天→過去式" },
        { s: "every Sunday", v: "goes", w: ["went", "will go", "is going"], hint: "every Sunday＝每週→現在習慣（第三人稱加 s）" },
        { s: "next weekend", v: "will go", w: ["went", "goes", "was going"], hint: "next weekend＝下週末→未來式" },
        { s: "last night", v: "watched", w: ["watches", "will watch", "is watching"], hint: "last night＝昨晚→過去式" },
        { s: "right now", v: "is reading", w: ["reads", "read", "will read"], hint: "right now＝此刻→現在進行式" },
        { s: "tomorrow", v: "will play", w: ["played", "plays", "was playing"], hint: "tomorrow＝明天→未來式" },
        { s: "two days ago", v: "ate", w: ["eats", "will eat", "is eating"], hint: "two days ago＝兩天前→過去式（eat 的過去式是不規則變化 ate）" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `My family ___ to the zoo ${it.s}.\n根據句中的時間詞，選出正確的動詞形式：`,
        correct: it.v,
        wrongs: it.w,
        explanation: `${it.hint}。時間詞是判斷時態最快的線索：先找時間詞，再決定動詞形式，不要只看動詞本身覺得「好像通順」。`,
      };
    },
  },
  {
    id: "double-comparative",
    topic: "比較級的正確形式",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["比較級", "more 與 -er 不可並用"],
    build(rng) {
      const cases = [
        { a: "more interesting than", w: ["more better than", "interestinger than", "most interesting than"], zh: "多音節 interesting" },
        { a: "bigger than", w: ["more bigger than", "biggest than", "more big than"], zh: "單音節 big" },
        { a: "more expensive than", w: ["expensiver than", "more expensiver than", "most expensive than"], zh: "多音節 expensive" },
        { a: "taller than", w: ["more taller than", "tallest than", "more tall than"], zh: "單音節 tall" },
        { a: "better than", w: ["more good than", "gooder than", "most good than"], zh: "不規則 good→better（不能再用 more）" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `This game is ___ the last one.\n（這個遊戲比上 one 更有趣/更好玩。）選出正確的比較級用法：`,
        correct: it.a,
        wrongs: it.w,
        explanation: `${it.zh}的比較級：多音節加 more，單音節加 -er，**只能擇一**。「more better」「more bigger」是重複比較級，母語者一聽就知道不對。`,
      };
    },
  },
  {
    id: "preposition-time",
    topic: "時間介系詞 in/on/at",
    difficulty: "基礎",
    grades: [4, 5],
    knowledge: ["介系詞 in/on/at", "時間的表達"],
    build(rng) {
      const cases = [
        { s: "Monday morning", a: "on", w: ["in", "at", "for"], note: "特定一天的早上用 on（on Monday morning）" },
        { s: "the afternoon", a: "in", w: ["on", "at", "for"], note: "泛指下午用 in（in the afternoon）" },
        { s: "seven o'clock", a: "at", w: ["in", "on", "for"], note: "幾點鐘用 at（at seven）" },
        { s: "July", a: "in", w: ["on", "at", "for"], note: "月份用 in（in July）" },
        { s: "National Day", a: "on", w: ["in", "at", "for"], note: "特定節日（一天）用 on（on National Day）" },
        { s: "night", a: "at", w: ["in", "on", "for"], note: "at night 是固定搭配（例外，要背）" },
        { s: "winter", a: "in", w: ["on", "at", "for"], note: "季節用 in（in winter）" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `We have English class ___ ${it.s}.\n填入正確的介系詞：`,
        correct: it.a,
        wrongs: it.w,
        explanation: `${it.note}。口訣：in 用於月、年、季節與泛指時段；on 用於特定日期與星期；at 用於時刻。`,
      };
    },
  },
  {
    id: "reading-infer-en",
    topic: "短文推論理解",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["閱讀推論", "細節整合"],
    build(rng) {
      const sets = [
        { s: "Amy put on her raincoat and took an umbrella before leaving home. Ten minutes later, the ground was wet and people ran into the store.", q: "What is happening outside?", a: "It is raining.", w: ["It is snowing.", "The sun is shining.", "A parade is passing by."] },
        { s: "Tom looked at the empty cookie box and crumbs on his little brother's face. His brother was smiling.", q: "Who ate the cookies?", a: "Tom's little brother.", w: ["Tom himself.", "Nobody, the box was like that.", "Their mother."] },
        { s: "Ben practiced free throws every day for a month. In today's game, he did not miss a single one.", q: "Why did Ben shoot so well?", a: "He practiced a lot before the game.", w: ["He was just lucky today.", "The basket was lower today.", "Other players helped him shoot."] },
        { s: "The sign on the door says: CLOSED FOR REPAIRS. BACK ON MONDAY.", q: "When can you shop at this store again?", a: "On Monday.", w: ["Right now.", "Never again.", "Only on repairs day."] },
        { s: "Lily fed her dog at six in the morning. Now the dog runs to its bowl every time Lily walks into the kitchen.", q: "Why does the dog run to its bowl?", a: "It learned that morning means feeding time.", w: ["It wants to play in the kitchen.", "It is afraid of Lily.", "The bowl is a new toy."] },
      ];
      const it = pick(rng, sets);
      return {
        prompt: `${it.s}\n\n${it.q}`,
        correct: it.a,
        wrongs: it.w,
        explanation: `推論題不會直接寫出答案，要把線索串起來：雨衣＋雨傘＋地面濕→下雨；空盒子＋弟弟臉上的餅乾屑＋微笑→弟弟吃的。先找證據，再下結論。`,
      };
    },
  },
  {
    id: "wh-word-inverse",
    topic: "疑問詞與答句的對應",
    difficulty: "標準",
    grades: [4, 5, 6],
    knowledge: ["疑問詞 when/where/who", "答句與問句對應"],
    build(rng) {
      const cases = [
        { a: "At ten o'clock.", q: "___ do you go to bed?", correct: "What time", w: ["Where", "Who", "How many"], note: "答句是時間點（At ten o'clock）→ 問時間用 What time／When。" },
        { a: "In the kitchen.", q: "___ did you leave your bag?", correct: "Where", w: ["When", "Who", "How many"], note: "答句是地點（In the kitchen）→ 問地點用 Where。" },
        { a: "My best friend, Amy.", q: "___ helped you with the project?", correct: "Who", w: ["When", "Where", "How many"], note: "答句是人（Amy）→ 問人用 Who。" },
        { a: "By bus.", q: "___ do you get to school?", correct: "How", w: ["Where", "When", "Why"], note: "答句是交通方式（By bus）→ 問方法用 How。" },
        { a: "Because I was tired.", q: "___ did you go home early?", correct: "Why", w: ["How", "When", "Which"], note: "Because（因為）→ 問原因用 Why。" },
        { a: "Three.", q: "___ apples are there on the table?", correct: "How many", w: ["How much", "What", "Where"], note: "答句是數量（可數）→ How many；不可數才用 How much。" },
        { a: "It's cloudy.", q: "___ is the weather today?", correct: "How", w: ["What time", "Who", "Where"], note: "問天氣狀況用 How is the weather（或 What is the weather like）——答句描述狀態。" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `Q: ${it.q}\nA: ${it.a}\n依答句判斷，問句開頭應該用哪一個疑問詞？`,
        correct: it.correct,
        wrongs: it.w,
        explanation: `${it.note}反向題不是讀問句猜答案，而是從答句反推問的方式。`,
      };
    },
  },
  {
    id: "borrow-vs-lend",
    topic: "易混淆動詞 borrow/lend",
    difficulty: "挑戰",
    grades: [5, 6],
    knowledge: ["borrow/lend 方向性", "易混淆動詞"],
    build(rng) {
      const cases = [
        { s: "Can you ___ me your eraser? I forgot mine.", zh: "可以借「給我」你的橡皮擦嗎？", a: "lend", w: ["borrow", "keep", "take"], note: "東西從「你」流到「我」→ lend（借給）。borrow 是「向人借進來」，方向相反。" },
        { s: "May I ___ your bike this afternoon?", zh: "下午我可以「借來騎」你的腳踏車嗎？", a: "borrow", w: ["lend", "keep", "carry"], note: "東西從「你」流到「我」這邊、我借進來 → borrow。" },
        { s: "Please ___ this book back to the library for me.", zh: "請幫我把書「還」給圖書館。", a: "take", w: ["bring", "borrow", "lend"], note: "take＝拿去（離開說話者）；bring＝帶來（朝向說話者）。還書是帶走 → take。" },
        { s: "Did you ___ your homework to school?", zh: "你把功課「帶來」學校了嗎？", a: "bring", w: ["take", "lend", "buy"], note: "bring＝帶到說話者這裡；take＝帶離說話者。在學校問 → 帶來 → bring。" },
        { s: "Grandma always ___ us cookies when we visit.", zh: "我們拜訪時，奶奶總「拿給」我們餅乾。", a: "brings", w: ["takes", "borrows", "steals"], note: "餅乾從奶奶那邊「給到我們這裡」→ brings（第三人稱單數加 s）。take 是帶離奶奶的方向。" },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `${it.s}\n（${it.zh}）`,
        correct: it.a,
        wrongs: it.w,
        explanation: `${it.note}bring/take、borrow/lend 這兩組的方向性是英語最經典的陷阱：**以說話者為中心**判斷方向。`,
      };
    },
  },
  {
    id: "adverb-placement",
    topic: "頻率副詞的位置",
    difficulty: "標準",
    grades: [5, 6],
    knowledge: ["頻率副詞", "副詞位置"],
    build(rng) {
      const cases = [
        { a: "usually go", w: ["go usually", "usually going", "am usually go"], s: "I ___ to school by bike." },
        { a: "is always", w: ["always is", "always being", "is always being"], s: "She ___ the first one to arrive." },
        { a: "never eats", w: ["eats never", "never eating", "is never eat"], s: "He ___ breakfast before school." },
        { a: "often plays", w: ["plays often", "often playing", "is often play"], s: "My brother ___ basketball after class." },
        { a: "are sometimes", w: ["sometimes are", "sometimes being", "are sometimes being"], s: "They ___ late on Fridays." },
      ];
      const it = pick(rng, cases);
      return {
        prompt: `${it.s}\n填入（usually / always 等頻率副詞的正確位置）：`,
        correct: it.a,
        wrongs: it.w,
        explanation: `頻率副詞（usually、always、often）放在**一般動詞之前**、**be 動詞之後**。I usually go（go 是動詞→放前面）；She is always（is 是 be 動詞→放後面）。位置錯了句子就會不自然。`,
      };
    },
  },
];

/* ==========================================================================
 * 產生主流程：五科 × 40 題，每題 timeLimitSec 180
 * ========================================================================== */
const PER_SUBJECT = 40;

export function generateDeepReasoning(rng, collector, target = 200, opts = {}) {
  const plan = [
    { subject: "數學", recipes: MATH_RECIPES },
    { subject: "自然", recipes: SCIENCE_RECIPES },
    { subject: "社會", recipes: SOCIAL_RECIPES },
    { subject: "國語", recipes: CHINESE_RECIPES },
    { subject: "英語", recipes: ENGLISH_RECIPES },
  ];
  const per = Math.round(target / plan.length);
  let produced = 0;
  const perSubject = {};

  for (const { subject, recipes } of plan) {
    let made = 0;
    let guard = 0;
    const limit = opts.perSubject ?? per;
    while (made < limit && guard < limit * 80) {
      guard += 1;
      const recipe = pick(rng, recipes);
      const built = recipe.build(rng);
      if (!built) continue;
      const { options, answer } = assemble(rng, built.correct, built.wrongs);
      if (new Set(options).size !== options.length) continue;
      const grade = pick(rng, recipe.grades ?? [3, 4, 5, 6]);
      const question = makeQuestion({
        subject,
        grade,
        topic: recipe.topic,
        difficulty: recipe.difficulty,
        prompt: built.prompt,
        options,
        answer,
        explanation: built.explanation,
        knowledge: recipe.knowledge,
        timeLimitSec: 180,
      });
      if (!question) continue;
      if (collector.add(question)) made += 1;
    }
    perSubject[subject] = made;
    produced += made;
  }
  return { total: produced, perSubject };
}

export const DEEP_REASONING_RECIPES = {
  數學: MATH_RECIPES.length,
  自然: SCIENCE_RECIPES.length,
  社會: SOCIAL_RECIPES.length,
  國語: CHINESE_RECIPES.length,
  英語: ENGLISH_RECIPES.length,
};
