export type WorldPrincipleKey =
  | "relativity"
  | "first-principles"
  | "quantum"
  | "thermodynamics"
  | "electromagnetism"
  | "fundamental-forces"
  | "impossible-trinity";

export type WorldPrinciple = {
  key: WorldPrincipleKey;
  name: string;
  english: string;
  eyebrow: string;
  color: string;
  short: string;
  explanation: string;
  lifeConnection: string;
  keyIdeas: string[];
  prompt: string;
};

export const WORLD_PRINCIPLES: WorldPrinciple[] = [
  {
    key: "relativity",
    name: "相對論",
    english: "RELATIVITY",
    eyebrow: "時空觀測站",
    color: "amber",
    short: "速度與重力會改變我們測量時間與距離的方式。",
    explanation: "愛因斯坦的相對論提醒我們，時間與空間不是完全固定的背景，而會和觀察者的運動狀態、所處的重力環境一起被測量。狹義相對論描述高速運動，廣義相對論則把重力理解為時空彎曲。",
    lifeConnection: "手機定位需要校正衛星與地面時鐘的差異；若不考慮相對論效應，定位會逐漸產生明顯誤差。",
    keyIdeas: ["光速是重要的自然極限", "運動狀態會影響時間與距離的測量", "重力可理解為時空幾何的改變"],
    prompt: "如果兩個人搭乘不同速度的交通工具，『同一分鐘』一定代表完全相同的經歷嗎？",
  },
  {
    key: "first-principles",
    name: "第一性原理",
    english: "FIRST PRINCIPLES",
    eyebrow: "拆解思考站",
    color: "coral",
    short: "把複雜問題拆回最基本的事實，再重新組合解法。",
    explanation: "第一性原理是一種思考方法，不是背誦更多名詞。面對問題時，先分辨哪些是可驗證的基本事實、哪些只是習慣或假設，再從基本條件推導新的方案。",
    lifeConnection: "規劃讀書時間時，可以先列出可用時間、目標與限制，再設計方法，而不是直接複製別人的行程表。",
    keyIdeas: ["區分事實、假設與習慣", "把問題拆成可驗證的小部分", "從基本條件重新設計方案"],
    prompt: "當你說『這件事只能這樣做』時，可以先找出哪一個假設需要被檢查？",
  },
  {
    key: "quantum",
    name: "量子力學",
    english: "QUANTUM MECHANICS",
    eyebrow: "微觀可能性站",
    color: "violet",
    short: "在微小尺度，物質呈現離散能量與機率性的行為。",
    explanation: "量子力學用來描述原子、電子與光等微觀系統。它告訴我們，某些物理量只能以特定能階出現，對微觀事件的預測常以機率分布表達，而不是像日常物體一樣直接畫出唯一軌跡。",
    lifeConnection: "LED、雷射、晶片與醫學影像都建立在對微觀粒子行為的理解上。",
    keyIdeas: ["能量可能以離散能階出現", "微觀結果常用機率描述", "觀測方式會影響我們能取得的資訊"],
    prompt: "面對機率結果時，『不知道』和『沒有規律』是同一件事嗎？",
  },
  {
    key: "thermodynamics",
    name: "熱力學",
    english: "THERMODYNAMICS",
    eyebrow: "能量循環站",
    color: "orange",
    short: "能量會轉換與傳遞，但效率和方向受到自然規律限制。",
    explanation: "熱力學研究能量、熱與功之間的關係。能量守恆表示能量不會憑空消失；熵增則提醒我們，真實過程會有能量分散與不可逆的方向，因此不可能製造百分之百效率的機器。",
    lifeConnection: "冰箱把熱從內部搬到外部，必須消耗電力；保溫杯則是減慢熱能傳遞，而不是創造寒冷或熱量。",
    keyIdeas: ["能量守恆", "熱量會由高溫處傳向低溫處", "真實轉換存在效率與耗散限制"],
    prompt: "為什麼打開冰箱門不能讓整個房間變涼？請從能量流向思考。",
  },
  {
    key: "electromagnetism",
    name: "電磁學",
    english: "ELECTROMAGNETISM",
    eyebrow: "場與訊號站",
    color: "cyan",
    short: "電與磁是同一套電磁現象的不同表現，支撐現代通訊與用電生活。",
    explanation: "電荷會產生電場，移動的電荷形成電流並可產生磁場；變動的電場與磁場又能彼此誘發，形成電磁波。這套理論連結了發電、馬達、光與無線通訊。",
    lifeConnection: "電磁爐、喇叭、手機訊號與太陽光，雖然用途不同，都能用電磁現象找到共同線索。",
    keyIdeas: ["電荷與電流是重要來源", "電場與磁場可以互相影響", "光是一種電磁波"],
    prompt: "為什麼發電機和馬達看起來功能相反，卻可以用同一套電磁概念理解？",
  },
  {
    key: "fundamental-forces",
    name: "宇宙四大力",
    english: "FOUR FUNDAMENTAL INTERACTIONS",
    eyebrow: "宇宙作用站",
    color: "teal",
    short: "重力、電磁力、強作用力與弱作用力，描述自然界最基本的互動。",
    explanation: "現代物理常以四種基本作用來整理自然界的互動：重力影響天體與質量；電磁力主導帶電粒子、原子與光；強作用力維繫原子核；弱作用力參與某些放射性衰變與粒子轉換。",
    lifeConnection: "站在地面、看見光、使用電池與觀察太陽，都能找到不同基本作用留下的線索。",
    keyIdeas: ["重力", "電磁力", "強作用力與弱作用力"],
    prompt: "同一個現象可能同時牽涉多種作用力嗎？請用生活中的一個例子說明。",
  },
  {
    key: "impossible-trinity",
    name: "不可能三角",
    english: "IMPOSSIBLE TRIANGLE",
    eyebrow: "取捨決策站",
    color: "blue",
    short: "當三個目標彼此牽制時，通常無法同時把三者都做到最好。",
    explanation: "不可能三角是一種理解取捨的模型。它常被用來說明速度、品質、成本等目標的互相牽制；不同領域也有不同版本。重點不是永遠只能選兩個，而是要先看清資源與限制，再說明自己願意交換什麼。",
    lifeConnection: "做一份報告時，若同時追求最短時間、最完整內容與最低成本，就需要協調範圍、分工或品質標準。",
    keyIdeas: ["目標之間可能互相牽制", "限制條件要先被說清楚", "好的決策會說明取捨理由"],
    prompt: "小組作業快到截止日，你會如何在速度、完整度與分工負擔之間做選擇？",
  },
];

export const getWorldPrinciple = (key: string) => WORLD_PRINCIPLES.find((item) => item.key === key);

export const WORMHOLE_GUIDE_DOMAINS = ["gravity", "light", "energy", "spacetime", "observation"] as const;

export type WormholeGuideDomain = (typeof WORMHOLE_GUIDE_DOMAINS)[number];

export type WormholeGuideQuestion = {
  id: string;
  domain: WormholeGuideDomain;
  domainLabel: string;
  prompt: string;
  hint: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
  principleKeys: readonly WorldPrincipleKey[];
};

export const WORMHOLE_GUIDE_QUESTIONS: readonly WormholeGuideQuestion[] = [
  {
    id: "wormhole-gravity-orbit",
    domain: "gravity",
    domainLabel: "重力航道",
    prompt: "躍遷探測艇在行星附近繞行。最能解釋它為何沒有直直飛走的線索是什麼？",
    hint: "想想是什麼持續改變探測艇移動的方向。",
    options: ["行星的重力持續拉向中心", "太空中完全沒有任何作用力", "探測艇自行製造空氣阻力", "星光把探測艇推成圓形"],
    correctIndex: 0,
    explanation: "重力會使物體互相吸引。當探測艇有向前速度，同時又持續受到行星重力影響，便可能形成繞行軌道。",
    principleKeys: ["fundamental-forces", "relativity"],
  },
  {
    id: "wormhole-gravity-evidence",
    domain: "gravity",
    domainLabel: "重力航道",
    prompt: "若想比較兩個區域的重力是否不同，哪一種作法最像科學觀測？",
    hint: "選擇能留下可比較資料的方法。",
    options: ["用儀器量測物體運動或軌道的改變", "只用肉眼猜哪裡比較重", "先決定答案再忽略其他資料", "把重力當成不需要證據的魔法"],
    correctIndex: 0,
    explanation: "重力不必靠想像判斷；科學家可透過物體運動、軌道或儀器資料比較重力場的差異。",
    principleKeys: ["fundamental-forces", "first-principles"],
  },
  {
    id: "wormhole-gravity-lens",
    domain: "gravity",
    domainLabel: "重力航道",
    prompt: "蟲洞外圈看似把遠方星光拉彎。這個情境最適合提醒我們什麼？",
    hint: "注意『看見的位置』和『光走過的路徑』不一定完全相同。",
    options: ["重力可能讓光線路徑產生偏折", "星光只能直線穿過任何地方", "所有亮光都來自海水反射", "光不需要任何路徑就能抵達"],
    correctIndex: 0,
    explanation: "在大質量物體附近，光線的路徑可受重力影響而偏折；因此觀測到的位置須連同路徑一起理解。",
    principleKeys: ["relativity"],
  },
  {
    id: "wormhole-gravity-fall",
    domain: "gravity",
    domainLabel: "重力航道",
    prompt: "兩個物體從相同高度落下，想比較它們的落下時間時，最重要的做法是什麼？",
    hint: "先控制會影響結果的條件。",
    options: ["固定高度與釋放方式，再重複量測", "只挑最快的一次", "先猜答案再修改時間", "用物體顏色判斷速度"],
    correctIndex: 0,
    explanation: "固定條件並重複量測，才能比較重力造成的運動差異，減少一次測量的偶然誤差。",
    principleKeys: ["fundamental-forces", "first-principles"],
  },
  {
    id: "wormhole-gravity-mass",
    domain: "gravity",
    domainLabel: "重力航道",
    prompt: "要討論某個天體對周圍物體的重力影響，哪組資料最有幫助？",
    hint: "想想影響重力的天體特徵與距離。",
    options: ["天體的質量與物體之間的距離", "天體名稱的長度", "畫面的背景顏色", "觀察者最喜歡的答案"],
    correctIndex: 0,
    explanation: "天體質量與距離是討論重力影響的重要線索，還需要配合模型與觀測資料檢驗。",
    principleKeys: ["fundamental-forces", "relativity"],
  },
  {
    id: "wormhole-light-signal",
    domain: "light",
    domainLabel: "光訊號層",
    prompt: "探測艇收到一段遙遠星體發出的光。這段光最重要的科學角色是什麼？",
    hint: "它可以攜帶來自遠方的資訊。",
    options: ["作為可分析的觀測訊號", "保證告訴我們所有答案", "把探測艇變成更重的物體", "取代所有其他量測"],
    correctIndex: 0,
    explanation: "光是重要的觀測訊號。分析亮度、顏色或光譜能幫助我們推論遠方物體的性質，但仍需結合其他證據。",
    principleKeys: ["electromagnetism", "first-principles"],
  },
  {
    id: "wormhole-light-spectrum",
    domain: "light",
    domainLabel: "光訊號層",
    prompt: "要把一束星光拆成不同顏色，找出可能的元素線索，最合適的工具概念是什麼？",
    hint: "想想彩虹如何把白光分開。",
    options: ["光譜分析", "只量測溫度計", "把訊號全部靜音", "隨機刪掉部分顏色"],
    correctIndex: 0,
    explanation: "光譜分析會把光按波長分開。不同物質能留下特徵，讓科學家從遠方光線找尋成分與狀態的線索。",
    principleKeys: ["electromagnetism", "quantum"],
  },
  {
    id: "wormhole-light-evidence",
    domain: "light",
    domainLabel: "光訊號層",
    prompt: "同一個星體在可見光與無線電觀測中呈現不同線索，最好的下一步是什麼？",
    hint: "不同波段可能看見不同現象。",
    options: ["比較不同訊號，整合證據再解釋", "只保留自己最喜歡的結果", "認定其中一個觀測必定無效", "不記錄量測條件"],
    correctIndex: 0,
    explanation: "不同波段能帶來不同資訊。把多種觀測條件與資料放在一起比較，比單靠一種訊號更能建立可靠解釋。",
    principleKeys: ["electromagnetism", "first-principles"],
  },
  {
    id: "wormhole-light-reflection",
    domain: "light",
    domainLabel: "光訊號層",
    prompt: "想知道水面反光方向如何改變，哪個觀察設計最清楚？",
    hint: "一次只改變一個重要條件。",
    options: ["固定光源與水面，只改變入射角並記錄反射方向", "同時改變光源、水面和距離", "只記住最亮的一次", "用故事情節代替量測"],
    correctIndex: 0,
    explanation: "控制多數條件、只改變入射角並記錄結果，能幫助觀察光反射方向的規律。",
    principleKeys: ["electromagnetism", "first-principles"],
  },
  {
    id: "wormhole-light-absorption",
    domain: "light",
    domainLabel: "光訊號層",
    prompt: "不同材料受到同一束光照射後亮度不同，哪個問題最適合接著研究？",
    hint: "把材料特徵和可量測結果連起來。",
    options: ["材料的顏色與表面是否影響吸收或反射", "哪個材料的名字最神祕", "直接宣布材料有魔法", "不必記錄光源條件"],
    correctIndex: 0,
    explanation: "材料的顏色、表面與組成可能影響光的吸收和反射，應在控制光源條件後進一步比較。",
    principleKeys: ["electromagnetism", "quantum"],
  },
  {
    id: "wormhole-energy-source",
    domain: "energy",
    domainLabel: "能量艙",
    prompt: "躍遷燈塔愈來愈亮。要檢查它是否合理運作，最先應追問什麼？",
    hint: "能量不會無緣無故出現。",
    options: ["它的能量從哪裡來、最後到哪裡去", "亮就代表不需要來源", "只要把名稱改成火種即可", "把耗能資料全部刪除"],
    correctIndex: 0,
    explanation: "分析能量系統時，要追蹤來源、轉換與去向。能量可轉移或轉換，但不能憑空產生。",
    principleKeys: ["thermodynamics", "first-principles"],
  },
  {
    id: "wormhole-energy-efficiency",
    domain: "energy",
    domainLabel: "能量艙",
    prompt: "為什麼真實的能量裝置通常無法把輸入能量百分之百轉成想要的效果？",
    hint: "觀察是否有熱、聲音或其他形式的能量分散。",
    options: ["部分能量會以其他形式分散或傳遞", "能量守恆只在教科書存在", "裝置愈新就沒有任何限制", "輸入能量可以不必計算"],
    correctIndex: 0,
    explanation: "真實過程常伴隨能量以熱、聲音等形式分散，因此效率受到限制；這不代表能量消失，而是轉成不同形式。",
    principleKeys: ["thermodynamics"],
  },
  {
    id: "wormhole-energy-claim",
    domain: "energy",
    domainLabel: "能量艙",
    prompt: "有人宣稱新裝置「不需要任何輸入，卻能永遠輸出能量」。面對這個說法，最合適的科學態度是？",
    hint: "先要求可檢查的量測與能量帳。",
    options: ["檢查輸入、輸出與量測方法是否完整", "因為聽起來厲害就直接相信", "不必測試，只看宣傳圖", "把疑問當作不支持科學"],
    correctIndex: 0,
    explanation: "科學主張需要可檢查的證據。先列出能量輸入、輸出、量測誤差與條件，才知道說法能否成立。",
    principleKeys: ["thermodynamics", "first-principles"],
  },
  {
    id: "wormhole-energy-transfer",
    domain: "energy",
    domainLabel: "能量艙",
    prompt: "太陽能板把光轉成電，這個例子說明了什麼？",
    hint: "留意能量形式的改變，而不是能量憑空出現。",
    options: ["能量可以從一種形式轉換成另一種形式", "電能完全不需要來源", "光照後所有能量都消失", "只有機械運動才算能量"],
    correctIndex: 0,
    explanation: "太陽能板把光能轉換成電能，過程仍需追蹤輸入、輸出與散失的其他能量形式。",
    principleKeys: ["thermodynamics", "electromagnetism"],
  },
  {
    id: "wormhole-energy-insulation",
    domain: "energy",
    domainLabel: "能量艙",
    prompt: "想比較兩種材料的隔熱效果，哪個測試較公平？",
    hint: "讓材料面積、初始溫度與加熱時間相同。",
    options: ["固定材料大小、初始溫度與加熱時間，再比較溫度變化", "選擇每種材料不同的加熱時間", "只看材料外觀", "只記錄最符合期待的結果"],
    correctIndex: 0,
    explanation: "控制材料大小、初始溫度與時間，才能把溫度差異較合理地歸因於隔熱效果。",
    principleKeys: ["thermodynamics", "first-principles"],
  },
  {
    id: "wormhole-spacetime-clock",
    domain: "spacetime",
    domainLabel: "時空定位儀",
    prompt: "蟲洞定位系統比對多個高空時鐘時，為何不能假設每個時鐘都永遠完全相同？",
    hint: "時鐘的運動狀態與重力環境可能不同。",
    options: ["測量時間會受運動與重力條件影響", "所有時鐘都與位置無關", "只有海底時鐘會走動", "時間只是畫面特效"],
    correctIndex: 0,
    explanation: "相對論告訴我們，時間與空間的測量和運動、重力環境有關。實際定位系統需要校正不同條件下的時鐘差異。",
    principleKeys: ["relativity"],
  },
  {
    id: "wormhole-spacetime-model",
    domain: "spacetime",
    domainLabel: "時空定位儀",
    prompt: "在蟲洞故事中看見彎曲的網格圖，最負責任的理解方式是什麼？",
    hint: "科學圖像通常是幫助思考的模型，不是完整實體照片。",
    options: ["把它當作說明關係的模型，再問它的限制", "相信它就是宇宙的唯一真實外觀", "因為像科幻就不必查證", "只記住顏色，不問概念"],
    correctIndex: 0,
    explanation: "科學模型能凸顯特定關係，也有使用範圍。看模型時要問：它解釋了什麼、略去了什麼、還需要哪些證據。",
    principleKeys: ["relativity", "first-principles"],
  },
  {
    id: "wormhole-spacetime-question",
    domain: "spacetime",
    domainLabel: "時空定位儀",
    prompt: "若觀測到一個訊號比預期晚抵達，哪個問題最有助於開始調查？",
    hint: "將直覺猜測改成能量測或比較的問題。",
    options: ["訊號走過的路徑、距離與量測時間是什麼？", "它一定是超自然現象", "不用記錄任何資料", "只要重複宣稱預期錯了"],
    correctIndex: 0,
    explanation: "好的調查先把問題變成可量測線索，例如路徑、距離、發射與接收時間，再比較不同解釋是否符合資料。",
    principleKeys: ["relativity", "first-principles"],
  },
  {
    id: "wormhole-spacetime-coordinate",
    domain: "spacetime",
    domainLabel: "時空定位儀",
    prompt: "要描述探測艇在某一時刻的位置，為什麼需要同時記錄時間與座標？",
    hint: "位置會隨著運動改變。",
    options: ["同一物體在不同時間可能位於不同位置", "時間永遠不會影響任何描述", "只記錄名稱就能知道位置", "座標只適合畫圖不能量測"],
    correctIndex: 0,
    explanation: "運動中的物體位置會改變，因此完整描述通常需要時間與座標一起記錄。",
    principleKeys: ["relativity", "first-principles"],
  },
  {
    id: "wormhole-spacetime-reference",
    domain: "spacetime",
    domainLabel: "時空定位儀",
    prompt: "比較兩艘探測艇的速度時，首先要約定什麼？",
    hint: "速度是相對於某個參考系描述的。",
    options: ["共同的參考點、方向與計時方式", "只比較誰的外觀更快", "不必說明測量起點", "把距離和時間混成同一個數字"],
    correctIndex: 0,
    explanation: "速度比較需要共同的參考點、方向、距離與時間定義，資料才有一致的意義。",
    principleKeys: ["relativity", "first-principles"],
  },
  {
    id: "wormhole-observation-repeat",
    domain: "observation",
    domainLabel: "觀測甲板",
    prompt: "探測器短暫記錄到一個奇特閃光。要判斷它是否可靠，下一步最合適的是？",
    hint: "單次訊號可能受雜訊或儀器狀態影響。",
    options: ["記錄條件並嘗試重複或交叉觀測", "立刻宣布已解開宇宙全部問題", "刪除不符合期待的資料", "只憑一次結果改寫規律"],
    correctIndex: 0,
    explanation: "一次觀測是線索，不是最後結論。記錄條件、重複量測或用其他儀器交叉檢查，可幫助分辨訊號與雜訊。",
    principleKeys: ["first-principles", "electromagnetism"],
  },
  {
    id: "wormhole-observation-question",
    domain: "observation",
    domainLabel: "觀測甲板",
    prompt: "下面哪一個最像可檢驗的觀測問題？",
    hint: "問題要能連到資料或量測。",
    options: ["不同波段是否在相同位置都出現訊號？", "蟲洞是不是很酷？", "宇宙想對我們說什麼？", "哪種答案最神祕？"],
    correctIndex: 0,
    explanation: "可檢驗的問題會指出要比較的資料與條件，例如不同波段、位置或時間。這樣才能設計觀測並討論證據。",
    principleKeys: ["first-principles", "electromagnetism"],
  },
  {
    id: "wormhole-observation-boundary",
    domain: "observation",
    domainLabel: "觀測甲板",
    prompt: "蟲洞是本館的想像場景。閱讀其中的科學引導時，最合適的態度是？",
    hint: "分清楚故事舞台與可查證的科學概念。",
    options: ["把故事當情境，並用證據檢查其中的科學概念", "把所有情節都當成已證實事實", "因為是故事就不必理解原理", "只相信最炫的畫面"],
    correctIndex: 0,
    explanation: "想像故事能幫助提出問題，但科學概念仍應回到可查證的證據、模型與觀測。分清兩者能讓探索更有趣也更可靠。",
    principleKeys: ["first-principles"],
  },
  {
    id: "wormhole-observation-variable",
    domain: "observation",
    domainLabel: "觀測甲板",
    prompt: "設計觀測實驗時，為什麼要先分清自變因、應變因與控制變因？",
    hint: "清楚知道改變什麼、量什麼、保持什麼不變。",
    options: ["才能判斷結果可能由哪個因素造成", "讓實驗步驟看起來更複雜", "可以不用記錄資料", "只要讓結果符合預期"],
    correctIndex: 0,
    explanation: "分清變因能讓觀測更有條理，幫助判斷改變的因素是否真的造成結果差異。",
    principleKeys: ["first-principles"],
  },
  {
    id: "wormhole-observation-uncertainty",
    domain: "observation",
    domainLabel: "觀測甲板",
    prompt: "兩次量測結果非常接近但不完全相同時，哪種說法最科學？",
    hint: "量測通常有誤差，不要把微小差異直接當成重大發現。",
    options: ["說明誤差範圍並重複量測確認", "直接宣布其中一次一定錯", "只留下自己喜歡的數字", "把差異誇大成完全不同"],
    correctIndex: 0,
    explanation: "說明誤差範圍並重複量測，可以判斷差異是否超過測量的不確定性。",
    principleKeys: ["first-principles", "electromagnetism"],
  },
];

export const getWormholeGuideQuestions = (domain?: WormholeGuideDomain) =>
  WORMHOLE_GUIDE_QUESTIONS.filter((question) => !domain || question.domain === domain);

export const createWormholeGuideSession = (domain: WormholeGuideDomain) =>
  [...getWormholeGuideQuestions(domain)];

export type WormholeQuestionGuidance = {
  keywordPrompt: string;
  keywords: readonly string[];
  reasoningSteps: readonly { title: string; detail: string }[];
  misconception: string;
  visualProbe: {
    title: string;
    prompt: string;
    signals: readonly { id: string; label: string; detail: string }[];
  };
  optionCheckPrompt: string;
  knowledgeLinkPrompt: string;
  relatedPrincipleKeys: WormholeGuideQuestion["principleKeys"];
  reflection: {
    prompt: string;
    choices: readonly { id: string; label: string; response: string }[];
  };
  scenario: {
    title: string;
    location: string;
    context: string;
    transferPrompt: string;
    choices: readonly { id: string; label: string; reflection: string }[];
  };
  ttsText: string;
};

type WormholeGuidanceTemplate = Omit<WormholeQuestionGuidance, "ttsText" | "relatedPrincipleKeys">;

const WORMHOLE_GUIDANCE_BY_DOMAIN: Record<WormholeGuideDomain, WormholeGuidanceTemplate> = {
  gravity: {
    keywordPrompt: "先圈出正在移動的物體、受到的作用與方向或距離。",
    keywords: ["物體運動", "作用方向", "質量與距離"],
    reasoningSteps: [
      { title: "辨識現象", detail: "先說清楚物體正在改變位置、速度或方向的哪一部分。" },
      { title: "連回作用", detail: "找出可能造成改變的作用，並檢查它的方向與條件。" },
      { title: "檢查證據", detail: "想想能用哪些運動、軌道或量測資料來比較你的推論。" },
    ],
    misconception: "容易把「太空沒有空氣」誤解成「太空沒有作用力」；是否有空氣與是否受重力影響是不同問題。",
    visualProbe: {
      title: "軌道線索盤",
      prompt: "點選一個你想先觀察的線索；這不是作答，也不會告訴你正解。",
      signals: [
        { id: "path", label: "路徑", detail: "先看看物體的路徑有沒有彎曲、加速或改變方向。" },
        { id: "distance", label: "距離", detail: "比較物體和參考點的距離是否改變。" },
        { id: "timing", label: "時間", detail: "把不同時間點的位置排在一起，找出可比較的變化。" },
      ],
    },
    optionCheckPrompt: "回看你的選擇：它是否同時說清楚物體的變化、作用方向，或可比較的觀測資料？",
    knowledgeLinkPrompt: "想延伸時，可回到下方相關原理卡，先複習概念再回來校準線索。",
    reflection: {
      prompt: "下一次遇到軌道或運動問題時，你想先做哪一件事？",
      choices: [
        { id: "mark", label: "標出方向與參考點", response: "先建立參考點，能讓後續比較更清楚。" },
        { id: "sequence", label: "排出前後位置", response: "把前後位置排在一起，是觀察變化的好起點。" },
        { id: "evidence", label: "再找一筆可比較資料", response: "願意多找一筆資料，是讓推論更可靠的好習慣。" },
      ],
    },
    scenario: {
      title: "東岸潮線探測任務",
      location: "想像的臺灣東岸海岸線",
      context: "探測小隊要在海岸地圖上比較浮標每一輪的位置變化，並把觀察到的移動線索交給下一班研究員。",
      transferPrompt: "你想先把哪一種線索放進任務紀錄？",
      choices: [
        { id: "direction", label: "標出移動方向與和地標的距離", reflection: "方向與距離能讓下一輪觀測有共同的比較基準。" },
        { id: "timing", label: "記下觀測時刻與當時條件", reflection: "記錄時刻與條件，有助於把不同輪次的觀察放在一起看。" },
        { id: "route", label: "畫出下次要核對的路徑", reflection: "先畫出要核對的路徑，可以幫助你安排下一次要蒐集的證據。" },
      ],
    },
  },
  light: {
    keywordPrompt: "先圈出訊號來源、光的特徵，以及量測或比較的條件。",
    keywords: ["訊號來源", "波長與顏色", "量測條件"],
    reasoningSteps: [
      { title: "辨識訊號", detail: "先確認眼前的光或電磁波能提供什麼可分析的資料。" },
      { title: "比較條件", detail: "分開看波段、角度、材料或儀器，避免一次改太多條件。" },
      { title: "整合線索", detail: "用多筆可比較的觀測資料檢查解釋，而不是只依賴單一畫面。" },
    ],
    misconception: "容易把「看見亮光」當成「已知道全部原因」；光是線索，仍要搭配量測條件與其他證據。",
    visualProbe: {
      title: "光訊號觀測盤",
      prompt: "選一個先觀察的訊號面向；它只幫你整理資料，不會提示答案。",
      signals: [
        { id: "source", label: "來源", detail: "先確認訊號可能從哪裡來，以及觀測方向。" },
        { id: "color", label: "特徵", detail: "留意顏色、波段或亮度等可以比較的特徵。" },
        { id: "condition", label: "條件", detail: "記下時間、角度與儀器條件，避免漏掉比較基準。" },
      ],
    },
    optionCheckPrompt: "回看你的選擇：它有沒有把訊號特徵和量測條件分開，而不是只依賴單一畫面？",
    knowledgeLinkPrompt: "想延伸時，可先查看相關原理卡，練習把光的特徵與觀測條件一起思考。",
    reflection: {
      prompt: "下一次看見一個天空訊號時，你想先留下哪一種紀錄？",
      choices: [
        { id: "direction", label: "出現方向", response: "記錄方向能讓不同觀測者比較同一條線索。" },
        { id: "condition", label: "觀測條件", response: "留下條件，能讓你知道資料是在什麼情況下取得的。" },
        { id: "compare", label: "另一筆對照資料", response: "準備對照資料，能幫助你不急著從單一畫面下結論。" },
      ],
    },
    scenario: {
      title: "校園天空訊號任務",
      location: "想像的校園屋頂觀測角",
      context: "科學社要把夜空觀測做成小地圖，分組在不同位置記錄同一個光點，準備比較各自收集到的訊號。",
      transferPrompt: "你想先安排哪一個觀測行動？",
      choices: [
        { id: "source", label: "標出訊號從哪個方向出現", reflection: "先記錄方向，能幫助不同觀測位置對齊同一條線索。" },
        { id: "condition", label: "留下時間、天氣與儀器條件", reflection: "把觀測條件寫清楚，能讓後續比較更有依據。" },
        { id: "compare", label: "規劃和另一個觀測點交叉比對", reflection: "交叉比對能讓小隊看見單一位置未必能提供的資訊。" },
      ],
    },
  },
  energy: {
    keywordPrompt: "先圈出能量從哪裡來、經過什麼轉換，以及最後到哪裡去。",
    keywords: ["能量來源", "轉換過程", "輸出與散失"],
    reasoningSteps: [
      { title: "畫出能量帳", detail: "先找輸入與輸出，不把看不見的能量轉換漏掉。" },
      { title: "追蹤轉換", detail: "思考能量可能變成運動、光、熱、聲音或其他形式。" },
      { title: "檢查限制", detail: "確認是否有散失、傳遞或效率限制，再判斷說法是否合理。" },
    ],
    misconception: "容易把「效率不高」誤解成「能量消失」；能量會轉成其他形式，不等於憑空不見。",
    visualProbe: {
      title: "能量路線盤",
      prompt: "點選你想先追蹤的一段能量路線；這是整理思路，不是選答案。",
      signals: [
        { id: "input", label: "來源", detail: "先找系統開始運作時，能量從哪裡進來。" },
        { id: "change", label: "轉換", detail: "看看過程中可能出現哪些不同形式的能量。" },
        { id: "output", label: "去向", detail: "想想能量最後以哪些形式離開或傳遞出去。" },
      ],
    },
    optionCheckPrompt: "回看你的選擇：它是否區分了能量來源、轉換與去向，而沒有把「看不見」當成「消失」？",
    knowledgeLinkPrompt: "想延伸時，可查看相關原理卡，練習畫出完整的能量來源、轉換與去向。",
    reflection: {
      prompt: "下一次分析設備運作時，你想先追蹤哪一段？",
      choices: [
        { id: "start", label: "從能量來源開始", response: "從來源出發，能協助你建立完整的能量帳。" },
        { id: "forms", label: "標出轉換形式", response: "留意不同形式的轉換，能看見更多運作線索。" },
        { id: "measure", label: "想一個量測方式", response: "規劃量測方式，能讓後續檢查更具體。" },
      ],
    },
    scenario: {
      title: "校園節能基地任務",
      location: "想像的操場旁科學營地",
      context: "任務小隊要替夜間觀測設備規劃能量地圖，追蹤設備從啟動到運作時可能出現的轉換與耗散。",
      transferPrompt: "你想先從哪一段開始畫出能量路線？",
      choices: [
        { id: "input", label: "找出設備啟動時需要的來源", reflection: "從來源開始記錄，能協助你建立完整的能量帳。" },
        { id: "conversion", label: "標出可能的光、熱或聲音轉換", reflection: "把不同形式的轉換標上去，可以看見裝置運作的更多線索。" },
        { id: "review", label: "設計下一輪可比較的量測方式", reflection: "先想好可比較的量測方式，能讓之後的檢查更具體。" },
      ],
    },
  },
  spacetime: {
    keywordPrompt: "先圈出觀測者、測量的時間或距離，以及使用的比較基準。",
    keywords: ["觀測者", "時間與距離", "比較基準"],
    reasoningSteps: [
      { title: "說明誰在觀測", detail: "先確認不同位置或運動狀態的觀測者各自量到什麼。" },
      { title: "固定比較基準", detail: "把時間、距離或速度的測量方式說清楚，再做比較。" },
      { title: "回到可驗證模型", detail: "用模型和可觀測結果檢查推論，不把想像情境直接當成事實。" },
    ],
    misconception: "容易以為不同觀測描述必定互相矛盾；先檢查比較基準，才知道差異是否真的衝突。",
    visualProbe: {
      title: "時空比較盤",
      prompt: "選一個你想先固定的比較基準；它協助你讀題，不會暗示答案。",
      signals: [
        { id: "observer", label: "觀測者", detail: "先確認誰在何處量測，避免把不同視角混在一起。" },
        { id: "clock", label: "計時", detail: "確認計時起點與方式，讓時間資料可以比較。" },
        { id: "reference", label: "參考點", detail: "標出共同的方向或位置，讓距離描述有依據。" },
      ],
    },
    optionCheckPrompt: "回看你的選擇：它有沒有先交代觀測者與比較基準，再解讀時間或距離的差異？",
    knowledgeLinkPrompt: "想延伸時，可查看相關原理卡，練習分清觀測者、量測方式與比較基準。",
    reflection: {
      prompt: "下次要比較兩組觀測時，你想先約定什麼？",
      choices: [
        { id: "reference", label: "共同參考點", response: "共用參考點能讓不同位置的描述更容易對照。" },
        { id: "clock", label: "計時規則", response: "說清楚計時規則，是公平比較資料的重要一步。" },
        { id: "assumption", label: "需要檢查的假設", response: "先列出假設，能提醒自己用資料持續校準。" },
      ],
    },
    scenario: {
      title: "離島航線同步任務",
      location: "想像的臺灣島嶼航線地圖",
      context: "兩組探索員從不同碼頭記錄遠方訊號抵達的時刻，準備在同一張航線圖上整理彼此的觀測。",
      transferPrompt: "你想先讓兩組約定哪一項共通做法？",
      choices: [
        { id: "reference", label: "使用同一個參考點與方向", reflection: "共同的參考點與方向，能讓不同位置的描述更容易比較。" },
        { id: "clock", label: "把計時方式與起點寫清楚", reflection: "先約好計時方式，能幫助小隊辨識資料差異從何而來。" },
        { id: "model", label: "列出需要再用資料檢查的假設", reflection: "把假設寫下來，能提醒小隊用後續資料持續校準想法。" },
      ],
    },
  },
  observation: {
    keywordPrompt: "先圈出要比較的資料、改變的條件，以及需要保持不變的部分。",
    keywords: ["可量測資料", "變因與條件", "誤差與重複"],
    reasoningSteps: [
      { title: "把問題變可量測", detail: "把故事情境改寫成能用資料、時間、位置或數值回答的問題。" },
      { title: "分清變因", detail: "確認改變什麼、量什麼，以及哪些條件要保持一致。" },
      { title: "檢查不確定性", detail: "重複量測並記錄誤差範圍，避免用單次結果下太快結論。" },
    ],
    misconception: "容易把一次觀察到的結果當成最後答案；可靠結論需要可比較的資料與對誤差的說明。",
    visualProbe: {
      title: "觀測證據盤",
      prompt: "點選一項你想先確認的證據；它只幫你設計觀測，不提供正解。",
      signals: [
        { id: "data", label: "資料", detail: "先想清楚要記錄什麼，才能讓問題變得可量測。" },
        { id: "variable", label: "條件", detail: "分開看哪些條件改變、哪些條件應保持一致。" },
        { id: "repeat", label: "重複", detail: "安排重複觀測，看看結果是否能再次出現。" },
      ],
    },
    optionCheckPrompt: "回看你的選擇：它是否指出可比較的資料或條件，而不是把一次觀察直接當成結論？",
    knowledgeLinkPrompt: "想延伸時，可查看相關原理卡，練習把故事情境改寫成可量測、可比較的問題。",
    reflection: {
      prompt: "下一次設計觀測時，你想先加上哪一項安排？",
      choices: [
        { id: "repeat", label: "重複一次觀測", response: "願意重複觀測，能幫助你分辨偶然與可再現的線索。" },
        { id: "variables", label: "列出比較條件", response: "把比較條件寫下來，能讓資料更容易回答問題。" },
        { id: "peer", label: "找另一個觀測點對照", response: "增加對照觀測點，能讓你有更多交叉檢查的機會。" },
      ],
    },
    scenario: {
      title: "山城觀測地圖任務",
      location: "想像的臺灣山城與校園觀測點",
      context: "社團把不同觀測點標在任務地圖上，想確認短暫閃光是穩定訊號、環境變化，或只是需要再確認的線索。",
      transferPrompt: "你想先為下一次觀測加上哪一種安排？",
      choices: [
        { id: "repeat", label: "安排同條件下的重複觀測", reflection: "重複觀測可以幫助小隊分辨偶然訊號與可再現的線索。" },
        { id: "variables", label: "標記要固定與要比較的條件", reflection: "把條件分清楚，能讓資料更容易回答原本的問題。" },
        { id: "crosscheck", label: "邀請另一個觀測點一起記錄", reflection: "多一個觀測點能提供交叉檢查的機會，讓結論更穩健。" },
      ],
    },
  },
};

/**
 * 只提供作答前的觀測與推理支架；不包含選項、正確索引或完整解析。
 */
export const getWormholeQuestionGuidance = (question: WormholeGuideQuestion): WormholeQuestionGuidance => {
  const template = WORMHOLE_GUIDANCE_BY_DOMAIN[question.domain];
  const stepText = template.reasoningSteps.map((step, index) => `第 ${index + 1} 步，${step.title}：${step.detail}`).join(" ");
  const scenarioText = `生活與地圖情境：${template.scenario.title}，地點是${template.scenario.location}。${template.scenario.context} 遷移想一想：${template.scenario.transferPrompt} 可選擇的任務方向有：${template.scenario.choices.map((choice) => choice.label).join("、")}。這些選擇不計分，也沒有標準答案。`;
  const visualText = `圖像化微互動：${template.visualProbe.title}。${template.visualProbe.prompt} 可先查看${template.visualProbe.signals.map((signal) => signal.label).join("、")}。`;

  return {
    ...template,
    relatedPrincipleKeys: question.principleKeys,
    ttsText: `原理引導補強。${template.keywordPrompt} 關鍵詞包含：${template.keywords.join("、")}。三步驟推理：${stepText} 常見迷思：${template.misconception} ${visualText} ${scenarioText}`,
  };
};
