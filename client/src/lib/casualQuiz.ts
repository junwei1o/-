export type CasualQuizCategory = "熱門問答摘錄" | "有趣問答" | "擴展知識問答" | "隱藏劇情問答";

export type CasualQuizQuestion = {
  id: string;
  series: "奧特曼" | "假面騎士" | "我是奶龍";
  category: CasualQuizCategory;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

type PromptSpec = {
  category: CasualQuizCategory;
  prompt: string;
  correct: string;
  explanation: string;
};

const SERIES = ["奧特曼", "假面騎士", "我是奶龍"] as const;
const DISTRACTORS: Record<CasualQuizCategory, string[]> = {
  "熱門問答摘錄": ["只比較角色外型", "只背招式名稱", "把不同作品的設定混為一談"],
  "有趣問答": ["只選最誇張的畫面", "忽略鏡頭與聲音線索", "把想像直接當成官方設定"],
  "擴展知識問答": ["只記結論不看證據", "把虛構規則當成現實定律", "只採信沒有出處的轉述"],
  "隱藏劇情問答": ["只看最後結果", "忽略前後情節差異", "把單一細節直接判成答案"],
};

const TOKUSATSU_PROMPT_SPECS: readonly PromptSpec[] = [
  { category: "熱門問答摘錄", prompt: "提到{series}時，最適合先用哪個角度掌握系列核心？", correct: "辨識守護、變身與身份衝突如何在故事中交會", explanation: "先抓住重複出現的敘事核心，才能避免只把系列理解為招式清單。" },
  { category: "熱門問答摘錄", prompt: "介紹{series}的第一集時，哪種摘要最清楚？", correct: "交代主角目標、眼前危機與尚未解開的問題", explanation: "好的第一集摘要保留故事推進力，也不把後續轉折提早說破。" },
  { category: "熱門問答摘錄", prompt: "觀看{series}的變身段落時，最值得注意的是什麼？", correct: "角色決心、鏡頭節奏與變身後行動目標的連結", explanation: "變身段落同時是視覺演出與敘事轉折，不只是特效展示。" },
  { category: "熱門問答摘錄", prompt: "比較兩部{series}作品時，哪個問題最能形成有效比較？", correct: "它們如何用不同角色與舞台處理相近的守護主題", explanation: "先建立共同觀察軸，再分析差異，能讓比較更具體。" },
  { category: "熱門問答摘錄", prompt: "想無劇透推薦{series}時，最適合說明什麼？", correct: "作品氣氛、核心衝突與觀賞時可留意的演出特色", explanation: "無劇透推薦應提供觀看方向，而不是揭露身份或結局。" },
  { category: "熱門問答摘錄", prompt: "{series}中反覆出現的標誌性道具，通常最可能承擔什麼功能？", correct: "串連角色身份、劇情規則與關鍵選擇", explanation: "道具可能是力量媒介，也可能是辨識角色與推進情節的線索。" },
  { category: "熱門問答摘錄", prompt: "討論{series}的戰鬥場面時，哪種說法更完整？", correct: "說明戰鬥如何改變角色目標、關係或局勢", explanation: "動作戲的價值不只在勝負，也在它如何推進故事。" },
  { category: "熱門問答摘錄", prompt: "{series}的主角常被觀眾記住，較主要的原因是什麼？", correct: "他在壓力下反覆做出的選擇逐漸形成角色輪廓", explanation: "角色的辨識度來自行動與選擇，而不只來自裝備外型。" },
  { category: "熱門問答摘錄", prompt: "面對{series}的經典畫面，最適合從哪三項開始描述？", correct: "構圖、角色動作與畫面前後的情節位置", explanation: "這三項能把單一畫面放回完整演出脈絡。" },
  { category: "熱門問答摘錄", prompt: "若{series}出現兩位立場不同的守護者，應先比較什麼？", correct: "各自掌握的資訊、目標與願意承擔的代價", explanation: "立場衝突往往來自資訊與代價不同，不宜只用善惡二分。" },
  { category: "熱門問答摘錄", prompt: "{series}的片頭若在中段更換畫面，最合理的觀察方向是什麼？", correct: "新畫面是否呼應新篇章、角色關係或威脅變化", explanation: "片頭更新常提示敘事階段轉移，值得和正片互相對照。" },
  { category: "熱門問答摘錄", prompt: "閱讀{series}的單集標題時，哪種做法更有助於觀賞？", correct: "把標題視為觀看後回頭驗證的主題提示", explanation: "單集標題可能指向情節、情緒或角色處境，不一定直接給出答案。" },
  { category: "熱門問答摘錄", prompt: "{series}中力量受限的設定，對故事最重要的作用是什麼？", correct: "讓角色必須衡量時機、選擇與風險", explanation: "限制會製造決策壓力，使力量不只是無條件解法。" },
  { category: "有趣問答", prompt: "如果要替{series}設計一張不含角色肖像的篇章海報，哪種元素最有效？", correct: "使用象徵物、主題色與能暗示衝突的構圖", explanation: "以抽象視覺線索傳達篇章氣氛，能保留觀賞時的發現空間。" },
  { category: "有趣問答", prompt: "把{series}的一段追逐戲改成分鏡猜題時，最適合遮住哪類資訊？", correct: "遮住關鍵動作後的結果，保留前面的因果線索", explanation: "保留足夠線索才能讓猜題建立在推理，而不是任意猜測。" },
  { category: "有趣問答", prompt: "若用四格整理{series}的衝突場景，最合理的排列是什麼？", correct: "局勢出現、角色決定、行動碰撞、結果留下新問題", explanation: "四格結構能清楚呈現衝突如何展開與延續。" },
  { category: "有趣問答", prompt: "為{series}設計『線索雷達』時，最值得分成哪三欄？", correct: "已知事實、角色推測與尚待驗證的疑問", explanation: "把事實與推測分開，能使觀察筆記更可靠。" },
  { category: "有趣問答", prompt: "若{series}的反派初次登場只有短暫鏡頭，最有趣的觀察玩法是什麼？", correct: "從站位、色彩、視線與環境聲蒐集初步線索", explanation: "短鏡頭仍可提供角色定位與威脅感的演出資訊。" },
  { category: "有趣問答", prompt: "替{series}某一集命名時，哪種名稱最像合格的篇章標題？", correct: "能指向衝突或角色選擇，但不直接公布結局", explanation: "好的篇章標題能引發期待，也能在觀賞後回看其雙重含義。" },
  { category: "有趣問答", prompt: "如果把{series}的戰鬥規則做成策略卡，最必要的卡面資訊是什麼？", correct: "行動條件、消耗、效果與可能限制", explanation: "清楚規則讓策略選擇可被比較，而非只追求畫面威力。" },
  { category: "有趣問答", prompt: "為{series}設計一題『找出不一致』時，最好的題材是什麼？", correct: "同一事件在角色台詞與畫面證據之間的差異", explanation: "差異能引導觀眾回看敘事證據，而不是只依靠角色說法。" },
  { category: "有趣問答", prompt: "若把{series}的能量特效改成文字描述，最應保留哪個重點？", correct: "色彩、移動方向、速度感與對場景造成的改變", explanation: "動態畫面的可讀性來自可觀察的視覺元素。" },
  { category: "有趣問答", prompt: "設計{series}主題的角色關係圖時，連線上最應標示什麼？", correct: "互信、對立、隱瞞或共同目標等關係性質", explanation: "關係圖的重點是說明角色間的互動類型，而非只列出名字。" },
  { category: "有趣問答", prompt: "若{series}某段音樂在不同場景重複出現，最適合玩的觀察遊戲是什麼？", correct: "比較它每次出現時對應的情緒、鏡頭與角色狀態", explanation: "重複旋律可能具有主題意義，需比對每次演出語境。" },
  { category: "有趣問答", prompt: "要把{series}的單集結尾做成懸念卡，哪種提問最適合？", correct: "新出現的線索將如何改變下一集的角色目標", explanation: "懸念題應承接已知情節，並引向尚未解開的問題。" },
  { category: "有趣問答", prompt: "如果為{series}設計『戰力以外』的角色評分表，應加入哪個面向？", correct: "判斷、協調、承擔與觀察等行動能力", explanation: "多面向觀察能避免把角色價值簡化成單一強弱排序。" },
  { category: "擴展知識問答", prompt: "研究{series}的造型語言時，哪組元素最值得一起分析？", correct: "輪廓、材質、色彩與裝備功能的對應", explanation: "造型可用視覺語言提示角色定位與作品主題。" },
  { category: "擴展知識問答", prompt: "分析{series}的一段場景調度時，首先要辨識什麼？", correct: "角色與鏡頭在空間中的位置如何引導視線", explanation: "場景調度會影響觀眾先看到什麼、感到誰處於優勢。" },
  { category: "擴展知識問答", prompt: "閱讀{series}的世界觀設定時，哪種整理方法最清楚？", correct: "分開記錄力量規則、組織關係、地點與時間線", explanation: "分欄整理能降低把不同層次設定混在一起的情況。" },
  { category: "擴展知識問答", prompt: "{series}使用特效時，最適合用哪個問題分析其作用？", correct: "特效是否強化了危機感、力量差異或角色狀態", explanation: "特效是演出語言，重點在它如何服務敘事，而非只看複雜程度。" },
  { category: "擴展知識問答", prompt: "查閱{series}資料時，如何分辨正式設定與觀眾解讀？", correct: "核對官方出處、版本資訊與內容發布時間", explanation: "明確標示來源與版本，能減少把推測誤當設定的風險。" },
  { category: "擴展知識問答", prompt: "比較{series}不同敵人的設計時，最適合採用什麼觀察軸？", correct: "外型符號、行動模式、與主角形成的衝突類型", explanation: "用固定觀察軸比較，能看見敵人如何承擔不同戲劇功能。" },
  { category: "擴展知識問答", prompt: "分析{series}的色彩配置時，哪個說法較精準？", correct: "色彩能區分陣營、情緒與場景狀態，需連同畫面脈絡判讀", explanation: "色彩不是固定答案，而是與光線、構圖和情節共同作用。" },
  { category: "擴展知識問答", prompt: "{series}中的怪獸或對手若改變外觀，最值得先檢查什麼？", correct: "改變是否對應新的能力、階段或劇情壓力", explanation: "外觀變化通常具有敘事功能，應與情節前後一起觀察。" },
  { category: "擴展知識問答", prompt: "研究{series}的單集結構時，哪個順序最常用於理解節奏？", correct: "引出問題、累積壓力、角色行動、留下餘波", explanation: "用節奏節點閱讀單集，能更清楚看出衝突如何被安排。" },
  { category: "擴展知識問答", prompt: "討論{series}的跨作品元素時，為何要先確認作品與版本？", correct: "避免把不同時期、媒介或平行設定錯誤拼接", explanation: "系列內容可能跨越多種版本，版本辨識是討論的基本前提。" },
  { category: "擴展知識問答", prompt: "{series}的無聲停頓常可如何解讀？", correct: "作為讓觀眾注意表情、空間或即將揭露資訊的演出安排", explanation: "沉默不是空白，它可能把注意力轉向非語言線索。" },
  { category: "擴展知識問答", prompt: "如果要為{series}建立可查詢的劇情資料表，第一步是什麼？", correct: "先定義事件、角色、集數、來源與關聯欄位", explanation: "先確立資料欄位，才能讓後續比較與更新保持一致。" },
  { category: "隱藏劇情問答", prompt: "{series}早期出現的物件疑似是伏筆時，第一步應做什麼？", correct: "記錄出現位置與情境，再回看後續是否有合理呼應", explanation: "伏筆需要前後證據支持，不能只因後來事件相似就直接定論。" },
  { category: "隱藏劇情問答", prompt: "{series}角色反覆避談某件事時，最穩妥的推理是什麼？", correct: "把沉默當作線索，同時保留多種可能原因", explanation: "沉默可能是隱瞞、保護或敘事留白，需要更多證據確認。" },
  { category: "隱藏劇情問答", prompt: "若{series}的台詞與畫面出現矛盾，該如何處理？", correct: "分別記錄台詞與畫面證據，等待後續資訊驗證", explanation: "矛盾可能是角色誤解、敘事視角或故意留下的謎團。" },
  { category: "隱藏劇情問答", prompt: "破解{series}的時間線時，最不容易混亂的方法是什麼？", correct: "依事件發生順序排列，並標記回憶、預示與現在段落", explanation: "區分故事時間與敘事順序，才能定位線索出現的真正位置。" },
  { category: "隱藏劇情問答", prompt: "{series}中某個配角的反應為何可能是關鍵線索？", correct: "停頓、視線與行動可能透露主角尚未得知的資訊", explanation: "線索不只存在於明說台詞，也可能藏在演員與鏡頭的細節。" },
  { category: "隱藏劇情問答", prompt: "觀看{series}的身份謎團時，哪種筆記最有用？", correct: "已知事實、相互矛盾的線索與尚待確認的假設", explanation: "把事實和假設分開，能避免推理時被印象帶走。" },
  { category: "隱藏劇情問答", prompt: "若{series}兩條支線在後段交會，應如何檢查呼應是否成立？", correct: "對照早期線索是否在新情節中得到合理回應", explanation: "好的交會不只製造驚訝，也會回收前面已建立的資訊。" },
  { category: "隱藏劇情問答", prompt: "面對{series}的開放式結尾，哪種解讀最負責任？", correct: "以文本證據提出多種可能，並標明哪些仍屬推測", explanation: "開放結局容許不同看法，但仍要區分畫面事實與個人推論。" },
  { category: "隱藏劇情問答", prompt: "{series}的預告片看似揭露很多內容時，應如何閱讀？", correct: "把預告當作宣傳剪輯，與正片完整情境分開判讀", explanation: "預告可重組語境以製造期待，不能直接當成劇情證明。" },
  { category: "隱藏劇情問答", prompt: "觀察{series}角色關係變化時，哪個細節最具有證據力？", correct: "稱呼、站位、互助方式與衝突後的行動改變", explanation: "角色關係常先在可觀察的互動細節中變化。" },
  { category: "隱藏劇情問答", prompt: "如果{series}某個謎題暫時沒有答案，最好的處理方式是什麼？", correct: "整理現有線索與缺口，等待後續情節提供新證據", explanation: "保留未知比過早下結論更能維持推理的準確性。" },
  { category: "隱藏劇情問答", prompt: "{series}中看似不合理的角色選擇，應先檢查哪三項？", correct: "他當時知道的資訊、承受的壓力與可選方案", explanation: "從角色當下視角分析，能避免用觀眾的全知資訊過早判斷。" },
];

const ANIMATION_PROMPT_SPECS: readonly PromptSpec[] = [
  { category: "熱門問答摘錄", prompt: "提到{series}時，最適合先描述哪種作品特徵？", correct: "角色表情、短篇節奏與輕鬆幽默的演出方式", explanation: "以可觀察的演出特色介紹作品，比補寫未確認設定更可靠。" },
  { category: "熱門問答摘錄", prompt: "觀看{series}的短篇段落時，哪項最能幫助掌握笑點？", correct: "比較角色期待、實際結果與表情變化", explanation: "短篇笑點常由期待落差與反應節奏共同形成。" },
  { category: "熱門問答摘錄", prompt: "{series}的角色外型為何容易被辨識？", correct: "輪廓、比例、表情與色彩形成穩定的視覺記號", explanation: "辨識度來自一組一致的視覺線索，而非單一裝飾。" },
  { category: "熱門問答摘錄", prompt: "想無劇透介紹{series}時，哪種說法最合適？", correct: "說明畫面氣氛、角色互動與短篇節奏特色", explanation: "無劇透介紹應保留故事發展，提供觀賞方向即可。" },
  { category: "熱門問答摘錄", prompt: "{series}中反覆出現的表情節奏，通常可用來做什麼？", correct: "建立角色性格並提示即將出現的情緒轉折", explanation: "重複表情能形成角色語言，也能帶動短篇節奏。" },
  { category: "熱門問答摘錄", prompt: "討論{series}的角色互動時，哪種描述更完整？", correct: "說明動作、停頓與彼此反應如何推動場景", explanation: "角色關係會透過互動節奏呈現，不只存在於台詞中。" },
  { category: "熱門問答摘錄", prompt: "{series}某個短篇結尾突然停住時，最可能的演出效果是什麼？", correct: "把注意力留在最後的反應或未說明的趣味落差", explanation: "短篇結尾常以停頓保留餘韻，而不是交代所有細節。" },
  { category: "熱門問答摘錄", prompt: "觀看{series}的背景細節時，最適合先找什麼？", correct: "能呼應角色動作或預告下一個反應的小元素", explanation: "背景不一定只是裝飾，也可能參與短篇的鋪陳。" },
  { category: "熱門問答摘錄", prompt: "{series}的畫面若突然改變色調，最值得觀察什麼？", correct: "色調是否放大角色當下情緒或場景轉折", explanation: "色彩轉換能在短時間內建立不同的情緒層次。" },
  { category: "熱門問答摘錄", prompt: "將{series}的一段畫面濃縮成一句觀察時，應包含什麼？", correct: "角色目標、出現的阻礙與最後的反應", explanation: "這三項能保留短篇段落最核心的戲劇節點。" },
  { category: "熱門問答摘錄", prompt: "{series}中重複出現的物件，最適合如何理解？", correct: "先記錄每次出現的功能，再判斷是否形成前後呼應", explanation: "重複物件可能是笑點、習慣或線索，需要比較語境。" },
  { category: "熱門問答摘錄", prompt: "若{series}幾乎沒有台詞，觀眾主要應從什麼理解場景？", correct: "表情、動作、鏡頭距離與聲音效果", explanation: "非語言元素可以完整承擔短篇敘事。" },
  { category: "熱門問答摘錄", prompt: "{series}的標題若很短，最好的閱讀方式是什麼？", correct: "先觀賞內容，再回看標題如何提示這段趣味", explanation: "短標題可能在觀看後才呈現雙關或反差。" },
  { category: "有趣問答", prompt: "如果替{series}設計一張『表情變化卡』，最必要的欄位是什麼？", correct: "前一刻情緒、觸發事件與下一個動作", explanation: "表情變化需要放在事件順序中，才看得出它的演出功能。" },
  { category: "有趣問答", prompt: "把{series}某段無台詞畫面做成排序題時，怎樣安排最好？", correct: "保留關鍵動作與反應，讓順序可由因果線索推回", explanation: "排序題應提供可觀察的因果，而不是要求憑記憶猜答案。" },
  { category: "有趣問答", prompt: "若要為{series}設計一個不劇透的封面符號，哪種做法最適合？", correct: "選用代表情緒或衝突的物件與色彩組合", explanation: "抽象符號能提示氣氛，同時保留劇情的發現空間。" },
  { category: "有趣問答", prompt: "{series}的角色突然靜止不動時，哪種觀察玩法最有趣？", correct: "猜測下一個動作，並用畫面中的視線與物件說明理由", explanation: "預測要回到畫面證據，才能讓推理更有意思。" },
  { category: "有趣問答", prompt: "為{series}整理『趣味節奏圖』時，最適合標記什麼？", correct: "鋪陳、意外、反應與結尾停頓的位置", explanation: "節奏圖能把短篇如何形成趣味清楚呈現。" },
  { category: "有趣問答", prompt: "如果把{series}一段畫面改成四格漫畫，最合理的格序是什麼？", correct: "角色想做什麼、出現什麼變化、如何反應、留下什麼結果", explanation: "四格結構能維持短篇的因果與節奏。" },
  { category: "有趣問答", prompt: "替{series}的背景音效設計觀察題時，應先問什麼？", correct: "這個聲音出現前後，畫面與角色狀態有何改變", explanation: "聲音效果常與動作或情緒轉折綁在一起。" },
  { category: "有趣問答", prompt: "若{series}某段畫面突然放大特寫，最可能要引導觀眾注意什麼？", correct: "角色的關鍵反應或一個即將發揮作用的細節", explanation: "特寫能控制觀眾視線，讓細節成為場景焦點。" },
  { category: "有趣問答", prompt: "為{series}製作『找出前後呼應』的題目時，哪種素材最合適？", correct: "前段出現的物件在後段以不同功能再次出現", explanation: "前後功能變化能讓呼應不只是重複畫面。" },
  { category: "有趣問答", prompt: "如果替{series}設計片尾一秒停格，哪種畫面最有趣？", correct: "能保留角色最後反應，並讓前面事件形成反差的畫面", explanation: "停格結尾能延長趣味，也讓觀眾回想剛才的因果。" },
  { category: "有趣問答", prompt: "將{series}的角色關係整理成圖時，連線上應寫什麼？", correct: "互相幫忙、誤會、追逐或共同目標等互動類型", explanation: "關係圖要呈現互動性質，才能協助理解場景變化。" },
  { category: "有趣問答", prompt: "若{series}出現重複動作，最好的判讀方式是什麼？", correct: "比較每次出現時的情境，判斷它是習慣、笑點或線索", explanation: "相同行動在不同情境中可能承擔不同演出作用。" },
  { category: "擴展知識問答", prompt: "分析{series}的角色設計時，哪組視覺元素最適合一起觀察？", correct: "輪廓、比例、表情與動作幅度", explanation: "這些元素共同形成角色的可讀性與情緒感。" },
  { category: "擴展知識問答", prompt: "{series}的誇張動作通常如何產生趣味？", correct: "透過動作幅度、停頓與前後反應放大期待落差", explanation: "趣味來自演出節奏與觀眾預期的差異。" },
  { category: "擴展知識問答", prompt: "研究{series}的色彩使用時，哪個問題最值得先問？", correct: "色彩是否用來區分情緒、焦點或段落節奏", explanation: "色彩在動畫中可引導視線，也可快速轉換氣氛。" },
  { category: "擴展知識問答", prompt: "解讀{series}的畫面構圖時，首先要辨識什麼？", correct: "角色、物件與留白如何安排在觀眾視線路徑上", explanation: "構圖決定觀眾先讀到什麼，也影響反應的力道。" },
  { category: "擴展知識問答", prompt: "查閱{series}的資料時，怎樣避免把觀眾創作當成正式設定？", correct: "確認來源、發布者與內容是否標示官方性質", explanation: "來源辨識能協助區分作品資訊與觀眾延伸創作。" },
  { category: "擴展知識問答", prompt: "{series}中簡化的背景為何仍可能有效？", correct: "它能讓視線集中在角色動作與情緒反應", explanation: "背景簡化是視覺取捨，可讓短篇敘事更聚焦。" },
  { category: "擴展知識問答", prompt: "分析{series}的聲音設計時，最適合比較哪些部分？", correct: "聲音出現時機、長短、音高與對應動作", explanation: "聲音與畫面配合，能建立節奏、質感與笑點。" },
  { category: "擴展知識問答", prompt: "{series}若使用快速剪接，應如何判斷它是否有效？", correct: "檢查每個鏡頭是否仍提供可理解的動作與反應線索", explanation: "快速不等於混亂；有效剪接仍會維持觀眾的理解路徑。" },
  { category: "擴展知識問答", prompt: "若要為{series}建立短篇資料表，最必要的欄位是什麼？", correct: "段落目標、轉折動作、核心表情與結尾效果", explanation: "這些欄位可幫助比較不同短篇的結構與演出。" },
  { category: "擴展知識問答", prompt: "研究{series}的角色動作重複時，何時可視為角色習慣？", correct: "當動作在不同場景穩定出現且與角色反應一致", explanation: "穩定重複並與性格連結，才可能形成可辨識的角色習慣。" },
  { category: "擴展知識問答", prompt: "{series}的短篇若缺少明確反派，衝突可能來自哪裡？", correct: "角色目標、誤會、環境變化或彼此期待的落差", explanation: "衝突不必來自對立角色，也可由情境本身產生。" },
  { category: "擴展知識問答", prompt: "比較{series}兩段相似情節時，最應留意什麼？", correct: "相同前提下角色反應、鏡頭節奏或結果是否改變", explanation: "比較差異能看出作品如何用重複製造變化。" },
  { category: "隱藏劇情問答", prompt: "{series}早段出現的小物件疑似有後續作用時，第一步是什麼？", correct: "記錄它出現的情境，再等待是否有後段呼應", explanation: "重複物件可能是裝飾，也可能是伏筆，需要前後證據。" },
  { category: "隱藏劇情問答", prompt: "若{series}角色突然改變表情，最穩妥的推理方式是什麼？", correct: "比較前一刻事件、畫面焦點與角色接收到的資訊", explanation: "表情變化要放回事件順序中，才能避免過度解讀。" },
  { category: "隱藏劇情問答", prompt: "猜測{series}下一個短篇轉折時，哪種說法最有根據？", correct: "提出假設並引用已出現的動作、物件或視線線索", explanation: "有根據的預測會清楚說明證據，並保留其他可能。" },
  { category: "隱藏劇情問答", prompt: "{series}某句話反覆出現時，如何避免直接判定它是伏筆？", correct: "比較每次出現的位置與功能，區分口頭禪和情節線索", explanation: "重複本身不足以證明伏筆，仍需檢查它是否改變了後續事件。" },
  { category: "隱藏劇情問答", prompt: "分析{series}角色關係的變化時，哪項細節最有用？", correct: "稱呼、距離、互動順序與衝突後的行動", explanation: "關係變化常先表現在細節互動，再由情節進一步說明。" },
  { category: "隱藏劇情問答", prompt: "若{series}結尾留下空白，哪種討論最合適？", correct: "把畫面事實與個人推測分開，提出多個可能方向", explanation: "開放結尾可有不同理解，但需清楚標記證據與假設。" },
  { category: "隱藏劇情問答", prompt: "{series}中配角的停頓可能提供什麼線索？", correct: "他可能注意到主角尚未發現的變化或矛盾", explanation: "非語言反應可提示觀眾留意畫面中的未解問題。" },
  { category: "隱藏劇情問答", prompt: "若{series}一段情節看似矛盾，應先檢查什麼？", correct: "時間順序、角色當下資訊與畫面是否省略關鍵過程", explanation: "先檢查敘事條件，比立刻判定內容錯誤更準確。" },
  { category: "隱藏劇情問答", prompt: "為{series}建立劇情推理筆記時，哪些欄位最實用？", correct: "已知線索、待解問題、可能假設與支持證據", explanation: "分欄記錄可以避免把猜測與畫面事實混在一起。" },
  { category: "隱藏劇情問答", prompt: "{series}中的角色行動看似不合理時，應先問什麼？", correct: "他當時知道什麼、想完成什麼，以及有哪些限制", explanation: "從角色當下視角理解，能讓推理更貼近故事內部規則。" },
  { category: "隱藏劇情問答", prompt: "若{series}的預告與正片氛圍不同，最好的閱讀方式是什麼？", correct: "將預告視為節奏重組的宣傳素材，與正片分開比較", explanation: "預告可能為製造期待而改變資訊順序，不等於完整劇情證據。" },
  { category: "隱藏劇情問答", prompt: "發現{series}前後兩段畫面相似時，如何說明可能的呼應？", correct: "指出相似元素、不同情境與它可能改變的意義", explanation: "完整的呼應分析會同時說明相同處與變化處。" },
  { category: "隱藏劇情問答", prompt: "若{series}的場景在結尾回到最初畫面，最適合先檢查什麼？", correct: "角色目標、畫面細節或情緒是否已因中間事件而改變", explanation: "回到相似場景不代表完全重複；比較改變之處才能判讀它的收束作用。" },
];

function rotate<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
}

function specsForSeries(series: (typeof SERIES)[number]) {
  return series === "我是奶龍" ? ANIMATION_PROMPT_SPECS : TOKUSATSU_PROMPT_SPECS;
}

function buildQuestions(): CasualQuizQuestion[] {
  return SERIES.flatMap((series, seriesIndex) => specsForSeries(series).map((spec, promptIndex) => {
    const answer = (seriesIndex * 3 + promptIndex) % 4;
    const options = rotate([spec.correct, ...DISTRACTORS[spec.category]], answer);
    return {
      id: `casual-${seriesIndex + 1}-${String(promptIndex + 1).padStart(2, "0")}`,
      series,
      category: spec.category,
      prompt: spec.prompt.replaceAll("{series}", series),
      options,
      answer,
      explanation: `${spec.explanation} 本題為原創問答整理，聚焦${series}的作品觀測與敘事理解，不直接重現原作台詞。`,
    };
  }));
}

export const CASUAL_QUIZ_QUESTIONS = buildQuestions();
export const CASUAL_QUIZ_CATEGORIES: Array<CasualQuizCategory | "全部"> = ["全部", "熱門問答摘錄", "有趣問答", "擴展知識問答", "隱藏劇情問答"];

export function getCasualQuizQuestion(id: string) {
  return CASUAL_QUIZ_QUESTIONS.find((question) => question.id === id) ?? null;
}
