import type { RegionKey } from "./rpgTypes";

export type SubjectKey = "chinese" | "math" | "english" | "science";

export type SubjectMonster = { id: string; subject: SubjectKey; name: string; emoji: string; region: RegionKey; maxHp: number; attack: number; defense: number; description: string; isRare?: boolean; requiredStreak?: number; title?: string; };

export const SUBJECT_MONSTERS: Record<SubjectKey, SubjectMonster[]> = {
  "chinese": [
    {
      "id": "chinese-classical",
      "subject": "chinese",
      "name": "文言文怪獸",
      "emoji": "📜",
      "region": "north",
      "maxHp": 135,
      "attack": 14,
      "defense": 8,
      "description": "守著古籍線索的字句怪獸。"
    },
    {
      "id": "chinese-idiom",
      "subject": "chinese",
      "name": "成語幽靈",
      "emoji": "👻",
      "region": "north",
      "maxHp": 155,
      "attack": 18,
      "defense": 5,
      "description": "會把相似成語藏進霧裡。"
    },
    {
      "id": "chinese-poetry",
      "subject": "chinese",
      "name": "詩詞巨人",
      "emoji": "🏯",
      "region": "north",
      "maxHp": 175,
      "attack": 11,
      "defense": 12,
      "description": "以平仄與意象守護詩路。"
    }
  ],
  "math": [
    {
      "id": "math-equation",
      "subject": "math",
      "name": "方程式魔王",
      "emoji": "🧮",
      "region": "central",
      "maxHp": 160,
      "attack": 16,
      "defense": 10,
      "description": "將未知數鎖在等式迷宮裡。"
    },
    {
      "id": "math-fraction",
      "subject": "math",
      "name": "分數史萊姆",
      "emoji": "🟢",
      "region": "central",
      "maxHp": 155,
      "attack": 12,
      "defense": 6,
      "description": "分裂後仍要保持分母一致。"
    },
    {
      "id": "math-geometry",
      "subject": "math",
      "name": "幾何巨獸",
      "emoji": "📐",
      "region": "central",
      "maxHp": 185,
      "attack": 13,
      "defense": 15,
      "description": "用角度與面積封鎖城門。"
    }
  ],
  "english": [
    {
      "id": "english-word",
      "subject": "english",
      "name": "單字蝙蝠",
      "emoji": "🦇",
      "region": "south",
      "maxHp": 135,
      "attack": 17,
      "defense": 5,
      "description": "在字根與拼字間快速移動。"
    },
    {
      "id": "english-tense",
      "subject": "english",
      "name": "時態狼人",
      "emoji": "🐺",
      "region": "south",
      "maxHp": 155,
      "attack": 15,
      "defense": 9,
      "description": "會把時間線藏在句子裡。"
    },
    {
      "id": "english-reading",
      "subject": "english",
      "name": "閱讀海龍",
      "emoji": "🐉",
      "region": "south",
      "maxHp": 165,
      "attack": 12,
      "defense": 13,
      "description": "守護文章主旨與推論寶珠。"
    }
  ],
  "science": [
    {
      "id": "science-ecosystem",
      "subject": "science",
      "name": "生態藤怪",
      "emoji": "🌿",
      "region": "east",
      "maxHp": 135,
      "attack": 13,
      "defense": 9,
      "description": "把食物鏈纏成綠色迷宮。"
    },
    {
      "id": "science-astronomy",
      "subject": "science",
      "name": "星軌水母",
      "emoji": "🪼",
      "region": "east",
      "maxHp": 155,
      "attack": 19,
      "defense": 6,
      "description": "漂浮在星體運動的潮汐裡。"
    },
    {
      "id": "science-energy",
      "subject": "science",
      "name": "能量岩魔",
      "emoji": "🪨",
      "region": "east",
      "maxHp": 185,
      "attack": 12,
      "defense": 16,
      "description": "把力與能量凝成岩石護盾。"
    }
  ]
};

const rareMonsters: Record<SubjectKey, SubjectMonster[]> = {
  "chinese": [
    {
      "id": "chinese-rare-1",
      "subject": "chinese",
      "name": "古籍星君",
      "emoji": "📚",
      "region": "north",
      "maxHp": 245,
      "attack": 24,
      "defense": 14,
      "description": "守護失落典籍的稀有文字怪物。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：古籍星君"
    },
    {
      "id": "chinese-rare-2",
      "subject": "chinese",
      "name": "韻律鳳凰",
      "emoji": "🦚",
      "region": "north",
      "maxHp": 265,
      "attack": 20,
      "defense": 18,
      "description": "以平仄聲韻點燃詩歌之火。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：韻律鳳凰"
    },
    {
      "id": "chinese-rare-3",
      "subject": "chinese",
      "name": "成語金獅",
      "emoji": "🦁",
      "region": "north",
      "maxHp": 285,
      "attack": 28,
      "defense": 12,
      "description": "把四字智慧化成金色鎧甲。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：成語金獅"
    }
  ],
  "math": [
    {
      "id": "math-rare-1",
      "subject": "math",
      "name": "無限數列龍",
      "emoji": "🐲",
      "region": "central",
      "maxHp": 275,
      "attack": 26,
      "defense": 18,
      "description": "在規律與未知數之間穿梭的稀有巨龍。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：無限數列龍"
    },
    {
      "id": "math-rare-2",
      "subject": "math",
      "name": "幾何星獸",
      "emoji": "🌟",
      "region": "central",
      "maxHp": 295,
      "attack": 24,
      "defense": 24,
      "description": "用對稱與角度守護幾何星門。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：幾何星獸"
    },
    {
      "id": "math-rare-3",
      "subject": "math",
      "name": "分數幻術師",
      "emoji": "🧙",
      "region": "central",
      "maxHp": 255,
      "attack": 30,
      "defense": 12,
      "description": "能把等值分數變成閃耀魔法。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：分數幻術師"
    }
  ],
  "english": [
    {
      "id": "english-rare-1",
      "subject": "english",
      "name": "文法獨角獸",
      "emoji": "🦄",
      "region": "south",
      "maxHp": 255,
      "attack": 26,
      "defense": 16,
      "description": "用句型與時態守護英文港。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：文法獨角獸"
    },
    {
      "id": "english-rare-2",
      "subject": "english",
      "name": "詞彙寶箱怪",
      "emoji": "🎁",
      "region": "south",
      "maxHp": 235,
      "attack": 32,
      "defense": 10,
      "description": "收集稀有單字並藏在寶箱深處。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：詞彙寶箱怪"
    },
    {
      "id": "english-rare-3",
      "subject": "english",
      "name": "閱讀鳳龍",
      "emoji": "🐉",
      "region": "south",
      "maxHp": 300,
      "attack": 22,
      "defense": 22,
      "description": "從段落線索中讀出隱藏的主旨。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：閱讀鳳龍"
    }
  ],
  "science": [
    {
      "id": "science-rare-1",
      "subject": "science",
      "name": "星系觀測者",
      "emoji": "🔭",
      "region": "east",
      "maxHp": 285,
      "attack": 24,
      "defense": 20,
      "description": "記錄行星與星體運行的稀有守衛。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：星系觀測者"
    },
    {
      "id": "science-rare-2",
      "subject": "science",
      "name": "生態水晶鹿",
      "emoji": "🦌",
      "region": "east",
      "maxHp": 250,
      "attack": 22,
      "defense": 22,
      "description": "守護食物鏈與棲地平衡。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：生態水晶鹿"
    },
    {
      "id": "science-rare-3",
      "subject": "science",
      "name": "能量極光獸",
      "emoji": "🌌",
      "region": "east",
      "maxHp": 310,
      "attack": 30,
      "defense": 16,
      "description": "將光、熱與電的能量凝成極光。",
      "isRare": true,
      "requiredStreak": 10,
      "title": "擊敗後獲得限定稱號：能量極光獸"
    }
  ]
};

export function getCorrectStreak(records: readonly { isCorrect: boolean }[]): number { let streak = 0; for (let index = records.length - 1; index >= 0; index -= 1) { if (!records[index].isCorrect) break; streak += 1; } return streak; }
export function getRandomSubjectMonster(subject: SubjectKey, random: () => number = Math.random, correctStreak = 0): SubjectMonster { const rare = rareMonsters[subject]; if (correctStreak >= 10 && random() < 0.18) return rare[Math.min(rare.length - 1, Math.floor(random() * rare.length))]; const list = SUBJECT_MONSTERS[subject]; return list[Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)))]; }
export function getRareMonsters(subject: SubjectKey): SubjectMonster[] { return rareMonsters[subject]; }

export type CurriculumQuestion = { id: string; subject: SubjectKey; topic: string; difficulty: 1 | 2 | 3; prompt: string; options: [string, string, string, string]; answer: number; explanation: string; errorTag: "concept" | "careless" | "memory"; };

const seeds: Record<SubjectKey, Array<{ topic: string; prompt: string; options: [string,string,string,string]; answer: number; explanation: string; errorTag: CurriculumQuestion["errorTag"] }>> = {
  "chinese": [
    {
      "topic": "字音字形",
      "prompt": "下列哪個詞語用字正確？",
      "options": [
        "再接再厲",
        "再接再勵",
        "再接再歷",
        "再接再利"
      ],
      "answer": 0,
      "explanation": "「厲」有磨礪、奮發之意，成語寫作再接再厲。",
      "errorTag": "memory"
    },
    {
      "topic": "成語",
      "prompt": "畫龍點睛最適合形容什麼？",
      "options": [
        "在關鍵處加上精采內容",
        "把畫面塗成藍色",
        "反覆修改錯字",
        "快速完成作業"
      ],
      "answer": 0,
      "explanation": "畫龍點睛比喻在關鍵處加上精采的一筆，使整體更生動。",
      "errorTag": "concept"
    },
    {
      "topic": "閱讀理解",
      "prompt": "守株待兔提醒我們不要？",
      "options": [
        "只等運氣而不主動努力",
        "每天觀察植物",
        "保護農田環境",
        "耐心排隊等待"
      ],
      "answer": 0,
      "explanation": "守株待兔比喻不主動努力，只想靠偶然機會獲得成功。",
      "errorTag": "concept"
    },
    {
      "topic": "詩詞",
      "prompt": "一鼓作氣中的「鼓」原本指什麼？",
      "options": [
        "擊鼓進軍",
        "鼓起勇氣",
        "鼓掌祝賀",
        "鼓樂表演"
      ],
      "answer": 0,
      "explanation": "一鼓作氣源自擊鼓進軍，第一次擊鼓時士氣最旺。",
      "errorTag": "memory"
    },
    {
      "topic": "字音字形",
      "prompt": "文章標題最常幫助讀者先建立什麼？",
      "options": [
        "對內容的預測",
        "所有細節的答案",
        "作者的住址",
        "文章的字數"
      ],
      "answer": 0,
      "explanation": "標題提供主題線索，能幫助讀者預測文章內容。",
      "errorTag": "concept"
    },
    {
      "topic": "成語",
      "prompt": "閱讀短文找主旨時，最應優先注意？",
      "options": [
        "反覆出現的重點與段落中心",
        "最長的句子",
        "第一個標點符號",
        "生字的筆畫數"
      ],
      "answer": 0,
      "explanation": "主旨通常可由段落中心與反覆出現的重點歸納。",
      "errorTag": "concept"
    },
    {
      "topic": "閱讀理解",
      "prompt": "同音字辨識最可靠的方法是？",
      "options": [
        "放回語境確認意思",
        "只看字的外形",
        "選筆畫最多的字",
        "依照讀音猜測"
      ],
      "answer": 0,
      "explanation": "同音字讀音相同，必須放回語境與詞義判斷。",
      "errorTag": "careless"
    },
    {
      "topic": "詩詞",
      "prompt": "寓言故事通常透過什麼傳達道理？",
      "options": [
        "角色遭遇與故事結果",
        "作者的出生日期",
        "地圖上的距離",
        "每個字的部首"
      ],
      "answer": 0,
      "explanation": "寓言常藉由角色行動及結果，讓讀者理解背後道理。",
      "errorTag": "concept"
    },
    {
      "topic": "字音字形",
      "prompt": "詩句中的季節意象可以幫助我們推測？",
      "options": [
        "時間與情境",
        "作者的身高",
        "紙張大小",
        "押韻字數"
      ],
      "answer": 0,
      "explanation": "花、雁、落葉等季節意象能提供時間與情境線索。",
      "errorTag": "memory"
    },
    {
      "topic": "成語",
      "prompt": "寫摘要時最不應加入？",
      "options": [
        "自己的評論與未出現的資訊",
        "文章的核心事件",
        "重要人物與原因",
        "主要結果"
      ],
      "answer": 0,
      "explanation": "摘要要忠實保留原文重點，不應混入個人評論或原文沒有的資訊。",
      "errorTag": "careless"
    },
    {
      "topic": "閱讀理解",
      "prompt": "段落中的「但是」通常提示？",
      "options": [
        "語意轉折",
        "時間順序",
        "列舉例子",
        "下定義"
      ],
      "answer": 0,
      "explanation": "但是是常見轉折詞，表示前後內容有對比或改變。",
      "errorTag": "concept"
    },
    {
      "topic": "詩詞",
      "prompt": "對偶句的上下句通常具有什麼特色？",
      "options": [
        "字數相近、結構相似、意思相關",
        "完全沒有關聯",
        "只使用疑問句",
        "每句都必須押同一韻"
      ],
      "answer": 0,
      "explanation": "對偶講求結構與字數相近，並且上下句意思互相映照。",
      "errorTag": "concept"
    },
    {
      "topic": "字音字形",
      "prompt": "閱讀推論必須根據什麼建立？",
      "options": [
        "文章線索與合理連結",
        "讀者的隨意想像",
        "題目外的傳聞",
        "文章字體顏色"
      ],
      "answer": 0,
      "explanation": "推論需要以文本線索為證據，再進行合理連結。",
      "errorTag": "concept"
    },
    {
      "topic": "成語",
      "prompt": "望梅止渴中的梅主要扮演什麼作用？",
      "options": [
        "用想像的景象暫時安慰需求",
        "真正提供飲水",
        "代表春天植物",
        "說明梅子的價格"
      ],
      "answer": 0,
      "explanation": "望梅止渴是以想像梅子酸味暫時安慰口渴，並非真的解渴。",
      "errorTag": "concept"
    },
    {
      "topic": "閱讀理解",
      "prompt": "說明文使用表格最適合呈現？",
      "options": [
        "多項資料的比較",
        "人物內心獨白",
        "故事高潮",
        "押韻效果"
      ],
      "answer": 0,
      "explanation": "表格能把多項資料並列，方便讀者比較與查找。",
      "errorTag": "concept"
    },
    {
      "topic": "詩詞",
      "prompt": "詩詞押韻主要能產生什麼效果？",
      "options": [
        "節奏感與音樂性",
        "增加段落數量",
        "改變作者姓名",
        "隱藏所有主旨"
      ],
      "answer": 0,
      "explanation": "押韻讓語句讀來更有節奏與音樂性，也較容易記憶。",
      "errorTag": "memory"
    },
    {
      "topic": "字音字形",
      "prompt": "遇到不熟悉的詞語，可先利用什麼？",
      "options": [
        "前後文與構詞線索",
        "猜測作者年齡",
        "只查第一個字",
        "忽略整句意思"
      ],
      "answer": 0,
      "explanation": "前後文與詞語組成能提供理解生字詞的線索。",
      "errorTag": "careless"
    },
    {
      "topic": "成語",
      "prompt": "故事結尾呼應開頭通常帶來什麼效果？",
      "options": [
        "結構完整並加深主題",
        "讓人物消失",
        "刪除所有衝突",
        "改變文章體裁"
      ],
      "answer": 0,
      "explanation": "首尾呼應能讓結構更完整，也能再次凸顯主題。",
      "errorTag": "concept"
    },
    {
      "topic": "閱讀理解",
      "prompt": "使用成語前最需要確認？",
      "options": [
        "詞義與使用情境",
        "字數一定是四個",
        "每次都用在稱讚",
        "只要讀音相同"
      ],
      "answer": 0,
      "explanation": "成語有特定語意與感情色彩，需確認是否符合情境。",
      "errorTag": "careless"
    },
    {
      "topic": "詩詞",
      "prompt": "引用名言時應注意什麼？",
      "options": [
        "來源與原意是否正確",
        "一定要改寫作者姓名",
        "只能放在文章開頭",
        "不可說明用途"
      ],
      "answer": 0,
      "explanation": "引用要尊重原文，確認來源與原意，避免斷章取義。",
      "errorTag": "memory"
    },
    {
      "topic": "字音字形",
      "prompt": "描寫景物時加入感官詞能？",
      "options": [
        "讓畫面更具體生動",
        "使文章沒有順序",
        "刪除所有細節",
        "只表達數學關係"
      ],
      "answer": 0,
      "explanation": "視覺、聽覺、嗅覺等感官詞能讓讀者更具體感受景物。",
      "errorTag": "concept"
    },
    {
      "topic": "成語",
      "prompt": "人物語氣突然改變可能反映？",
      "options": [
        "情緒或立場的轉變",
        "字體大小改變",
        "故事時間停止",
        "作者換了國籍"
      ],
      "answer": 0,
      "explanation": "語氣變化常是人物情緒、態度或立場轉變的線索。",
      "errorTag": "concept"
    },
    {
      "topic": "閱讀理解",
      "prompt": "近體詩常見的格律特色是？",
      "options": [
        "字數、平仄與押韻有規律",
        "每句都沒有節奏",
        "只能使用白話文",
        "不可描寫景物"
      ],
      "answer": 0,
      "explanation": "近體詩在句數、字數、平仄與押韻上通常有較明確規律。",
      "errorTag": "memory"
    },
    {
      "topic": "詩詞",
      "prompt": "段落主旨通常與哪些句子關係密切？",
      "options": [
        "中心句與支持細節",
        "只有最後一個字",
        "所有標點符號",
        "頁碼與插圖邊框"
      ],
      "answer": 0,
      "explanation": "中心句提出重點，支持細節補充說明，兩者共同呈現段落主旨。",
      "errorTag": "concept"
    },
    {
      "topic": "字音字形",
      "prompt": "找文章證據時，應回到哪裡確認？",
      "options": [
        "原文具體句子",
        "自己的記憶",
        "文章以外的留言",
        "題目編號"
      ],
      "answer": 0,
      "explanation": "閱讀判斷應回到原文找具體句子，避免憑印象作答。",
      "errorTag": "careless"
    }
  ],
  "math": [
    {
      "topic": "四則運算",
      "prompt": "12 + 8 × 2 的結果是多少？",
      "options": [
        "28",
        "40",
        "32",
        "24"
      ],
      "answer": 0,
      "explanation": "先乘除後加減，8×2=16，再加12得到28。",
      "errorTag": "careless"
    },
    {
      "topic": "分數",
      "prompt": "長方形長 6 公分、寬 4 公分，面積是多少？",
      "options": [
        "24 平方公分",
        "20 平方公分",
        "10 平方公分",
        "48 平方公分"
      ],
      "answer": 0,
      "explanation": "長方形面積＝長×寬＝6×4＝24平方公分。",
      "errorTag": "concept"
    },
    {
      "topic": "方程式",
      "prompt": "若 x + 7 = 15，x 等於多少？",
      "options": [
        "8",
        "22",
        "7",
        "15"
      ],
      "answer": 0,
      "explanation": "等式兩邊同減7，x＝15−7＝8。",
      "errorTag": "concept"
    },
    {
      "topic": "幾何",
      "prompt": "3/4 和 2/3 哪一個比較大？",
      "options": [
        "3/4",
        "2/3",
        "一樣大",
        "無法比較"
      ],
      "answer": 0,
      "explanation": "交叉比較 3×3=9、2×4=8，因此3/4較大。",
      "errorTag": "careless"
    },
    {
      "topic": "四則運算",
      "prompt": "三角形內角和是多少度？",
      "options": [
        "180度",
        "90度",
        "270度",
        "360度"
      ],
      "answer": 0,
      "explanation": "任意三角形三個內角的總和都是180度。",
      "errorTag": "memory"
    },
    {
      "topic": "分數",
      "prompt": "45 ÷ 5 的商是多少？",
      "options": [
        "9",
        "8",
        "10",
        "225"
      ],
      "answer": 0,
      "explanation": "45分成5等份，每份是9。",
      "errorTag": "careless"
    },
    {
      "topic": "方程式",
      "prompt": "2x = 18 時，x 等於多少？",
      "options": [
        "9",
        "16",
        "20",
        "36"
      ],
      "answer": 0,
      "explanation": "等式兩邊同除以2，x＝18÷2＝9。",
      "errorTag": "concept"
    },
    {
      "topic": "幾何",
      "prompt": "半徑 3 公分的圓，直徑是多少？",
      "options": [
        "6公分",
        "3公分",
        "9公分",
        "12公分"
      ],
      "answer": 0,
      "explanation": "直徑是半徑的2倍，所以3×2＝6公分。",
      "errorTag": "memory"
    },
    {
      "topic": "四則運算",
      "prompt": "5/8 + 1/8 等於多少？",
      "options": [
        "6/8",
        "5/16",
        "1/8",
        "6/16"
      ],
      "answer": 0,
      "explanation": "分母相同，分子相加：5/8+1/8=6/8，也可約成3/4。",
      "errorTag": "careless"
    },
    {
      "topic": "分數",
      "prompt": "每盒彩筆 24 元，買 3 盒需要多少元？",
      "options": [
        "72元",
        "27元",
        "48元",
        "8元"
      ],
      "answer": 0,
      "explanation": "總價＝24×3＝72元。",
      "errorTag": "careless"
    },
    {
      "topic": "方程式",
      "prompt": "平行線的特色是什麼？",
      "options": [
        "在同一平面永不相交",
        "一定互相垂直",
        "長度一定相等",
        "只能畫成水平線"
      ],
      "answer": 0,
      "explanation": "同一平面上的平行線不論延長多遠都不相交。",
      "errorTag": "concept"
    },
    {
      "topic": "幾何",
      "prompt": "0.6 可以寫成哪個最簡分數？",
      "options": [
        "3/5",
        "6/100",
        "1/6",
        "2/3"
      ],
      "answer": 0,
      "explanation": "0.6＝6/10，分子分母同除以2得到3/5。",
      "errorTag": "concept"
    },
    {
      "topic": "四則運算",
      "prompt": "一個數增加 9 後為 20，原數是多少？",
      "options": [
        "11",
        "29",
        "9",
        "20"
      ],
      "answer": 0,
      "explanation": "原數＝20−9＝11。",
      "errorTag": "careless"
    },
    {
      "topic": "分數",
      "prompt": "正方形周長 28 公分，邊長是多少？",
      "options": [
        "7公分",
        "14公分",
        "24公分",
        "112公分"
      ],
      "answer": 0,
      "explanation": "正方形四邊等長，邊長＝28÷4＝7公分。",
      "errorTag": "concept"
    },
    {
      "topic": "方程式",
      "prompt": "7 × 6 − 5 的結果是多少？",
      "options": [
        "37",
        "67",
        "42",
        "1"
      ],
      "answer": 0,
      "explanation": "先算乘法7×6=42，再減5得到37。",
      "errorTag": "careless"
    },
    {
      "topic": "幾何",
      "prompt": "2/5 與 4/10 的關係是什麼？",
      "options": [
        "相等",
        "前者較大",
        "後者較大",
        "相加等於1"
      ],
      "answer": 0,
      "explanation": "2/5乘以2得到4/10，所以兩者相等。",
      "errorTag": "concept"
    },
    {
      "topic": "四則運算",
      "prompt": "未知數在算式中通常用什麼表示？",
      "options": [
        "英文字母",
        "標點符號",
        "單位名稱",
        "小數點"
      ],
      "answer": 0,
      "explanation": "代數常用 x、y 等英文字母代表未知數。",
      "errorTag": "memory"
    },
    {
      "topic": "分數",
      "prompt": "梯形具有哪一項幾何特徵？",
      "options": [
        "至少有一組平行邊",
        "四邊都相等",
        "沒有任何角",
        "三個頂點"
      ],
      "answer": 0,
      "explanation": "梯形至少有一組對邊平行。",
      "errorTag": "concept"
    },
    {
      "topic": "方程式",
      "prompt": "100 的 25% 是多少？",
      "options": [
        "25",
        "4",
        "75",
        "125"
      ],
      "answer": 0,
      "explanation": "25%＝25/100，所以100×25%＝25。",
      "errorTag": "careless"
    },
    {
      "topic": "幾何",
      "prompt": "平均分成 8 份取 3 份可表示為？",
      "options": [
        "3/8",
        "8/3",
        "3×8",
        "8−3"
      ],
      "answer": 0,
      "explanation": "取3份、總共8份，以分數3/8表示。",
      "errorTag": "concept"
    },
    {
      "topic": "四則運算",
      "prompt": "90度的角稱為什麼角？",
      "options": [
        "直角",
        "銳角",
        "鈍角",
        "平角"
      ],
      "answer": 0,
      "explanation": "90度的角叫作直角。",
      "errorTag": "memory"
    },
    {
      "topic": "分數",
      "prompt": "若 y − 4 = 11，y 等於多少？",
      "options": [
        "15",
        "7",
        "44",
        "11"
      ],
      "answer": 0,
      "explanation": "等式兩邊同加4，y＝11＋4＝15。",
      "errorTag": "careless"
    },
    {
      "topic": "方程式",
      "prompt": "長方體有幾個面？",
      "options": [
        "6個",
        "4個",
        "8個",
        "12個"
      ],
      "answer": 0,
      "explanation": "長方體有6個長方形面。",
      "errorTag": "memory"
    },
    {
      "topic": "幾何",
      "prompt": "18與24的最大公因數是多少？",
      "options": [
        "6",
        "3",
        "12",
        "72"
      ],
      "answer": 0,
      "explanation": "18與24共同因數中最大的為6。",
      "errorTag": "concept"
    },
    {
      "topic": "四則運算",
      "prompt": "等式兩邊同加同減仍保持什麼？",
      "options": [
        "相等關係",
        "面積增加",
        "角度變直",
        "分母變大"
      ],
      "answer": 0,
      "explanation": "對等式兩邊做相同運算，等式仍維持相等。",
      "errorTag": "concept"
    }
  ],
  "english": [
    {
      "topic": "vocabulary",
      "prompt": "Which word means「蘋果」?",
      "options": [
        "apple",
        "table",
        "orange",
        "school"
      ],
      "answer": 0,
      "explanation": "Apple means 蘋果。",
      "errorTag": "memory"
    },
    {
      "topic": "grammar",
      "prompt": "Choose the correct sentence: She ___ happy.",
      "options": [
        "is",
        "are",
        "am",
        "be"
      ],
      "answer": 0,
      "explanation": "She is happy 使用第三人稱單數 be 動詞 is。",
      "errorTag": "concept"
    },
    {
      "topic": "reading",
      "prompt": "What is the opposite of big?",
      "options": [
        "small",
        "long",
        "fast",
        "high"
      ],
      "answer": 0,
      "explanation": "Small is the opposite of big。",
      "errorTag": "memory"
    },
    {
      "topic": "conversation",
      "prompt": "Which question asks about a place?",
      "options": [
        "Where are you?",
        "Who are you?",
        "What is it?",
        "When is it?"
      ],
      "answer": 0,
      "explanation": "Where 用來詢問地點。",
      "errorTag": "concept"
    },
    {
      "topic": "vocabulary",
      "prompt": "Choose the past tense of go.",
      "options": [
        "went",
        "goed",
        "goes",
        "going"
      ],
      "answer": 0,
      "explanation": "Go 的過去式是不規則變化 went。",
      "errorTag": "memory"
    },
    {
      "topic": "grammar",
      "prompt": "What does library mean?",
      "options": [
        "圖書館",
        "醫院",
        "公園",
        "市場"
      ],
      "answer": 0,
      "explanation": "Library means 圖書館。",
      "errorTag": "memory"
    },
    {
      "topic": "reading",
      "prompt": "Complete: They ___ playing football.",
      "options": [
        "are",
        "is",
        "am",
        "be"
      ],
      "answer": 0,
      "explanation": "They 是複數主詞，現在進行式使用 are playing。",
      "errorTag": "concept"
    },
    {
      "topic": "conversation",
      "prompt": "Which word is a color?",
      "options": [
        "blue",
        "run",
        "teacher",
        "quickly"
      ],
      "answer": 0,
      "explanation": "Blue 是顏色名稱。",
      "errorTag": "memory"
    },
    {
      "topic": "vocabulary",
      "prompt": "Tom has two cats. How many cats does Tom have?",
      "options": [
        "Two",
        "One",
        "Three",
        "Four"
      ],
      "answer": 0,
      "explanation": "短文直接指出 Tom has two cats。",
      "errorTag": "careless"
    },
    {
      "topic": "grammar",
      "prompt": "Choose the polite greeting for morning.",
      "options": [
        "Good morning.",
        "Good night.",
        "See you yesterday.",
        "Goodbye tomorrow."
      ],
      "answer": 0,
      "explanation": "早上的禮貌問候是 Good morning。",
      "errorTag": "concept"
    },
    {
      "topic": "reading",
      "prompt": "What is the plural form of child?",
      "options": [
        "children",
        "childs",
        "childes",
        "childrens"
      ],
      "answer": 0,
      "explanation": "Child 的複數是不規則變化 children。",
      "errorTag": "memory"
    },
    {
      "topic": "conversation",
      "prompt": "Complete: I am ___ Taiwan.",
      "options": [
        "in",
        "on",
        "at",
        "to"
      ],
      "answer": 0,
      "explanation": "表示人在國家或城市內通常使用 in。",
      "errorTag": "concept"
    },
    {
      "topic": "vocabulary",
      "prompt": "Which word means「快速的」?",
      "options": [
        "fast",
        "quiet",
        "heavy",
        "kind"
      ],
      "answer": 0,
      "explanation": "Fast means 快速的。",
      "errorTag": "memory"
    },
    {
      "topic": "grammar",
      "prompt": "Choose the correct article: ___ orange.",
      "options": [
        "an",
        "a",
        "thee",
        "some"
      ],
      "answer": 0,
      "explanation": "Orange 的開頭是母音音，使用 an。",
      "errorTag": "concept"
    },
    {
      "topic": "reading",
      "prompt": "What does because show in a sentence?",
      "options": [
        "原因",
        "時間",
        "地點",
        "數量"
      ],
      "answer": 0,
      "explanation": "Because 引導原因。",
      "errorTag": "concept"
    },
    {
      "topic": "conversation",
      "prompt": "Complete: He ___ to school every day.",
      "options": [
        "goes",
        "go",
        "going",
        "gone"
      ],
      "answer": 0,
      "explanation": "He 是第三人稱單數，現在式動詞加 s。",
      "errorTag": "concept"
    },
    {
      "topic": "vocabulary",
      "prompt": "Which sentence is a question?",
      "options": [
        "Are you ready?",
        "I am ready.",
        "Be ready.",
        "Ready and quiet."
      ],
      "answer": 0,
      "explanation": "問句通常以問號結尾，Are you ready? 是疑問句。",
      "errorTag": "careless"
    },
    {
      "topic": "grammar",
      "prompt": "What is the opposite of early?",
      "options": [
        "late",
        "fast",
        "first",
        "near"
      ],
      "answer": 0,
      "explanation": "Late is the opposite of early。",
      "errorTag": "memory"
    },
    {
      "topic": "reading",
      "prompt": "Choose the correct pronoun for Mary and I.",
      "options": [
        "we",
        "he",
        "she",
        "it"
      ],
      "answer": 0,
      "explanation": "Mary and I 是兩人，第一人稱複數代名詞是 we。",
      "errorTag": "concept"
    },
    {
      "topic": "conversation",
      "prompt": "What does weather describe?",
      "options": [
        "天氣狀況",
        "人物性格",
        "食物味道",
        "房間大小"
      ],
      "answer": 0,
      "explanation": "Weather describes 天氣狀況。",
      "errorTag": "memory"
    },
    {
      "topic": "vocabulary",
      "prompt": "Complete: There ___ three books.",
      "options": [
        "are",
        "is",
        "am",
        "be"
      ],
      "answer": 0,
      "explanation": "Three books 是複數，使用 There are。",
      "errorTag": "concept"
    },
    {
      "topic": "grammar",
      "prompt": "Which word is a verb?",
      "options": [
        "jump",
        "blue",
        "happy",
        "book"
      ],
      "answer": 0,
      "explanation": "Jump 是表示動作的動詞。",
      "errorTag": "memory"
    },
    {
      "topic": "reading",
      "prompt": "What does careful mean?",
      "options": [
        "小心的",
        "吵鬧的",
        "寒冷的",
        "空的"
      ],
      "answer": 0,
      "explanation": "Careful means 小心的。",
      "errorTag": "memory"
    },
    {
      "topic": "conversation",
      "prompt": "Choose the correct comparative: tall, taller, ___.",
      "options": [
        "tallest",
        "more tall",
        "talling",
        "tallful"
      ],
      "answer": 0,
      "explanation": "三者比較最高級為 tallest；題目用逗號列出比較詞形。",
      "errorTag": "concept"
    },
    {
      "topic": "vocabulary",
      "prompt": "What does borrow mean?",
      "options": [
        "借入",
        "歸還",
        "購買",
        "遺失"
      ],
      "answer": 0,
      "explanation": "Borrow means 借入，lend 才是借出。",
      "errorTag": "concept"
    }
  ],
  "science": [
    {
      "topic": "生態",
      "prompt": "植物進行光合作用主要需要哪種能量？",
      "options": [
        "光能",
        "聲能",
        "磁能",
        "核能"
      ],
      "answer": 0,
      "explanation": "植物利用光能製造養分，這個過程稱為光合作用。",
      "errorTag": "concept"
    },
    {
      "topic": "天文",
      "prompt": "地球繞著哪個天體公轉？",
      "options": [
        "太陽",
        "月亮",
        "火星",
        "北極星"
      ],
      "answer": 0,
      "explanation": "地球繞太陽公轉，形成一年。",
      "errorTag": "memory"
    },
    {
      "topic": "能量",
      "prompt": "食物鏈中的生產者通常是？",
      "options": [
        "綠色植物",
        "獅子",
        "真菌",
        "細菌"
      ],
      "answer": 0,
      "explanation": "綠色植物能自行製造養分，是常見生產者。",
      "errorTag": "concept"
    },
    {
      "topic": "物質",
      "prompt": "水在 100°C 沸騰時會？",
      "options": [
        "由液態變氣態",
        "由氣態變固態",
        "由固態變液態",
        "保持固態"
      ],
      "answer": 0,
      "explanation": "沸騰是液態水大量變成水蒸氣的現象。",
      "errorTag": "concept"
    },
    {
      "topic": "生態",
      "prompt": "月亮本身會發光嗎？",
      "options": [
        "不會，主要反射太陽光",
        "會自行產生陽光",
        "只在白天發光",
        "由地球供應光線"
      ],
      "answer": 0,
      "explanation": "月亮看起來明亮是因為反射太陽光。",
      "errorTag": "memory"
    },
    {
      "topic": "天文",
      "prompt": "摩擦力通常會阻礙什麼？",
      "options": [
        "物體相對運動",
        "光線傳播",
        "水的蒸發",
        "植物生長"
      ],
      "answer": 0,
      "explanation": "摩擦力方向通常與接觸面的相對運動或運動趨勢相反。",
      "errorTag": "concept"
    },
    {
      "topic": "能量",
      "prompt": "下列哪個屬於可再生能源？",
      "options": [
        "太陽能",
        "煤炭",
        "石油",
        "天然氣"
      ],
      "answer": 0,
      "explanation": "太陽能可由自然持續補充，屬於可再生能源。",
      "errorTag": "memory"
    },
    {
      "topic": "物質",
      "prompt": "生態系中分解者的作用是？",
      "options": [
        "分解遺體並釋放養分",
        "製造陽光",
        "吃掉所有生產者",
        "停止水循環"
      ],
      "answer": 0,
      "explanation": "分解者把遺體與排遺分解，讓養分回到環境。",
      "errorTag": "concept"
    },
    {
      "topic": "生態",
      "prompt": "影子的方向主要與哪個因素有關？",
      "options": [
        "光源方向",
        "物體重量",
        "空氣味道",
        "聲音大小"
      ],
      "answer": 0,
      "explanation": "影子會出現在背向光源的一側。",
      "errorTag": "concept"
    },
    {
      "topic": "天文",
      "prompt": "固體通常具有什麼形狀特徵？",
      "options": [
        "固定形狀與體積",
        "沒有體積",
        "隨容器完全變形",
        "只能在空氣中存在"
      ],
      "answer": 0,
      "explanation": "固體的粒子排列較固定，通常具有固定形狀與體積。",
      "errorTag": "concept"
    },
    {
      "topic": "能量",
      "prompt": "地球自轉一周約需多久？",
      "options": [
        "24小時",
        "12小時",
        "7天",
        "365天"
      ],
      "answer": 0,
      "explanation": "地球自轉一周約24小時，形成一天。",
      "errorTag": "memory"
    },
    {
      "topic": "物質",
      "prompt": "魚主要用什麼構造呼吸？",
      "options": [
        "鰓",
        "肺",
        "皮膚毛孔",
        "葉片"
      ],
      "answer": 0,
      "explanation": "魚利用鰓從水中取得溶解氧。",
      "errorTag": "memory"
    },
    {
      "topic": "生態",
      "prompt": "磁鐵的同極會如何作用？",
      "options": [
        "互相排斥",
        "互相吸引",
        "完全沒有作用",
        "變成電池"
      ],
      "answer": 0,
      "explanation": "磁鐵同極相斥、異極相吸。",
      "errorTag": "concept"
    },
    {
      "topic": "天文",
      "prompt": "雲主要是由什麼形成？",
      "options": [
        "小水滴或冰晶",
        "沙粒燃燒",
        "植物根部",
        "聲波聚集"
      ],
      "answer": 0,
      "explanation": "水蒸氣冷卻凝結成小水滴或冰晶，聚集形成雲。",
      "errorTag": "concept"
    },
    {
      "topic": "能量",
      "prompt": "聲音需要什麼才能傳播？",
      "options": [
        "介質",
        "真空",
        "黑暗",
        "磁鐵"
      ],
      "answer": 0,
      "explanation": "聲音需要空氣、水或固體等介質傳播，真空中無法傳播。",
      "errorTag": "concept"
    },
    {
      "topic": "物質",
      "prompt": "保護生物多樣性的重要方法是？",
      "options": [
        "保護棲地並減少過度捕捉",
        "移除所有植物",
        "只飼養單一物種",
        "增加污染"
      ],
      "answer": 0,
      "explanation": "保護棲地與降低人為干擾有助維持生物多樣性。",
      "errorTag": "concept"
    },
    {
      "topic": "生態",
      "prompt": "溫度計主要測量什麼？",
      "options": [
        "溫度",
        "重量",
        "長度",
        "亮度"
      ],
      "answer": 0,
      "explanation": "溫度計的用途是測量物體或環境的冷熱程度。",
      "errorTag": "memory"
    },
    {
      "topic": "天文",
      "prompt": "太陽系最大的行星是哪一顆？",
      "options": [
        "木星",
        "地球",
        "水星",
        "金星"
      ],
      "answer": 0,
      "explanation": "木星是太陽系中體積最大的行星。",
      "errorTag": "memory"
    },
    {
      "topic": "能量",
      "prompt": "水循環包含哪些過程？",
      "options": [
        "蒸發、凝結、降水",
        "燃燒、爆炸、熔化",
        "生長、開花、結果",
        "摩擦、碰撞、反彈"
      ],
      "answer": 0,
      "explanation": "水在蒸發、凝結與降水等過程間循環。",
      "errorTag": "concept"
    },
    {
      "topic": "物質",
      "prompt": "電路要形成通路才會？",
      "options": [
        "讓電流通過並使電器運作",
        "使電池消失",
        "停止所有光線",
        "讓導線變成磁鐵"
      ],
      "answer": 0,
      "explanation": "完整通路能讓電流通過，電器才可能運作。",
      "errorTag": "concept"
    },
    {
      "topic": "生態",
      "prompt": "月相改變主要與哪些相對位置有關？",
      "options": [
        "太陽、地球、月亮",
        "地球與海洋",
        "雲與風",
        "山與河流"
      ],
      "answer": 0,
      "explanation": "月相取決於太陽照亮月球的部分及三者相對位置。",
      "errorTag": "concept"
    },
    {
      "topic": "天文",
      "prompt": "動物適應環境的特徵稱為？",
      "options": [
        "適應",
        "蒸發",
        "反射",
        "溶解"
      ],
      "answer": 0,
      "explanation": "生物為適應環境而形成的特徵或行為稱為適應。",
      "errorTag": "memory"
    },
    {
      "topic": "能量",
      "prompt": "風通常是由什麼差異造成？",
      "options": [
        "氣壓差",
        "顏色差",
        "聲音差",
        "重量相同"
      ],
      "answer": 0,
      "explanation": "空氣會由高氣壓流向低氣壓，形成風。",
      "errorTag": "concept"
    },
    {
      "topic": "物質",
      "prompt": "物質由液態變固態稱為？",
      "options": [
        "凝固",
        "融化",
        "蒸發",
        "凝結"
      ],
      "answer": 0,
      "explanation": "液體冷卻成固體的過程稱為凝固。",
      "errorTag": "memory"
    },
    {
      "topic": "生態",
      "prompt": "植物根部主要吸收什麼？",
      "options": [
        "水分與無機鹽",
        "陽光與聲音",
        "氧氣與糖果",
        "花粉與果實"
      ],
      "answer": 0,
      "explanation": "根部從土壤吸收水分與無機鹽，供植物利用。",
      "errorTag": "concept"
    }
  ]
};

function expandQuestions(subject: SubjectKey): CurriculumQuestion[] { const variants = ["請先找出題幹的核心線索。", "請把這個概念套用到新的學習情境。", "請比較各選項後再作答。", "請說明你選擇答案時最重要的判斷依據。"] as const; return seeds[subject].flatMap((seed, seedIndex) => variants.map((variant, variantIndex) => ({ id: `${subject}-expedition-${String(seedIndex * 4 + variantIndex + 1).padStart(3, "0")}`, subject, topic: seed.topic, difficulty: (variantIndex === 0 ? 1 : variantIndex === 1 ? 2 : variantIndex === 2 ? 2 : 3) as 1 | 2 | 3, prompt: `${seed.prompt} ${variant}`, options: seed.options, answer: seed.answer, explanation: seed.explanation, errorTag: seed.errorTag }))); }
export const CURRICULUM_QUESTIONS: Record<SubjectKey, CurriculumQuestion[]> = { chinese: expandQuestions("chinese"), math: expandQuestions("math"), english: expandQuestions("english"), science: expandQuestions("science") };
export const ALL_CURRICULUM_QUESTIONS = Object.values(CURRICULUM_QUESTIONS).flat();
