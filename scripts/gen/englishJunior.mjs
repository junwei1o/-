/**
 * 英語科「國中（七～九年級）」知識事實表。
 *
 * 原本 scripts/gen/english.mjs 只涵蓋三到六年級，國中完全沒有題目。
 * 這裡補上國中英文三大主軸：七年級基礎時態與疑問句、八年級比較級與完成式、
 * 九年級被動語態、關係子句與假設語氣。
 *
 * 格式：[主題, 年級, 題幹, [正解, 干擾1, 干擾2, 干擾3], 正確敘述, 常見迷思, 詳解]
 */
export const ENGLISH_JUNIOR_FACTS = [
  // ── 七年級 ───────────────────────────────────────────────────────
  ["過去式 be 動詞", 7, "I ___ at home yesterday. 空格應填入哪一個？", ["was", "am", "is", "were"], "過去式的 I／he／she／it 後面用 was。", "過去式不管主詞是誰都可以用 was。", "be 動詞過去式：I、he、she、it 用 was；you、we、they 用 were。"],
  ["規則動詞過去式", 7, "規則動詞的過去式通常在字尾加上什麼？", ["-ed", "-ing", "-s", "-ly"], "規則動詞的過去式在字尾加 -ed。", "所有動詞的過去式都是在字尾加 -s。", "規則動詞加 -ed（play → played），不規則動詞需另外記憶（go → went、eat → ate）。"],
  ["未來式", 7, "表示未來將發生的事，下列哪一句正確？", ["I will go to school tomorrow.", "I will goes to school tomorrow.", "I will going to school tomorrow.", "I will went to school tomorrow."], "未來式用 will 加原形動詞。", "will 後面的動詞要加 -ed 或 -ing。", "未來式句型為 will ＋ 原形動詞，不因主詞人稱而變化。"],
  ["there is / there are", 7, "There ___ three books on the desk. 空格應填入？", ["are", "is", "be", "am"], "there be 的動詞要與後面的名詞一致，複數用 are。", "there be 句型裡永遠只能用 is。", "There is 接單數或不可數名詞；There are 接複數名詞，動詞跟著後面的名詞走。"],
  ["疑問詞", 7, "想問「原因」時，應該用哪一個疑問詞？", ["why", "when", "where", "who"], "詢問原因用 why。", "詢問原因要用 when。", "常見疑問詞：who（人）、what（事物）、where（地點）、when（時間）、why（原因）、how（方法）。"],
  ["頻率副詞位置", 7, "頻率副詞 usually 在句子中的通常位置是？", ["放在一般動詞之前、be 動詞之後", "放在句尾", "放在主詞之前", "只能放在句首"], "頻率副詞放在一般動詞前、be 動詞後。", "頻率副詞只能放在句子的最後面。", "頻率副詞（always、usually、often、sometimes、never）置於一般動詞之前、be 動詞與助動詞之後。"],
  ["can 表能力", 7, "He can ___ basketball very well. 空格應填入？", ["play", "plays", "playing", "played"], "can 後面必須接原形動詞。", "can 後面的動詞要加 -s。", "情態助動詞 can、must、may 之後一律接原形動詞，不隨主詞變化。"],
  ["時間介系詞", 7, "表示「在星期一」時，正確的介系詞是？", ["on", "in", "at", "for"], "星期幾前面用介系詞 on。", "星期幾前面要用介系詞 in。", "時間介系詞：at 用於時刻、on 用於星期與特定日期、in 用於月份年份與時段。"],

  // ── 八年級 ───────────────────────────────────────────────────────
  ["現在完成式", 8, "現在完成式的正確結構是哪一個？", ["have／has ＋ 過去分詞", "have ＋ 原形動詞", "had ＋ 過去式", "having ＋ 過去分詞"], "現在完成式由 have 或 has 加過去分詞構成。", "現在完成式是 have 加上原形動詞。", "現在完成式表示過去發生而持續到現在、或與現在有關的經驗，結構為 have／has ＋ p.p.。"],
  ["比較級", 8, "形容詞比較級通常用於比較幾個人事物？", ["兩者之間的比較", "三者以上的比較", "完全不比較", "只用於最高級"], "比較級用於兩者比較，最高級用於三者以上。", "比較級是用在三個以上相比的場合。", "兩者相比用比較級（taller than），三者以上相比用最高級（the tallest）。"],
  ["最高級", 8, "形容詞最高級前面通常要加上哪一個字？", ["the", "a", "an", "of"], "最高級前面通常加定冠詞 the。", "最高級前面不能加任何冠詞。", "最高級句型為 the ＋ 最高級形容詞，常用 in 或 of 帶出比較範圍。"],
  ["連接詞", 8, "「因為下雨，所以我待在家」應使用哪一組連接詞？", ["because ... , so 不同時用，選其一", "because ... so 同時使用", "because ... but", "but ... so"], "英文中 because 與 so 不可同時使用。", "英文裡 because 和 so 一定要同時出現。", "英文一個句子只用一個主要連接詞，because（因為）與 so（所以）不能並用。"],
  ["不定詞", 8, "I want ___ a new bike. 空格應填入？", ["to buy", "buy", "buying", "bought"], "want 後面接 to 加原形動詞。", "want 後面的動詞要加 -ing。", "want、hope、decide、plan 等動詞後接不定詞 to V；enjoy、finish、mind 則接 V-ing。"],
  ["動名詞", 8, "She enjoys ___ in the park. 空格應填入？", ["walking", "walk", "to walk", "walked"], "enjoy 後面接動名詞 V-ing。", "enjoy 後面要接 to 加原形動詞。", "enjoy、finish、mind、practice 等動詞後面固定接動名詞（V-ing）。"],
  ["副詞形成", 8, "形容詞 quick 變成副詞，正確的寫法是？", ["quickly", "quicklyly", "quick", "quicky"], "形容詞加 -ly 變成副詞。", "形容詞變副詞時要重複字尾再加 -ly。", "多數形容詞直接加 -ly 形成副詞，用來修飾動詞、形容詞或整個句子。"],
  ["數量詞", 8, "「很多水」的正確英文是？", ["much water", "many water", "many waters", "a water"], "不可數名詞用 much 修飾。", "water 是可數名詞，要用 many。", "many 修飾可數名詞複數，much 修飾不可數名詞；a lot of 兩者都可用。"],

  // ── 九年級 ───────────────────────────────────────────────────────
  ["被動語態", 9, "The letter ___ by Tom yesterday. 空格應填入？", ["was written", "wrote", "is writing", "writes"], "被動語態為 be 動詞加過去分詞。", "被動語態直接用動詞過去式即可。", "被動語態結構為 be ＋ 過去分詞，必要時以 by 帶出動作執行者；時態由 be 動詞表現。"],
  ["關係代名詞", 9, "指人並當主詞用時，正確的關係代名詞是？", ["who", "which", "whose", "whom"], "指人且當主詞時用 who。", "指人的關係代名詞要用 which。", "who 指人（主格）、whom 為受格、whose 表所有格；which 指事物、that 兩者皆可用。"],
  ["假設語氣", 9, "與現在事實相反的假設，正確的句型是？", ["If I were you, I would ...", "If I am you, I will ...", "If I was you, I will ...", "If I be you, I would ..."], "與現在事實相反時，if 子句用過去式、主要子句用 would。", "與現在事實相反的假設，主要子句要用 will。", "與現在事實相反：If ＋ 主詞 ＋ 過去式（be 動詞用 were），主詞 ＋ would ＋ 原形動詞。"],
  ["完成式與過去式", 9, "I ___ my homework already. 空格應填入？", ["have finished", "finished", "finish", "am finishing"], "有 already 且強調已完成，用現在完成式。", "句中有 already 時一定要用過去簡單式。", "already、yet、just、ever、never 常搭配現在完成式；明確的過去時間點（yesterday、last year）則用過去簡單式。"],
  ["間接問句", 9, "Do you know where ___ ? 空格應填入？", ["he lives", "does he live", "does he lives", "he live"], "間接問句用直述句語序，不需倒裝。", "間接問句仍然要把助動詞放到主詞前面。", "間接問句（名詞子句）保持「主詞＋動詞」的直述語序，不加助動詞 do／does。"],
  ["look forward to", 9, "I look forward to ___ you soon. 空格應填入？", ["seeing", "see", "saw", "seen"], "look forward to 後面接動名詞。", "look forward to 後面要接原形動詞。", "look forward to 的 to 是介系詞，後面接名詞或動名詞（V-ing）。"],
  ["使役動詞", 9, "My mom made me ___ my room. 空格應填入？", ["clean", "to clean", "cleaning", "cleaned"], "使役動詞 make 後面接原形動詞。", "make 後面要接 to 加原形動詞。", "使役動詞 make、let、have 後接受詞再加原形動詞；被動時才會出現 to V。"],
  ["too … to", 9, "「這箱子太重，我搬不動」的正確說法是？", ["The box is too heavy for me to carry.", "The box is very heavy for me to carry.", "The box is too heavy for me carrying.", "The box is enough heavy for me to carry."], "too 加形容詞再加 to 加原形動詞，表示「太…而不能」。", "too … to 句型裡的 to 後面要接動名詞。", "too ＋ 形容詞 ＋ to V 表「太…以致不能」；enough 則放在形容詞之後，語意為「足夠…可以」。"],
];
