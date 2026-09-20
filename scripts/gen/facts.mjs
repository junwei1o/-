/**
 * 知識事實表的共用產生邏輯（自然／社會／國語／英語共用）。
 *
 * 每筆事實提供：
 *   stem（原始題幹）、choices（正解 + 3 個干擾）、
 *   conclusion（一句正確敘述）、myth（一句常見迷思／錯誤敘述）
 *
 * 由這四個欄位可派生六種題型，讓同一個知識點自然長出「變體題」與「組合題」：
 *   A 原始選擇題　B 何者正確（跨概念）　C 何者錯誤（跨概念）
 *   D/E 是非題（正確敘述／錯誤敘述）　F 雙概念組合題
 * 其中 B/C/F 的選項刻意混進其他單元的敘述，題目變多也順便練到跨單元辨識。
 */
import { shuffle, buildChoice, buildTrueFalse } from "./common.mjs";

/** 從事實表隨機取 n 筆不同 topic 的其它敘述。 */
function otherStatements(rng, facts, excludeTopic, field, count) {
  const pool = facts.filter((f) => f[0] !== excludeTopic).map((f) => f[field]);
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < count && guard < 200) {
    guard += 1;
    const v = pool[Math.floor(rng() * pool.length)];
    if (!v || used.has(v)) continue;
    used.add(v);
    out.push(v);
  }
  return out;
}

const LABEL = { 自然: "自然科學", 社會: "社會與生活", 國語: "國語文", 英語: "英語" };

/**
 * 跨概念題的題幹輪替。
 * 早期所有「何者正確／何者錯誤」都用同一句題幹，結果題庫裡出現上百題
 * 一字不差的相同題幹，學生會覺得「這題我寫過」。這裡準備幾種說法輪流用，
 * 題目在畫面上就不會一直重複同一句。
 */
const CORRECT_PROMPTS = (label) => [
  `下列關於${label}的敘述，哪一項是正確的？`,
  `關於${label}，下列哪一句說法是對的？`,
  `老師上課時提到下列哪一句${label}的敘述是正確的？`,
  `下列有關${label}的敘述，何者正確？`,
  `小考時出現下列四句${label}的敘述，只有一句是對的，是哪一句？`,
  `下列${label}的說法中，正確的是哪一項？`,
];

const WRONG_PROMPTS = (label) => [
  `下列關於${label}的敘述，哪一項是錯誤的？`,
  `關於${label}，下列哪一句說法是錯的？`,
  `下列有關${label}的敘述，何者錯誤？`,
  `同學報告時講錯了下列哪一句${label}的敘述？`,
  `下列四句${label}的敘述中，有一句觀念錯誤，是哪一句？`,
  `關於${label}，下列哪一個說法是不正確的？`,
];

export function generateFromFacts(rng, collector, subject, facts, target, opts = {}) {
  const label = LABEL[subject] ?? subject;
  /** 年級配額（可選）：某年級滿額就換一題生，讓題庫不會全擠在五、六年級。 */
  const quota = opts.quota ?? null;
  let produced = 0;
  let guard = 0;
  while (produced < target && guard < target * 30) {
    guard += 1;
    const fact = facts[Math.floor(rng() * facts.length)];
    const [topic, grade, stem, choices, conclusion, myth, explain] = fact;
    const correct = choices[0];
    const wrongs = choices.slice(1);
    const difficulty = grade <= 4 ? "基礎" : grade <= 6 ? "標準" : "挑戰";
    const base = { subject, grade, topic, difficulty, knowledge: [topic] };
    // 七種題型輪流：A 原題、B 何者正確、C 何者錯誤、D/E 是非、F 雙概念組合、
    // G 三概念組合。組合題（F、G）刻意把不同單元的敘述混在一起，題目變多的同時
    // 也練到跨單元辨識——老師要的「組合題更多組合」就在這裡。
    const form = Math.floor(rng() * 7);
    let question = null;

    if (form === 0) {
      // A：原始選擇題（可加情境前綴，產生變體）
      question = buildChoice(rng, {
        ...base,
        prompt: stem,
        correct,
        distractors: wrongs,
        explanation: explain,
      });
    } else if (form === 1) {
      // B：跨概念「何者正確」
      const distractors = [
        ...otherStatements(rng, facts, topic, "mythSlot", 2),
        ...otherStatements(rng, facts, topic, "mythSlot", 3),
      ].slice(0, 3);
      if (distractors.length === 3) {
        question = buildChoice(rng, {
          ...base,
          prompt: CORRECT_PROMPTS(label)[Math.floor(rng() * CORRECT_PROMPTS(label).length)],
          correct: conclusion,
          distractors,
          explanation: `${explain} 其他選項都是常見的錯誤觀念。`,
        });
      }
    } else if (form === 2) {
      // C：跨概念「何者錯誤」
      const distractors = otherStatements(rng, facts, topic, "conclusionSlot", 3);
      if (distractors.length === 3) {
        question = buildChoice(rng, {
          ...base,
          prompt: WRONG_PROMPTS(label)[Math.floor(rng() * WRONG_PROMPTS(label).length)],
          correct: myth,
          distractors,
          explanation: `${myth} 是錯誤的說法。${explain}`,
        });
      }
    } else if (form === 3) {
      // D：是非題（正確敘述）
      question = buildTrueFalse(rng, {
        ...base,
        prompt: `判斷：${conclusion}`,
        isTrue: true,
        explanation: `這句敘述正確。${explain}`,
      });
    } else if (form === 4) {
      // E：是非題（錯誤敘述）
      question = buildTrueFalse(rng, {
        ...base,
        prompt: `判斷：${myth}`,
        isTrue: false,
        explanation: `這句敘述錯誤。${explain}`,
      });
    } else if (form === 5) {
      // F：雙概念組合題（A 與 B 兩個單元一起考）
      const other = facts[Math.floor(rng() * facts.length)];
      if (other[0] === topic) continue;
      const useFirst = rng() < 0.5;
      const answerTopic = useFirst ? topic : other[0];
      const distractors = [
        useFirst ? myth : other[5],
        ...otherStatements(rng, facts, answerTopic, "mythSlot", 3),
      ].slice(0, 3);
      if (distractors.length === 3) {
        question = buildChoice(rng, {
          ...base,
          grade: Math.max(grade, other[1]),
          topic: `${topic}、${other[0]}`,
          difficulty: "挑戰",
          prompt: `關於「${topic}」與「${other[0]}」，下列哪一項敘述是正確的？`,
          correct: useFirst ? conclusion : other[4],
          distractors,
          explanation: `${useFirst ? explain : other[6]} 本題同時考兩個單元的觀念。`,
          knowledge: [topic, other[0]],
        });
      }
    } else {
      // G：三概念組合題——把三個單元的敘述放進同一題，只有一個是正確的。
      const others = facts.filter((f) => f[0] !== topic);
      if (others.length < 2) continue;
      const b = others[Math.floor(rng() * others.length)];
      const c = others[Math.floor(rng() * others.length)];
      if (b[0] === c[0]) continue;
      const distractors = [b[5], c[5], ...otherStatements(rng, facts, topic, "mythSlot", 2)].slice(0, 3);
      if (distractors.length === 3 && new Set(distractors).size === 3) {
        question = buildChoice(rng, {
          ...base,
          grade: Math.max(grade, b[1], c[1]),
          topic: `${topic}、${b[0]}、${c[0]}`,
          difficulty: "挑戰",
          prompt: `關於「${topic}」「${b[0]}」「${c[0]}」三個主題，下列哪一項敘述是正確的？`,
          correct: conclusion,
          distractors,
          explanation: `${explain} 另外兩項分別是關於「${b[0]}」與「${c[0]}」的錯誤敘述。`,
          knowledge: [topic, b[0], c[0]],
        });
      }
    }

    if (!question) continue;
    const gradeUsed = question.grade;
    if (quota && !quota.take(gradeUsed)) continue;
    if (collector.add(question)) {
      produced += 1;
    } else if (quota) {
      // 題目被去重丟掉，名額要還回去，不然配額會被「生不出來」的題目吃光。
      quota.release(gradeUsed);
    }
  }
  return produced;
}

/** 把事實表轉成帶命名欄位的物件，方便上面用 mythSlot / conclusionSlot 取值。 */
export function withSlots(facts) {
  return facts.map((f) => {
    const obj = [...f];
    obj.mythSlot = f[5];
    obj.conclusionSlot = f[4];
    return obj;
  });
}

export { shuffle };
