export type ObservatoryCategory = "親子動畫" | "特攝英雄";

export type ObservatoryEntry = {
  key: string;
  title: string;
  category: ObservatoryCategory;
  era: string;
  palette: string;
  shortDescription: string;
  observation: string;
  learning: string;
  worldviewTitle: string;
  worldview: string;
  learningPaths: string[];
  officialSourceUrl: string;
  officialLabel: string;
};

/**
 * 觀測站只保存原創摘要與學習提示，不儲存劇照、台詞、劇情逐字稿或非授權媒體。
 */
export const OBSERVATORY_ENTRIES: ObservatoryEntry[] = [
  {
    key: "nailong",
    title: "我是奶龍",
    category: "親子動畫",
    era: "日常成長觀測",
    palette: "yellow",
    shortDescription: "從溫暖日常、好奇提問與朋友互動出發，觀察一件小事如何成為成長的冒險。",
    observation: "留意角色怎麼說出感受、怎麼向朋友求助，以及如何從失敗裡再試一次。",
    learning: "擴展知識：情緒表達、生活觀察、互助與勇敢提問。",
    worldviewTitle: "把小日子變成好奇實驗室",
    worldview: "這是一個從日常情境出發的溫暖想像世界。當角色遇到疑問、挫折或新朋友時，可以用提問、陪伴與嘗試，把原本不確定的小事變成一起完成的任務。",
    learningPaths: ["國語：用三個詞說清楚今天遇到的問題。", "社會：想想朋友、家人與社區如何互相照顧。", "自然：從食物、天氣或生活小現象練習觀察。"],
    officialSourceUrl: "https://www.nailoong.com/ipStar/Nailong/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "ultraman",
    title: "奧特曼",
    category: "特攝英雄",
    era: "巨大英雄觀測",
    palette: "coral",
    shortDescription: "從巨大化、光與城市防衛的想像，觀察英雄如何面對未知威脅與守護選擇。",
    observation: "留意尺度變化、城市空間、隊伍分工與保護他人的選擇。",
    learning: "擴展知識：尺度、能量、公共安全與環境想像。",
    worldviewTitle: "從遙遠宇宙到共同守護的城市",
    worldview: "這個世界以宇宙探索、未知來訪與城市防衛作為想像舞台。英雄不只是力量的象徵，也讓人思考面對危機時，資訊、合作與保護他人的行動如何連在一起。",
    learningPaths: ["自然：用能量與光的概念提出一個可驗證的問題。", "數學：比較巨大尺度、距離與地圖上的位置。", "社會：討論公共安全需要哪些分工與準備。"],
    officialSourceUrl: "https://www.ultramanconnection.com/pages/universe/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "kamen-rider",
    title: "假面騎士",
    category: "特攝英雄",
    era: "變身英雄觀測",
    palette: "tidal",
    shortDescription: "以變身、裝備與夥伴關係，拆解英雄身份、代價與責任的故事語法。",
    observation: "比較不同形態的功能、限制與角色在關鍵時刻的選擇。",
    learning: "擴展知識：科技設計、責任、選擇與公共守護。",
    worldviewTitle: "科技裝備與責任選擇",
    worldview: "這個世界把裝備、技術與身份轉變放在一起思考：當工具讓人更有能力時，也需要面對限制、後果與如何使用力量的選擇。",
    learningPaths: ["自然：從材料、能量與功能推測一項裝備的設計目的。", "社會：討論能力、權利與責任如何互相平衡。", "國語：區分作品明示的線索與自己的推論。"],
    officialSourceUrl: "https://www.kamen-rider-official.com/series/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "doraemon",
    title: "哆啦A夢",
    category: "親子動畫",
    era: "道具想像觀測",
    palette: "tidal",
    shortDescription: "從未來道具與日常難題出發，觀察「方便的工具」帶來的幫助，以及意料之外的後果。",
    observation: "留意角色遇到問題時，是先想清楚需求，還是直接依賴道具；道具解決了什麼，又帶來什麼新麻煩。",
    learning: "擴展知識：科技工具、因果關係、問題分析與負責任的選擇。",
    worldviewTitle: "用道具解決問題？先想清楚再許願",
    worldview: "這是一個充滿未來道具的奇想世界。道具能放大願望，也會放大粗心：每次使用都會引發連鎖反應，提醒我們工具不能代替思考，理解問題、評估後果才是真正的能力。",
    learningPaths: ["自然：觀察一項工具如何把「輸入」變成「輸出」。", "社會：討論使用工具前要考慮哪些人的感受與安全。", "國語：用「問題、方法、後果」三步驟複述一個故事。"],
    officialSourceUrl: "https://dora-world.com/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "pokemon",
    title: "寶可夢",
    category: "親子動畫",
    era: "生態冒險觀測",
    palette: "yellow",
    shortDescription: "從收服、培育與搭檔冒險出發，觀察生物特性、環境適應，以及信任如何建立。",
    observation: "留意不同生物如何適合不同環境、訓練家怎麼觀察搭檔的狀態，以及合作需要哪些準備。",
    learning: "擴展知識：生物多樣性、生態系、圖鑑分類與信任合作。",
    worldviewTitle: "在多樣生態中，學習與夥伴同行",
    worldview: "這是一個由多樣生物與豐富環境組成的冒險世界。每種生物都有獨特特性與適合的棲地；成功的冒險不是征服，而是觀察、理解、照顧與信任，並在旅程中為自己的選擇負責。",
    learningPaths: ["自然：用圖鑑方式記錄一種生物的特徵、棲地與習性。", "社會：討論照顧動物與夥伴關係需要哪些責任。", "數學：用表格分類並比較不同生物的屬性數值。"],
    officialSourceUrl: "https://tw.portal-pokemon.com/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "anpanman",
    title: "麵包超人",
    category: "親子動畫",
    era: "分享助人觀測",
    palette: "coral",
    shortDescription: "從把自己的麵包臉分給飢餓的人出發，觀察分享、正義，以及輪流幫忙的社區力量。",
    observation: "留意角色幫助他人時付出了什麼、自己如何恢復，以及大家為什麼願意互相支援。",
    learning: "擴展知識：食物與營養、社區互助、同理心與珍惜資源。",
    worldviewTitle: "分享自己的一部分，世界會一起變強",
    worldview: "這是一個溫柔的社區世界：英雄把自己的食物分給飢餓的人，再由麵包師傅重新烤好。故事告訴我們幫助別人會付出代價，但在互相照顧的網絡裡，每個人都能重新獲得力量。",
    learningPaths: ["生活：認識食物如何提供體力與營養，練習珍惜資源。", "社會：觀察社區中哪些人默默提供協助。", "國語：練習具體說出自己被幫助時的感謝。"],
    officialSourceUrl: "https://www.ntv.co.jp/anpanman/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "chibi-maruko",
    title: "櫻桃小丸子",
    category: "親子動畫",
    era: "家庭日常觀測",
    palette: "moss",
    shortDescription: "從小丸子與家人同學的日常出發，觀察平凡生活中的心情、誤會與體諒。",
    observation: "留意角色說話背後的心情、誤會是怎麼發生的，以及家人之間最後怎麼和好。",
    learning: "擴展知識：情緒辨識、家庭角色、同理心與自我表達。",
    worldviewTitle: "在平凡日常裡，看見每個人的心情",
    worldview: "這是一個以家庭與校園為舞台的日常世界。沒有巨大敵人，真正的課題是理解他人的處境：有時一句莽撞的話來自關心，誤會拉鋸之後，體諒與道歉讓關係重新靠近。",
    learningPaths: ["國語：練習用「我覺得……因為……」表達心情。", "社會：觀察家庭中每個人的分工與角色。", "綜合：記錄一件今天發生、可以體諒別人的小事。"],
    officialSourceUrl: "https://chibimaruko.com/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "shin-chan",
    title: "蠟筆小新",
    category: "親子動畫",
    era: "生活幽默觀測",
    palette: "yellow",
    shortDescription: "從胡鬧又充滿笑料的家庭日常出發，觀察界線、規矩，以及搞笑底下的守護。",
    observation: "留意哪些行為好笑但不適合模仿、規矩背後保護的是什麼，以及家人在危機時怎麼彼此守護。",
    learning: "擴展知識：生活禮儀、界線感、家庭應變與幽默的分寸。",
    worldviewTitle: "笑聲背後的規矩：知道什麼時候不能鬧",
    worldview: "這是一個用誇張搞笑呈現的家庭世界。胡鬧帶來笑聲，但故事也不斷示範：有些時候、有些場合需要守住界線與規矩；真正的守護，是在危機發生時把家人放在第一順位。",
    learningPaths: ["生活：分辨哪些玩笑在真實校園不適合對別人做。", "社會：討論規矩背後保護的人與理由。", "綜合：練習走失、地震等狀況的自保與求助步驟。"],
    officialSourceUrl: "https://www.tv-asahi.co.jp/shinchan/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "super-sentai",
    title: "超級戰隊",
    category: "特攝英雄",
    era: "團隊英雄觀測",
    palette: "coral",
    shortDescription: "從多人組隊、輪流主攻與機器人合體出發，觀察團隊分工、互補與共同目標。",
    observation: "留意每位成員的專長與位置、意見不同時怎麼整合，以及「合體」需要哪些默契。",
    learning: "擴展知識：團隊分工、機械結構、角色責任與演練整備。",
    worldviewTitle: "五種顏色，一支隊伍：分工才能一起變強",
    worldview: "這個世界以團隊作戰為核心：每位戰士有不同顏色、專長與性格，單獨行動總會遇到瓶頸。當大家尊重彼此位置、整合不同意見，再巨大的挑戰也能像合體機器人一樣，由不同零件組成完整力量。",
    learningPaths: ["社會：分析小組報告中各種角色如何分工與輪替。", "自然：觀察機器（或人體）由哪些構造協力運作。", "數學：用表格記錄每位成員的專長、任務與結果。"],
    officialSourceUrl: "https://www.toei.co.jp/tv/sentai/",
    officialLabel: "官方作品資訊",
  },
  {
    key: "precure",
    title: "光之美少女",
    category: "親子動畫",
    era: "變身成長觀測",
    palette: "tidal",
    shortDescription: "從平凡少女變身守護者出發，觀察勇氣、同伴支持，以及「先照顧好自己」的成長。",
    observation: "留意主角們如何在社團、課業與守護任務間平衡，害怕時是什麼支持她們站出來。",
    learning: "擴展知識：情緒管理、時間安排、同伴支持與勇敢選擇。",
    worldviewTitle: "變身不是變成別人，而是拿出自己的勇氣",
    worldview: "這個世界把日常成長與守護使命放在一起：變身後的力量來自平常培養的特質與夥伴約定。她們會失敗、會吵架，但學習表達感受、互相支持，讓「想保護重要事物」的心情成為行動力。",
    learningPaths: ["綜合：練習安排課業、社團與休息的一週計畫。", "國語：寫下一句能在害怕時鼓勵自己的話。", "社會：討論朋友遇到困難時，「支持」與「代替」的界線。"],
    officialSourceUrl: "https://www.toei-anim.co.jp/tv/precure/",
    officialLabel: "官方作品資訊",
  },
];

export const OBSERVATORY_CATEGORIES: Array<ObservatoryCategory | "全部"> = ["全部", "親子動畫", "特攝英雄"];

export function getObservatoryEntry(key: string | undefined) {
  return OBSERVATORY_ENTRIES.find((entry) => entry.key === key) ?? null;
}
