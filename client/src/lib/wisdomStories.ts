export type WisdomCategory = "成語新解" | "寓言故事" | "歷史典故" | "名人名言" | "真實案例";

export type WisdomStory = {
  key: string;
  category: WisdomCategory;
  title: string;
  hook: string;
  story: string;
  newMeaning: string;
  lifeLink: string;
  question: string;
  source?: { label: string; url: string; date?: string };
};

export const WISDOM_CATEGORIES: Array<WisdomCategory | "全部"> = ["全部", "成語新解", "寓言故事", "歷史典故", "名人名言", "真實案例"];

export const WISDOM_STORIES: WisdomStory[] = [
  { key: "draw-snake-add-feet", category: "成語新解", title: "畫蛇添足", hook: "做得更多，不一定做得更好。", story: "有人比賽畫蛇，先完成的人為了炫耀又替蛇加上腳，結果反而失去勝利。", newMeaning: "完成任務後，先檢查是否符合目標；不必要的添加可能讓成果變差。", lifeLink: "報告已經清楚時，不必塞入無關資料；程式能運作時，也要先測試再增加功能。", question: "你最近有沒有一件事可以刪掉多餘步驟，讓成果更清楚？" },
  { key: "look-at-fire", category: "成語新解", title: "隔岸觀火", hook: "看見問題時，旁觀也是一種選擇。", story: "站在河岸看著對岸失火，若只評論而不提醒或求助，可能讓損失擴大。", newMeaning: "面對公共問題，要分辨安全旁觀、善意提醒與逞強介入的界線。", lifeLink: "看到同學被排擠時，可以先找可信任的大人或老師，而不是獨自衝突。", question: "遇到自己無法處理的危險，你會向誰求助？" },
  { key: "move-mountains", category: "成語新解", title: "愚公移山", hook: "長期目標需要願景，也需要每天可做的小事。", story: "愚公相信子孫持續努力，山就能一點一點被移開。", newMeaning: "毅力不是盲目硬撐，而是把大目標拆成可持續、可檢查的步驟。", lifeLink: "準備考試可以每天完成一小段，並依測驗結果調整方法。", question: "把一個大目標拆開後，你今天能完成哪一小步？" },
  { key: "fox-grapes", category: "寓言故事", title: "狐狸與葡萄", hook: "得不到時，先誠實面對失望。", story: "狐狸多次跳躍仍摘不到葡萄，最後說葡萄一定是酸的。", newMeaning: "自我安慰能暫時保護情緒，但更好的做法是承認失望，再找新的策略。", lifeLink: "比賽落選時，可以先整理心情，再請教方法或尋找適合自己的舞台。", question: "當你失敗時，什麼樣的自我對話能幫助你重新開始？" },
  { key: "ant-grasshopper", category: "寓言故事", title: "螞蟻與蚱蜢", hook: "準備很重要，但休息與互助也同樣重要。", story: "螞蟻平時儲備食物，蚱蜢只顧玩樂；故事提醒人們要為未來準備。", newMeaning: "規劃不是把生活塞滿，而是在責任、休息與分享之間找到平衡。", lifeLink: "安排讀書計畫時，也要留出睡眠、運動與與家人相處的時間。", question: "你的計畫裡，哪一格是準備，哪一格是休息？" },
  { key: "tortoise-hare", category: "寓言故事", title: "龜兔賽跑", hook: "穩定前進，常常比短暫衝刺更可靠。", story: "兔子因為自滿中途休息，烏龜則保持步伐完成比賽。", newMeaning: "速度、策略與持續力要一起評估；慢不等於沒有方法。", lifeLink: "學習時可用番茄鐘或小目標維持節奏，不必和別人的速度比較。", question: "哪一種節奏最適合你長期學習？" },
  { key: "three-visits", category: "歷史典故", title: "三顧茅廬", hook: "尊重專業，有時需要耐心與誠意。", story: "劉備多次拜訪諸葛亮，展現求才與請益的誠意，後來形成重要合作。", newMeaning: "請教他人不是把責任丟出去，而是先說清楚問題、尊重對方並願意一起承擔。", lifeLink: "向老師提問前先整理卡住的步驟，對方更容易提供有效協助。", question: "你可以如何讓一次請教更有準備？" },
  { key: "back-chu", category: "歷史典故", title: "破釜沉舟", hook: "下定決心不等於拒絕安全計畫。", story: "古代軍隊以破釜沉舟表達決心，鼓舞士氣面對困境。", newMeaning: "現代使用時，應把它理解為聚焦目標與承擔責任，而不是冒險或切斷所有退路。", lifeLink: "參加重要比賽前全力準備，同時保留健康、求助與風險評估。", question: "努力追夢時，哪些安全界線一定要保留？" },
  { key: "mirror-history", category: "歷史典故", title: "以人為鏡", hook: "從別人的經驗看見自己的盲點。", story: "古人以人作為鏡子，意思是透過他人的行為與回饋反省自己。", newMeaning: "回饋不是否定；能分辨事實、感受與建議，才能把回饋變成成長工具。", lifeLink: "小組合作後互相回顧，先說具體行為，再提出下一次可改進之處。", question: "你希望別人用什麼方式給你建設性回饋？" },
  { key: "curiosity-evidence", category: "名人名言", title: "好奇心要和證據同行", hook: "提出好問題，是學習的起點。", story: "許多科學與創作工作都從「為什麼」開始，但好奇的想法仍要透過觀察、紀錄與檢驗。", newMeaning: "不要只追求聽起來厲害的答案；能說明證據與限制，才是可靠的思考。", lifeLink: "看到網路訊息時，先查作者、日期、原始來源，再決定是否轉傳。", question: "下次遇到令人驚訝的消息，你會先查哪三件事？" },
  { key: "small-actions", category: "名人名言", title: "偉大的改變從小行動開始", hook: "一句鼓勵若沒有行動，就還只是願望。", story: "人們常用名言提醒自己勇敢、堅持與關懷，但真正的價值在於能否落實到日常。", newMeaning: "把抽象價值轉成今天可觀察的行為，才知道自己是否真的在實踐。", lifeLink: "想成為友善的人，可以從主動打招呼、傾聽與完成承諾開始。", question: "你想把哪一句鼓勵變成今天的一個行動？" },
  { key: "south-gate-school", category: "真實案例", title: "南門國小：把受傷的樹變成一堂課", hook: "照顧環境，也是在練習觀察與責任。", story: "報導描述桃園南門國小師生發現校園椰子樹受傷後，邀請樹木醫學專家會勘、修補與養護，學生也透過觀察、資料蒐集與祝福卡片參與其中。", newMeaning: "面對問題可以先觀察、找專業、分工，再用持續照護讓改變發生。", lifeLink: "班級設備損壞時，先記錄狀況、通報適當人員，不自行冒險維修。", question: "如果校園有一個需要照顧的角落，你會如何開始調查？", source: { label: "桃園電子報：將生活結合品德教育", url: "https://tyenews.com/2026/01/1217989/", date: "2026-01-19" } },
  { key: "nanxing-kindness", category: "真實案例", title: "南興國小：把善良練成日常", hook: "品格不是口號，而是每天做得到的選擇。", story: "報導提到學生透過戲劇理解尊重差異、拒絕霸凌與勇於原諒，也把淨山、食農教育與惜福行動放進校園生活。", newMeaning: "價值教育要連結情境、對話與實作，學生才有機會把理解變成行動。", lifeLink: "遇到同學意見不同時，先描述自己的感受，再聽對方理由並尋找共同規則。", question: "你能設計一個讓班級更友善的微小行動嗎？", source: { label: "人間通訊社：三好校園品格教育", url: "https://www.lnanews.com/news/%E3%80%94%E4%B8%89%E5%A5%BD%E6%A0%A1%E5%9C%92%E3%80%95%E5%93%81%E6%A0%BC%E6%95%99%E8%82%B2%E7%AF%89%E6%9C%AA%E4%BE%86%E3%80%80%E5%96%84%E8%89%AF%E6%88%90%E6%97%A5%E5%B8%B8%E7%BF%92%E6%85%A3.html", date: "2025-09-09" } },
  { key: "service-learning", category: "真實案例", title: "服務學習：把課堂帶進社區", hook: "學到的知識，在真實世界中接受考驗。", story: "全球服務學習資料介紹台灣學生參與鄉村服務學習，透過反思與多元評量，把社區參與連結到學習成果與個人成長。", newMeaning: "服務不是單方面幫助，而是先理解需求、一起設計、行動後反思。", lifeLink: "規劃公益活動前，先訪談社區或校園使用者，不要只憑想像決定方案。", question: "一個好的服務方案，應該先問誰的需要？", source: { label: "NYLC：World Service-Learning", url: "https://nylc.org/event/world-service-learning/" } },
  { key: "digital-evidence", category: "真實案例", title: "校園科技討論：便利也要看見風險", hook: "新工具帶來可能，也帶來需要討論的責任。", story: "Reuters 報導美國家長對校園裝置、學生資料隱私與網路風險的公共討論；不同立場對便利、保護與責任有不同看法。", newMeaning: "面對科技議題，要同時整理支持與疑慮，查證資料並尊重公共討論，不把複雜問題簡化成口號。", lifeLink: "使用學習工具時，了解會收集哪些資料、如何保護帳號，遇到不舒服的內容要向大人求助。", question: "你認為校園使用科技時，最需要先訂下哪一條規則？", source: { label: "Reuters：Parents may hate screens in schools", url: "https://www.reuters.com/legal/government/small-texas-law-firm-taking-fight-against-classroom-tech-court-2026-05-22/", date: "2026-05-22" } },
];

export function getWisdomStory(key: string) {
  return WISDOM_STORIES.find((story) => story.key === key);
}
