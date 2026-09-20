#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Insert a content-specific `step` label as the FIRST property of every frame,
and apply three prop/caption accuracy fixes.

The frame `id: N,` token appears exactly once per frame, in file order, so we
replace each occurrence with `step: "<label>", id: N,` using an ordered label
list that matches that exact frame order.
"""
import re

SRC = "client/src/game/onionAcademyLessons.ts"

# 256 labels in exact declaration/frame order (lessons 1..34).
labels = [
    # 1 FRACTION_LESSON (7)
    "步驟 1：認識披薩題目", "步驟 2：把披薩切四份", "步驟 3：吃掉一片是1/4",
    "步驟 4：朋友再拿兩片", "步驟 5：分母同加分子", "步驟 6：算出1/4加2/4",
    "步驟 7：記住同分母口訣",
    # 2 CHINESE_DE_LESSON (7)
    "步驟 1：三個字讀音同", "步驟 2：認識「的」接名詞", "步驟 3：認識「得」接動詞後",
    "步驟 4：認識「地」接動詞前", "步驟 5：背口訣分用法", "步驟 6：小心名詞用「的」",
    "步驟 7：準備闖關分三字",
    # 3 WATER_CYCLE_LESSON (7)
    "步驟 1：雨從哪裡來", "步驟 2：太陽加熱蒸發", "步驟 3：高空遇冷凝結",
    "步驟 4：水珠變重降水", "步驟 5：流回河海匯流", "步驟 6：四階段不停循環",
    "步驟 7：能量來自太陽",
    # 4 TRIANGLE_AREA_LESSON (7)
    "步驟 1：三角形面積之謎", "步驟 2：認識底和高", "步驟 3：兩個三角形拼平行四邊形",
    "步驟 4：平行四邊形底乘高", "步驟 5：三角形要再除以二", "步驟 6：公式底乘高除二",
    "步驟 7：記底乘高除二口訣",
    # 5 PHOTOSYNTHESIS_LESSON (10)
    "步驟 1：葉子像綠色工廠", "步驟 2：工廠需要三原料", "步驟 3：根吸水送葉子",
    "步驟 4：二氧化碳從氣孔進", "步驟 5：葉綠體是機器房", "步驟 6：陽光合成養分",
    "步驟 7：養分送到全身", "步驟 8：排出副產氧氣", "步驟 9：記光合作用公式",
    "步驟 10：口訣根送水吐氧",
    # 6 NEGATIVE_NUMBER_LESSON (10)
    "步驟 1：零下3度是什麼", "步驟 2：比0小用負號", "步驟 3：排成數線",
    "步驟 4：數線三要素", "步驟 5：往左開到負4", "步驟 6：往右加回數線",
    "步驟 7：右大左小比大小", "步驟 8：負數離零越遠越小", "步驟 9：距零相同是相反數",
    "步驟 10：口訣右大左小",
    # 7 LINEAR_EQUATION_LESSON (10)
    "步驟 1：天平上的神祕箱", "步驟 2：平衡寫成等式", "步驟 3：目標留住x",
    "步驟 4：兩邊同減3", "步驟 5：解出x等於5", "步驟 6：代回檢验算對",
    "步驟 7：移項要變號", "步驟 8：記移項變號口訣", "步驟 9：再試x減2等6",
    "步驟 10：總整理天平法",
    # 8 ONION_CELL_LESSON (10)
    "步驟 1：洋蔥介紹細胞", "步驟 2：細胞是最小單位", "步驟 3：撕表皮看格子",
    "步驟 4：細胞壁像牆壁", "步驟 5：細胞膜管進出", "步驟 6：細胞核是指揮",
    "步驟 7：液泡儲水倉庫", "步驟 8：植物才有細胞壁", "步驟 9：細胞組成個體",
    "步驟 10：口訣牆門核泡",
    # 9 PYTHAGOREAN_LESSON (10)
    "步驟 1：認識斜邊最長", "步驟 2：兩股長3和4", "步驟 3：三邊蓋正方形",
    "步驟 4：小杯9中杯16大杯25", "步驟 5：兩小杯倒出來", "步驟 6：倒進大杯剛滿",
    "步驟 7：換6和8算斜邊", "步驟 8：公式a平方加b平方等c平方", "步驟 9：已知斜邊求一股",
    "步驟 10：口訣斜邊平方",
    # 10 QUADRATIC_LESSON (10)
    "步驟 1：一次函數是直線", "步驟 2：x平方會轉彎", "步驟 3：先描點畫圖",
    "步驟 4：左右對稱y軸", "步驟 5：連成拋物線", "步驟 6：頂點在最低點",
    "步驟 7：負號開口朝下", "步驟 8：加常數上下移", "步驟 9：括號裡左右移",
    "步驟 10：口訣a正開口上",
    # 11 UNIT_CONVERSION_LESSON (7)
    "步驟 1：公分公尺公里比", "步驟 2：認識1公分", "步驟 3：100公分是1公尺",
    "步驟 4：1000公尺是1公里", "步驟 5：大換小用乘法", "步驟 6：小換大用除法",
    "步驟 7：記大乘小除口訣",
    # 12 FACTOR_MULTIPLE_LESSON (7)
    "步驟 1：12顆糖平分誰行", "步驟 2：分1人分2人", "步驟 3：整除與不能整除",
    "步驟 4：能整除的是因數", "步驟 5：一直加是倍數", "步驟 6：因數有限倍數無限",
    "步驟 7：記因數倍數口訣",
    # 13 FRACTION_MULTIPLY_LESSON (7)
    "步驟 1：1/4塊蛋糕三份", "步驟 2：疊兩個1/4看", "步驟 3：1/4乘3等於3/4",
    "步驟 4：規則動分子", "步驟 5：試2/5乘3", "步驟 6：假分數變帶分數",
    "步驟 7：記乘整數動分子",
    # 14 PUNCTUATION_LESSON (7)
    "步驟 1：標點像紅綠燈", "步驟 2：逗號是黃燈", "步驟 3：句號是紅燈",
    "步驟 4：問號用來發問", "步驟 5：驚嘆號有情緒", "步驟 6：四種燈號記起來",
    "步驟 7：記標點口訣",
    # 15 FOOD_CHAIN_LESSON (7)
    "步驟 1：草原三角色", "步驟 2：草被兔吃箭頭", "步驟 3：鷹吃兔能量傳",
    "步驟 4：植物是生產者", "步驟 5：吃人的是消費者", "步驟 6：分解者收尾",
    "步驟 7：記箭頭指吃方",
    # 16 STAT_CHART_LESSON (7)
    "步驟 1：最愛水果調查", "步驟 2：畫成長條圖", "步驟 3：先讀標題單位",
    "步驟 4：找最長最短", "步驟 5：相差用減法", "步驟 6：總共全部加",
    "步驟 7：記讀圖三步驟",
    # 17 PHOTOSYNTHESIS_JUNIOR_LESSON (7)
    "步驟 1：拆開葉綠體", "步驟 2：葉綠餅與基質", "步驟 3：光反應拆水放氧",
    "步驟 4：暗反應在基質", "步驟 5：暗反應固定CO2", "步驟 6：總反應式平衡",
    "步驟 7：對照呼吸作用",
    # 18 CHEMICAL_CHANGE_LESSON (7)
    "步驟 1：融化生鏽兩回事", "步驟 2：冰融是物理變化", "步驟 3：形狀變是物理",
    "步驟 4：鐵生鏽新物質", "步驟 5：產新物質是化學", "步驟 6：化學變化四線索",
    "步驟 7：有無新物質判斷",
    # 19 CELL_DIVISION_LESSON (7)
    "步驟 1：分裂長大身體", "步驟 2：先複製染色體", "步驟 3：染色體排隊",
    "步驟 4：染色體分離", "步驟 5：一分為二", "步驟 6：子細胞數目相同",
    "步驟 7：記複製分離口訣",
    # 20 SPEED_RATE_LESSON (7)
    "步驟 1：甲乙誰比較快", "步驟 2：同距比時間", "步驟 3：算速率公式",
    "步驟 4：100除20得5", "步驟 5：乙4甲5比大小", "步驟 6：速度多方向",
    "步驟 7：記速率除時間",
    # 21 PLATE_TECTONICS_LESSON (7)
    "步驟 1：地殼像拼圖", "步驟 2：岩石圈破成板塊", "步驟 3：板塊一年幾公分",
    "步驟 4：擠壓造山脈", "步驟 5：張裂造裂谷", "步驟 6：能量釋放地震",
    "步驟 7：記擠壓張裂地震",
    # 22 ENGLISH_TENSE_LESSON (7)
    "步驟 1：吃飯兩種說法", "步驟 2：簡單式表習慣", "步驟 3：every day關鍵字",
    "步驟 4：進行式表正在", "步驟 5：be加V-ing公式", "步驟 6：now等提示語",
    "步驟 7：記習慣與正在",
    # 23 CIRCLE_AREA_LESSON (7)
    "步驟 1：圓藏著π", "步驟 2：周長除直徑得π", "步驟 3：周長等直徑乘π",
    "步驟 4：半徑是直徑一半", "步驟 5：圓面積公式", "步驟 6：扇形拼長方形",
    "步驟 7：記周長面積口訣",
    # 24 BA_BEI_LESSON (7)
    "步驟 1：三種句子講", "步驟 2：基本句主動", "步驟 3：把字句主動者",
    "步驟 4：被字句承受者", "步驟 5：兩句意思同", "步驟 6：轉換口訣",
    "步驟 7：記主動被動口訣",
    # 25 TIME_TELLING_LESSON (7)
    "步驟 1：時針分針認", "步驟 2：一小時是60分", "步驟 3：1小時半小時比",
    "步驟 4：讀時刻方法", "步驟 5：3點30分怎讀", "步驟 6：經過時間用減",
    "步驟 7：記短針長針口訣",
    # 26 ANGLE_TYPES_LESSON (7)
    "步驟 1：角有名字", "步驟 2：認識角的組成", "步驟 3：比三種角度",
    "步驟 4：直角是90度", "步驟 5：鈍角介於中", "步驟 6：平角是180度",
    "步驟 7：記角度分類口訣",
    # 27 PLANT_PARTS_LESSON (7)
    "步驟 1：根莖葉分工", "步驟 2：根固定吸水", "步驟 3：莖支撐運輸",
    "步驟 4：葉做食物", "步驟 5：三部位合作", "步驟 6：循環根莖葉",
    "步驟 7：記根深莖直口訣",
    # 28 TAIWAN_GEO_LESSON (7)
    "步驟 1：認識家園台灣", "步驟 2：台灣在東南", "步驟 3：北回歸線通過",
    "步驟 4：五大地形", "步驟 5：山地最多", "步驟 6：人口集中平原",
    "步驟 7：記島鏈地形口訣",
    # 29 SYNONYM_ANTONYM_LESSON (7)
    "步驟 1：近義反義詞", "步驟 2：開心高興近義", "步驟 3：天平看近義",
    "步驟 4：冷熱意思相反", "步驟 5：天平看反義", "步驟 6：從上下文判斷",
    "步驟 7：記近義反義口訣",
    # 30 ELECTRIC_CIRCUIT_LESSON (7)
    "步驟 1：電燈為何亮", "步驟 2：通路閉合回路", "步驟 3：斷路不亮",
    "步驟 4：短路危險", "步驟 5：串聯並聯", "步驟 6：電流方向",
    "步驟 7：記通路短路口訣",
    # 31 FORCE_BALANCE_LESSON (7)
    "步驟 1：力與平衡", "步驟 2：力的兩種效應", "步驟 3：合力總效果",
    "步驟 4：兩力平衡條件", "步驟 5：靜止等速平衡", "步驟 6：平衡狀態整理",
    "步驟 7：記等大反向口訣",
    # 32 TAIWAN_CLIMATE_LESSON (7)
    "步驟 1：台灣氣候之謎", "步驟 2：低緯度高溫", "步驟 3：夏季西南季風",
    "步驟 4：冬季東北季風", "步驟 5：迎風坡多雨", "步驟 6：背風坡雨蔭",
    "步驟 7：記低緯季風口訣",
    # 33 FACTORING_LESSON (7)
    "步驟 1：分配律反過來", "步驟 2：提出共同數", "步驟 3：找公因式3",
    "步驟 4：三步驟提公因式", "步驟 5：再練2x加4", "步驟 6：十字交乘",
    "步驟 7：記分配律反過來",
    # 34 PASSIVE_VOICE_LESSON (7)
    "步驟 1：被動怎麼講", "步驟 2：主動改被動", "步驟 3：改被動三步",
    "步驟 4：be隨時態變", "步驟 5：看was broken", "步驟 6：常見錯誤",
    "步驟 7：記be加p.p.口訣",
]

EXPECTED = len(labels)
assert EXPECTED == 256, EXPECTED

with open(SRC, "r", encoding="utf-8") as f:
    text = f.read()

# --- content fixes (Task 2) applied before step insertion ---
fixes = [
    # FACTOR_MULTIPLE f3: caption only mentioned 2人/3人 (both factors) while the
    # ask and bars reference 5人 (NOT a factor of 12). Make the caption reconcile
    # all three groupings consistently.
    (
        'caption: "分給 2 個人：每人 6 顆。分給 3 個人：每人 4 顆。都剛好分完！"',
        'caption: "分給 2 人每人 6 顆、3 人每人 4 顆，都剛好分完；但分給 5 人會剩 2 顆，分不掉！"',
    ),
    # FRACTION_MULTIPLY f2: prop shows 2 個 1/4 -> result 2/4, but caption says 3 個
    (
        'caption: "如果有 3 個這樣的 1/4，就把它們疊起來看看。"',
        'caption: "先拿 2 個這樣的 1/4，疊起來看看是幾分之幾。"',
    ),
    # CELL_DIVISION f6: balance 母2n vs 子2n+2n is inconsistent; must show replication (4n)
    (
        'left: "母細胞 2n", right: "子細胞 2n ＋ 2n"',
        'left: "母細胞複製後 4n", right: "子細胞 2n ＋ 子細胞 2n"',
    ),
]
for old, new in fixes:
    assert old in text, "fix anchor not found: " + old
    text = text.replace(old, new, 1)

# --- step insertion ---
idx = {"i": 0}

def repl(m):
    num = m.group(1)
    lab = labels[idx["i"]]
    idx["i"] += 1
    return 'step: "' + lab + '", id: ' + num + ','

new_text, n = re.subn(r'id: (\d+),', repl, text)
assert n == EXPECTED, "id matches=%d expected=%d" % (n, EXPECTED)

with open(SRC, "w", encoding="utf-8") as f:
    f.write(new_text)

# sanity: every frame now has a step
missing = new_text.count('id: ')  # not reliable; just report
print("step insertions:", n)
print("labels consumed:", idx["i"])
print("file bytes:", len(new_text.encode("utf-8")))
