/**
 * 高中地理課程（洋蔥學院 200 堂擴充計畫：三、高中新增 65 堂／地理 6 堂）。
 *
 * 依據課表 id／年級／課名／核心概念撰寫，不更名、不改 id。
 * 設計原則：先決定教具數字、字幕再把數字說出來，確保圖解一致。
 * 每堂課 9 幀分鏡（至少 3 幀含 ask）＋ 7 題闖關 ＋ 4 條 takeaways。
 */
import type { OnionLesson } from "@/game/onionAcademyLessons";

const SH_GEO_GIS: OnionLesson = {
  id: "sh-geo-gis",
  title: "地圖與地理資訊：看懂地圖在說什麼",
  subject: "地理",
  topic: "地圖與地理資訊",
  grade: "高一",
  stages: ["高中"],
  desc: "經緯度定位、等高線看高低與陡緩、比例尺算距離，再用 GIS 圖層分析空間資訊。",
  takeaways: ["經度決定時區、緯度決定南北位置與氣候帶", "等高線：線越密坡越陡，閉合小圈是山頂或盆地", "比例尺＝圖上距離÷實際距離；GIS 用多張主題圖層疊合分析", "經緯度以 N/S、E/W 標明南北與東西半球；閉合等高線可判斷山頂或盆地"],
  frames: [
    { step: "步驟 1：用手機地圖找路", id: 1, caption: "嗨！你用手機地圖找咖啡店時，地圖怎麼知道你在哪、店在哪？關鍵是「地理資訊」。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：用經緯度定位", id: 2, caption: "地球像鋪了一張網：橫向是緯度、縱向是經度。台北約在緯度 25°N、經度 121°E，這組座標就能精準定位。", action: "point", prop: { kind: "text", text: "緯度 25°N、經度 121°E（台北）", sub: "經度定時區、緯度定氣候帶", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：分辨東經西經、南緯北緯", id: 3, caption: "進一步：經度 0° 以東叫東經、以西叫西經，各到 180°；赤道以北是北緯、以南是南緯，標明 N／S、E／W 就能定出所在半球。", ask: { prompt: "座標寫成 25°N、121°E，其中的「E」代表什麼？", options: ["東經", "西經", "北緯", "南緯"], answer: 0, hint: "E 是英文 East（東）的縮寫，指東經。" }, action: "think", prop: { kind: "text", text: "經度：東經／西經；緯度：北緯／南緯", sub: "座標標明 N/S、E/W", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：用等高線比高度", id: 4, caption: "同一張地形圖上，甲地等高線標高 100、乙地標高 400；乙地比甲地高出 300 公尺，地勢明顯更高。", ask: { prompt: "等高線標高甲地 100 公尺、乙地 400 公尺，哪裡地勢較高？", options: ["乙地", "甲地", "一樣高", "無法判斷"], answer: 0, hint: "標高數字越大，代表海拔越高。" }, action: "think", prop: { kind: "bars", items: [{ label: "甲地", value: 100 }, { label: "乙地", value: 400 }], unit: "公尺", active: 1 }, duration: 3800 },
    { step: "步驟 5：等高線密就陡", id: 5, caption: "等高線的疏密還會說故事：線越密，代表同樣高度變化壓在很短的水平距離，也就是山坡越陡；線越疏則越平緩。", action: "jump", prop: { kind: "text", text: "等高線密 → 坡陡；疏 → 坡緩", sub: "閉合小圈＝山頂或盆地", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：比例尺算距離", id: 6, caption: "比例尺告訴你圖和實際的比例。1:50000 表示地圖上 1 公分，實際是 50000 公分，也就是 500 公尺。", ask: { prompt: "比例尺 1:50000，地圖上 1 公分等於實際多少距離？", options: ["500 公尺", "50 公尺", "5 公尺", "5000 公尺"], answer: 0, hint: "50000 公分換算成公尺要除以 100，得到 500 公尺。" }, action: "point", prop: { kind: "text", text: "1:50000 → 1 cm = 50000 cm = 500 m", sub: "比例尺＝圖上距離÷實際距離", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：GIS 疊圖層分析", id: 7, caption: "GIS（地理資訊系統）把不同主題疊成「圖層」：人口層、交通層、土地利用層，疊在一起就能看出空間關係。", action: "walk", prop: { kind: "flow", steps: ["人口圖層", "交通圖層", "土地利用圖層", "疊合分析"], active: 3 }, duration: 3800 },
    { step: "步驟 8：手機找店就是 GIS", id: 8, caption: "生活應例：你用手機找最近的咖啡廳，背後就是 GIS 同時疊上「你在哪、店家在哪、哪條路好走」三個圖層。", action: "point", prop: { kind: "flow", steps: ["定位圖層", "店家圖層", "路網圖層", "疊合推薦"], active: 3 }, duration: 3800 },
    { step: "步驟 9：記定位與圖層口訣", id: 9, caption: "口訣：經緯度定位、等高線看高低與陡緩、比例尺算距離、GIS 用圖層疊合分析。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-geo-gis-1", prompt: "經度主要決定什麼？", options: ["時區", "氣候帶", "海拔高度", "人口密度"], answer: 0, hints: ["經度跟太陽位置的時間差有關", "緯度才決定氣候帶"], explanation: "經度決定時區（東西方向時間差），緯度決定南北位置與氣候帶。" },
    { id: "sh-geo-gis-2", prompt: "台北約位於下列哪組座標？", options: ["緯度 25°N、經度 121°E", "緯度 121°N、經度 25°E", "赤道上、經度 0°", "南半球緯度 25°S"], answer: 0, hints: ["台北在北半球的亞熱帶", "經度約在 120 出頭"], explanation: "台北位於北半球，約緯度 25°N、經度 121°E。" },
    { id: "sh-geo-gis-3", prompt: "同一地區等高線越密集，代表？", options: ["山坡越陡", "山坡越平緩", "海拔越高", "沒有關係"], answer: 0, hints: ["線密代表高度變化壓在短距離", "短距離內爬升多就是陡"], explanation: "等高線越密，相同的高度差對應越短的水平距離，所以坡越陡。" },
    { id: "sh-geo-gis-4", prompt: "比例尺 1:50000，圖上 1 公分等於實際多少？", options: ["500 公尺", "50 公尺", "5 公尺", "5000 公尺"], answer: 0, hints: ["50000 公分÷100＝公尺", "結果是 500 公尺"], explanation: "1:50000 表示 1 公分對應 50000 公分，50000÷100＝500 公尺。" },
    { id: "sh-geo-gis-5", prompt: "GIS（地理資訊系統）的核心做法是？", options: ["把不同主題疊成圖層來分析", "只畫一張簡單地圖", "只計算經緯度", "只畫等高線"], answer: 0, hints: ["GIS 強調多主題疊合", "人口、交通、土地可一起看"], explanation: "GIS 把人口、交通、土地利用等不同主題做成圖層，疊合後分析空間資訊。" },
    { id: "sh-geo-gis-6", prompt: "座標 25°N、121°E 所在的位置是？", options: ["北半球、東經", "南半球、西經", "北半球、西經", "赤道上"], answer: 0, hints: ["N 是北方、E 是東方", "北＋東"], explanation: "N 代表北緯（北半球）、E 代表東經，故該地位於北半球、東經。" },
    { id: "sh-geo-gis-7", prompt: "地形圖上一圈封閉等高線，中間標高比四周高，這通常是？", options: ["山頂", "盆地", "湖泊", "平原"], answer: 0, hints: ["中間高、四周低", "凸出來的地形"], explanation: "封閉等高線若中間標高較高，代表中間凸出、四周較低，通常是山頂；中間低才是盆地。" },
  ],
};

const SH_GEO_CLIMATE_TYPE: OnionLesson = {
  id: "sh-geo-climate-type",
  title: "氣候類型：用氣溫與雨量分類",
  subject: "地理",
  topic: "氣候類型",
  grade: "高一",
  stages: ["高中"],
  desc: "氣候是「氣溫×雨量」的組合；成因要看緯度、距海遠近、洋流、地形與盛行風。",
  takeaways: ["氣候用「氣溫＋雨量」組合分類（雨林、莽原、沙漠、地中海型…）", "緯度決定氣溫高低；距海遠近、洋流、地形、盛行風影響溫差與雨量", "地中海型夏乾冬雨、溫帶海洋性全年有雨且溫差小", "分類要「氣溫＋雨量」一起看，最冷月均溫區分熱溫帶；臺灣為亞熱帶季風氣候、夏雨冬乾"],
  frames: [
    { step: "步驟 1：為什麼氣候差很多", id: 1, caption: "嗨！為什麼有些地方終年濕熱、有些地方夏乾冬雨？其實氣候是「氣溫和雨量的組合」說了算。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：用氣溫雨量分類", id: 2, caption: "地理學用「氣溫」和「雨量」兩把尺分類：高溫多雨叫熱帶雨林，乾燥少雨叫沙漠氣候，組合不同類型就不同。", action: "point", prop: { kind: "text", text: "氣候＝氣溫 × 雨量 的組合", sub: "雨林：高溫多雨；沙漠：乾燥", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：認識主要類型", id: 3, caption: "常見類型有七種：熱帶雨林、莽原、沙漠、地中海型、溫帶海洋性、溫帶大陸性、寒帶，另外還有高地氣候。", ask: { prompt: "下列哪一種氣候「夏乾冬雨」？", options: ["地中海型", "熱帶雨林", "沙漠", "溫帶海洋性"], answer: 0, hint: "夏天乾燥、冬天反而是雨季的那一型。" }, action: "think", prop: { kind: "text", text: "地中海型：夏乾冬雨", sub: "溫帶海洋性：全年有雨、溫差小", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：用年雨量比一比", id: 4, caption: "從年雨量看差異最直觀：熱帶雨林超過 2000 毫米、沙漠不到 250 毫米、溫帶海洋性約 1000 毫米。", action: "jump", prop: { kind: "bars", items: [{ label: "熱帶雨林", value: 2000 }, { label: "沙漠", value: 250 }, { label: "溫帶海洋性", value: 1000 }], unit: "毫米", active: 0 }, duration: 3800 },
    { step: "步驟 5：氣溫要看最冷月", id: 5, caption: "光看雨量還不夠，氣溫要看「最冷月均溫」：最冷月均溫高於 18℃ 才算熱帶，低於 0℃ 就可能是溫帶大陸性或寒帶。", ask: { prompt: "判斷是否為熱帶氣候，除雨量外通常看哪個氣溫指標？", options: ["最冷月均溫是否高於 18℃", "一年當中最高溫", "平均風速", "全年雨量"], answer: 0, hint: "看最冷的月份夠不夠暖，就知道是不是熱帶。" }, action: "think", prop: { kind: "balance", left: "熱帶：最冷月 > 18℃", right: "溫帶：最冷月較低", tip: "氣溫＋雨量一起判" }, duration: 3800 },
    { step: "步驟 6：成因先看緯度", id: 6, caption: "成因要講對：緯度決定接收的太陽熱量，越靠近赤道越熱；這也是熱帶不可能出現在高緯度的原因。", ask: { prompt: "緯度主要影響氣候的哪一方面？", options: ["氣溫高低", "雨量多少", "颱風數量", "地震頻率"], answer: 0, hint: "緯度決定能接收到多少太陽熱。" }, action: "point", prop: { kind: "text", text: "緯度 → 接收太陽熱量 → 氣溫", sub: "近赤道熱、近兩極冷", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：海陸洋流地形風", id: 7, caption: "距海遠近、洋流、地形、盛行風也改氣候：沿海溫差小、暖流增溫增濕、山脈擋住濕風讓迎風坡多雨。", action: "walk", prop: { kind: "flow", steps: ["緯度定熱量", "距海遠近定溫差", "洋流增溫或降溫", "地形與風定雨量"], active: 3 }, duration: 3800 },
    { step: "步驟 8：臺灣的氣候類型", id: 8, caption: "生活實例：臺灣屬亞熱帶季風氣候，夏季多雨、冬季較涼；西南季風與颱風都是重要的降雨來源。", action: "point", prop: { kind: "text", text: "臺灣：亞熱帶季風為主", sub: "夏雨冬涼、颱風帶雨", tone: "ok" }, duration: 3800 },
    { step: "步驟 9：記氣溫雨量口訣", id: 9, caption: "口訣：氣候看氣溫×雨量；成因看緯度、海陸、洋流、地形與風。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-geo-climate-type-1", prompt: "地理學分類氣候主要看哪兩個要素？", options: ["氣溫與雨量", "緯度與經度", "人口與地形", "高度與風向"], answer: 0, hints: ["一個是冷熱、一個是乾濕", "這兩把尺組出類型"], explanation: "氣候用「氣溫＋雨量」的組合來分類。" },
    { id: "sh-geo-climate-type-2", prompt: "下列哪種氣候「夏乾冬雨」？", options: ["地中海型", "熱帶雨林", "沙漠", "溫帶大陸性"], answer: 0, hints: ["夏天乾、冬天反而下雨", "多分布在地中海沿岸"], explanation: "地中海型氣候夏季受副熱帶高壓控制乾燥，冬季受西風帶來雨水，故夏乾冬雨。" },
    { id: "sh-geo-climate-type-3", prompt: "熱帶雨林氣候的特徵是？", options: ["高溫多雨", "乾燥少雨", "夏乾冬雨", "全年寒冷"], answer: 0, hints: ["終年高溫", "雨量也非常充沛"], explanation: "熱帶雨林氣候終年高溫且多雨。" },
    { id: "sh-geo-climate-type-4", prompt: "距海遠近會影響什麼？", options: ["溫差大小（沿海溫差小）", "緯度高低", "經度大小", "地震頻率"], answer: 0, hints: ["海洋調節溫度", "離海遠內陸溫差大"], explanation: "距海遠近影響溫差：沿海受海洋調節溫差小，內陸溫差大。" },
    { id: "sh-geo-climate-type-5", prompt: "山脈擋住濕潤的盛行風，會在哪一側形成較多降雨？", options: ["迎風坡", "背風坡", "山頂", "海底"], answer: 0, hints: ["濕空氣被迫爬升", "爬升冷卻就容易下雨"], explanation: "濕潤氣流遇山被迫抬升、冷卻凝結，在迎風坡形成較多降雨。" },
    { id: "sh-geo-climate-type-6", prompt: "判斷一個地方是否屬於熱帶氣候，除雨量外常看？", options: ["最冷月均溫是否高於 18℃", "一年最高溫", "平均風速", "全年日數"], answer: 0, hints: ["最冷的月份夠不夠暖", "高於 18℃ 才算熱帶"], explanation: "熱帶氣候即使在最冷月也相當溫暖，通常以最冷月均溫高於 18℃ 作為判準之一。" },
    { id: "sh-geo-climate-type-7", prompt: "臺灣夏季多雨，除午後對流雨外，常見的降雨系統還有？", options: ["西南季風與颱風", "終年東北信風", "副極地低壓", "極地冷鋒"], answer: 0, hints: ["夏季來自海洋的濕風", "颱風夏秋季常報到"], explanation: "臺灣夏秋季受西南季風與颱風影響，帶來大量降水，是重要的降雨來源。" },
  ],
};

const SH_GEO_GLOBALIZATION: OnionLesson = {
  id: "sh-geo-globalization",
  title: "世界經濟與全球化：一條看不見的供應鏈",
  subject: "地理",
  topic: "世界經濟與全球化",
  grade: "高二",
  stages: ["高中"],
  desc: "比較利益促成國際分工，供應鏈串起各國；機會是效率與多元，風險是關鍵環節中斷。",
  takeaways: ["比較利益讓各國專精、形成國際分工與供應鏈", "跨國企業分散生產，使各國經濟互相依賴", "全球化的機會在效率與多元，風險在關鍵環節中斷（如晶片）", "比較利益講機會成本最低而非絕對最強；斷鏈風險促使企業分散備援"],
  frames: [
    { step: "步驟 1：手機來自全世界", id: 1, caption: "嗨！你手上的手機，晶片可能來自台灣、螢幕來自韓國、組裝在中國——這就是全球化，世界連成一張網。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：比較利益分工", id: 2, caption: "各國專做自己最擅長的事，叫「比較利益」：A 國做晶圓、B 國做組裝，整體效率比各做全套更高。", action: "point", prop: { kind: "text", text: "比較利益：各國專精、互補分工", sub: "國際分工提升整體效率", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：比較利益看機會成本", id: 3, caption: "別搞混：比較利益是「機會成本」最低就專做那件事，不是樣樣都贏別人；就算兩樣都強，還是該專注自己相對更划算的。", ask: { prompt: "A 國做晶圓和組裝都比 B 國快，依比較利益，A 國應該？", options: ["專注自己相對更擅長的、把另一樣交給 B 國", "兩樣都自己做、完全不貿易", "只做組裝", "停止生產"], answer: 0, hint: "關鍵在「相對」划算，而不是兩樣都包。" }, action: "think", prop: { kind: "text", text: "比較利益＝機會成本最低", sub: "不是絕對最強、是相對划算", tone: "warn" }, duration: 3800 },
    { step: "步驟 4：產品走過供應鏈", id: 4, caption: "產品從原料到成品跨越多國，這串流程叫「供應鏈」；任何一環斷掉，後面的生產都會停擺。", ask: { prompt: "產品跨多國、從原料到成品的流程稱為？", options: ["供應鏈", "貨幣政策", "選舉制度", "火山活動"], answer: 0, hint: "它把各國的生產環節串成一條線。" }, action: "think", prop: { kind: "flow", steps: ["原料", "零件", "組裝", "成品出貨"], active: 3 }, duration: 3800 },
    { step: "步驟 5：跨國企業分散生產", id: 5, caption: "跨國企業在好幾個國家設廠，把生產分散到成本較低的地方，也讓各國經濟變得更互相依賴。", action: "jump", prop: { kind: "text", text: "跨國企業：多國設廠、分散生產", sub: "各國經濟互相依賴", tone: "ok" }, duration: 3800 },
    { step: "步驟 6：全球化的機會", id: 6, caption: "全球化的機會：商品更便宜、選擇更多、技術擴散更快；各國都能專注自己的強項，而不是樣樣都做。", ask: { prompt: "下列何者「不是」全球化帶來的機會？", options: ["各國都變成完全相同的產業", "商品更便宜", "選擇更多", "技術擴散更快"], answer: 0, hint: "全球化是分工互補，不是大家都做同一件事。" }, action: "point", prop: { kind: "text", text: "機會：便宜、多元、技術擴散", sub: "風險：依賴單一環節", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：風險：晶片斷鏈", id: 7, caption: "風險也很真實：2020 年車用晶片短缺，全球一年約造 4000 萬輛車，那年只剩約 3000 萬輛，整整少了 1000 萬輛。", action: "walk", prop: { kind: "bars", items: [{ label: "正常年", value: 4000 }, { label: "缺晶片年", value: 3000 }], unit: "萬輛", active: 1 }, duration: 3800 },
    { step: "步驟 8：分散備援因應斷鏈", id: 8, caption: "因應對策：面對斷鏈風險，企業開始「分散風險」、多地備援（近岸生產），不再把所有產能壓在單一地點。", action: "point", prop: { kind: "flow", steps: ["單一集中生產", "斷鏈風險高", "分散多地備援", "降低依賴"], active: 3 }, duration: 3800 },
    { step: "步驟 9：記分工與風險口訣", id: 9, caption: "口訣：比較利益促成國際分工，供應鏈串起全球；機會是效率與多元，風險是依賴與中斷。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-geo-globalization-1", prompt: "各國專做自己最擅長的生產，這個概念叫？", options: ["比較利益", "貨幣貶值", "關稅壁壘", "選舉"], answer: 0, hints: ["強調「專精」", "分工能提升效率"], explanation: "比較利益指各國專注相對擅長的生產，透過分工提升整體效率。" },
    { id: "sh-geo-globalization-2", prompt: "產品跨多國、從原料到成品的流程叫？", options: ["供應鏈", "食物鏈", "生態系", "憲法"], answer: 0, hints: ["把各國生產環節串起來", "一環斷全鏈受影響"], explanation: "供應鏈是產品從原料、零件、組裝到出貨所經過的多國生產流程。" },
    { id: "sh-geo-globalization-3", prompt: "跨國企業分散設廠，會造成什麼結果？", options: ["各國經濟互相依賴", "各國完全獨立", "物價漲一倍", "貿易完全停止"], answer: 0, hints: ["生產分散到多國", "一國出事會波及他國"], explanation: "跨國企業分散生產，使各國在生產上互相依賴。" },
    { id: "sh-geo-globalization-4", prompt: "全球化對消費者的好處是？", options: ["商品更便宜、選擇更多", "只能買本地貨", "價格變貴", "沒有影響"], answer: 0, hints: ["分工降低成本", "進口帶來多樣選擇"], explanation: "國際分工降低成本的同時，進口商品也讓消費者選擇更多。" },
    { id: "sh-geo-globalization-5", prompt: "車用晶片短缺說明了全球化的哪項風險？", options: ["關鍵環節中斷、整條供應鏈受影響", "各國自給自足", "完全沒有風險", "只影響農業"], answer: 0, hints: ["晶片是關鍵零件", "斷鏈讓下游都缺料"], explanation: "關鍵零組件（如晶片）短缺會使整條供應鏈停擺，凸顯全球化的依賴風險。" },
    { id: "sh-geo-globalization-6", prompt: "比較利益強調的重點是？", options: ["機會成本最低就專做那件事", "每樣都要贏過別國", "完全不要貿易", "只看絕對技術"], answer: 0, hints: ["相對划算最重要", "即使兩樣都強也要分工"], explanation: "比較利益並不要求樣樣都最強，而是專注機會成本最低、相對最划算的生產。" },
    { id: "sh-geo-globalization-7", prompt: "為降低單一供應地斷鏈的風險，企業常採取？", options: ["把產能分散到多地備援", "全部集中一國生產", "完全停止貿易", "只堆庫存不生產"], answer: 0, hints: ["不把雞蛋放一個籃子", "多地備援"], explanation: "面對斷鏈風險，企業傾向分散生產、多地備援，降低對單一供應地的依賴。" },
  ],
};

const SH_GEO_TAIWAN_REGION: OnionLesson = {
  id: "sh-geo-taiwan-region",
  title: "臺灣區域發展：北金融、中精密、南重工",
  subject: "地理",
  topic: "臺灣區域發展",
  grade: "高二",
  stages: ["高中"],
  desc: "北部的金融服務、中部的精密機械、南部的石化重工、東部的觀光農業，產業正從代工轉向研發。",
  takeaways: ["北部政治金融服務業、中部農業與精密機械、南部石化重工業、東部觀光農業", "區域差異源於地形、歷史與區位（港口、首都）", "產業從代工轉向研發與品牌，提升附加價值", "區位條件塑造分工；科學園區等產業聚落藉同業聚集共享資源"],
  frames: [
    { step: "步驟 1：同島不同產業", id: 1, caption: "嗨！同樣是台灣，北部高樓金融、中部精密機械、南部重工業、東部好山好水——為什麼差這麼多？", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：北部是決策中心", id: 2, caption: "北部：首都與主要港口集中，政治、金融、服務業發達，是全國的決策與商業中心。", action: "point", prop: { kind: "text", text: "北部：政治·金融·服務業", sub: "決策與商業中心", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：中部與南部的強項", id: 3, caption: "中部以農業和精密機械見長；南部則有石化與重工業，工廠與港口相當密集。", ask: { prompt: "台灣中部的產業特色是？", options: ["農業與精密機械", "石化與重工業", "政治金融", "觀光為主"], answer: 0, hint: "想到工具機、自行車零件就對了。" }, action: "think", prop: { kind: "text", text: "中部：農業＋精密機械", sub: "南部：石化與重工業", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：用就業結構看差異", id: 4, caption: "用服務業就業比重看：北部佔 70%、中部 55%、南部 50%，北部明顯更偏服務業導向。", action: "jump", prop: { kind: "bars", items: [{ label: "北部", value: 70 }, { label: "中部", value: 55 }, { label: "南部", value: 50 }], unit: "%", active: 0 }, duration: 3800 },
    { step: "步驟 5：分工背後的區位條件", id: 5, caption: "為何這樣分工？北部靠首都與港口先發展服務業；南部有大港口與重工原料，適合重工業；中部平原與傳統技術則利機械與農業。", ask: { prompt: "台灣南部發展石化重工業，最關鍵的區位條件是？", options: ["有大型港口與重工原料", "是政治中心", "觀光客最多", "地勢最平緩"], answer: 0, hint: "重工業需要方便進出口的港口與原料。" }, action: "think", prop: { kind: "flow", steps: ["北部首都港口", "南部重工原料港", "中部平原技術", "各據區位發展"], active: 2 }, duration: 3800 },
    { step: "步驟 6：東部與離島", id: 6, caption: "東部地勢陡、平原少，以觀光和農業為主；離島（如澎湖、金門）則靠觀光與特殊產業維生。", ask: { prompt: "台灣東部因為地勢陡、平原少，產業以什麼為主？", options: ["觀光與農業", "石化重工業", "金融服務", "航太工業"], answer: 0, hint: "平原少不利大工廠，好山好水適合觀光。" }, action: "point", prop: { kind: "text", text: "東部：觀光·農業（地勢陡）", sub: "離島：觀光為主", tone: "ok" }, duration: 3800 },
    { step: "步驟 7：產業轉型升級", id: 7, caption: "整體趨勢是「從代工走向研發」：過去幫別人組裝，現在發展自有技術與品牌，附加價值更高。", action: "walk", prop: { kind: "flow", steps: ["早期代工", "累積技術", "投入研發", "自有品牌"], active: 3 }, duration: 3800 },
    { step: "步驟 8：產業聚落同業聚集", id: 8, caption: "生活實例：新竹科學園區、台中精密機械園區、高雄臨港線，都是把同業聚集、共享設施與人力的「產業聚落」。", action: "point", prop: { kind: "text", text: "產業聚落：同業聚集、共享資源", sub: "科學園區／精密機械園區", tone: "ok" }, duration: 3800 },
    { step: "步驟 9：記區域分工口訣", id: 9, caption: "口訣：北金融、中精密、南重工、東觀光；產業從代工轉向研發，價值更高。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-geo-taiwan-region-1", prompt: "台灣北部的主要產業是？", options: ["政治金融與服務業", "石化重工業", "農業為主", "航太工業"], answer: 0, hints: ["首都與大港在北部", "商業決策集中地"], explanation: "北部因首都與港口集中，政治、金融、服務業最發達。" },
    { id: "sh-geo-taiwan-region-2", prompt: "台灣中部以什麼產業见长？", options: ["農業與精密機械", "金融服務", "觀光為主", "石化重工業"], answer: 0, hints: ["想到工具機、自行車", "還有豐沛的農產"], explanation: "中部以農業與精密機械（如工具機）見長。" },
    { id: "sh-geo-taiwan-region-3", prompt: "台灣南部產業特色是？", options: ["石化與重工業", "政治金融", "精密機械", "觀光農業"], answer: 0, hints: ["南部有大煉油與鋼鐵廠", "港口配合出貨"], explanation: "南部有石化與重工業，工廠、港口密集。" },
    { id: "sh-geo-taiwan-region-4", prompt: "台灣東部因地形限制，產業以？", options: ["觀光與農業", "金融中心", "重工業", "航太工業"], answer: 0, hints: ["地勢陡、平原少", "好山好水適合觀光"], explanation: "東部地勢陡、平原少，以大規模工業不易，以觀光與農業為主。" },
    { id: "sh-geo-taiwan-region-5", prompt: "台灣產業轉型的趨勢是？", options: ["從代工走向研發與品牌", "從研發退回代工", "只做農業", "完全停止工業"], answer: 0, hints: ["提升附加價值", "發展自有技術"], explanation: "台灣產業正從代工組裝轉向研發與自有品牌，以提升附加價值。" },
    { id: "sh-geo-taiwan-region-6", prompt: "台灣南部發展石化重工業，最主要的區位優勢是？", options: ["擁有大型港口、方便原料進口與產品出貨", "是政治決策中心", "觀光客最多", "地勢最平緩"], answer: 0, hints: ["重工業依賴港口", "大宗原料與產品需要海運"], explanation: "南部有大型港口，方便大宗原料進口與產品出貨，適合發展石化與重工業。" },
    { id: "sh-geo-taiwan-region-7", prompt: "科學園區把相關產業聚集在一起，主要好處是？", options: ["共享設施與人力、降低成本", "完全沒有好處", "讓產業彼此封閉", "只為了觀光"], answer: 0, hints: ["同業聚集", "共享資源與人才"], explanation: "產業聚落讓相關廠商聚集，共享設施、技術與人才，降低成本並提升效率。" },
  ],
};

const SH_GEO_URBAN: OnionLesson = {
  id: "sh-geo-urban",
  title: "都市與人口：都市化與人口轉型",
  subject: "地理",
  topic: "都市與人口",
  grade: "高二",
  stages: ["高中"],
  desc: "人口往都市集中形成都市化與機能分區；人口轉型走向低低低，台灣正面臨少子化與高齡化。",
  takeaways: ["都市化＝人口往都市集中，並出現商業·工業·住宅等分區", "人口轉型：高高低 → 低低低，出生率與死亡率都下降", "台灣人口金字塔走向高齡化（鐘型），面臨少子化與扶養壓力", "都市分區背後是地租機制；都市化衍生擁擠高房價，需大眾運輸與社會住宅對策"],
  frames: [
    { step: "步驟 1：家鄉越來越多大樓", id: 1, caption: "嗨！你家附近是不是越來越多大樓？人口不斷往都市集中，這個現象就叫「都市化」。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：什麼是都市化", id: 2, caption: "都市化：人口從鄉村移往都市，都市面積擴大、機能變複雜，也帶來交通與住房的壓力。", action: "point", prop: { kind: "text", text: "都市化：人口往都市集中", sub: "都市擴張、機能複雜化", tone: "ok" }, duration: 3800 },
    { step: "步驟 3：都市機能分區", id: 3, caption: "都市內部會分區：商業區在市中心、工業區在外圍、住宅區夾在中間，各有最適合的位置。", ask: { prompt: "都市的市中心通常屬於哪種分區？", options: ["商業區", "工業區", "農業區", "森林區"], answer: 0, hint: "市中心人潮多、商店集中。" }, action: "think", prop: { kind: "text", text: "市中心：商業區", sub: "工業區在外圍、住宅區居中", tone: "ok" }, duration: 3800 },
    { step: "步驟 4：分區背後的地租", id: 4, caption: "背後原理是「地租」：市中心人潮多、地價貴，付得起高租金的商業活動才能進駐；住宅與工業則往外移到較便宜的地方。", ask: { prompt: "都市市中心多為商業區，最主要因為？", options: ["市中心地價高、只有商業付得起租金", "市中心沒有人", "商業最喜歡偏僻", "工業付得起高租金"], answer: 0, hint: "商業付得起高租金，才能擠進最精華的地段。" }, action: "think", prop: { kind: "flow", steps: ["市中心地價高", "商業付得起租金", "住宅外移", "工業在外圍"], active: 1 }, duration: 3800 },
    { step: "步驟 5：人口轉型四階段", id: 5, caption: "人口轉型：從「高出生高死亡」一路降到「低出生低死亡」；發展越進步，死亡率先降、出生率後降。", action: "jump", prop: { kind: "flow", steps: ["高出生高死亡", "死亡率先降", "出生率後降", "低出生低死亡"], active: 3 }, duration: 3800 },
    { step: "步驟 6：看人口金字塔", id: 6, caption: "人口金字塔看年齡結構：年輕型像三角形（底寬），高齡化像鐘型（中間胖）。台灣 65 歲以上佔約 18%、0–14 歲約 12%。", ask: { prompt: "台灣 65 歲以上人口佔比約多少？", options: ["18%", "12%", "5%", "50%"], answer: 0, hint: "台灣已邁入高齡社會，老年佔比約兩成。" }, action: "point", prop: { kind: "bars", items: [{ label: "65歲以上", value: 18 }, { label: "0–14歲", value: 12 }], unit: "%", active: 0 }, duration: 3800 },
    { step: "步驟 7：少子化與高齡化", id: 7, caption: "台灣面臨少子化與高齡化：出生變少、老人變多，扶養壓力上升，需要長照與年金等對策。", action: "walk", prop: { kind: "text", text: "少子化＋高齡化：扶養壓力上升", sub: "需長照、年金等對策", tone: "warn" }, duration: 3800 },
    { step: "步驟 8：都市病與調適", id: 8, caption: "生活議題：都市化也帶來擁擠、交通、房價高漲與老舊社區更新；透過大眾運輸、社會住宅與都市計畫來調適。", action: "point", prop: { kind: "text", text: "都市病：擁擠·交通·高房價", sub: "對策：大眾運輸·社會住宅", tone: "warn" }, duration: 3800 },
    { step: "步驟 9：記都市與轉型口訣", id: 9, caption: "口訣：都市化人口集中、分區有秩序；人口轉型到低低低，金字塔看年齡、高齡化要面對。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-geo-urban-1", prompt: "人口往都市集中的現象叫？", options: ["都市化", "工業化", "農業化", "火山活動"], answer: 0, hints: ["和「城市」有關", "鄉村人口移入城市"], explanation: "都市化是人口從鄉村移往都市、都市規模擴大的過程。" },
    { id: "sh-geo-urban-2", prompt: "都市的市中心通常規劃為？", options: ["商業區", "工業區", "農業區", "漁業區"], answer: 0, hints: ["人潮與商店集中", "工業多在郊外"], explanation: "市中心人潮密集、商店集中，通常規劃為商業區。" },
    { id: "sh-geo-urban-3", prompt: "人口轉型理論的最後階段是？", options: ["低出生低死亡", "高出生高死亡", "高出生低死亡", "低出生高死亡"], answer: 0, hints: ["發展成熟後兩者都低", "現代社會的型態"], explanation: "人口轉型最後進入低出生率、低死亡率的穩定階段。" },
    { id: "sh-geo-urban-4", prompt: "台灣目前人口結構的主要挑戰是？", options: ["少子化與高齡化", "人口爆炸", "只有年輕人", "沒有老人"], answer: 0, hints: ["出生率下降、壽命延長", "扶養比上升"], explanation: "台灣面臨少子化與高齡化，老年人口占比上升、扶養壓力增加。" },
    { id: "sh-geo-urban-5", prompt: "人口金字塔呈「鐘型、中間寬」通常代表？", options: ["高齡化社會", "年輕人口極多", "戰爭中", "農業社會"], answer: 0, hints: ["中老年人多", "和少子高齡有關"], explanation: "鐘型（中間寬、上下窄）反映中老年人口多，是高齡化社會的特徵。" },
    { id: "sh-geo-urban-6", prompt: "都市市中心多為商業區，背後的主要機制是？", options: ["市中心地價高、只有商業付得起租金", "市中心沒有人潮", "商業最喜歡偏僻處", "工業願付最高租金"], answer: 0, hints: ["地租最高", "商業付得起"], explanation: "市中心地價與租金最高，商業活動付得起高租金而聚集，住宅、工業則外移到較便宜的區位。" },
    { id: "sh-geo-urban-7", prompt: "下列哪一項是緩解都市擁擠與高房價的常見對策？", options: ["興建社會住宅與完善大眾運輸", "把所有工廠蓋進市中心", "完全不做都市計畫", "禁止人們進城"], answer: 0, hints: ["增加平價住宅", "改善通勤"], explanation: "興建社會住宅、完善大眾運輸系統並配合都市計畫，有助緩解都市擁擠與高房價問題。" },
  ],
};

const SH_GEO_HAZARD: OnionLesson = {
  id: "sh-geo-hazard",
  title: "自然災害與調適：颱風、地震、洪水",
  subject: "地理",
  topic: "自然災害與調適",
  grade: "高三",
  stages: ["高中"],
  desc: "颱風帶豪雨暴潮、地震源自板塊、洪水土石流看地形；調適靠工程與非工程手段並用。",
  takeaways: ["颱風帶豪雨強風與暴潮；地震源自板塊交界，震源淺近都市災情重", "洪水易發於排水不良平原、土石流在陡坡暴雨時", "調適靠工程（堤防）與非工程（預警、土地利用、演練）並用", "地震時記得趴下、掩護、穩住；洪水看低窪下游、土石流看陡坡溪谷"],
  frames: [
    { step: "步驟 1：多災的台灣", id: 1, caption: "嗨！颱風、地震、洪水——台灣位在多災的地理位置，認識災害才能真正防備。", action: "wave", prop: { kind: "none" }, duration: 3200 },
    { step: "步驟 2：颱風的三件套", id: 2, caption: "颱風從海面形成、沿路徑逼近，帶來豪雨與強風，登陸時還可能掀起「暴潮」，淹沒低窪的海岸。", action: "point", prop: { kind: "text", text: "颱風：豪雨＋強風＋暴潮", sub: "沿路徑逼近、低窪易淹", tone: "warn" }, duration: 3800 },
    { step: "步驟 3：地震源自板塊", id: 3, caption: "台灣在板塊交界，岩層錯動釋放能量就成地震；震源越淺、離都市越近，災情通常越重。", ask: { prompt: "台灣地震頻繁，主要因為？", options: ["位於板塊交界", "靠近北極", "火山很多", "颱風造成"], answer: 0, hint: "想到菲律賓海板塊與歐亞板塊。" }, action: "think", prop: { kind: "text", text: "地震：板塊交界、岩層錯動", sub: "震源淺、離都市近 → 災情重", tone: "warn" }, duration: 3800 },
    { step: "步驟 4：地震時怎麼自保", id: 4, caption: "避難觀念：搖晃時記得「趴下、掩護、穩住」，躲在堅固桌子下護住頭頸；住家應事先把高處重物固定，避免掉落傷人。", ask: { prompt: "地震強烈搖晃時，第一個正確動作是？", options: ["立刻衝到樓下", "趴下、掩護頭頸並穩住", "站在窗邊看", "搭電梯逃生"], answer: 1, hint: "先保護頭頸、穩住身體，再視情況避難。" }, action: "think", prop: { kind: "text", text: "地震避難：趴下·掩護·穩住", sub: "固定高處重物、準備避難包", tone: "warn" }, duration: 3800 },
    { step: "步驟 5：雨量門檻與致災", id: 5, caption: "用雨量看門檻：24 小時累積雨量，普通下雨約 50 毫米，致災暴雨可超過 200 毫米，就容易引發洪水與土石流。", action: "jump", prop: { kind: "bars", items: [{ label: "普通雨", value: 50 }, { label: "致災暴雨", value: 200 }], unit: "毫米", active: 1 }, duration: 3800 },
    { step: "步驟 6：洪水與土石流的位置", id: 6, caption: "空間分布：洪水多發生在排水不良的低窪平原與河川下游；土石流則在溪谷上游的陡坡，暴雨時鬆動土石隨水沖下。", action: "think", prop: { kind: "balance", left: "洪水：低窪平原下游", right: "土石流：陡坡溪谷上游", tip: "看地形與位置判斷" }, duration: 3800 },
    { step: "步驟 7：調適而非硬擋", id: 7, caption: "面對災害，我們可以「調適」：提前預警、把房子蓋在安全的地方、平常就要演練，減少傷亡。", ask: { prompt: "下列哪一個屬於「非工程」的防災手段？", options: ["土地利用規劃與預警", "興建更高的堤防", "購買發電機", "開採礦產"], answer: 0, hint: "不改硬體、靠制度與行為的那一類。" }, action: "point", prop: { kind: "text", text: "調適：預警＋避開危險地", sub: "平時演練、蓋在安全處", tone: "ok" }, duration: 3800 },
    { step: "步驟 8：工程與非工程並用", id: 8, caption: "調適分兩手：工程手段（堤防、疏濬）做硬體防護；非工程手段（預警、土地利用規劃、演練）減少傷亡。", action: "walk", prop: { kind: "flow", steps: ["工程：堤防疏濬", "非工程：預警", "土地利用規劃", "防災演練"], active: 3 }, duration: 3800 },
    { step: "步驟 9：記防災調適口訣", id: 9, caption: "口訣：颱風豪雨暴潮、地震在板塊；洪水看平原、土石流看陡坡，工程非工程都要做。準備闖關！", action: "cheer", prop: { kind: "none" }, duration: 3000 },
  ],
  questions: [
    { id: "sh-geo-hazard-1", prompt: "颱風登陸時常伴隨哪種海岸災害？", options: ["暴潮", "地震", "土石流", "乾旱"], answer: 0, hints: ["強風推擠海水堆高", "低窪海岸最危險"], explanation: "颱風強風推擠海水形成風暴潮，易淹沒低窪海岸。" },
    { id: "sh-geo-hazard-2", prompt: "台灣地震頻繁的主因是？", options: ["位於板塊交界", "靠近北極", "颱風引起", "火山噴發"], answer: 0, hints: ["兩個板塊擠壓", "岩層容易錯動"], explanation: "台灣位於菲律賓海板塊與歐亞板塊交界，地殼活動頻繁。" },
    { id: "sh-geo-hazard-3", prompt: "下列哪一處容易發生土石流？", options: ["陡坡且遇暴雨", "平坦沙漠", "高山頂無雨", "城市中心"], answer: 0, hints: ["鬆動土石＋水流", "坡度大才沖得下來"], explanation: "土石流多發生在陡坡，暴雨使鬆動土石隨水流下沖。" },
    { id: "sh-geo-hazard-4", prompt: "24 小時累積雨量超過約多少毫米容易致災？", options: ["200", "50", "10", "1000"], answer: 0, hints: ["是普通雨量的好幾倍", "對照致災暴雨的門檻"], explanation: "24 小時累積雨量超過約 200 毫米即達致災暴雨等級，易引發洪水與土石流。" },
    { id: "sh-geo-hazard-5", prompt: "下列哪一個是「非工程」防災手段？", options: ["土地利用規劃與預警演練", "興建更高堤防", "挖掘深水庫", "鋪設馬路"], answer: 0, hints: ["靠制度與行為", "不是蓋硬體"], explanation: "非工程手段包括土地利用規劃、預警系統與防災演練，不靠硬體建設。" },
    { id: "sh-geo-hazard-6", prompt: "強烈地震搖晃當下，較恰當的第一個動作是？", options: ["趴下、掩護頭頸並穩住", "立刻衝下樓", "站在窗邊觀察", "搭電梯逃生"], answer: 0, hints: ["先保護頭頸", "穩住再移動"], explanation: "地震時應先趴下、以堅固遮蔽物保護頭頸並穩住身體，避免掉落物與玻璃傷及自身。" },
    { id: "sh-geo-hazard-7", prompt: "土石流最容易發生在下列哪種環境？", options: ["溪谷上游陡坡、暴雨時", "平坦的市中心", "乾燥沙漠", "高山頂無雨處"], answer: 0, hints: ["陡坡＋鬆動土石＋大雨", "溪谷才有水流沖下"], explanation: "土石流需陡坡、鬆動土石與大量雨水條件，多發生在溪谷上游的陡坡區。" },
  ],
};

export default [
  SH_GEO_GIS,
  SH_GEO_CLIMATE_TYPE,
  SH_GEO_GLOBALIZATION,
  SH_GEO_TAIWAN_REGION,
  SH_GEO_URBAN,
  SH_GEO_HAZARD,
];
