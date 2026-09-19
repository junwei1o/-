import React from "react";
import type { OnionScene } from "@/lib/onionLessons";

/**
 * 分數微課的程序化 SVG 動畫舞台。
 * 完全由 scene 參數驅動：元件在切換分鏡時重新掛載（key=sceneIndex），
 * 進場動畫由 onion.css 的 keyframes＋inline animationDelay 自動播放，
 * 不依賴任何影片檔，local-first、手機可看。
 */

const VB_W = 320;
const VB_H = 250;

// 配色（暖橙＝塗色／拿到，奶油＝未塗，海藍＝標註，紅＝錯誤示範）
const C_FILL = "#f2994a";
const C_FILL_EDGE = "#d9822f";
const C_EMPTY = "#fff1dc";
const C_EMPTY_EDGE = "#e6c493";
const C_INK = "#3a4a5a";
const C_SEA = "#1b7082";
const C_RED = "#d65a48";

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180; // 從正上方起，順時針
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function sectorPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const [x1, y1] = polar(cx, cy, r, startAngle);
  const [x2, y2] = polar(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

/** 圓形等分（披薩）。 */
function Wheel({ parts = 4, take = 0, lift = false, showDen = false, showNum = false }: OnionScene) {
  const cx = 132;
  const cy = showDen || showNum ? 104 : 118;
  const r = 72;
  const step = 360 / parts;
  const slices = [];
  for (let i = 0; i < parts; i += 1) {
    const filled = i < take;
    const start = i * step;
    const end = (i + 1) * step;
    const mid = (start + end) / 2;
    const [dx, dy] = polar(0, 0, lift && filled ? 11 : 0, mid);
    slices.push(
      <path
        key={i}
        d={sectorPath(cx, cy, r, start, end)}
        className={`on-slice${filled ? " is-fill" : ""}${lift && filled ? " is-lift" : ""}`}
        style={{
          animationDelay: `${i * 0.16}s`,
          // @ts-expect-error CSS 自訂變數供 keyframes 平移
          "--lx": `${dx.toFixed(1)}px`,
          "--ly": `${dy.toFixed(1)}px`,
          fill: filled ? C_FILL : C_EMPTY,
          stroke: filled ? C_FILL_EDGE : C_EMPTY_EDGE,
        }}
      />,
    );
  }
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="on-stage-svg" role="img" aria-label={`圓形分成 ${parts} 份，塗色 ${take} 份`}>
      <g className="on-wheel">{slices}</g>
      {showDen && (
        <g className="on-label on-label-den">
          <rect x={52} y={196} width={160} height={34} rx={17} fill="#e3f1f4" stroke={C_SEA} strokeWidth={1.5} />
          <text x={132} y={218} textAnchor="middle" className="on-svg-txt" fill={C_SEA}>
            一共 {parts} 份 → 分母 {parts}
          </text>
        </g>
      )}
      {showNum && (
        <g className="on-label on-label-num">
          <rect x={196} y={40} width={118} height={34} rx={17} fill="#fdeee2" stroke={C_FILL_EDGE} strokeWidth={1.5} />
          <text x={255} y={62} textAnchor="middle" className="on-svg-txt" fill="#b5651d">
            拿 {take} 份 → 分子 {take}
          </text>
        </g>
      )}
    </svg>
  );
}

/** 長條等分（巧克力）。 */
function Bar({ parts = 4, take = 0, showNum = false }: OnionScene) {
  const x0 = 36;
  const x1 = VB_W - 36;
  const y0 = 92;
  const y1 = 158;
  const w = (x1 - x0) / parts;
  const cells = [];
  for (let i = 0; i < parts; i += 1) {
    const filled = i < take;
    cells.push(
      <rect
        key={i}
        x={x0 + i * w + 1.5}
        y={y0}
        width={w - 3}
        height={y1 - y0}
        rx={5}
        className={`on-bar-cell${filled ? " is-fill" : ""}`}
        style={{ animationDelay: `${i * 0.12}s`, fill: filled ? C_FILL : C_EMPTY, stroke: filled ? C_FILL_EDGE : C_EMPTY_EDGE }}
      />,
    );
  }
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="on-stage-svg" role="img" aria-label={`長條分成 ${parts} 格，塗色 ${take} 格`}>
      <g>{cells}</g>
      {showNum && (
        <g className="on-label">
          <rect x={70} y={190} width={180} height={36} rx={18} fill="#fdeee2" stroke={C_FILL_EDGE} strokeWidth={1.5} />
          <text x={160} y={213} textAnchor="middle" className="on-svg-txt" fill="#b5651d">
            全部 {parts} 格是分母、塗色 {take} 格是分子
          </text>
        </g>
      )}
    </svg>
  );
}

/** 分數符號組裝。 */
function Frac({ num = 3, den = 4 }: OnionScene) {
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="on-stage-svg" role="img" aria-label={`分數 ${num} 分之 ${den}`}>
      <text x={160} y={92} textAnchor="middle" className="on-frac-num on-frac-part" style={{ animationDelay: "0.1s" }} fill={C_FILL_EDGE}>
        {num}
      </text>
      <rect className="on-frac-line on-frac-part" x={112} y={118} width={96} height={7} rx={3.5} fill={C_INK} style={{ animationDelay: "0.55s" }} />
      <text x={160} y={182} textAnchor="middle" className="on-frac-den on-frac-part" style={{ animationDelay: "0.95s" }} fill={C_SEA}>
        {den}
      </text>
      <text x={232} y={100} className="on-frac-tag on-frac-part" style={{ animationDelay: "1.2s" }} fill={C_FILL_EDGE}>
        分子
      </text>
      <text x={232} y={184} className="on-frac-tag on-frac-part" style={{ animationDelay: "1.35s" }} fill={C_SEA}>
        分母
      </text>
    </svg>
  );
}

/** 錯誤示範：切成明顯不等大的三塊。 */
function Uneven() {
  const cx = 132;
  const cy = 112;
  const r = 74;
  const angles = [0, 42, 172, 360]; // 42°、130°、188°，明顯不等大
  const colors = ["#e0a36a", "#d65a48", "#c98f5e"];
  const slices = [];
  for (let i = 0; i < 3; i += 1) {
    slices.push(
      <path
        key={i}
        d={sectorPath(cx, cy, r, angles[i], angles[i + 1])}
        className="on-uneven-slice"
        style={{ animationDelay: `${0.2 + i * 0.25}s`, fill: colors[i], stroke: "#a85a3c" }}
      />,
    );
  }
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="on-stage-svg" role="img" aria-label="切成大小不同的三塊，不是平均分">
      <g>{slices}</g>
      <g className="on-cross">
        <circle cx={236} cy={70} r={26} fill="#fff" stroke={C_RED} strokeWidth={3} />
        <path d="M224 58 L248 82 M248 58 L224 82" stroke={C_RED} strokeWidth={4} strokeLinecap="round" />
      </g>
      <text x={132} y={214} textAnchor="middle" className="on-svg-txt" fill={C_RED}>
        大小不一樣，不公平！
      </text>
    </svg>
  );
}

/** 等值分數：1/2 = 2/4 = 3/6，陰影面積相同。 */
function Equivalent() {
  const rows = [
    { parts: 2, take: 1, label: "1/2", delay: 0.2 },
    { parts: 4, take: 2, label: "2/4", delay: 0.9 },
    { parts: 6, take: 3, label: "3/6", delay: 1.6 },
  ];
  const x0 = 40;
  const x1 = 236;
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="on-stage-svg" role="img" aria-label="二分之一等於四分之二等於六分之三">
      {rows.map((row, ri) => {
        const y0 = 26 + ri * 66;
        const h = 46;
        const w = (x1 - x0) / row.parts;
        const cells = [];
        for (let i = 0; i < row.parts; i += 1) {
          const filled = i < row.take;
          cells.push(
            <rect
              key={i}
              x={x0 + i * w + 1.5}
              y={y0}
              width={w - 3}
              height={h}
              rx={4}
              className={`on-eq-cell${filled ? " is-fill on-equiv-glow" : ""}`}
              style={{ animationDelay: `${row.delay + i * 0.08}s`, fill: filled ? C_FILL : C_EMPTY, stroke: filled ? C_FILL_EDGE : C_EMPTY_EDGE }}
            />,
          );
        }
        return (
          <g key={ri} className="on-eq-row">
            {cells}
            <text x={268} y={y0 + 31} textAnchor="middle" className="on-eq-label" fill={C_INK}>
              {row.label}
            </text>
            {ri < rows.length - 1 && (
              <text x={268} y={y0 + 62} textAnchor="middle" className="on-eq-eq" fill={C_SEA}>
                =
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function FractionStage({ scene }: { scene: OnionScene }) {
  switch (scene.kind) {
    case "uneven":
      return <Uneven />;
    case "wheel":
      return <Wheel {...scene} />;
    case "bar":
      return <Bar {...scene} />;
    case "frac":
      return <Frac {...scene} />;
    case "equiv":
      return <Equivalent />;
    default:
      return null;
  }
}
