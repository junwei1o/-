/**
 * 中階主題標籤（topicTag）
 *
 * 背景：題庫的 `knowledge` 標籤過細（1130 題卻有 1049 組標籤），
 * 弱點分析以「每題第一個知識標籤」分組時，幾乎每個主題只出現一次，
 * 達不到「至少作答 2 次」的門檻 → 老師／家長永遠看不到弱點主題。
 *
 * 解法：不改資料，於執行期把細標籤收斂成各科 8～12 個中階主題桶，
 * 讓同一個概念的題目能被聚合（例如「分數乘法」「通分」「異分母加減」
 * 都落在「分數與小數」）。
 */

type TopicRule = {
  tag: string;
  keywords: string[];
};

/** 依序比對，越具體的規則放越前面。 */
const MATH_RULES: TopicRule[] = [
  { tag: "分數與小數", keywords: ["分數", "小數", "通分", "約分", "等值分數", "分母", "分子", "小數點"] },
  { tag: "代數與方程式", keywords: ["方程式", "移項", "未知數", "代數", "負數", "數線", "正負", "等量", "一元一次"] },
  { tag: "因數與倍數", keywords: ["因數", "倍數", "公因", "公倍", "質數", "合數", "奇偶", "整除", "餘數"] },
  { tag: "比例與速率", keywords: ["比例", "比值", "速率", "速度", "單位價格", "折扣", "百分比", "成正", "成反", " ppm"] },
  { tag: "幾何與圖形", keywords: ["角", "三角形", "四邊形", "正方形", "長方形", "梯形", "平行", "垂直", "圓", "周長", "面積", "體積", "對稱", "邊", "周界", "扇形", "柱體", "球"] },
  { tag: "統計與圖表", keywords: ["統計", "圖表", "長條圖", "折線圖", "圓餅圖", "直方圖", "平均", "眾數", "中位數", "機率", "資料"] },
  { tag: "量與單位換算", keywords: ["單位", "換算", "長度", "重量", "容量", "時間", "公分", "公尺", "公斤", "公升", "時", "分", "秒", "日期", "月曆"] },
  { tag: "數與計算", keywords: ["加", "減", "乘", "除", "四則", "位值", "進位", "退位", "估算", "湊整", "數的", "數列", "規律"] },
  { tag: "生活應用解題", keywords: ["應用", "文字題", "找零", "付錢", "錢", "價錢", "距離", "分配"] },
];

const CHINESE_RULES: TopicRule[] = [
  { tag: "修辭與寫作", keywords: ["修辭", "比喻", "擬人", "擬物", "排比", "設問", "誇飾", "映襯", "摹寫", "轉化", "寫作", "段落", "文章結構", "開頭", "結尾"] },
  { tag: "閱讀理解", keywords: ["閱讀", "推論", "主旨", "大意", "情緒", "動機", "跨文本", "上下文", "語境", "歸納", "預測", "訊息", "理解", "判斷", "比較文本"] },
  { tag: "字詞與成語", keywords: ["詞語", "詞義", "成語", "反義", "近義", "同義", "量詞", "疊字", "部首", "造詞", "詞語搭配", "慣用語", "諺語", "字義", "多音"] },
  { tag: "句型與語法", keywords: ["句型", "句構", "句序", "關聯詞", "標點", "頓號", "逗號", "句號", "病句", "語序", "被動", "因果", "轉折", "假設", "句子"] },
  { tag: "注音與識字", keywords: ["注音", "聲調", "國字", "錯字", "別字", "筆順", "筆畫", "識字"] },
  { tag: "文體與應用文", keywords: ["詩", "韻文", "兒歌", "故事", "寓言", "記敘", "說明", "議論", "童話", "小說", "文體", "書信", "便條", "日記", "公告", "卡片", "邀請", "演說", "報告", "訪談", "討論", "禮貌"] },
];

const SCIENCE_RULES: TopicRule[] = [
  { tag: "科學探究與實驗", keywords: ["控制變因", "變項", "實驗", "假設", "證據", "推論", "測量", "數據", "圖表", "觀察", "分類", "操作"] },
  { tag: "植物與光合作用", keywords: ["植物", "光合作用", "葉綠體", "根", "莖", "葉", "花", "果實", "種子", "向光", "蒸散", "氣孔", "養分"] },
  { tag: "生物與生命", keywords: ["細胞", "構造與功能", "器官", "生物體", "組織", "遺傳", "顯微"] },
  { tag: "生物與生命", keywords: ["動物", "食物鏈", "食物網", "生態", "棲地", "保育", "適應", "演化", "族群", "昆蟲", "魚", "鳥", "哺乳", "器官系統"] },
  { tag: "生物與生命", keywords: ["人體", "呼吸", "消化", "血液循環", "骨骼", "肌肉", "營養", "健康", "疾病", "感官", "免疫"] },
  { tag: "電與磁", keywords: ["電", "電路", "串聯", "並聯", "磁", "電池", "燈泡", "電流", "電壓", "導體", "絕緣", "靜電"] },
  { tag: "力與運動", keywords: ["力", "運動", "摩擦", "浮力", "重力", "彈力", "槓桿", "滑輪", "機械", "平衡", "速度", "慣性"] },
  { tag: "光與聲音", keywords: ["光", "反射", "折射", "鏡", "影", "顏色", "聲音", "音量", "音色", "樂器", "噪音", "傳播"] },
  { tag: "熱與溫度", keywords: ["熱", "溫度", "傳導", "對流", "輻射", "膨脹", "蒸發", "凝結", "沸騰", "熔化", "凝固", "溫標"] },
  { tag: "物質與變化", keywords: ["物質", "溶解", "密度", "狀態", "燃燒", "氧化", "酸鹼", "混合物", "性質", "變化", "水溶液", "結晶"] },
  {
    tag: "地球、水與大氣",
    keywords: ["地球", "地層", "岩石", "土壤", "地震", "火山", "風化", "板塊", "月", "太陽", "星", "宇宙", "潮汐",
      "水循環", "降雨", "雲", "地下水", "河", "海", "大氣", "空氣", "氣壓", "濕度",
      "天氣", "氣候", "颱風", "季風", "氣溫", "鋒面", "梅雨", "寒流"],
  },
];

const SOCIAL_RULES: TopicRule[] = [
  { tag: "資料與圖表判讀", keywords: ["資料", "圖表", "統計", "人口", "密度", "比例", "百分比", "資料來源", "數量比較", "代表性", "解讀"] },
  { tag: "環境與永續", keywords: ["環境", "汙染", "污染", "保育", "永續", "資源", "災害", "防災", "回收", "節能"] },
  { tag: "經濟與生活", keywords: ["經濟", "貨幣", "生產", "消費", "儲蓄", "機會成本", "需求", "供給", "產業", "貿易", "稅", "價格", "工作", "職業"] },
  { tag: "政府與制度", keywords: ["政府", "法律", "制度", "權利", "義務", "選舉", "民主", "組織", "國際", "條約", "政策", "公共"] },
  { tag: "臺灣歷史", keywords: ["歷史", "朝代", "日治", "清", "鄭", "荷西", "移民", "事件", "時代", "古蹟", "先民", "開墾"] },
  { tag: "原住民族與文化", keywords: ["原住", "族群", "文化", "習俗", "祭典", "語言", "傳統", "節慶", "信仰"] },
  { tag: "臺灣地理", keywords: ["臺灣", "台灣", "地形", "河川", "縣市", "區域", "島嶼", "平原", "盆地", "山脈", "港口"] },
  { tag: "世界地理", keywords: ["世界", "洲", "洋", "國家", "地圖", "經緯", "方位", "全球", "外國"] },
];

const ENGLISH_RULES: TopicRule[] = [
  { tag: "文法與句型", keywords: ["文法", "grammar", "tense", "時態", "句型", "sentence", "be 動詞", "疑問", "介系詞"] },
  { tag: "閱讀理解", keywords: ["閱讀", "reading", "理解", "文章", "短文", "comprehension"] },
  { tag: "聽力與口說", keywords: ["聽力", "listening", "口說", "speaking", "發音", "pronunciation", "對話", "dialog"] },
  { tag: "寫作與拼字", keywords: ["寫作", "writing", "拼字", "spelling", "單字", "vocabulary", "字彙"] },
  { tag: "生活應用", keywords: ["生活", "daily", "情境", "應用", "文化", "節慶"] },
];

const RULES_BY_SUBJECT: Record<string, TopicRule[]> = {
  數學: MATH_RULES,
  國語: CHINESE_RULES,
  自然: SCIENCE_RULES,
  社會: SOCIAL_RULES,
  英語: ENGLISH_RULES,
};

/** 科目對不上時的收斂桶。 */
const FALLBACK_TAG_BY_SUBJECT: Record<string, string> = {
  數學: "數與計算",
  國語: "閱讀理解",
  自然: "科學探究與實驗",
  社會: "資料與圖表判讀",
  英語: "生活應用",
};

/**
 * 由細知識標籤與學習主題，收斂出中階主題標籤。
 * @param subject 科目（數學／國語／自然／社會／英語）
 * @param knowledge 該題的細知識標籤
 * @param learningTopic 該題的學習主題（可省略）
 */
export function resolveTopicTag(
  subject: string,
  knowledge: readonly string[] = [],
  learningTopic?: string,
): string {
  const rules = RULES_BY_SUBJECT[subject];
  if (!rules) return subject || "其他";
  const haystack = [...knowledge, learningTopic ?? ""].filter(Boolean).join(" ");
  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (haystack.includes(keyword)) return rule.tag;
    }
  }
  return FALLBACK_TAG_BY_SUBJECT[subject] ?? subject;
}

/** 作答紀錄版本：只需要科目與知識標籤。 */
export function resolveTopicTagFromAttempt(attempt: {
  curriculumDomain?: string;
  subject?: string;
  knowledge?: readonly string[];
  learningTopic?: string;
}): string {
  const subject = attempt.subject ?? attempt.curriculumDomain ?? "";
  return resolveTopicTag(subject, attempt.knowledge ?? [], attempt.learningTopic);
}

/** 各科中階主題清單（給篩選 UI 或文件用）。 */
export function listTopicTags(subject: string): string[] {
  const rules = RULES_BY_SUBJECT[subject];
  if (!rules) return [];
  return Array.from(new Set(rules.map((rule) => rule.tag)));
}

export const TOPIC_TAG_SUBJECTS = Object.keys(RULES_BY_SUBJECT);
