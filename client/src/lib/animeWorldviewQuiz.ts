export type AnimeWorldviewKey = "nailong" | "ultraman" | "kamen-rider";

export type AnimeWorldviewQuestion = {
  id: string;
  entryKey: AnimeWorldviewKey;
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  focus: string;
};

const NAILONG_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "nailong-q1", entryKey: "nailong", prompt: "在溫暖的日常冒險裡，遇到一件還不明白的小事，最適合先做什麼？", options: ["先仔細觀察並提出問題", "直接把責任交給別人", "不看原因就下結論", "把問題藏起來"], answer: 0, explanation: "觀察與提問能把好奇心變成可以繼續探索的線索。", focus: "國語／自然：觀察與提問" },
  { id: "nailong-q2", entryKey: "nailong", prompt: "如果要記錄今天發現的生活現象，哪一種筆記最有幫助？", options: ["只寫我覺得很酷", "記下時間、看到的變化與自己的疑問", "只畫一個沒有說明的符號", "照抄別人的猜測"], answer: 1, explanation: "具體的時間、變化和疑問，能讓之後的比較與驗證更清楚。", focus: "自然：生活觀察紀錄" },
  { id: "nailong-q3", entryKey: "nailong", prompt: "朋友在任務中遇到困難時，哪個行動最符合互助的精神？", options: ["笑他做得太慢", "不問原因就替他全部完成", "先聽他說明，再一起分配小步驟", "轉身離開不再討論"], answer: 2, explanation: "先理解需要，再把任務拆成可以合作完成的小步驟，能保留每個人的參與。", focus: "社會：合作與互助" },
  { id: "nailong-q4", entryKey: "nailong", prompt: "第一次嘗試沒有成功時，最有學習價值的下一步是什麼？", options: ["檢查哪個步驟需要調整，再試一次", "把結果改寫成成功", "認定自己永遠做不到", "不留下任何紀錄"], answer: 0, explanation: "檢查步驟、找出可調整的地方，能把失敗轉成下一次的學習線索。", focus: "學習策略：修正與再嘗試" },
  { id: "nailong-q5", entryKey: "nailong", prompt: "要把一個好奇念頭變成小小實驗，哪個安排最完整？", options: ["只猜結果，不做記錄", "先提出問題、決定觀察方法，再記錄結果", "先決定答案，遇到不同就刪掉", "請別人做完，自己不觀察"], answer: 1, explanation: "問題、方法與結果紀錄，讓好奇念頭能成為可觀察、可分享的探索。", focus: "自然：問題與驗證" },
  { id: "nailong-q6", entryKey: "nailong", prompt: "把兩次觀察結果放在一起比較時，哪種做法最清楚？", options: ["只保留比較喜歡的結果", "使用相同的觀察項目並標出差異", "把不同單位混在一起", "只說這次感覺比較好"], answer: 1, explanation: "相同的觀察項目與清楚的差異，能讓比較更公平也更容易說明。", focus: "數學／自然：比較與紀錄" },
  { id: "nailong-q7", entryKey: "nailong", prompt: "小組一起完成任務時，怎樣分配工作最能讓大家參與？", options: ["由一個人決定全部工作", "依照每個人的能力分工並約定回報時間", "只把簡單工作留給自己", "遇到問題就互相責怪"], answer: 1, explanation: "清楚分工並約定回報時間，可以讓每個人知道責任，也能及早互相幫助。", focus: "社會：分工與合作" },
  { id: "nailong-q8", entryKey: "nailong", prompt: "看到和自己想法不同的觀察結果時，第一個好習慣是什麼？", options: ["立刻說結果一定錯了", "重新檢查方法與紀錄，再提出新的問題", "刪掉不符合的資料", "要求大家只能同意自己"], answer: 1, explanation: "重新檢查方法和紀錄，能把不同結果變成修正想法的新線索。", focus: "自然／國語：檢核與修正" },
];

const ULTRAMAN_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "ultraman-q1", entryKey: "ultraman", prompt: "在巨大英雄守護城市的想像中，要比較兩個物體的大小，哪個方法最可靠？", options: ["只看誰的名字比較威風", "找共同參考物並記錄比例", "用感覺猜一個答案", "只看畫面顏色"], answer: 1, explanation: "共同參考物和比例能讓尺度比較更有依據。", focus: "數學：尺度與比例" },
  { id: "ultraman-q2", entryKey: "ultraman", prompt: "想研究光能不能照亮遠處目標時，哪一個問題最容易驗證？", options: ["光是不是最勇敢", "不同距離下，目標表面的亮度如何變化", "英雄一定會不會贏", "城市是不是永遠安全"], answer: 1, explanation: "把距離與亮度變化連起來，就能設計觀察與比較。", focus: "自然：光與可驗證問題" },
  { id: "ultraman-q3", entryKey: "ultraman", prompt: "遇到城市中的突發危機，最有效的守護行動通常需要什麼？", options: ["一個人不告訴任何人就行動", "依照分工傳遞資訊並保護民眾", "先追求最華麗的畫面", "只等待危機自己消失"], answer: 1, explanation: "公共安全需要資訊、分工與保護行動彼此配合。", focus: "社會：公共安全與分工" },
  { id: "ultraman-q4", entryKey: "ultraman", prompt: "面對來自未知宇宙的訊號，哪種做法最像負責任的觀測者？", options: ["立刻把猜測當成事實", "蒐集線索、比較資料，再提出暫時解釋", "只相信最令人害怕的說法", "不記錄就直接轉述"], answer: 1, explanation: "先蒐集與比較證據，再說明暫時解釋，可以減少誤判。", focus: "自然／國語：證據與推論" },
  { id: "ultraman-q5", entryKey: "ultraman", prompt: "守護城市與自然環境同時發生衝突時，哪個選擇較完整？", options: ["只追求速度，不管後果", "評估風險、減少傷害並和相關的人合作", "把所有問題交給最強的人", "先破壞環境再慢慢想"], answer: 1, explanation: "守護不只看眼前勝負，也要評估風險、減少傷害並協調合作。", focus: "社會／自然：責任與環境" },
  { id: "ultraman-q6", entryKey: "ultraman", prompt: "要判斷兩次光線觀測是否真的不同，哪項資料最有幫助？", options: ["只記得哪一次看起來更亮", "記錄相同時間、距離與測量結果", "挑一張最漂亮的照片", "只聽旁觀者的印象"], answer: 1, explanation: "固定觀測條件並留下測量結果，才能減少誤差並比較光線變化。", focus: "自然：觀測條件與資料" },
  { id: "ultraman-q7", entryKey: "ultraman", prompt: "收到可能影響城市安全的訊息時，哪種傳遞方式最負責任？", options: ["先加上誇張內容再轉發", "標出已確認與待確認的部分，再通知適合的單位", "只傳給最要好的朋友", "完全不說明來源"], answer: 1, explanation: "分清已確認與待確認資訊，並交給適合處理的人，能降低錯誤訊息造成的風險。", focus: "國語／社會：資訊判讀" },
  { id: "ultraman-q8", entryKey: "ultraman", prompt: "保護陌生生物棲地時，哪個行動最符合永續的守護？", options: ["為了看清楚而靠得越近越好", "保持距離、減少干擾並記錄觀察", "把生物帶回家研究", "只拍照不遵守場域規定"], answer: 1, explanation: "保持距離與減少干擾，才能在學習觀察的同時保護棲地與生物。", focus: "自然／社會：生態與永續" },
];

const KAMEN_RIDER_QUESTIONS: AnimeWorldviewQuestion[] = [
  { id: "kamen-rider-q1", entryKey: "kamen-rider", prompt: "設計一件變身裝備時，除了力量，還應優先確認什麼？", options: ["外觀是否最複雜", "功能、限制與使用安全", "能不能讓所有人害怕", "是否完全不需要練習"], answer: 1, explanation: "好的設計要同時考慮功能、限制與安全，而不只是看起來強大。", focus: "自然：功能與限制" },
  { id: "kamen-rider-q2", entryKey: "kamen-rider", prompt: "擁有能幫助大家的科技工具時，最負責任的使用方式是什麼？", options: ["想用就用，不管別人", "先了解規則、風險與可能影響", "把工具借給陌生人試玩", "隱瞞所有限制"], answer: 1, explanation: "理解規則、風險與影響，才能讓能力真正服務於保護與合作。", focus: "社會：科技倫理" },
  { id: "kamen-rider-q3", entryKey: "kamen-rider", prompt: "故事中看到一個線索時，哪一句最能區分事實與推論？", options: ["我看到指示燈變紅，這是事實", "所以敵人一定在附近，這是事實", "大家猜什麼就當作答案", "只要很像就不需要證據"], answer: 0, explanation: "直接觀察到的指示燈顏色是事實；敵人是否在附近則仍需要證據推論。", focus: "國語：事實與推論" },
  { id: "kamen-rider-q4", entryKey: "kamen-rider", prompt: "要知道新裝備是否真的能降低危險，哪個測試設計較公平？", options: ["只測一次最順利的情況", "在相同條件下多次比較有無裝備的結果", "只問設計者覺得如何", "先選好結論再挑資料"], answer: 1, explanation: "相同條件、多次比較，才能更公平地觀察裝備是否產生效果。", focus: "自然：公平測試" },
  { id: "kamen-rider-q5", entryKey: "kamen-rider", prompt: "當英雄能力變強、可以影響更多人時，最重要的思考是什麼？", options: ["只要贏就不用解釋", "能力越大，越要思考權利、責任與後果", "把所有決定交給裝備", "永遠不聽夥伴的意見"], answer: 1, explanation: "能力擴大也代表影響擴大，需要一起思考權利、責任與行動後果。", focus: "社會：權利與責任" },
  { id: "kamen-rider-q6", entryKey: "kamen-rider", prompt: "設計科技工具時，哪一項最能幫助使用者避免誤用？", options: ["只增加外觀裝飾", "加入清楚的操作提示與安全限制", "把警告文字全部刪除", "讓工具永遠自動決定"], answer: 1, explanation: "清楚提示與安全限制能幫助使用者理解工具，降低不小心誤用的機會。", focus: "自然／科技：設計與安全" },
  { id: "kamen-rider-q7", entryKey: "kamen-rider", prompt: "團隊要選擇一個行動方案時，哪種討論方式最公平？", options: ["只讓聲音最大的人決定", "先列出證據、風險與不同意見，再共同決定", "不聽取少數人的擔心", "先投票再找理由"], answer: 1, explanation: "先整理證據、風險與不同觀點，能讓團隊決定更透明，也更容易承擔結果。", focus: "社會：民主討論與決策" },
  { id: "kamen-rider-q8", entryKey: "kamen-rider", prompt: "完成一次任務後想知道下次如何做得更好，最有用的回顧是什麼？", options: ["只記住最後誰獲勝", "記錄有效做法、遇到的問題與下一步調整", "把所有失誤歸咎於別人", "只保留最精彩的片段"], answer: 1, explanation: "同時記錄有效做法、問題與調整方向，才能把任務經驗轉成下一次的策略。", focus: "學習策略：反思與改進" },
];

export const ANIME_WORLDVIEW_QUIZZES: Record<AnimeWorldviewKey, AnimeWorldviewQuestion[]> = {
  nailong: NAILONG_QUESTIONS,
  ultraman: ULTRAMAN_QUESTIONS,
  "kamen-rider": KAMEN_RIDER_QUESTIONS,
};

export function getAnimeWorldviewQuestions(entryKey: string): AnimeWorldviewQuestion[] {
  if (!(entryKey in ANIME_WORLDVIEW_QUIZZES)) return [];
  return ANIME_WORLDVIEW_QUIZZES[entryKey as AnimeWorldviewKey].map((question) => ({ ...question, options: [...question.options] as AnimeWorldviewQuestion["options"] }));
}

export function scoreAnimeWorldviewQuiz(questions: AnimeWorldviewQuestion[], answers: Array<number | null>) {
  const correct = questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
  return { correct, total: questions.length, percentage: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100) };
}

export function getAnimeWorldviewResultMessage(correct: number, total: number): string {
  if (total === 0) return "目前沒有可挑戰的題目。";
  if (correct === total) return "觀測完成！你把世界觀線索整理得很完整。";
  if (correct >= Math.ceil(total * 0.6)) return "觀測得不錯！再回看一個線索，你會發現更多連結。";
  return "每一題都是新的觀測線索，回到詳情卡再試一次也可以。";
}
