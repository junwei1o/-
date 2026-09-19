import { BookOpenCheck, BookText, Compass, FlaskConical, Landmark, Languages, RotateCcw, Ruler, Sparkles, Volume2, type LucideIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import { getPaperNextGroupStrategyHint } from "@/lib/paperExam";
import { loadMapRouteFirstUseHint, markMapRouteFirstUseHintSeen } from "@/lib/mapRouteFirstUseHint";
import { hasSavedPreferenceForIsland, loadMapSupplyStrategyPreference, preferenceForIsland, saveMapSupplyStrategyPreference } from "@/lib/mapSupplyStrategyPreference";
import type { KnowledgeIslandId, KnowledgeIslandSnapshot, KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import type { RegionKey } from "@/game/rpgTypes";
import { routeIdForRegion, supplyMarkerIdForRegion } from "@/game/mapVictoryProgress";
import type { MapReinforcementJournalEntry, MapReinforcementReward } from "@/game/mapReinforcementReward";
import { getInventory, tryDropSpecialty, type InventoryItem } from "@/game/inventoryService";
import type { RandomAdventureRouteReward } from "@/game/randomAdventureRouteReward";
import { loadClassroomBest, type ClassroomBestMap } from "@/lib/classroomBank";
import { recordPipiEvent } from "@/game/pipiCompanion";
import { BxEmptyState } from "@/components/bx/EmptyState";
import "./TaiwanMainNavigationMap.css";

type TaiwanMainNavigationMapProps = {
  islands: KnowledgeIslandSnapshot[];
  onOpenSubject: (subject: KnowledgeIslandSubject) => void;
  onStartIslandQuiz?: (subject: KnowledgeIslandSubject) => void;
  onOpenTopic: (subject: KnowledgeIslandSubject, topic: string) => void;
  onOpenWrongAnswers?: (subject: KnowledgeIslandSubject) => void;
  /** 開啟教室融合玩法（關卡碼頭）；未提供時碼頭只顯示資訊不可點。 */
  onOpenGame?: (gameId: string) => void;
  unlockedRouteIds?: string[];
  supplyMarkerIds?: string[];
  reinforcementReward?: MapReinforcementReward | null;
  reinforcementJournal?: MapReinforcementJournalEntry[];
  reinforcementSuggestion?: string;
  randomAdventureRouteReward?: RandomAdventureRouteReward | null;
};

type IslandCellLayout = {
  /** 板塊主格（可點擊的島嶼按鈕落點） */
  main: { col: number; row: number };
  /** 板塊領土格（同色模塊） */
  cells: Array<{ col: number; row: number }>;
  /** 船停靠的海面孔位 */
  port: { col: number; row: number };
  region: string;
};

type LandscapeIcon = {
  symbol: string;
  label: string;
};

type IslandVisualState = "gold" | "green" | "orange" | "mist";

type LearningRouteSegment = {
  id: KnowledgeIslandId;
  d: string;
};

/* =========================================================
 * v9 PaGamO 式六角格大地圖
 * 40×26＝1040 個六角格（v8 方格版的 6.5 倍），台灣由六角陸地模塊拼出；
 * 海域分深淺、陸地分草原／森林／山地／沙岸，並畫上樹、山與浪花。
 * 之後要加地標、活動、新玩法：在 MAP_TERRAIN 補 X（造陸）、
 * 在 MAP_CELL_FEATURES 加一筆（col/row 定位）即可，不必動渲染邏輯。
 * ======================================================= */
export const MAP_GRID_COLS = 40;
export const MAP_GRID_ROWS = 26;
/** 六角地形：每行 40 字，X＝陸地模塊、.＝海域（第 0 行最北；pointy-top hex，奇數行右移半格）。 */
export const MAP_TERRAIN: string[] = [
  "......................XXXX..............",
  "......................XXXX..............",
  "....................XXXXXXXX............",
  "....................XXXXXXXX............",
  "..................XXXXXXXXXX............",
  "..................XXXXXXXXXX............",
  "................XXXXXXXXXXXX............",
  "................XXXXXXXXXXXX............",
  "........XXXX....XXXXXXXXXXXX............",
  "........XXXX....XXXXXXXXXXXX............",
  "........XXXX..XXXXXXXXXXXX..............",
  "........XXXX..XXXXXXXXXXXX..............",
  "..............XXXXXXXXXX................",
  "..............XXXXXXXXXX................",
  "..............XXXXXXXX..................",
  "..............XXXXXXXX..................",
  "..............XXXXXX....................",
  "..............XXXXXX....................",
  "..............XXXX......................",
  "..............XXXX......................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
];

const HEX_SIZE = 13.5;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_VSTEP = 1.5 * HEX_SIZE;
const MAP_OFFSET_X = 26;
const MAP_OFFSET_Y = 42;

/** 六角格座標 → SVG 中心點（viewBox 0 0 1000 620，pointy-top、奇數行右移半格）。 */
export function mapCellCenter(col: number, row: number) {
  return {
    x: MAP_OFFSET_X + col * HEX_WIDTH + (row % 2 === 1 ? HEX_WIDTH / 2 : 0) + HEX_WIDTH / 2,
    y: MAP_OFFSET_Y + row * HEX_VSTEP + HEX_SIZE,
  };
}

/** 格線座標 → 畫布百分比（HTML 圖層定位用）。 */
export function mapCellPercent(col: number, row: number) {
  const center = mapCellCenter(col, row);
  return { left: `${(center.x / 1000) * 100}%`, top: `${(center.y / 620) * 100}%` };
}

export type MapCellFeatureKind = "landmark" | "activity";
export type MapCellFeature = {
  id: string;
  col: number;
  row: number;
  icon: string;
  label: string;
  kind: MapCellFeatureKind;
  note?: string;
};
/** 地標／活動登記處：之後的新地標、新活動都在這裡登記一筆就會長到地圖上。 */
export const MAP_CELL_FEATURES: MapCellFeature[] = [
  { id: "feature-tpe101", col: 20, row: 3, icon: "🏢", label: "台北 101", kind: "landmark", note: "北部真實地標" },
  { id: "feature-taroko", col: 26, row: 6, icon: "🏔️", label: "太魯閣", kind: "landmark", note: "東部真實地標" },
  { id: "feature-sunmoon", col: 20, row: 11, icon: "⛵", label: "日月潭", kind: "landmark", note: "中部真實地標" },
  { id: "feature-chihkan", col: 16, row: 14, icon: "🏛️", label: "赤崁樓", kind: "landmark", note: "南部真實地標" },
  { id: "feature-kenting", col: 14, row: 18, icon: "🗼", label: "墾丁", kind: "landmark", note: "台灣本島最南端" },
  { id: "feature-activity-slot", col: 22, row: 13, icon: "🎪", label: "活動預備格", kind: "activity", note: "之後的新活動會落在這種格子上" },
];

const ISLAND_REGION_BY_ID: Record<KnowledgeIslandId, RegionKey> = {
  language: "north",
  math: "central",
  social: "south",
  science: "east",
  english: "south",
};

/** 島嶼＝六角格上的板塊模塊群（主格放按鈕，其餘為同色領土格）。 */
const ISLAND_CELLS: Record<KnowledgeIslandId, IslandCellLayout> = {
  language: {
    main: { col: 23, row: 1 },
    cells: [
      { col: 22, row: 0 }, { col: 23, row: 0 }, { col: 24, row: 0 }, { col: 25, row: 0 },
      { col: 22, row: 1 }, { col: 23, row: 1 }, { col: 24, row: 1 }, { col: 25, row: 1 },
      { col: 22, row: 2 }, { col: 23, row: 2 },
    ],
    port: { col: 21, row: 0 },
    region: "北部・古書樓",
  },
  math: {
    main: { col: 17, row: 7 },
    cells: [
      { col: 16, row: 6 }, { col: 17, row: 6 },
      { col: 16, row: 7 }, { col: 17, row: 7 }, { col: 18, row: 7 },
      { col: 16, row: 8 }, { col: 17, row: 8 }, { col: 18, row: 8 },
      { col: 17, row: 9 },
    ],
    port: { col: 15, row: 7 },
    region: "中部・量測塔",
  },
  social: {
    main: { col: 15, row: 15 },
    cells: [
      { col: 14, row: 14 }, { col: 15, row: 14 },
      { col: 14, row: 15 }, { col: 15, row: 15 }, { col: 16, row: 15 },
      { col: 14, row: 16 }, { col: 15, row: 16 },
      { col: 14, row: 17 }, { col: 15, row: 17 },
    ],
    port: { col: 13, row: 15 },
    region: "南部・生活港",
  },
  science: {
    main: { col: 25, row: 9 },
    cells: [
      { col: 24, row: 8 }, { col: 25, row: 8 }, { col: 26, row: 8 },
      { col: 24, row: 9 }, { col: 25, row: 9 }, { col: 26, row: 9 },
      { col: 24, row: 10 }, { col: 25, row: 10 },
    ],
    port: { col: 27, row: 10 },
    region: "東部・山海觀察站",
  },
  english: {
    main: { col: 9, row: 9 },
    cells: [
      { col: 8, row: 8 }, { col: 9, row: 8 },
      { col: 8, row: 9 }, { col: 9, row: 9 }, { col: 10, row: 9 },
      { col: 8, row: 10 }, { col: 9, row: 10 },
    ],
    port: { col: 7, row: 9 },
    region: "西部離島・英語港",
  },
};

/** 航線＝沿海外海航道（以海域六角格座標描述，載入時轉成 SVG 折線）。 */
const ROUTE_WAYPOINTS: Record<KnowledgeIslandId, Array<{ col: number; row: number }>> = {
  language: [
    { col: 4, row: 12 }, { col: 2, row: 10 }, { col: 2, row: 2 }, { col: 10, row: 1 }, { col: 21, row: 0 },
  ],
  math: [
    { col: 4, row: 12 }, { col: 2, row: 10 }, { col: 6, row: 6 }, { col: 10, row: 7 }, { col: 15, row: 7 },
  ],
  social: [
    { col: 4, row: 12 }, { col: 4, row: 15 }, { col: 9, row: 16 }, { col: 13, row: 15 },
  ],
  science: [
    { col: 4, row: 12 }, { col: 2, row: 14 }, { col: 4, row: 17 }, { col: 8, row: 20 }, { col: 16, row: 22 }, { col: 27, row: 22 }, { col: 27, row: 10 },
  ],
  english: [
    { col: 4, row: 12 }, { col: 2, row: 11 }, { col: 7, row: 9 },
  ],
};

const ISLAND_ROUTE_PATHS = Object.fromEntries(
  Object.entries(ROUTE_WAYPOINTS).map(([id, waypoints]) => [
    id,
    waypoints
      .map((point, index) => {
        const { x, y } = mapCellCenter(point.col, point.row);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" "),
  ]),
) as Record<KnowledgeIslandId, string>;

/** 母港與各島港口（皆為海域格中心，船會實際航行過去）。 */
const HOME_PORT = mapCellCenter(4, 12);
const ISLAND_PORTS: Record<KnowledgeIslandId, { x: number; y: number }> = {
  language: mapCellCenter(ISLAND_CELLS.language.port.col, ISLAND_CELLS.language.port.row),
  math: mapCellCenter(ISLAND_CELLS.math.port.col, ISLAND_CELLS.math.port.row),
  social: mapCellCenter(ISLAND_CELLS.social.port.col, ISLAND_CELLS.social.port.row),
  science: mapCellCenter(ISLAND_CELLS.science.port.col, ISLAND_CELLS.science.port.row),
  english: mapCellCenter(ISLAND_CELLS.english.port.col, ISLAND_CELLS.english.port.row),
};

const ISLAND_ICONS: Record<KnowledgeIslandId, LucideIcon> = {
  language: BookText,
  math: Ruler,
  social: Landmark,
  science: FlaskConical,
  english: Languages,
};

/* ----- v9 六角格地形貼圖（海、草原、森林、山地、沙岸） ----- */

type HexTerrain = "deepsea" | "shallow" | "grass" | "forest" | "mountain" | "sand";

const HEX_POINTS = (() => {
  const halfW = (HEX_WIDTH / 2).toFixed(2);
  const s = HEX_SIZE.toFixed(2);
  const halfS = (HEX_SIZE / 2).toFixed(2);
  return `0,-${s} ${halfW},-${halfS} ${halfW},${halfS} 0,${s} -${halfW},${halfS} -${halfW},-${halfS}`;
})();

function hexHash(col: number, row: number) {
  let h = Math.imul(col + 1, 374761393) + Math.imul(row + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return Math.abs((h ^ (h >>> 16)) >>> 0);
}

const LAND_KEY_SET = new Set(
  MAP_TERRAIN.flatMap((line, row) =>
    line.split("").map((ch, col) => (ch === "X" ? `${col},${row}` : "")),
  ).filter(Boolean),
);

function isLandCell(col: number, row: number) {
  return row >= 0 && row < MAP_TERRAIN.length && col >= 0 && col < (MAP_TERRAIN[row]?.length ?? 0) && LAND_KEY_SET.has(`${col},${row}`);
}

/** 六鄰居中是陸地的數量（0＝深海，1-5＝近岸，6＝內陸）。 */
function landNeighborCount(col: number, row: number) {
  const offsets = row % 2 === 1
    ? [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]]
    : [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];
  return offsets.filter(([dc, dr]) => isLandCell(col + dc, row + dr)).length;
}

function hexTree(dx: number, dy: number, scale: number, key: string) {
  return (
    <g key={key} transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)}) scale(${scale.toFixed(2)})`}>
      <rect x={-0.7} y={-1} width={1.4} height={2.4} rx={0.4} fill="#8a5a34" />
      <circle cx={0} cy={-2.8} r={2.4} fill="#3f7f46" />
      <circle cx={-1.3} cy={-1.7} r={1.6} fill="#4f9451" />
    </g>
  );
}

type MapHex = {
  key: string;
  col: number;
  row: number;
  x: number;
  y: number;
  terrain: HexTerrain;
  cluster: KnowledgeIslandId | null;
  deco: ReactNode;
};

function buildMapHexes(): MapHex[] {
  const clusterLookup = new Map<string, KnowledgeIslandId>();
  (Object.entries(ISLAND_CELLS) as Array<[KnowledgeIslandId, IslandCellLayout]>).forEach(([id, layout]) => {
    layout.cells.forEach((cell) => clusterLookup.set(`${cell.col},${cell.row}`, id));
  });

  const hexes: MapHex[] = [];
  MAP_TERRAIN.forEach((line, row) => {
    line.split("").forEach((char, col) => {
      const { x, y } = mapCellCenter(col, row);
      const cluster = clusterLookup.get(`${col},${row}`) ?? null;
      const isLand = char === "X";
      const landNeighbors = landNeighborCount(col, row);
      const seed = hexHash(col, row);
      let terrain: HexTerrain;
      let deco: ReactNode = null;

      if (!isLand) {
        terrain = landNeighbors > 0 ? "shallow" : "deepsea";
        if (seed % 5 === 0) {
          const dx = (seed % 3) - 1;
          deco = (
            <path
              d={`M${-5 + dx} 1 Q${-2.5 + dx} -1.6 ${dx} 1 Q${2.5 + dx} 3.6 ${5 + dx} 1`}
              fill="none"
              stroke="#6fa9c7"
              strokeWidth={1.1}
              strokeLinecap="round"
              opacity={0.6}
            />
          );
        }
      } else if (cluster) {
        // 板塊領土格：主題色乾淨呈現（CSS island-cell-*），不放雜物
        terrain = "grass";
      } else if (landNeighbors < 6) {
        // 海岸帶：沙岸＋偶爾小石
        terrain = "sand";
        if (seed % 6 === 0) {
          deco = (
            <g key="pebbles">
              <circle cx={-3} cy={2} r={1.1} fill="#d3ba7e" />
              <circle cx={3.4} cy={-1.6} r={0.9} fill="#d3ba7e" />
            </g>
          );
        }
      } else {
        // 內陸：草原／森林／山地
        const roll = seed % 10;
        if (roll <= 3) {
          terrain = "forest";
          const jitterX = ((seed >>> 3) % 5) - 2;
          const jitterY = ((seed >>> 5) % 3) - 1;
          deco = (
            <>
              {hexTree(jitterX - 3, jitterY, 1, "t1")}
              {hexTree(jitterX + 3.4, jitterY + 2.2, 0.85, "t2")}
            </>
          );
        } else if (roll <= 5) {
          terrain = "mountain";
          const jitterX = ((seed >>> 3) % 5) - 2;
          deco = (
            <g key="peak">
              <path d={`M${-5.5 + jitterX} 4.5 L${jitterX} -5.5 L${5.5 + jitterX} 4.5 Z`} fill="#9a917d" />
              <path d={`M${-1.9 + jitterX} -1.6 L${jitterX} -5.5 L${1.9 + jitterX} -1.6 Z`} fill="#f7f4ec" />
            </g>
          );
        } else {
          terrain = "grass";
          if (seed % 3 === 0) {
            deco = hexTree(((seed >>> 3) % 7) - 3, ((seed >>> 5) % 3) - 1, 0.8, "tree");
          } else if (seed % 3 === 1) {
            deco = <circle key="bush" cx={((seed >>> 3) % 7) - 3} cy={2.2} r={1.5} fill="#7fbf6f" />;
          }
        }
      }

      hexes.push({ key: `${col}-${row}`, col, row, x, y, terrain, cluster, deco });
    });
  });
  return hexes;
}

const MAP_HEXES = buildMapHexes();

const ISLAND_LANDSCAPES: Record<KnowledgeIslandId, { summary: string; icons: LandscapeIcon[] }> = {
  language: {
    summary: "北部文化城的古城、毛筆與詩詞卷軸",
    icons: [
      { symbol: "🏯", label: "古城牆" },
      { symbol: "🖌️", label: "毛筆" },
      { symbol: "📜", label: "詩詞卷軸" },
    ],
  },
  math: {
    summary: "中部測量原野的幾何建築、齒輪與量尺",
    icons: [
      { symbol: "▱", label: "幾何建築" },
      { symbol: "⚙️", label: "齒輪" },
      { symbol: "📏", label: "量尺" },
    ],
  },
  social: {
    summary: "南部生活港的帆船、燈塔與世界地圖",
    icons: [
      { symbol: "⛵", label: "帆船" },
      { symbol: "🗼", label: "燈塔" },
      { symbol: "🗺️", label: "世界地圖" },
    ],
  },
  science: {
    summary: "東部山海觀察站的山林、海浪與顯微鏡",
    icons: [
      { symbol: "⛰️", label: "山林" },
      { symbol: "🌊", label: "海浪" },
      { symbol: "🔬", label: "顯微鏡" },
    ],
  },
  english: {
    summary: "西部英語港的燈塔、船錨與字母旗幟",
    icons: [
      { symbol: "🗼", label: "燈塔" },
      { symbol: "⚓", label: "船錨" },
      { symbol: "🔤", label: "字母旗幟" },
    ],
  },
};

/** 各區真實地標：在地圖上以小地標章呈現，也在島嶼面板「真實地標」列出（奇幻島嶼＋真實台灣地標）。 */
const ISLAND_LANDMARKS: Record<KnowledgeIslandId, Array<{ symbol: string; name: string; note: string; left: string; top: string }>> = {
  language: [
    { symbol: "🏺", name: "故宮博物院", note: "世界級中華文物寶庫，藏在台北外雙溪。", left: "39.5%", top: "11.3%" },
    { symbol: "🏢", name: "台北 101", note: "曾經的世界第一高樓，北部文化城的天際線。", left: "42.5%", top: "19.4%" },
    { symbol: "🏮", name: "九份老街", note: "山城紅燈籠與芋圓，像走進神隱少女的場景。", left: "40%", top: "27.4%" },
  ],
  math: [
    { symbol: "🌅", name: "高美濕地", note: "台中清水的泥灘地，風車與夕陽一起算角度。", left: "37.2%", top: "40.3%" },
    { symbol: "🐑", name: "清境農場", note: "海拔 1700 公尺的高山牧場，綿羊成群。", left: "39.2%", top: "47.6%" },
    { symbol: "⛵", name: "日月潭", note: "台灣最大的天然湖泊，湖面像一個大圓。", left: "40.8%", top: "54.8%" },
  ],
  social: [
    { symbol: "🏛️", name: "赤崁樓", note: "台南的古蹟，見證荷蘭、明鄭到清領的歷史。", left: "56.5%", top: "82.3%" },
    { symbol: "⚓", name: "高雄港", note: "台灣最大的港口，貨櫃船日夜進出。", left: "58.5%", top: "89.5%" },
    { symbol: "🏖️", name: "墾丁沙灘", note: "台灣本島最南端的白沙灣與珊瑚礁。", left: "60%", top: "96%" },
  ],
  science: [
    { symbol: "🪨", name: "清水斷崖", note: "花蓮的懸崖直落太平洋，斷層岩壁壯觀。", left: "66%", top: "38.7%" },
    { symbol: "🏞️", name: "太魯閣峽谷", note: "大理石峽谷是立霧溪切了幾百萬年的作品。", left: "67.2%", top: "48.4%" },
    { symbol: "🌉", name: "三仙台", note: "台東的八拱跨海步橋與離岸小島。", left: "66.8%", top: "59.7%" },
  ],
  english: [
    { symbol: "🏮", name: "鹿港老街", note: "彰化的百年老街，「一府二鹿三艋舺」的二鹿。", left: "31.5%", top: "54%" },
    { symbol: "⛩️", name: "北港朝天宮", note: "雲林的媽祖信仰中心，香火綿延三百年。", left: "30%", top: "67.7%" },
    { symbol: "💗", name: "澎湖雙心石滬", note: "七美的雙心石滬，用玄武岩堆出的愛心捕魚堰。", left: "13.5%", top: "77.4%" },
  ],
};

/** 關卡碼頭：每座島停靠的教室融合玩法（成績只存本機）。 */
const ISLAND_DOCKS: Record<KnowledgeIslandId, Array<{ gameId: string; emoji: string; label: string; hint: string }>> = {
  language: [
    { gameId: "flipdex", emoji: "🃏", label: "翻牌圖鑑", hint: "翻牌問答＋看圖選答混編" },
    { gameId: "relay", emoji: "🔗", label: "選擇配對接力", hint: "選擇題解鎖配對盤" },
  ],
  math: [
    { gameId: "duo", emoji: "🎶", label: "因數雙重奏", hint: "找因數＋拼長方形接續" },
    { gameId: "meteor", emoji: "🛡️", label: "倍數防衛戰", hint: "攔截目標倍數隕石" },
  ],
  social: [
    { gameId: "trap", emoji: "🪤", label: "陷阱題挑戰", hint: "經典陷阱題全解析" },
    { gameId: "flashrush", emoji: "⚡", label: "閃電接力", hint: "是非＋四選一混賽道" },
  ],
  science: [
    { gameId: "flashrush", emoji: "⚡", label: "閃電接力", hint: "是非＋四選一混賽道" },
    { gameId: "trap", emoji: "🪤", label: "陷阱題挑戰", hint: "經典陷阱題全解析" },
  ],
  english: [
    { gameId: "flipdex", emoji: "🃏", label: "翻牌圖鑑", hint: "翻牌問答＋看圖選答混編" },
    { gameId: "relay", emoji: "🔗", label: "選擇配對接力", hint: "選擇題解鎖配對盤" },
  ],
};

function islandStatus(island: KnowledgeIslandSnapshot) {
  if (island.attemptCount === 0) return "啟航";
  if (island.attemptCount < 4) return "探索中";
  return "穩定航行";
}

/**
 * 色彩只作為學生已留下作答紀錄的背景提示，不以分數、好壞或警示文字呈現。
 * 未啟程資料不套用正確率色階，改以中性灰霧且維持所有入口可操作。
 */
export function islandVisualState(island: KnowledgeIslandSnapshot): IslandVisualState {
  if (island.accuracy === null || island.attemptCount === 0) return "mist";
  if (island.accuracy >= 0.8) return "gold";
  if (island.accuracy >= 0.5) return "green";
  return "orange";
}

/**
 * 島嶼星級：依作答量與正確率給 0-3 星，作為「還可以再挑戰」的進步提示。
 * 0 星代表尚未留下足夠足跡，不顯示星列；星級會隨練習自然提升。
 */
export function islandStarRating(island: KnowledgeIslandSnapshot): number {
  if (island.accuracy === null || island.attemptCount === 0) return 0;
  if (island.accuracy >= 0.85 && island.attemptCount >= 5) return 3;
  if (island.accuracy >= 0.65 && island.attemptCount >= 3) return 2;
  if (island.accuracy >= 0.4) return 1;
  return 0;
}

/** 航線只反映學生已完成的真實作答足跡；尚未練習的島嶼不預先繪製路徑。 */
export function learningRouteSegments(islands: KnowledgeIslandSnapshot[], unlockedRouteIds: string[] = []): LearningRouteSegment[] {
  return islands
    .filter((island) => island.attemptCount > 0 || unlockedRouteIds.includes(routeIdForRegion(ISLAND_REGION_BY_ID[island.id])))
    .map((island) => ({ id: island.id, d: ISLAND_ROUTE_PATHS[island.id] }));
}

function islandSpeechText(island: KnowledgeIslandSnapshot) {
  const observedKnowledge = island.observedKnowledge.length
    ? `你已留下的知識線索有：${island.observedKnowledge.join("、")}。`
    : "還沒有知識線索也沒關係，可以從第一份練習開始。";
  const recentTopics = island.recentReviewTopics.length
    ? `近期可複習的知識點有：${island.recentReviewTopics.join("、")}。`
    : "目前還沒有近期可複習的知識點。";
  const review = island.dueReviewCount
    ? "這裡有可依自己的步調回顧的線索。"
    : "現在可以選擇一小段練習繼續探索。";

  const landscape = ISLAND_LANDSCAPES[island.id];

  return `${island.title}。${island.description}。目前的旅程狀態是${islandStatus(island)}。台灣地景意象是${landscape.summary}。${observedKnowledge}${recentTopics}${review}`;
}

export function mapReinforcementJournalReadout(entries: MapReinforcementJournalEntry[]) {
  if (!entries.length) return "本週補強小航誌目前還沒有完成紀錄。每完成一題補強，這裡會留下真實主題。";
  return `本週補強小航誌共有${entries.length}筆真實完成紀錄：${entries.map((entry) => `${entry.subject}的${entry.knowledge}`).join("、")}。`;
}

function formatMapReinforcementJournalTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

export function TaiwanMainNavigationMap({ islands, onOpenSubject, onOpenTopic, onOpenWrongAnswers, onOpenGame, unlockedRouteIds = [], supplyMarkerIds = [], reinforcementReward = null, reinforcementJournal = [], reinforcementSuggestion = "", randomAdventureRouteReward = null }: TaiwanMainNavigationMapProps) {
  const [activeIslandId, setActiveIslandId] = useState<KnowledgeIslandId | null>(null);
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
  const [showRestoredPreferenceNotice, setShowRestoredPreferenceNotice] = useState(false);
  const [recentlyCompletedSupplyMarkerIds, setRecentlyCompletedSupplyMarkerIds] = useState<string[]>([]);
  const [showRouteHint, setShowRouteHint] = useState(false);
  const [showReinforcementReward, setShowReinforcementReward] = useState(Boolean(reinforcementReward));
  const [showRandomAdventureRouteReward, setShowRandomAdventureRouteReward] = useState(Boolean(randomAdventureRouteReward));
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getInventory());
  const [showBackpack, setShowBackpack] = useState(false);
  const [showTyphoonStory, setShowTyphoonStory] = useState(false);
  const [recentlyUnlockedIslandIds, setRecentlyUnlockedIslandIds] = useState<KnowledgeIslandId[]>([]);
  // v7 航海圖淨空版：船隻航行
  const [boatPos, setBoatPos] = useState(HOME_PORT);
  const [isSailing, setIsSailing] = useState(false);
  const sailTimerRef = useRef<number | null>(null);
  const firstBoatRunRef = useRef(true);
  const speech = useMemo(() => createSpeechController(), []);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(speech.isSupported ? "idle" : "unsupported");
  const triggerRefs = useRef<Partial<Record<KnowledgeIslandId, HTMLButtonElement | null>>>({});
  const strategyTriggerRefs = useRef<Partial<Record<KnowledgeIslandId, HTMLButtonElement | null>>>({});
  const strategyPanelRef = useRef<HTMLElement | null>(null);
  const activeIsland = islands.find((island) => island.id === activeIslandId) ?? null;
  const classroomBest: ClassroomBestMap = loadClassroomBest();
  const activeIslandHasSupply = activeIsland
    ? supplyMarkerIds.includes(supplyMarkerIdForRegion(ISLAND_REGION_BY_ID[activeIsland.id]))
    : false;
  const activeIslandStrategy = activeIsland ? getPaperNextGroupStrategyHint(activeIsland.subject) : null;
  const unlockedSupplyCount = supplyMarkerIds.filter((id) => id.startsWith("supply-")).length;
  const randomAdventureRewardIslandId = randomAdventureRouteReward
    ? islands.find((island) => island.subject === randomAdventureRouteReward.subject)?.id ?? null
    : null;
  const routeSegments = learningRouteSegments(
    islands,
    randomAdventureRewardIslandId
      ? [...unlockedRouteIds, routeIdForRegion(ISLAND_REGION_BY_ID[randomAdventureRewardIslandId])]
      : unlockedRouteIds,
  );
  const supplyMarkerSignature = supplyMarkerIds.join("|");
  const previousSupplyMarkerIdsRef = useRef<string[]>(supplyMarkerIds);
  const previousUnlockedIslandIdsRef = useRef<KnowledgeIslandId[]>(islands.filter((island) => island.unlocked).map((island) => island.id));
  const reinforcementRewardIslandId = reinforcementReward ? islands.find((island) => island.subject === reinforcementReward.subject)?.id ?? null : null;
  const reinforcementJournalReadout = mapReinforcementJournalReadout(reinforcementJournal);

  useEffect(() => {
    const previousIds = previousUnlockedIslandIdsRef.current;
    const currentIds = islands.filter((island) => island.unlocked).map((island) => island.id);
    const newlyUnlocked = currentIds.filter((id) => !previousIds.includes(id));
    previousUnlockedIslandIdsRef.current = currentIds;
    if (!newlyUnlocked.length) return;
    setRecentlyUnlockedIslandIds(newlyUnlocked);
    const timeoutId = window.setTimeout(() => setRecentlyUnlockedIslandIds([]), 800);
    return () => window.clearTimeout(timeoutId);
  }, [islands]);

  useEffect(() => {
    const previousIds = previousSupplyMarkerIdsRef.current;
    const newlyCompletedIds = supplyMarkerIds.filter((id) => !previousIds.includes(id));
    previousSupplyMarkerIdsRef.current = [...supplyMarkerIds];

    if (!newlyCompletedIds.length) return;

    setRecentlyCompletedSupplyMarkerIds(newlyCompletedIds);
    const completionTimeoutId = window.setTimeout(() => setRecentlyCompletedSupplyMarkerIds([]), 1400);
    const shouldShowRouteHint = !loadMapRouteFirstUseHint().seen;
    const hintTimeoutId = shouldShowRouteHint
      ? window.setTimeout(() => setShowRouteHint(false), 1400)
      : null;

    if (shouldShowRouteHint) {
      setShowRouteHint(true);
      markMapRouteFirstUseHintSeen();
    }

    return () => {
      window.clearTimeout(completionTimeoutId);
      if (hintTimeoutId !== null) window.clearTimeout(hintTimeoutId);
    };
  }, [supplyMarkerSignature]);

  useEffect(() => () => speech.stop(), [speech]);

  // v7：選島時船實際航行到該島港口；關閉對話框駛回母港
  useEffect(() => {
    const target = activeIslandId ? ISLAND_PORTS[activeIslandId] : HOME_PORT;
    setBoatPos(target);
    if (firstBoatRunRef.current) {
      firstBoatRunRef.current = false;
      return;
    }
    setIsSailing(true);
    if (sailTimerRef.current !== null) window.clearTimeout(sailTimerRef.current);
    sailTimerRef.current = window.setTimeout(() => setIsSailing(false), 2000);
    return () => {
      if (sailTimerRef.current !== null) {
        window.clearTimeout(sailTimerRef.current);
        sailTimerRef.current = null;
      }
    };
  }, [activeIslandId]);

  useEffect(() => {
    if (!activeIslandId || !showStrategyPanel) return;
    const frameId = window.requestAnimationFrame(() => strategyTriggerRefs.current[activeIslandId]?.focus());
    return () => window.cancelAnimationFrame(frameId);
  }, [activeIslandId, showStrategyPanel]);

  useEffect(() => {
    if (!showRestoredPreferenceNotice) return;
    const timeoutId = window.setTimeout(() => setShowRestoredPreferenceNotice(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [showRestoredPreferenceNotice]);

  useEffect(() => {
    setShowReinforcementReward(Boolean(reinforcementReward));
  }, [reinforcementReward?.completedAt]);

  useEffect(() => {
    setShowRandomAdventureRouteReward(Boolean(randomAdventureRouteReward));
  }, [randomAdventureRouteReward?.completedAt]);

  useEffect(() => {
    if (!showReinforcementReward) return;
    const timeoutId = window.setTimeout(() => setShowReinforcementReward(false), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [showReinforcementReward]);

  useEffect(() => {
    if (!showRandomAdventureRouteReward) return;
    const timeoutId = window.setTimeout(() => setShowRandomAdventureRouteReward(false), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [showRandomAdventureRouteReward]);

  useEffect(() => {
    if (!showTyphoonStory) return;
    const timeoutId = window.setTimeout(() => setShowTyphoonStory(false), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [showTyphoonStory]);

  function closeReinforcementReward() {
    setShowReinforcementReward(false);
  }

  function openTyphoonStory() {
    const specialty = tryDropSpecialty({ source: "map-easter-egg", awardId: "taipei-typhoon-story-v1" });
    if (specialty) setInventoryItems(getInventory());
    setShowTyphoonStory(true);
  }

  function closeStrategyPanel(restoreFocus = true) {
    const focusTarget = activeIslandId ? strategyTriggerRefs.current[activeIslandId] : null;
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    if (activeIslandId) saveMapSupplyStrategyPreference(activeIslandId, false);
    setShowStrategyPanel(false);
    setShowRestoredPreferenceNotice(false);
    if (restoreFocus && focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  useEffect(() => {
    if (!activeIslandId || !showStrategyPanel) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const trigger = strategyTriggerRefs.current[activeIslandId];
      if (strategyPanelRef.current?.contains(target) || trigger?.contains(target)) return;
      closeStrategyPanel(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeIslandId, showStrategyPanel]);

  function openSupplyStrategyFromRoute(id: KnowledgeIslandId) {
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    setShowRouteHint(false);
    setShowRestoredPreferenceNotice(false);
    saveMapSupplyStrategyPreference(id, true);
    setActiveIslandId(id);
    setShowStrategyPanel(true);
  }

  function toggleStrategyPanel() {
    const nextExpanded = !showStrategyPanel;
    if (activeIslandId) saveMapSupplyStrategyPreference(activeIslandId, nextExpanded);
    setShowStrategyPanel(nextExpanded);
  }

  function closePanel(restoreFocus = true) {
    const focusTarget = activeIslandId ? triggerRefs.current[activeIslandId] : null;
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    if (showStrategyPanel && activeIslandId) saveMapSupplyStrategyPreference(activeIslandId, false);
    setShowStrategyPanel(false);
    setShowRestoredPreferenceNotice(false);
    setActiveIslandId(null);

    if (restoreFocus && focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  function toggleIsland(id: KnowledgeIslandId) {
    if (activeIslandId === id) {
      closePanel(false);
      return;
    }
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    const preference = loadMapSupplyStrategyPreference();
    const hasSupply = supplyMarkerIds.includes(supplyMarkerIdForRegion(ISLAND_REGION_BY_ID[id]));
    const shouldRestoreStrategy = hasSupply && preferenceForIsland(preference, id);
    setShowStrategyPanel(shouldRestoreStrategy);
    setShowRestoredPreferenceNotice(hasSupply && hasSavedPreferenceForIsland(preference, id));
    setActiveIslandId(id);
  }

  return (
    <section
      className="taiwan-navigation-map"
      aria-labelledby="taiwan-navigation-map-title"
      data-testid="taiwan-navigation-map"
      data-tour="map"
      onKeyDown={(event) => {
        if (event.key === "Escape" && showRandomAdventureRouteReward) {
          event.preventDefault();
          setShowRandomAdventureRouteReward(false);
        } else if (event.key === "Escape" && showReinforcementReward) {
          event.preventDefault();
          closeReinforcementReward();
        } else if (event.key === "Escape" && showTyphoonStory) {
          event.preventDefault();
          setShowTyphoonStory(false);
        } else if (event.key === "Escape" && showBackpack) {
          event.preventDefault();
          setShowBackpack(false);
        } else if (event.key === "Escape" && activeIsland) {
          event.preventDefault();
          closePanel();
        }
      }}
    >
      <header className="taiwan-navigation-map-heading">
        <div>
          <p className="eyebrow">TAIWAN LEARNING ROUTE</p>
          <h2 id="taiwan-navigation-map-title">台灣主航海圖</h2>
          <p>選一座島看見可探索的方向，再決定這次想練習哪一個主題。</p>
        </div>
        <div className="taiwan-navigation-map-key-group">
          {/* v7：探險小工具移出地圖畫布，讓地圖保持純航海圖 */}
          <div className="taiwan-map-tools">
            <div className="taiwan-map-extras" aria-label="探險小工具">
              <button
                type="button"
                className="taiwan-map-backpack-trigger"
                aria-expanded={showBackpack}
                aria-controls="taiwan-map-backpack-panel"
                onClick={() => setShowBackpack((open) => !open)}
                data-testid="taiwan-map-backpack-trigger"
              >
                <span aria-hidden="true">🎒</span> 特產背包 <small>{inventoryItems.length}</small>
              </button>
            </div>
            <button type="button" className="taiwan-map-easter-egg-trigger" onClick={openTyphoonStory} aria-describedby="taiwan-map-easter-egg-description" data-testid="taiwan-map-easter-egg-trigger">
              <span aria-hidden="true">🌬️</span><span>海風傳聞</span>
            </button>
            <span id="taiwan-map-easter-egg-description" className="sr-only">發現一段台灣天氣故事，不會中斷目前探索。</span>
            {showBackpack ? (
              <aside id="taiwan-map-backpack-panel" className="taiwan-map-backpack-panel" aria-label="特產背包" data-testid="taiwan-map-backpack-panel">
                <div>
                  <p className="eyebrow">TAIWAN SPECIALTIES</p>
                  <h3>特產背包</h3>
                </div>
                <button type="button" onClick={() => setShowBackpack(false)} aria-label="關閉特產背包">關閉</button>
                {inventoryItems.length ? (
                  <ul aria-label="已收集的台灣特產">
                    {inventoryItems.map((item) => <li key={item.id}><span aria-hidden="true">{item.emoji}</span><span>{item.name}</span></li>)}
                  </ul>
                ) : <BxEmptyState slot="backpack" />}
              </aside>
            ) : null}
            {showTyphoonStory ? (
              <aside className="taiwan-map-easter-egg-panel" role="status" aria-live="polite" data-testid="taiwan-map-easter-egg-panel">
                <div>
                  <p className="eyebrow">MAP STORY</p>
                  <h3>颱風的海上來信</h3>
                  <p>一陣暖濕海風提醒航海家：觀察雲層、整理補給，再依自己的步調前進。這是一段純故事發現，不會改變你的答題進度。</p>
                </div>
                <button type="button" onClick={() => setShowTyphoonStory(false)} aria-label="關閉颱風故事">關閉</button>
              </aside>
            ) : null}
          </div>
          <p className="taiwan-navigation-map-key"><Sparkles size={16} aria-hidden="true" /> 光亮表示已留下真實學習線索</p>
          {unlockedSupplyCount > 0 ? <p className="taiwan-navigation-map-supply-summary" role="status">已發現 {unlockedSupplyCount} 個真實學習補給標記</p> : null}
          {showRouteHint ? (
            <p className="taiwan-map-route-hint" role="status" data-testid="taiwan-map-route-hint">
              <Compass size={15} aria-hidden="true" className="taiwan-map-route-hint-compass" data-testid="taiwan-map-route-hint-compass" /> 微光航線可以點一下，查看補給策略
            </p>
          ) : null}
          <section className="taiwan-map-reinforcement-journal" aria-labelledby="taiwan-map-reinforcement-journal-title" data-testid="taiwan-map-reinforcement-journal">
            <div className="taiwan-map-reinforcement-journal-heading">
              <div>
                <p className="eyebrow">WEEKLY REINFORCEMENT LOG</p>
                <h3 id="taiwan-map-reinforcement-journal-title">本週補強小航誌</h3>
              </div>
              <button type="button" onClick={() => speech.speak(reinforcementJournalReadout, setSpeechStatus)} disabled={!speech.isSupported} aria-label="朗讀本週補強小航誌"><Volume2 size={16} aria-hidden="true" /> 朗讀</button>
            </div>
            {reinforcementJournal.length ? (
              <ul aria-label="本週真實完成的補強主題">
                {reinforcementJournal.map((entry) => <li key={`${entry.questionId}-${entry.completedAt}`}><span className="taiwan-map-reinforcement-journal-subject">{entry.subject}</span><span><strong>{entry.knowledge}</strong><small>{formatMapReinforcementJournalTime(entry.completedAt)} 完成</small></span></li>)}
              </ul>
              ) : <BxEmptyState slot="weekly" />}
            {reinforcementSuggestion ? <p className="taiwan-map-reinforcement-suggestion" role="status" data-testid="taiwan-map-reinforcement-suggestion">{reinforcementSuggestion}</p> : null}
          </section>
        </div>
      </header>

      <div className="taiwan-map-layout">
      <div className="taiwan-map-canvas" aria-label="台灣學習航海圖" data-tour="islands">
        {/* v7 回饋對話直接顯示在地圖上（跟著船走） */}
        {showReinforcementReward && reinforcementReward ? (
          <aside
            className="taiwan-map-speech"
            role="status"
            aria-live="polite"
            data-testid="taiwan-map-reinforcement-reward"
            style={{ left: `${(boatPos.x / 1000) * 100}%`, top: `${(boatPos.y / 620) * 100}%` } as CSSProperties}
          >
            <strong>✦ 已完成一題</strong>
            <p>{reinforcementReward.subject}的「{reinforcementReward.knowledge}」補強已留在航海圖。</p>
            <div className="taiwan-map-speech-actions">
              <button type="button" onClick={() => speech.speak(`已完成一題。${reinforcementReward.subject}的${reinforcementReward.knowledge}補強已留在航海圖。`, setSpeechStatus)} disabled={!speech.isSupported} aria-label="朗讀一題補強獎勵"><Volume2 size={14} aria-hidden="true" /> 朗讀</button>
              <button type="button" onClick={closeReinforcementReward} aria-label="關閉一題補強獎勵">關閉</button>
            </div>
          </aside>
        ) : null}
        {showRandomAdventureRouteReward && randomAdventureRouteReward ? (
          <aside
            className="taiwan-map-speech"
            role="status"
            aria-live="polite"
            data-testid="taiwan-map-random-route-reward"
            style={{ left: `${(boatPos.x / 1000) * 100}%`, top: `${(boatPos.y / 620) * 100}%` } as CSSProperties}
          >
            <strong>✦ 隨機冒險完成</strong>
            <p>{randomAdventureRouteReward.subject}航線已為這次真實答對點亮。</p>
            <div className="taiwan-map-speech-actions">
              <button type="button" onClick={() => setShowRandomAdventureRouteReward(false)} aria-label="關閉隨機冒險航線點亮提示">關閉</button>
            </div>
          </aside>
        ) : null}
        <svg className="taiwan-map-outline" viewBox="0 0 1000 620" aria-hidden="true" focusable="false">
          {/* v9 六角格模塊：深淺海＋草原／森林／山地／沙岸（台灣由六角模塊拼出） */}
          <g className="taiwan-map-grid" data-testid="taiwan-map-grid">
            {MAP_HEXES.map((hex) => (
              <g
                key={hex.key}
                className={`taiwan-map-hex taiwan-map-hex-${hex.terrain}${hex.cluster ? ` island-cell-${hex.cluster}` : ""}`}
                transform={`translate(${hex.x.toFixed(2)} ${hex.y.toFixed(2)})`}
              >
                <polygon className="taiwan-map-hex-base" points={HEX_POINTS} />
                {hex.deco}
              </g>
            ))}
          </g>
          {/* 區域名稱嵌在板塊之間 */}
          <text className="taiwan-map-region-label" x="660" y="58">北部</text>
          <text className="taiwan-map-region-label" x="450" y="300">中部</text>
          <text className="taiwan-map-region-label" x="420" y="565">南部</text>
          <text className="taiwan-map-region-label" x="770" y="420">東部</text>
          <text className="taiwan-map-region-label" x="180" y="180">西部</text>
          {routeSegments.map((segment, index) => {
            const routeSupplyId = supplyMarkerIdForRegion(ISLAND_REGION_BY_ID[segment.id]);
            const isRouteGlowing = recentlyCompletedSupplyMarkerIds.includes(routeSupplyId);
            const isRandomAdventureRouteLit = showRandomAdventureRouteReward && randomAdventureRewardIslandId === segment.id;

            return (
              <path
                key={segment.id}
                className={`taiwan-map-route taiwan-map-route-animated island-route-${segment.id}${isRouteGlowing ? " is-route-glowing is-route-interactive" : ""}${isRandomAdventureRouteLit ? " is-route-random-adventure-lit" : ""}`}
                d={segment.d}
                pathLength="1"
                style={{ "--route-delay": `${index * 120}ms` } as CSSProperties}
                data-testid={`taiwan-map-route-${segment.id}`}
                data-route-glowing={isRouteGlowing ? "true" : "false"}
                data-route-interactive={isRouteGlowing ? "true" : "false"}
                data-route-random-adventure-lit={isRandomAdventureRouteLit ? "true" : "false"}
                role={isRouteGlowing ? "button" : undefined}
                tabIndex={isRouteGlowing ? 0 : -1}
                aria-label={isRouteGlowing ? `開啟${islands.find((island) => island.id === segment.id)?.shortTitle ?? "補給島"}的補給策略` : undefined}
                onClick={isRouteGlowing ? () => openSupplyStrategyFromRoute(segment.id) : undefined}
                onKeyDown={isRouteGlowing ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSupplyStrategyFromRoute(segment.id);
                  }
                } : undefined}
              />
            );
          })}
          {/* v7 船會實際航行：transform 過渡到所選島的港口 */}
          <g
            className={`taiwan-map-boat${isSailing ? " is-sailing" : ""}`}
            style={{ transform: `translate(${boatPos.x}px, ${boatPos.y}px)`, transition: "transform 1.9s cubic-bezier(0.45, 0.05, 0.35, 1)" }}
            data-testid="taiwan-map-boat"
            data-sailing={isSailing ? "true" : "false"}
          >
            <circle className="taiwan-map-boat-ring" r="18" />
            <g className="taiwan-map-boat-glyph">
              {/* 船身 */}
              <path d="M-13 4 Q0 9 13 4 L10 10 L-10 10 Z" fill="#8B4A2B" stroke="#5C3D26" strokeWidth="1.5" />
              {/* 主帆 */}
              <path d="M-2 -2 L-2 -16 L9 -6 Z" fill="#F9F3E8" stroke="#5C3D26" strokeWidth="1.5" />
              {/* 副帆 */}
              <path d="M2 -2 L2 -12 L-7 -5 Z" fill="#E8B84B" stroke="#5C3D26" strokeWidth="1.5" />
              {/* 船旗 */}
              <line x1="0" y1="-16" x2="0" y2="-20" stroke="#5C3D26" strokeWidth="1.5" />
              <path d="M0 -20 L6 -18 L0 -16 Z" fill="#E74C3C" />
            </g>
          </g>
          {/* 羅盤裝飾 */}
          <g className="taiwan-map-compass" transform="translate(930 80)">
            <circle r="26" fill="rgba(249,243,232,0.85)" stroke="#173d4a" strokeWidth="1.5" />
            <path d="M0 -20 L5 0 L0 20 L-5 0 Z" fill="#173d4a" />
            <path d="M-20 0 L0 -5 L20 0 L0 5 Z" fill="rgba(23,61,74,0.35)" />
            <text y="-30" textAnchor="middle" fontSize="11" fontWeight="800" fill="#173d4a">N</text>
          </g>
        </svg>

        {/* v8 地標／活動登記處：MAP_CELL_FEATURES 每一筆都會長在對應格線上 */}
        {MAP_CELL_FEATURES.map((feature) => {
          const position = mapCellPercent(feature.col, feature.row);
          return (
            <span
              key={feature.id}
              className={`taiwan-map-feature taiwan-map-feature-${feature.kind}`}
              style={{ left: position.left, top: position.top } as CSSProperties}
              role="img"
              aria-label={`${feature.label}，${feature.note ?? ""}`}
              title={`${feature.label}${feature.note ? `・${feature.note}` : ""}`}
              data-testid={`taiwan-map-feature-${feature.id}`}
            >
              <span className="taiwan-map-feature-icon" aria-hidden="true">{feature.icon}</span>
              <small className="taiwan-map-feature-label" aria-hidden="true">{feature.label}</small>
            </span>
          );
        })}

        {islands.map((island) => {
          const region = ISLAND_REGION_BY_ID[island.id];
          const layout = ISLAND_CELLS[island.id];
          const hasSupplyMarker = supplyMarkerIds.includes(supplyMarkerIdForRegion(region));
          const cellPosition = mapCellPercent(layout.main.col, layout.main.row);
          const Icon = ISLAND_ICONS[island.id];
          const isActive = island.id === activeIslandId;
          const visualState = islandVisualState(island);
          const style = {
            "--island-left": cellPosition.left,
            "--island-top": cellPosition.top,
          } as CSSProperties;

          return (
            <button
              key={island.id}
              ref={(node) => { triggerRefs.current[island.id] = node; }}
              type="button"
              className={`taiwan-map-island island-${island.id} island-visual-${visualState}${island.unlocked ? " is-unlocked" : ""}${recentlyUnlockedIslandIds.includes(island.id) ? " is-island-unlocking" : ""}${isActive ? " is-selected" : ""}${showReinforcementReward && reinforcementRewardIslandId === island.id ? " is-reinforcement-rewarded" : ""}`}
              style={style}
              aria-pressed={isActive}
              aria-controls={isActive ? `taiwan-island-panel-${island.id}` : undefined}
              aria-label={`${island.shortTitle}，${layout.region}，${islandStatus(island)}`}
              data-visual-state={visualState}
              data-testid={`taiwan-map-island-${island.id}`}
              data-island={island.id}
              data-subject={island.id === "language" ? "chinese" : island.id}
              data-region={region}
              data-reinforcement-rewarded={showReinforcementReward && reinforcementRewardIslandId === island.id ? "true" : "false"}
              data-island-unlocking={recentlyUnlockedIslandIds.includes(island.id) ? "true" : "false"}
              onClick={() => { recordPipiEvent("map-visit"); toggleIsland(island.id); }}
            >
              {/* v7 淨空版島嶼標記：只留圖示＋名稱，細節全收進外側系統對話框 */}
              <span className="taiwan-map-island-icon taiwan-island-icon" aria-hidden="true"><Icon size={17} /></span>
              <strong>{island.shortTitle}</strong>
              <span className="sr-only">{layout.region}</span>
              <span className="sr-only">{islandStatus(island)}</span>
              {island.unlocked ? <span className="taiwan-map-island-flag" aria-hidden="true" /> : null}
              {hasSupplyMarker ? <span
                className={`taiwan-map-supply-marker${recentlyCompletedSupplyMarkerIds.includes(supplyMarkerIdForRegion(region)) ? " is-supply-completing" : ""}`}
                role="img"
                aria-label={`${island.shortTitle}已出現學習補給標記`}
                data-testid={`taiwan-map-supply-marker-${island.id}`}
                data-supply-completing={recentlyCompletedSupplyMarkerIds.includes(supplyMarkerIdForRegion(region)) ? "true" : "false"}
              ><span aria-hidden="true">✦</span></span> : null}
            </button>
          );
        })}
      </div>

      {/* v7 系統對話框：點擊板塊後在外側展開（太閤／大航海式） */}
      {activeIsland ? (
        <article
          id={`taiwan-island-panel-${activeIsland.id}`}
          className="taiwan-map-panel taiwan-island-panel"
          aria-labelledby={`taiwan-island-panel-title-${activeIsland.id}`}
        >
          <div className="taiwan-map-panel-copy">
            <p className="eyebrow">{ISLAND_CELLS[activeIsland.id].region}</p>
            <h3 id={`taiwan-island-panel-title-${activeIsland.id}`}>{activeIsland.title}</h3>
            {showRestoredPreferenceNotice ? (
              <p className="taiwan-map-restored-preference" role="status" data-testid="taiwan-map-restored-preference">
                已恢復上次閱讀狀態
              </p>
            ) : null}
            <p>{activeIsland.description}</p>
            <section className="taiwan-map-curriculum-focus" aria-labelledby={`taiwan-map-curriculum-title-${activeIsland.id}`}>
              <p id={`taiwan-map-curriculum-title-${activeIsland.id}`}>課綱探索方向</p>
              <strong>{activeIsland.curriculumFocus}</strong>
              <ul aria-label="建議學習方向">
                {activeIsland.learningDirections.map((direction) => <li key={direction}>{direction}</li>)}
              </ul>
            </section>
            <p className={`taiwan-map-panel-status island-visual-${islandVisualState(activeIsland)}`}><Sparkles size={15} aria-hidden="true" /> {islandStatus(activeIsland)}{islandStarRating(activeIsland) > 0 ? <span className="taiwan-map-panel-stars" aria-label={`目前星級 ${islandStarRating(activeIsland)} 星，滿級 3 星`}>{Array.from({ length: 3 }).map((_, index) => <span key={index} className={index < islandStarRating(activeIsland) ? "is-star-filled" : "is-star-empty"} aria-hidden="true">★</span>)}</span> : null}</p>
            <section className="taiwan-map-panel-progress" aria-label="這座島的練習足跡" data-testid={`taiwan-island-progress-${activeIsland.id}`}>
              <span>練習足跡</span>
              <strong>{activeIsland.attemptCount > 0 ? `已累積 ${activeIsland.attemptCount} 次練習` : "下一次練習會從這裡開始"}</strong>
              <small>{activeIsland.dueReviewCount > 0 ? "可回顧的線索已準備好" : "依自己的步調，選一個方向開始探索"}</small>
            </section>

            <section className={`taiwan-map-landscape island-${activeIsland.id}`} aria-labelledby={`taiwan-landscape-title-${activeIsland.id}`}>
              <p id={`taiwan-landscape-title-${activeIsland.id}`}>台灣地景意象</p>
              <ul data-testid={`taiwan-landscape-icons-${activeIsland.id}`} aria-label={`${activeIsland.shortTitle}的台灣地景圖示`}>
                {ISLAND_LANDSCAPES[activeIsland.id].icons.map((icon) => (
                  <li key={icon.label}>
                    <span className="taiwan-island-icon" aria-hidden="true">{icon.symbol}</span>
                    <span>{icon.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`taiwan-map-landmarks island-${activeIsland.id}`} aria-labelledby={`taiwan-landmarks-title-${activeIsland.id}`} data-testid={`taiwan-landmarks-${activeIsland.id}`}>
              <p id={`taiwan-landmarks-title-${activeIsland.id}`}>真實地標</p>
              <ul aria-label={`${activeIsland.shortTitle}地區的真實台灣地標`}>
                {ISLAND_LANDMARKS[activeIsland.id].map((landmark) => (
                  <li key={landmark.name}>
                    <span className="taiwan-island-icon" aria-hidden="true">{landmark.symbol}</span>
                    <span>
                      <strong>{landmark.name}</strong>
                      <small>{landmark.note}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="taiwan-map-docks" aria-labelledby={`taiwan-docks-title-${activeIsland.id}`} data-testid={`taiwan-docks-${activeIsland.id}`}>
              <p id={`taiwan-docks-title-${activeIsland.id}`}>關卡碼頭 · 教室融合玩法</p>
              <ul aria-label={`${activeIsland.shortTitle}停靠的教室玩法`}>
                {ISLAND_DOCKS[activeIsland.id].map((dock) => {
                  const dockStars = classroomBest[dock.gameId]?.stars;
                  const dockScore = classroomBest[dock.gameId]?.score;
                  const bestText = dockStars ? `最佳 ${dockStars}★` : dockScore !== undefined ? `最佳 ${dockScore} 分` : "尚未挑戰";
                  const dockBody = (
                    <>
                      <span aria-hidden="true">{dock.emoji}</span>
                      <span>
                        <strong>{dock.label}</strong>
                        <small>{dock.hint} · {bestText}</small>
                      </span>
                    </>
                  );
                  return (
                    <li key={dock.gameId}>
                      {onOpenGame ? (
                        <button type="button" onClick={() => onOpenGame(dock.gameId)} aria-label={`前往${dock.label}：${dock.hint}，${bestText}`}>
                          {dockBody}
                        </button>
                      ) : (
                        <span>{dockBody}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {activeIsland.observedKnowledge.length ? (
              <div className="taiwan-map-panel-observed" aria-label="已留下的知識線索">
                <span>已留下的線索</span>
                <ul>{activeIsland.observedKnowledge.map((knowledge) => <li key={knowledge}>{knowledge}</li>)}</ul>
              </div>
            ) : null}

            {activeIsland.recentReviewTopics.length ? (
              <section className="taiwan-map-panel-topics" aria-label="近期可複習知識點">
                <p>近期可複習的知識點</p>
                <ul>
                  {activeIsland.recentReviewTopics.map((topic) => (
                    <li key={topic}>
                      <button type="button" onClick={() => onOpenTopic(activeIsland.subject, topic)} aria-label={`複習「${topic}」`}>{topic}</button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="taiwan-map-panel-empty">還沒有近期練習紀錄也沒關係，可以從這座島開始留下第一個線索。</p>
            )}
            {activeIsland.dueReviewCount ? <p className="taiwan-map-panel-review">這裡有可依自己的步調回顧的線索。</p> : null}
            <section className="taiwan-map-learning-resources" aria-labelledby={`taiwan-map-resources-title-${activeIsland.id}`}>
              <p id={`taiwan-map-resources-title-${activeIsland.id}`}>延伸學習資源</p>
              <ul>
                {activeIsland.resources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`${resource.title}，${resource.provider}，開啟外部資源`}>
                      <span>{resource.title}</span><small>{resource.provider} · {resource.kind}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="taiwan-map-panel-actions">
            <button type="button" className="taiwan-map-panel-primary taiwan-island-btn" onClick={() => onOpenSubject(activeIsland.subject)} aria-label={`繼續挑戰 ${activeIsland.shortTitle}`}>
              <BookOpenCheck size={18} aria-hidden="true" />
              繼續挑戰
            </button>
            <button
              type="button"
              className="taiwan-map-panel-wrong taiwan-island-btn"
              onClick={() => {
                if (onOpenWrongAnswers) onOpenWrongAnswers(activeIsland.subject);
                else onOpenSubject(activeIsland.subject);
              }}
              aria-label={`錯題重練 ${activeIsland.shortTitle}`}
            >
              <RotateCcw size={18} aria-hidden="true" />
              錯題重練
            </button>
            {activeIslandHasSupply ? (
              <>
                <button
                  type="button"
                  ref={(node) => { strategyTriggerRefs.current[activeIsland.id] = node; }}
                  className="taiwan-map-panel-strategy taiwan-island-btn"
                  aria-expanded={showStrategyPanel}
                  aria-controls={`taiwan-map-supply-strategy-${activeIsland.id}`}
                  aria-label={`查看${activeIsland.shortTitle}的學習策略`}
                  onClick={toggleStrategyPanel}
                >
                  查看策略
                </button>
                <button
                  type="button"
                  className="taiwan-map-panel-practice taiwan-island-btn"
                  aria-label={`再練一題：開始${activeIsland.shortTitle}的同科練習`}
                  onClick={() => onOpenSubject(activeIsland.subject)}
                >
                  再練一題
                </button>
                {showStrategyPanel ? (
                  <section
                    id={`taiwan-map-supply-strategy-${activeIsland.id}`}
                    className="taiwan-map-supply-strategy"
                    role="region"
                    aria-labelledby={`taiwan-map-supply-strategy-title-${activeIsland.id}`}
                    data-testid="taiwan-map-supply-strategy"
                    ref={strategyPanelRef}
                  >
                    <p id={`taiwan-map-supply-strategy-title-${activeIsland.id}`}>{activeIslandStrategy?.subjectLabel ?? "補給策略"}</p>
                    <strong>{activeIslandStrategy?.tip}</strong>
                    <div className="taiwan-map-supply-strategy-actions">
                      <button
                        type="button"
                        className="taiwan-map-supply-strategy-close"
                        onClick={() => closeStrategyPanel()}
                        aria-label="關閉補給策略摘要"
                      >
                        關閉策略
                      </button>
                      <button
                        type="button"
                        disabled={!speech.isSupported}
                      onClick={() => speech.speak(activeIslandStrategy?.tip ?? "", setSpeechStatus)}
                    >
                        {speechStatus === "speaking" ? "正在朗讀策略" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀策略"}
                      </button>
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className="taiwan-map-panel-speech taiwan-island-btn"
              disabled={!speech.isSupported}
              onClick={() => speech.speak(islandSpeechText(activeIsland), setSpeechStatus)}
            >
              {speechStatus === "speaking" ? "正在朗讀航線說明" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀航線說明"}
            </button>
            <button type="button" className="taiwan-map-panel-close taiwan-island-btn" onClick={() => closePanel()}>回到航海圖</button>
          </div>
        </article>
      ) : (
        <aside className="taiwan-map-waiting" role="status">
          <p className="eyebrow">SYSTEM MESSAGE</p>
          <strong>點擊任一塊島嶼板塊</strong>
          <p>船會航行到該島海域，並在這裡展開航海對話框。</p>
        </aside>
      )}
      </div>

      <span className="taiwan-map-sr-only" role="status">
        {speechStatus === "speaking" ? "正在朗讀航線說明" : ""}
      </span>
    </section>
  );
}
