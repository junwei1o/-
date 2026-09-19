import React from "react";
import "./TaiwanLandmarkMap.css";

/**
 * 台灣地標展示圖（純展示、不可點擊）。
 * 用於首頁：乾淨呈現台灣本島、五大區域名稱與各地真實地標。
 * 完整的「可點擊島嶼 + 航線 + 補給」互動航海圖保留在 /map（TaiwanMainNavigationMap）。
 * 座標空間：viewBox 0 0 1000 620，地標位置已對照台灣實際地理核對。
 */

type RegionKey = "north" | "central" | "south" | "east" | "west" | "offshore";

const REGION_META: Record<RegionKey, { label: string; color: string }> = {
  north: { label: "北部", color: "#E74C3C" },
  central: { label: "中部", color: "#D9A418" },
  south: { label: "南部", color: "#E67E22" },
  east: { label: "東部", color: "#138A72" },
  west: { label: "西部", color: "#5C7552" },
  offshore: { label: "離島", color: "#8E44AD" },
};

/** 五大區域名稱直接嵌在台灣本島上（SVG 座標）。 */
const REGION_LABELS: Array<{ text: string; x: number; y: number }> = [
  { text: "北部", x: 566, y: 58 },
  { text: "中部", x: 478, y: 250 },
  { text: "南部", x: 476, y: 480 },
  { text: "東部", x: 582, y: 372 },
  { text: "西部", x: 423, y: 225 },
];

type Landmark = {
  name: string;
  region: RegionKey;
  x: number;
  y: number;
  lx: number;
  ly: number;
  anchor: "start" | "middle" | "end";
};

/** 真實台灣地標，依實際地理位置定位於地圖上。 */
const LANDMARKS: Landmark[] = [
  // 北部
  { name: "故宮博物院", region: "north", x: 498, y: 95, lx: 498, ly: 80, anchor: "middle" },
  { name: "台北101", region: "north", x: 540, y: 120, lx: 556, ly: 125, anchor: "start" },
  { name: "九份老街", region: "north", x: 592, y: 138, lx: 592, ly: 162, anchor: "middle" },
  // 中部
  { name: "高美濕地", region: "central", x: 378, y: 296, lx: 368, ly: 284, anchor: "end" },
  { name: "清境農場", region: "central", x: 484, y: 302, lx: 484, ly: 288, anchor: "middle" },
  { name: "日月潭", region: "central", x: 452, y: 352, lx: 452, ly: 378, anchor: "middle" },
  // 南部
  { name: "赤崁樓", region: "south", x: 416, y: 438, lx: 406, ly: 432, anchor: "end" },
  { name: "高雄港", region: "south", x: 434, y: 478, lx: 424, ly: 504, anchor: "end" },
  { name: "墾丁沙灘", region: "south", x: 452, y: 542, lx: 452, ly: 524, anchor: "middle" },
  // 東部
  { name: "清水斷崖", region: "east", x: 602, y: 246, lx: 614, ly: 242, anchor: "start" },
  { name: "太魯閣峽谷", region: "east", x: 598, y: 292, lx: 614, ly: 306, anchor: "start" },
  { name: "三仙台", region: "east", x: 558, y: 414, lx: 572, ly: 408, anchor: "start" },
  // 西部
  { name: "鹿港老街", region: "west", x: 382, y: 338, lx: 372, ly: 343, anchor: "end" },
  { name: "北港朝天宮", region: "west", x: 390, y: 384, lx: 380, ly: 400, anchor: "end" },
  // 離島（海面上）
  { name: "澎湖雙心石滬", region: "offshore", x: 190, y: 440, lx: 190, ly: 464, anchor: "middle" },
];

export function TaiwanLandmarkMap() {
  return (
    <section className="taiwan-landmark-map" aria-labelledby="taiwan-landmark-map-title">
      <header className="taiwan-landmark-map-heading">
        <div>
          <p className="eyebrow">TAIWAN LANDMARK MAP</p>
          <h2 id="taiwan-landmark-map-title">台灣探險地圖</h2>
          <p>從北到南、從山到海，認識你正在探索的這座島上的真實地標。</p>
        </div>
        <ul className="taiwan-landmark-map-legend" aria-label="地區圖例">
          {(Object.keys(REGION_META) as RegionKey[]).map((key) => (
            <li key={key}>
              <span className="taiwan-landmark-legend-dot" style={{ background: REGION_META[key].color }} aria-hidden="true" />
              {REGION_META[key].label}
            </li>
          ))}
        </ul>
      </header>

      <div className="taiwan-landmark-map-scroll">
        <div className="taiwan-landmark-map-canvas">
          <svg className="taiwan-landmark-map-svg" viewBox="0 0 1000 620" role="img" aria-label="台灣地標地圖，標示北部、中部、南部、東部、西部與離島的真實地標位置">
            <path
              className="taiwan-landmark-land"
              d="M561 5 C615 45 632 100 619 143 C606 186 628 231 613 272 C595 314 608 354 579 395 C554 431 558 474 528 518 C498 561 452 591 420 570 C388 551 403 503 385 464 C366 424 382 377 364 336 C348 297 373 258 369 216 C367 176 397 143 409 104 C422 64 492 20 561 5 Z"
            />

            {REGION_LABELS.map((region) => (
              <text key={region.text} className="taiwan-landmark-region-label" x={region.x} y={region.y} textAnchor="middle">
                {region.text}
              </text>
            ))}

            {/* 我的船（紛飾，不可點擊） */}
            <circle className="taiwan-landmark-boat-ring" cx="248" cy="365" r="18" />
            <g className="taiwan-landmark-boat" transform="translate(248 365)">
              <path d="M-13 4 Q0 9 13 4 L10 10 L-10 10 Z" fill="#8B4A2B" stroke="#5C3D26" strokeWidth="1.5" />
              <path d="M-2 -2 L-2 -16 L9 -6 Z" fill="#F9F3E8" stroke="#5C3D26" strokeWidth="1.5" />
              <path d="M2 -2 L2 -12 L-7 -5 Z" fill="#E8B84B" stroke="#5C3D26" strokeWidth="1.5" />
              <line x1="0" y1="-16" x2="0" y2="-20" stroke="#5C3D26" strokeWidth="1.5" />
              <path d="M0 -20 L6 -18 L0 -16 Z" fill="#E74C3C" />
            </g>

            {/* 地標 */}
            {LANDMARKS.map((landmark) => (
              <g key={landmark.name} className="taiwan-landmark-pin">
                <circle
                  className="taiwan-landmark-pin-dot"
                  cx={landmark.x}
                  cy={landmark.y}
                  r="6.5"
                  fill={REGION_META[landmark.region].color}
                />
                <text
                  className="taiwan-landmark-pin-label"
                  x={landmark.lx}
                  y={landmark.ly}
                  textAnchor={landmark.anchor}
                >
                  {landmark.name}
                </text>
              </g>
            ))}

            {/* 羅盤 */}
            <g className="taiwan-landmark-compass" transform="translate(930 80)">
              <circle r="26" fill="rgba(249,243,232,0.85)" stroke="#173d4a" strokeWidth="1.5" />
              <path d="M0 -20 L5 0 L0 20 L-5 0 Z" fill="#173d4a" />
              <path d="M-20 0 L0 -5 L20 0 L0 5 Z" fill="rgba(23,61,74,0.35)" />
              <text y="-31" textAnchor="middle" fontSize="11" fontWeight="800" fill="#173d4a">N</text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}

export default TaiwanLandmarkMap;
