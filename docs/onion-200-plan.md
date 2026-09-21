# 洋蔥學院 200 堂課擴充計畫（累計 200 堂：國小 70／國中 65／高中 65）

> 這份文件是產課的**唯一課表**。每位寫手只認領自己那一節，照著 id、科目、年級、核心概念與圖解建議寫，
> 不要自己加課、不要改別人的課，避免重複與衝突。
>
> 每堂課的格式與現有課程完全相同（見 `client/src/game/onion/lessons/` 內既有檔案）：
> 7 幀分鏡（每幀都有 `step` 步驟標籤、caption、action、prop、duration，至少 2 幀有 `ask`）＋ 5 題闖關（含 2 級提示與詳解）＋ 3 條 takeaways。
> 寫完後跑 `npm run qc:onion` 確認自己那幾堂沒有問題。

> **撰寫規格**：怎麼寫一堂課（檔案結構、分鏡、教具與字幕一致性、題目規則、驗證指令）
> 請看 `docs/onion-authoring-spec.md`；本文件負責「要寫哪些課」。

## 設計原則（務求巧妙、循序漸進）

1. **一步一觀念**：7 幀就是 7 個步驟，順序固定為「引起動機 → 拆解觀念 1 → 觀念 2（中途提問）→ 動手算／推導（中途提問）→ 對照或易錯點 → 統整 → 口訣」。步驟標籤寫「步驟 N：具體動作」，不要寫「步驟 N：說明」這種空話。
2. **圖解要真的畫得出那個概念**：
   - 量的大小比較 → `bars`（值必須與字幕提到的數字一致）
   - 分數／比例 → `pie`、`pies`（a/b 必須與字幕的分數一致）
   - 等量公理／方程式／平衡 → `balance`
   - 有先後或因果 → `flow`
   - 循環（水循環、細胞週期、生態循環）→ `cycle`
   - 定義、口訣、對照表 → `text`
   - 面積幾何 → `shape`
3. **中途提問**放在學生最容易卡住的地方（不是放在結尾），提示要指出「往哪個方向想」而不是直接給答案。
4. **闖關 5 題**依難度排序：2 題基本觀念、2 題應用、1 題易錯或跨概念；詳解要寫「為什麼」，不要只寫答案。
5. 用臺灣課綱用語與繁體中文；數學用全形運算符號（＋ − × ÷ ＝）。

## 學段與科目配額

| 學段 | 現有 | 本計畫新增 | 目標 |
|---|---|---|---|
| 國小 | 20 | 50（數學 14／自然 12／社會 10／國語 8／英語 6） | 70 |
| 國中 | 20 | 45（數學 12／自然 10／社會 8／國語 7／英語 8） | 65 |
| 高中 | 0 | 65（數學 10／物理 8／化學 8／生物 8／地科 6／歷史 6／地理 6／公民 5／國文 4／英文 4） | 65 |

---

## 一、國小新增 50 堂

### 數學 14 堂（檔名建議 `elementary-math-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| el-math-decimal-multiply | 五上 | 小數的乘法 | 小數乘法先當整數算，再點小數點 | text → bars → flow |
| el-math-decimal-divide | 五下 | 小數的除法 | 除數是小數時先放大成整數 | flow → balance |
| el-math-fraction-divide | 六上 | 分數除以整數 | 除以 n 等於乘以 1/n | pie → pies → text |
| el-math-percent | 六上 | 百分比與打折 | 百分率＝部分÷全部；打折＝原價×折扣 | bars → text |
| el-math-ratio | 六下 | 比與比值 | 前項：後項、比值＝前項÷後項 | balance → text |
| el-math-polygon-area | 五上 | 平行四邊形與梯形面積 | 平行四邊形＝底×高；梯形＝（上底＋下底）×高÷2 | shape |
| el-math-scale-drawing | 六上 | 比例尺與縮放圖 | 比例尺 1:100 的意義 | text → flow |
| el-math-calendar | 三上 | 年月日與日期計算 | 大月小月、平年閏年、日期相差 | text → flow |
| el-math-weight-capacity | 三下 | 重量與容量 | 公斤／公克、公升／毫升的換算 | bars → flow |
| el-math-money | 三上 | 錢幣與找錢 | 付錢、找錢、單位換算 | bars → text |
| el-math-triangle-angles | 四上 | 三角形的角度和 | 三角形內角和 180 度 | shape → bars |
| el-math-symmetry | 四下 | 線對稱圖形 | 對稱軸、對稱點的距離相等 | shape → text |
| el-math-average | 六上 | 平均數 | 平均＝總和÷個數，用來代表整體 | bars → text |
| el-math-two-step | 四上 | 兩步驟應用問題 | 先算什麼、再算什麼（拆題） | flow |

### 自然 12 堂（`elementary-science-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| el-sci-magnet | 三下 | 磁鐵的奧祕 | 同極相斥、異極相吸；磁力隔空作用 | text → flow |
| el-sci-light-shadow | 四上 | 光與影子 | 光直線前進，擋住就形成影子 | text → shape |
| el-sci-sound | 四上 | 聲音的產生與傳播 | 振動產生聲音，需要介質 | bars → flow |
| el-sci-water-states | 三上 | 水的三態 | 固態／液態／氣態與變化條件 | cycle |
| el-sci-air-wind | 三上 | 空氣與風 | 空氣佔有空間、流動成風 | flow → text |
| el-sci-weather-watch | 四下 | 天氣觀測 | 溫度、雨量、風向的觀測 | bars → text |
| el-sci-moon-phase | 四下 | 月相的變化 | 農曆初一到三十的月相規律 | cycle |
| el-sci-sun-shadow | 五上 | 太陽與竿影 | 影子長短與太陽高度的關係 | bars → flow |
| el-sci-simple-circuit | 四上 | 讓燈泡亮起來 | 電池、導線、燈泡形成通路 | flow → text |
| el-sci-seed | 五上 | 種子的旅行與發芽 | 傳播方式與發芽條件 | flow → cycle |
| el-sci-animal-adapt | 六上 | 動物的構造與適應 | 構造配合環境（喙、腳、保護色） | text → bars |
| el-sci-ecosystem | 六下 | 生態系與環境保護 | 生物與環境互相影響、棲地保護 | cycle → flow |

### 社會 10 堂（`elementary-social-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| el-soc-family | 三上 | 家庭與我 | 家庭成員的關係與分工 | flow → text |
| el-soc-school-rules | 三上 | 校園生活與規則 | 規則讓大家安心學習 | text → flow |
| el-soc-community | 三下 | 社區與家鄉 | 社區資源與公共設施 | text → bars |
| el-soc-map-direction | 四上 | 地圖與方位 | 上北下南、比例尺、圖例 | text → flow |
| el-soc-taiwan-early | 四上 | 臺灣早期的開發 | 原住民、荷西、明鄭、清領 | flow |
| el-soc-festivals | 三下 | 臺灣的節慶習俗 | 春節、端午、中秋、原住民祭典 | text → cycle |
| el-soc-government | 六上 | 政府的角色與選舉 | 政府提供服務、人民投票 | flow → text |
| el-soc-consumption | 六下 | 消費與理財 | 需要與想要、記帳、儲蓄 | bars → text |
| el-soc-global | 六下 | 世界大不同與國際交流 | 文化差異與尊重、國際組織 | text → flow |
| el-soc-transport | 四下 | 交通與通訊的演變 | 從步行到高鐵、從書信到網路 | flow |

### 國語 8 堂（`elementary-language-add.ts` 前半）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| el-chi-idiom | 五上 | 成語的運用 | 看情境選成語、避免望文生義 | text → flow |
| el-chi-rhetoric | 五上 | 譬喻與擬人 | 把 A 比作 B、把物當人寫 | text → balance |
| el-chi-poem-rhythm | 四上 | 詩歌的節奏 | 押韻、停頓、朗讀語氣 | text → flow |
| el-chi-structure | 五下 | 段落的總分總 | 總說、分說、總結 | flow → text |
| el-chi-letter | 四上 | 書信與便條 | 稱謂、問候、署名、日期 | text → flow |
| el-chi-typo | 三下 | 形近字與錯別字 | 用部首與字義辨字 | text → balance |
| el-chi-main-idea | 六上 | 找出文章主旨 | 從關鍵句與重複出現的概念找 | flow → text |
| el-chi-quotation | 五下 | 引號的用法 | 引用話語與特別指稱 | text → balance |

### 英語 6 堂（`elementary-language-add.ts` 後半）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| el-eng-phonics | 三上 | 字母與自然發音 | 字母與常見發音對應 | text → flow |
| el-eng-greeting | 三上 | 問候與自我介紹 | Hello / My name is / Nice to meet you | text → flow |
| el-eng-numbers | 三下 | 數字與年齡 | one–twenty、How old are you | bars → text |
| el-eng-colors-shapes | 三下 | 顏色與形狀 | 顏色形容詞＋名詞順序 | text → shape |
| el-eng-family | 四上 | 家庭成員 | father/mother/brother… 所有格 | flow → text |
| el-eng-routine | 五上 | 日常作息與時間 | What time do you…? 時間表達 | flow → bars |

---

## 二、國中新增 45 堂

### 數學 12 堂（`junior-math-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| jh-math-integer-ops | 七上 | 整數的四則運算 | 負數的加減乘除與括號 | numberLine → flow |
| jh-math-fraction-ops | 七上 | 分數的四則運算 | 通分、約分、乘除 | pie → pies |
| jh-math-inequality | 七下 | 一元一次不等式 | 移項與乘除負數要變號 | balance → numberLine |
| jh-math-square-root | 八上 | 平方根與根號化簡 | √ 的意義、化簡與估算 | text → bars |
| jh-math-poly-formula | 八上 | 乘法公式與多項式 | (a+b)²、平方差公式 | flow → text |
| jh-math-quadratic-formula | 九上 | 一元二次方程式公式解 | 判別式與公式解 | text → flow |
| jh-math-congruence | 八下 | 三角形全等與幾何證明 | SSS/SAS/ASA 與推理 | shape → flow |
| jh-math-circle | 九上 | 圓的性質 | 弦、切線、圓心角與圓周角 | shape → text |
| jh-math-statistics | 九上 | 統計圖表與資料分析 | 平均數、中位數、眾數、全距 | bars → text |
| jh-math-probability-tree | 九下 | 樹狀圖與機率 | 列出所有可能再算機率 | flow → text |
| jh-math-similar | 九上 | 相似三角形 | 對應角相等、對應邊成比例 | shape → balance |
| jh-math-linear-function | 八下 | 函數與直線圖形 | y＝ax＋b 的圖形與斜率 | text → flow |

### 自然 10 堂（`junior-science-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| jh-sci-measurement | 七上 | 測量與單位 | 長度、體積、質量與估計值 | bars → flow |
| jh-sci-microscope | 七上 | 顯微鏡操作 | 對光、焦距、放大倍率 | flow → text |
| jh-sci-digestion | 七下 | 消化與營養 | 消化道順序、酵素、均衡飲食 | flow → bars |
| jh-sci-circulation | 七下 | 血液循環與呼吸 | 體循環、肺循環、氣體交換 | cycle → flow |
| jh-sci-plant-transport | 七下 | 植物的運輸 | 木質部運水、韌皮部運養分、蒸散 | flow → text |
| jh-sci-optics | 八上 | 光的反射與折射 | 反射定律、折射偏折 | text → shape |
| jh-sci-heat | 八上 | 溫度與熱量 | 比熱、熱量計算、熱平衡 | bars → balance |
| jh-sci-chemical-reaction | 八下 | 化學反應與質量守恆 | 原子不變、係數平衡 | balance → flow |
| jh-sci-electromagnet | 九上 | 電磁鐵與電磁感應 | 電流產生磁、變化產生電 | flow → text |
| jh-sci-weather-front | 九上 | 天氣與鋒面 | 冷鋒、暖鋒、滯留鋒與降雨 | flow → cycle |

### 社會 8 堂（`junior-social-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| jh-soc-ancient-china | 七上 | 中國古代文明與朝代 | 朝代更替與重要發明 | flow → text |
| jh-soc-taiwan-japanese | 七下 | 日治時期的臺灣 | 殖民統治、基礎建設與抗爭 | flow → text |
| jh-soc-taiwan-river | 七上 | 臺灣的河流與水文 | 河川特色、水資源利用 | bars → flow |
| jh-soc-population | 八上 | 人口分布與都市化 | 人口密度、都市形成 | bars → flow |
| jh-soc-china-region | 七上 | 中國的地理環境與區域 | 地形、氣候與區域差異 | text → bars |
| jh-soc-world-climate | 八下 | 世界氣候與文化分區 | 氣候類型與生活方式 | flow → text |
| jh-soc-constitution | 八上 | 憲法與人民權利 | 基本權利與義務 | text → flow |
| jh-soc-trade | 九下 | 市場經濟與國際貿易 | 供需、比較利益、全球化 | balance → flow |

### 國語 7 堂（`junior-chinese-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| jh-chi-classical-intro | 七上 | 文言文入門 | 之、其、而、以的常見用法 | text → flow |
| jh-chi-tang-poem | 八上 | 唐詩賞析 | 絕句、律詩與意象 | text → flow |
| jh-chi-argument | 八下 | 議論文的論點與論據 | 論點、論據、論證 | flow → text |
| jh-chi-idiom-origin | 七下 | 成語典故 | 典故來源與正確用法 | text → flow |
| jh-chi-narrative-order | 七上 | 記敘文的順敘與倒敘 | 時間線安排與效果 | flow |
| jh-chi-classical-translate | 八上 | 文言翻譯技巧 | 補主詞、調語序、換詞義 | flow → text |
| jh-chi-description | 七下 | 描寫手法 | 視覺、聽覺、觸覺描寫 | text → bars |

### 英語 8 堂（`junior-english-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| jh-eng-past | 七下 | 過去簡單式 | 規則與不規則動詞、did | flow → text |
| jh-eng-future | 八上 | 未來式 will / be going to | 兩種未來式的差別 | text → flow |
| jh-eng-comparative | 八上 | 比較級與最高級 | -er/-est、more/most、than | bars |
| jh-eng-gerund | 八下 | 動名詞與不定詞 | V-ing / to V 的用法 | text → flow |
| jh-eng-relative | 九上 | 關係子句 | who / which / that | flow → text |
| jh-eng-conjunction | 八下 | 連接詞與副詞子句 | because / when / if | flow |
| jh-eng-reading-skill | 九上 | 閱讀測驗技巧 | 找主題句與關鍵字 | flow → text |
| jh-eng-email | 九下 | 英文書信與 e-mail | 稱謂、正文、結尾 | text → flow |

---

## 三、高中新增 65 堂

### 數學 10 堂（`senior-math-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-math-polynomial | 高一 | 多項式函數 | 次數、圖形、根與因式定理 | text → flow |
| sh-math-exp-log | 高一 | 指數與對數 | 指數律、log 定義與換底 | bars → text |
| sh-math-trig | 高二 | 三角函數 | 弧度、sin/cos/tan、正弦定理 | shape → text |
| sh-math-line-circle | 高二 | 直線與圓 | 斜率、距離、圓方程式 | text → flow |
| sh-math-sequence | 高二 | 數列與級數 | 等差、等比、Σ 記號 | bars → flow |
| sh-math-permutation | 高二 | 排列組合 | 加法與乘法原理、C 與 P | flow → text |
| sh-math-probability | 高二 | 機率與統計 | 條件機率、期望值、常態 | bars → text |
| sh-math-matrix | 高三 | 矩陣 | 矩陣運算與線性方程 | text → flow |
| sh-math-vector | 高三 | 向量 | 內積、夾角、平面方程式 | shape → text |
| sh-math-calculus-intro | 高三 | 微積分初步 | 極限、導數的意義、面積 | flow → text |

### 物理 8 堂（`senior-physics-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-phy-kinematics | 高一 | 運動學 | 位移、速度、加速度與 v-t 圖 | bars → flow |
| sh-phy-newton | 高一 | 牛頓運動定律 | 慣性、F＝ma、作用反作用 | balance → flow |
| sh-phy-work-energy | 高一 | 功與能量 | 動能、位能、能量守恆 | flow → bars |
| sh-phy-momentum | 高二 | 動量與碰撞 | 動量守恆、彈性碰撞 | balance → flow |
| sh-phy-circular | 高二 | 圓周運動與萬有引力 | 向心力、衛星運動 | shape → text |
| sh-phy-wave | 高二 | 波動 | 波長、頻率、干涉與繞射 | text → flow |
| sh-phy-thermo | 高二 | 熱學 | 熱膨脹、比熱、熱力學定律 | bars → text |
| sh-phy-circuit | 高三 | 電流與電路（高中版） | 歐姆定律、串並聯、電功率 | flow → balance |

### 化學 8 堂（`senior-chemistry-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-chem-atom | 高一 | 原子結構與週期表 | 質子中子電子、週期趨勢 | text → bars |
| sh-chem-bond | 高一 | 化學鍵 | 離子鍵、共價鍵、金屬鍵 | flow → text |
| sh-chem-stoichiometry | 高一 | 化學計量 | 莫耳、係數與質量關係 | balance → flow |
| sh-chem-acid-base | 高二 | 酸鹼與中和 | pH、指示劑、中和反應 | numberLine → text |
| sh-chem-redox | 高二 | 氧化還原 | 氧化數、電子轉移 | flow → balance |
| sh-chem-organic | 高二 | 有機化合物 | 烷烯炔、官能基 | text → flow |
| sh-chem-equilibrium | 高三 | 化學平衡 | 可逆反應、勒沙特列原理 | balance → flow |
| sh-chem-solution | 高三 | 溶液與濃度 | 莫耳濃度、稀釋 | bars → text |

### 生物 8 堂（`senior-biology-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-bio-cell | 高一 | 細胞的構造與功能 | 胞器分工、膜運輸 | flow → text |
| sh-bio-genetics | 高一 | 孟德爾遺傳 | 顯隱性、棋盤方格 | bars → flow |
| sh-bio-dna | 高二 | DNA 與基因表現 | 複製、轉錄、轉譯 | flow → text |
| sh-bio-evolution | 高二 | 演化 | 天擇、適應與共同祖先 | flow → cycle |
| sh-bio-ecology | 高二 | 生態系與能量流動 | 食物網、能量塔 | cycle → bars |
| sh-bio-plant-physiology | 高二 | 植物生理 | 光合作用、蒸散、激素 | flow → text |
| sh-bio-human-body | 高三 | 人體生理整合 | 神經、內分泌與恆定 | flow → cycle |
| sh-bio-biotech | 高三 | 生物科技 | PCR、基因轉殖、倫理 | flow → text |

### 地球科學 6 堂（`senior-earth-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-earth-structure | 高一 | 地球的構造與板塊 | 分層、板塊邊界類型 | cycle → flow |
| sh-earth-quake | 高一 | 地震與地震波 | P 波 S 波、震度與規模 | bars → flow |
| sh-earth-atmosphere | 高一 | 大氣與天氣系統 | 大氣分層、氣壓與風 | flow → text |
| sh-earth-ocean | 高二 | 海洋與洋流 | 洋流、潮汐、聖嬰現象 | cycle → flow |
| sh-earth-astronomy | 高二 | 天文與星系 | 太陽系、恆星演化、光年 | flow → text |
| sh-earth-geologic-time | 高二 | 地質時間 | 相對與絕對定年、化石 | flow |

### 歷史 6 堂（`senior-history-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-hist-east-asia | 高一 | 東亞史的變遷 | 中原王朝與周邊互動 | flow → text |
| sh-hist-taiwan-modern | 高一 | 臺灣近現代史 | 清領、日治到戰後 | flow |
| sh-hist-renaissance | 高二 | 文藝復興到工業革命 | 思想、科學與技術變革 | flow → text |
| sh-hist-world-wars | 高二 | 兩次世界大戰 | 起因、經過與影響 | flow |
| sh-hist-cold-war | 高三 | 冷戰與兩極體系 | 圍堵、代理戰爭、解體 | flow → text |
| sh-hist-global-now | 高三 | 當代世界 | 全球化、區域整合與挑戰 | flow → text |

### 地理 6 堂（`senior-geo-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-geo-gis | 高一 | 地圖與地理資訊 | 座標、等高線、GIS | text → flow |
| sh-geo-climate-type | 高一 | 氣候類型 | 氣候分類與成因 | bars → flow |
| sh-geo-globalization | 高二 | 世界經濟與全球化 | 分工、供應鏈、跨國企業 | flow → text |
| sh-geo-taiwan-region | 高二 | 臺灣區域發展 | 區域差異與產業轉型 | bars → flow |
| sh-geo-urban | 高二 | 都市與人口 | 都市化、人口轉型 | flow → bars |
| sh-geo-hazard | 高三 | 自然災害與調適 | 颱風、地震、洪水與防災 | flow → text |

### 公民 5 堂（`senior-civics-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-civ-democracy | 高一 | 民主政治與憲政 | 主權在民、權力分立 | flow → text |
| sh-civ-economics | 高一 | 經濟學基礎 | 機會成本、供需、市場失靈 | balance → flow |
| sh-civ-law | 高二 | 法律與生活 | 民法、刑法、救濟途徑 | flow → text |
| sh-civ-global-org | 高二 | 國際組織與全球化 | 聯合國、WTO、區域組織 | text → flow |
| sh-civ-media-literacy | 高三 | 媒體識讀 | 假訊息辨識、媒體立場 | text → flow |

### 國文 4 堂（`senior-chinese-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-chi-classical-reading | 高一 | 文言文閱讀策略 | 斷句、虛詞、人物關係 | flow → text |
| sh-chi-poetry | 高二 | 詩詞曲選 | 詩、詞、曲的形式差異 | text → flow |
| sh-chi-prose | 高二 | 現代散文賞析 | 意象、節奏與情感 | text → flow |
| sh-chi-essay-writing | 高三 | 論說文寫作 | 立論、舉證、駁論、結論 | flow → text |

### 英文 4 堂（`senior-english-add.ts`）
| id | 年級 | 課名 | 核心概念 | 圖解建議 |
|---|---|---|---|---|
| sh-eng-tenses | 高一 | 時態總整理 | 12 時態的軸線與用法 | flow → text |
| sh-eng-subjunctive | 高二 | 假設語氣 | if 子句與過去式、過去完成 | flow → text |
| sh-eng-participle | 高二 | 分詞與分詞構句 | 現在分詞、過去分詞簡化子句 | flow → text |
| sh-eng-reading-writing | 高三 | 閱讀與寫作整合 | 摘要、轉述、段落寫作 | flow → text |

---

## 驗收

- `npm run qc:onion`：0 問題（步驟標籤、圖解一致性、題目結構、規模門檻 200 堂）
- `npx tsc --noEmit`：0 錯誤
- `vitest run client/src/game/onionAcademyContent.test.ts`：全過

## 產出方式（給後續接手的人）
- 一堂課一檔放在 `client/src/game/onion/lessons/*.ts`，`export default` 一個 `OnionLesson[]`；
  主檔 `onionAcademyLessons.ts` 用 `import.meta.glob` 自動彙總，**新增課程不需要改主檔**。
- 撰寫規格看 `docs/onion-authoring-spec.md`；驗收看 `npm run qc:onion`。
- 多批並行撰寫時，**一批一檔、一位寫手一個檔**，避免搶同一個檔案。
