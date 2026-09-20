/**
 * 洋蔥動畫講解：四堂課的「連續場景動畫」。
 *
 * 與早期「孤立小教具＋入場動畫」不同，這裡每堂課是一個固定的故事場景，
 * 隨著分鏡 frame 演進，場景中的元素連續運動（水滴循環、披薩切片滑動合併、
 * 三角形複製翻轉拼合、句卡關鍵字發光），洋蔥固定在角落當解說員。
 *
 * 每個場景元件只吃 { frame: number; action: OnionAction }，frame 對應資料檔的分鏡序。
 * 純 SVG + CSS keyframes，手機順暢、可離線、尊重 prefers-reduced-motion。
 */
import React from "react";
import type { OnionAction } from "@/game/onionAcademyLessons";

export type SceneProps = { frame: number; action: OnionAction };

/* ===================== 洋蔥角色（場景解說員） ===================== */
export function OnionMascot({ action, frame, size = 92 }: { action: OnionAction; frame: number; size?: number }) {
  const bodyCls =
    action === "jump" || action === "cheer" ? "ol-onion--hop" : action === "walk" ? "ol-onion--bob" : "";
  const armCls =
    action === "wave"
      ? "ol-arm--wave"
      : action === "point"
        ? "ol-arm--point"
        : action === "cheer"
          ? "ol-arm--cheer"
          : action === "think"
            ? "ol-arm--think"
            : "";
  return (
    <div className={`ol-onion ${bodyCls}`} style={{ width: size, height: size * 1.25 }} aria-hidden="true">
      <svg viewBox="0 0 120 150" width={size} height={size * 1.25} className="ol-onion-svg">
        <path d="M60 18 C 54 6 66 -2 62 16" stroke="#5fa84f" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M60 16 C 70 6 78 12 64 20" stroke="#6fc15c" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M60 22 C 30 22 18 52 30 96 C 36 118 48 130 60 130 C 72 130 84 118 90 96 C 102 52 90 22 60 22 Z" fill="#b794d6" stroke="#8a5fb0" strokeWidth="2" />
        <path d="M40 40 C 50 44 70 44 80 40" stroke="#9a6cc0" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M36 70 C 48 74 72 74 84 70" stroke="#9a6cc0" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M40 98 C 50 102 70 102 80 98" stroke="#9a6cc0" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="48" cy="62" r="5.5" fill="#2a1d3a" />
        <circle cx="72" cy="62" r="5.5" fill="#2a1d3a" />
        <circle cx="50" cy="60" r="1.8" fill="#fff" />
        <circle cx="74" cy="60" r="1.8" fill="#fff" />
        <path d="M52 80 Q 60 88 68 80" stroke="#2a1d3a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="38" cy="78" rx="6" ry="4" fill="#f2a0c0" opacity="0.55" />
        <ellipse cx="82" cy="78" rx="6" ry="4" fill="#f2a0c0" opacity="0.55" />
        <g className={`ol-arm ol-arm-l ${armCls}`}>
          <path d="M32 86 C 18 88 12 100 18 110" stroke="#8a5fb0" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
        <g className={`ol-arm ol-arm-r ${armCls}`}>
          <path d="M88 86 C 102 88 108 100 102 110" stroke="#8a5fb0" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
        {action === "think" && (
          <g className="ol-think">
            <circle cx="100" cy="40" r="3" fill="#fff" stroke="#8a5fb0" />
            <circle cx="108" cy="30" r="5" fill="#fff" stroke="#8a5fb0" />
            <text x="108" y="34" textAnchor="middle" fontSize="9" fill="#8a5fb0">?</text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* 場景內的階段標籤 pill（SVG）。 */
function SceneTag({ x, y, text, state, accent = "#2f9e6e", w }: { x: number; y: number; text: string; state: "off" | "on" | "now"; accent?: string; w?: number }) {
  const width = w ?? 58;
  const cls = state === "now" ? "ol-tag-pill is-now" : state === "on" ? "ol-tag-pill is-on" : "ol-tag-pill";
  const fill = state === "off" ? "#ffffff" : accent;
  const stroke = state === "off" ? "#c9d6d2" : accent;
  const color = state === "off" ? "#9aa8a4" : "#fff";
  return (
    <g className={cls}>
      <rect x={x - width / 2} y={y - 12} width={width} height={24} rx={12} fill={fill} stroke={stroke} strokeWidth="1.6" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>{text}</text>
    </g>
  );
}

/* ===================== 課程 3：自然 — 水循環連續場景 ===================== */
function WaterCycleScene({ frame, action }: SceneProps) {
  const rise = frame >= 1;
  const condense = frame >= 2;
  const rain = frame === 3 || frame === 5;
  const flow = frame >= 4;
  const allLoop = frame >= 5;
  const sunPower = frame >= 6;
  const tagState = (idx: number): "off" | "on" | "now" =>
    frame === idx + 1 ? "now" : frame > idx + 1 ? "on" : "off";

  const rises = [172, 188, 204];
  const rains = [196, 214, 232, 250];
  const flows = [250, 214, 178, 142];

  return (
    <div className={`ol-scene ol-scene--water wc-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="水循環動畫場景">
        <defs>
          <linearGradient id="wcSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe6ff" />
            <stop offset="100%" stopColor="#eaf7ff" />
          </linearGradient>
          <linearGradient id="wcSea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3fa0e0" />
            <stop offset="100%" stopColor="#1f74b8" />
          </linearGradient>
        </defs>

        {/* 天空 */}
        <rect x="0" y="0" width="340" height="190" fill="url(#wcSky)" />
        {/* 太陽 */}
        <g className={`wc-sun ${sunPower ? "is-power" : ""}`}>
          <g className="wc-sun-rays">
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x="43" y="8" width="4" height="11" rx="2" fill="#ffc531"
                transform={`rotate(${i * 45} 45 40)`} />
            ))}
          </g>
          <circle cx="45" cy="40" r="19" fill="#ffd45e" stroke="#f5b301" strokeWidth="2" />
        </g>

        {/* 山（右側） */}
        <path d="M176 188 L250 96 L300 150 L340 120 L340 188 Z" fill="#8fbf7e" />
        <path d="M250 96 L272 122 L240 118 Z" fill="#f4fbf6" />
        <path d="M300 150 L318 162 L292 160 Z" fill="#eef7f1" />

        {/* 河（山腳蜿蜒入海） */}
        <path d="M250 150 C 210 158 196 170 150 176 C 120 180 104 184 86 188"
          fill="none" stroke="#7cc4ef" strokeWidth="9" strokeLinecap="round" opacity="0.9" />

        {/* 海洋 */}
        <path d="M0 186 Q 40 180 80 186 T 160 186 T 240 186 T 340 186 L340 232 L0 232 Z" fill="url(#wcSea)" />
        <path className="wc-wave wc-wave-1" d="M0 192 Q 40 187 80 192 T 160 192 T 240 192 T 340 192" fill="none" stroke="#bfe6ff" strokeWidth="2.5" opacity="0.7" />
        <path className="wc-wave wc-wave-2" d="M0 204 Q 40 199 80 204 T 160 204 T 240 204 T 340 204" fill="none" stroke="#bfe6ff" strokeWidth="2.5" opacity="0.5" />

        {/* 蒸發：水滴從海面上升 */}
        <g className={`wc-layer wc-rise ${rise ? "is-active" : ""}`}>
          {rises.map((x, i) => (
            <circle key={i} className="wc-drop wc-drop--rise" cx={x} cy="180" r="3.4" fill="#57b0e8"
              style={{ animationDelay: `${i * 0.9}s` }} />
          ))}
          <path className="wc-arrow wc-arrow--up" d="M186 170 L186 116 M180 124 L186 114 L192 124"
            fill="none" stroke="#2f9e6e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* 雲（凝結長大、降水變灰） */}
        <g className={`wc-cloud ${condense ? "is-formed" : ""} ${rain ? "is-rain" : ""}`}>
          <ellipse cx="206" cy="78" rx="26" ry="20" />
          <ellipse cx="234" cy="72" rx="30" ry="24" />
          <ellipse cx="262" cy="80" rx="24" ry="18" />
          <ellipse cx="232" cy="90" rx="40" ry="16" />
        </g>

        {/* 凝結時雲周圍聚攏的小水珠 */}
        <g className={`wc-layer wc-condense ${condense ? "is-active" : ""}`}>
          {[[182, 60], [286, 58], [196, 48], [276, 46]].map(([x, y], i) => (
            <circle key={i} className="wc-mote" cx={x} cy={y} r="2.6" fill="#9fd0f2" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </g>

        {/* 降水：雨滴從雲落下 */}
        <g className={`wc-layer wc-rainlayer ${rain ? "is-active" : ""}`}>
          {rains.map((x, i) => (
            <path key={i} className="wc-drop wc-drop--rain" d={`M${x} 104 q-3 7 0 11 q3 -4 0 -11 Z`} fill="#3f93d6"
              style={{ animationDelay: `${i * 0.45}s` }} />
          ))}
        </g>

        {/* 匯流：河水往海 */}
        <g className={`wc-layer wc-flow ${flow ? "is-active" : ""}`}>
          {flows.map((x, i) => (
            <path key={i} className="wc-flow-dot" d={`M${x} ${166 - (i % 2) * 4} l-7 4 l7 4 Z`} fill="#1f74b8"
              style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>

        {/* 全循環指示環 */}
        {allLoop && (
          <g className="wc-loopring">
            <path d="M150 104 C 150 60 190 40 232 52" fill="none" stroke="#2f9e6e" strokeWidth="2"
              strokeDasharray="5 5" strokeLinecap="round" />
          </g>
        )}

        {/* 階段標籤 */}
        <SceneTag x={120} y={128} text="蒸發" state={tagState(0)} accent="#2f9e6e" />
        <SceneTag x={232} y={30} text="凝結" state={tagState(1)} accent="#2f7ec4" w={58} />
        <SceneTag x={300} y={128} text="降水" state={tagState(2)} accent="#3f78c8" />
        <SceneTag x={120} y={160} text="匯流" state={tagState(3)} accent="#1f8a8a" />
      </svg>
      <div className="ol-scene-mascot"><OnionMascot action={action} frame={frame} size={74} /></div>
    </div>
  );
}

/* SceneDispatcher 在檔案末端，其他三個場景見下方。 */

/* 圓餅切片 path 產生器（cx,cy 圓心、r 半徑、b 等份），回傳每片 path 字串。 */
function pieSlices(cx: number, cy: number, r: number, b: number): string[] {
  if (b <= 0) return [];
  if (b === 1) return [`M${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`];
  const step = 360 / b;
  const out: string[] = [];
  for (let i = 0; i < b; i++) {
    const s = ((i * step - 90) * Math.PI) / 180;
    const e = (((i + 1) * step - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = step > 180 ? 1 : 0;
    out.push(`M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`);
  }
  return out;
}

/* 一個小披薩（盤）：b 等份、a 片上色，sliceCls 控制每片動畫 class。 */
function MiniPizza({ cx, cy, r, b, a, sliceCls, plate = true }: { cx: number; cy: number; r: number; b: number; a: number; sliceCls?: (i: number) => string; plate?: boolean }) {
  const slices = pieSlices(cx, cy, r, b);
  return (
    <g>
      {plate && <circle cx={cx} cy={cy + 3} r={r + 9} fill="#fff" stroke="#e8d9c2" strokeWidth="2" />}
      <circle cx={cx} cy={cy} r={r} fill="#ffe7b0" stroke="#d99a3c" strokeWidth="2" />
      {slices.map((d, i) => (
        <path key={i} d={d} fill={i < a ? "#ef8a3c" : "transparent"} stroke="#c97a2e" strokeWidth="1.6"
          className={sliceCls ? sliceCls(i) : "fp-static"} />
      ))}
    </g>
  );
}

/* 直式分數標記（分子/分母）。 */
function Frac({ x, y, n, d, denHi, numHi, scale = 1 }: { x: number; y: number; n: number | string; d: number | string; denHi?: boolean; numHi?: boolean; scale?: number }) {
  return (
    <g className="fp-frac" style={{}} transform={`translate(${x} ${y}) scale(${scale})`}>
      <text x="0" y="-4" textAnchor="middle" fontSize="15" fontWeight="900" className={numHi ? "fp-num is-hi" : "fp-num"} fill="#b35a12">{n}</text>
      <line x1="-11" y1="2" x2="11" y2="2" stroke="#b35a12" strokeWidth="2.4" />
      <text x="0" y="17" textAnchor="middle" fontSize="15" fontWeight="900" className={denHi ? "fp-den is-hi" : "fp-den"} fill="#b35a12">{d}</text>
    </g>
  );
}

/* ===================== 課程 1：數學 — 分數加減披薩連續場景 ===================== */
function FractionScene({ frame, action }: SceneProps) {
  // frame: 0 完整 1 切四等份 2 吃1片 3 朋友給2片 4 分母同分子相加 5 合併3/4 6 口訣
  const cut = frame >= 1;
  const take1 = frame >= 2;
  const take2 = frame >= 3;
  const sameDen = frame >= 4;
  const merge = frame >= 5;
  const rule = frame >= 6;

  const main = pieSlices(96, 132, 64, 4);
  const gone = (i: number) => (i === 0 && take1) || ((i === 1 || i === 2) && take2);
  const result = pieSlices(250, 112, 50, 4);

  return (
    <div className={`ol-scene ol-scene--fraction fp-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="分數加減披薩動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#fff6e6" />

        {/* 主披薩（左） */}
        <g className="fp-main">
          <circle cx="96" cy="135" r="72" fill="#fff" stroke="#ecdcc2" strokeWidth="2" />
          <circle cx="96" cy="132" r="64" fill="#ffe7b0" stroke="#d99a3c" strokeWidth="2.5" />
          {main.map((d, i) => (
            <path key={i} d={d}
              fill={gone(i) ? "#f6c98f" : "#ef8a3c"}
              stroke="#c97a2e" strokeWidth="2"
              className={`fp-slice ${cut ? "is-cut" : ""} ${gone(i) ? "is-gone" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
          {cut && <text x="96" y="214" textAnchor="middle" fontSize="13" fontWeight="800" fill="#b35a12">切成 4 等份，每份 1/4</text>}
        </g>

        {/* 你吃的 1 片（右上盤） */}
        <g className={`fp-plate fp-plate--you ${take1 && !merge ? "is-show" : ""} ${merge ? "is-leave" : ""}`}>
          <MiniPizza cx={256} cy={62} r={22} b={4} a={1} sliceCls={() => "fp-fly fp-fly--you"} />
          <text x="256" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="#b35a12">你吃的</text>
          <Frac x={312} y={66} n={1} d={4} denHi={sameDen} numHi={sameDen} />
        </g>

        {/* 朋友給的 2 片（右中盤） */}
        <g className={`fp-plate fp-plate--friend ${take2 && !merge ? "is-show" : ""} ${merge ? "is-leave" : ""}`}>
          <MiniPizza cx={256} cy={128} r={22} b={4} a={2} sliceCls={(i) => `fp-fly fp-fly--friend ${i < 2 ? "is-on" : ""}`} />
          <text x="250" y="176" textAnchor="middle" fontSize="12" fontWeight="800" fill="#b35a12">朋友給的</text>
          <Frac x={312} y={132} n={2} d={4} denHi={sameDen} numHi={sameDen} />
        </g>

        {/* f4：分母相同提示（置頂）＋相加箭頭 */}
        {sameDen && !merge && (
          <g className="fp-sameden">
            <text x="250" y="100" textAnchor="middle" fontSize="26" fontWeight="900" fill="#e07a2f">＋</text>
            <rect x="20" y="8" width="300" height="30" rx="15" fill="#ffe1c2" stroke="#ef8a3c" strokeWidth="1.6" />
            <text x="170" y="28" textAnchor="middle" fontSize="13.5" fontWeight="900" fill="#b35a12">分母都是 4，不變！分子直接相加</text>
          </g>
        )}

        {/* f5-6：合併結果披薩 3/4 */}
        <g className={`fp-result ${merge ? "is-show" : ""}`}>
          <circle cx="250" cy="115" r="60" fill="#fff" stroke="#ecdcc2" strokeWidth="2" />
          <circle cx="250" cy="112" r="50" fill="#ffe7b0" stroke="#d99a3c" strokeWidth="2" />
          {result.map((d, i) => (
            <path key={i} d={d} fill={i < 3 ? "#ef8a3c" : "transparent"} stroke="#c97a2e" strokeWidth="1.8"
              className="fp-result-slice" style={{ animationDelay: `${i * 0.28}s` }} />
          ))}
          <g className="fp-eq"><text x="178" y="118" textAnchor="middle" fontSize="28" fontWeight="900" fill="#e07a2f">＝</text></g>
          <g className="fp-result-frac">
            <circle cx="250" cy="112" r="22" fill="#ffffff" stroke="#d99a3c" strokeWidth="1.6" />
            <text x="250" y="106" textAnchor="middle" fontSize="16" fontWeight="900" fill="#d2501f">3</text>
            <line x1="239" y1="112" x2="261" y2="112" stroke="#d2501f" strokeWidth="2.2" />
            <text x="250" y="128" textAnchor="middle" fontSize="16" fontWeight="900" fill="#d2501f">4</text>
          </g>
        </g>

        {/* f6 口訣卡（置頂，避免遮擋結果披薩） */}
        {rule && (
          <g className="fp-rule">
            <rect x="20" y="8" width="300" height="32" rx="16" fill="#8a5fb0" />
            <text x="170" y="29" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">同分母相加：分母不變，分子相加</text>
          </g>
        )}
      </svg>
      <div className="ol-scene-mascot"><OnionMascot action={action} frame={frame} size={66} /></div>
    </div>
  );
}

/* ===================== 課程 4：數學 — 三角形面積拼合推導場景 ===================== */
function TriangleScene({ frame, action }: SceneProps) {
  // frame: 0 開場 1 認識底高 2 複製一個 3 翻轉拼平行四邊形 4 底×高 5 一半÷2 6 公式 7 口訣
  const showBase = frame >= 1;
  const copied = frame >= 2;
  const merged = frame >= 3;
  const area = frame >= 4;
  const half = frame === 5;
  const formula = frame >= 6;

  // 原三角形 A：(70,150)(230,150)(120,40)。繞平行四邊形中心 (175,95) 轉 180° 得貼合的 B。
  const A = "M70 150 L230 150 L120 40 Z";
  const banner =
    frame <= 1 ? "橫的叫「底」，垂直量到頂點叫「高」"
    : frame === 2 ? "複製一個一模一樣的三角形"
    : frame === 3 ? "翻轉複製品，兩個拼成平行四邊形！"
    : frame === 4 ? "平行四邊形面積 ＝ 底 × 高 ＝ 40"
    : frame === 5 ? "三角形是一半：40 ÷ 2 ＝ 20"
    : frame === 6 ? "三角形面積 ＝ 底 × 高 ÷ 2"
    : "口訣：底乘高、除以二";

  return (
    <div className={`ol-scene ol-scene--triangle ta-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="三角形面積推導動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#eef4fb" />

        {/* 平行四邊形外框（拼合後強調） */}
        {merged && (
          <path className="ta-parallel" d="M70 150 L230 150 L280 40 L120 40 Z"
            fill="rgba(58,123,191,0.08)" stroke="#3a7bbf" strokeWidth="2" strokeDasharray="6 4" />
        )}

        {/* 原三角形 A（一半時閃爍） */}
        <path d={A} fill="#bcd8f5" stroke="#3a7bbf" strokeWidth="2.6"
          className={`ta-tri-a ${half ? "is-half" : ""}`} />

        {/* 複製品 B：初始與 A 同 path，複製時偏移，拼合時繞中心轉 180° */}
        {copied && (
          <path d={A} fill="#9fc7ec" stroke="#2f63a0" strokeWidth="2.6"
            className={`ta-copy ${merged ? "is-merge" : "is-copy"}`} />
        )}

        {/* 高（虛線）、直角記號與底標示——放最上層才不會被填色蓋住 */}
        {showBase && (
          <g className="ta-height">
            <line x1="120" y1="40" x2="120" y2="150" stroke="#e07a4f" strokeWidth="2" strokeDasharray="5 4" />
            <path d="M120 150 L113 150 L113 143" fill="none" stroke="#e07a4f" strokeWidth="1.8" />
            <text x="127" y="98" fontSize="13" fontWeight="900" fill="#d8602f">高 5</text>
            {/* 底標示 */}
            <line x1="70" y1="158" x2="230" y2="158" stroke="#3a5a8c" strokeWidth="2.5" />
            <text x="150" y="172" textAnchor="middle" fontSize="13" fontWeight="900" fill="#3a5a8c">底 8</text>
          </g>
        )}

        {/* 面積標註 */}
        {area && !half && (
          <text x="150" y="112" textAnchor="middle" fontSize="15" fontWeight="900" fill="#2f63a0" className="ta-eq">8 × 5</text>
        )}
        {half && (
          <g className="ta-divide">
            <text x="150" y="108" textAnchor="middle" fontSize="17" fontWeight="900" fill="#d8602f">÷ 2</text>
            <text x="150" y="128" textAnchor="middle" fontSize="14" fontWeight="800" fill="#d8602f">＝ 20</text>
          </g>
        )}

        {/* 公式/口訣橫幅 */}
        <g className={`ta-banner ${formula ? "is-formula" : ""}`} key={banner}>
          <rect x="10" y="184" width="278" height="34" rx="17"
            fill={formula ? "#3a7bbf" : "#ffffff"} stroke={formula ? "#3a7bbf" : "#c3d6ec"} strokeWidth="1.6" />
          <text x="149" y="206" textAnchor="middle" fontSize="13" fontWeight="900"
            fill={formula ? "#fff" : "#3a5a8c"}>{banner}</text>
        </g>
      </svg>
      <div className="ol-scene-mascot ol-scene-mascot--br-sm"><OnionMascot action={action} frame={frame} size={56} /></div>
    </div>
  );
}

/* ===================== 課程 2：國語 — 的得地句卡連續場景（HTML 文字動畫） ===================== */
function DeUsageScene({ frame, action }: SceneProps) {
  // frame: 0 三字牌 1 的+名詞 2 得+動詞後 3 地+動詞前 4 口訣 5 例句 6 準備闖關
  return (
    <div className={`ol-scene ol-scene--chinese de-f${frame}`}>
      <div className="de-board">
        {frame === 0 && (
          <div className="de-stage" key="de0">
            <div className="de-cards">
              <span className="de-card de-c1">的</span>
              <span className="de-card de-c2">得</span>
              <span className="de-card de-c3">地</span>
            </div>
            <p className="de-hint">讀音都一樣，用法卻不同</p>
          </div>
        )}

        {frame === 1 && (
          <div className="de-stage" key="de1">
            <p className="de-sentence">
              <span className="de-word">紅</span>
              <span className="de-key de-c1">的</span>
              <span className="de-word de-noun">蘋果<span className="de-tag de-tag--n">名詞</span></span>
            </p>
            <p className="de-rule">形容詞 <b className="de-c1">的</b> 名詞</p>
          </div>
        )}

        {frame === 2 && (
          <div className="de-stage" key="de2">
            <p className="de-sentence">
              <span className="de-word de-verb">跑<span className="de-tag de-tag--v">動詞</span></span>
              <span className="de-key de-c2">得</span>
              <span className="de-word">快</span>
            </p>
            <p className="de-rule">動詞 <b className="de-c2">得</b> 補充說明</p>
          </div>
        )}

        {frame === 3 && (
          <div className="de-stage" key="de3">
            <p className="de-sentence">
              <span className="de-word">慢慢</span>
              <span className="de-key de-c3">地</span>
              <span className="de-word de-verb">走<span className="de-tag de-tag--v">動詞</span></span>
            </p>
            <p className="de-rule">修飾詞 <b className="de-c3">地</b> 動詞</p>
          </div>
        )}

        {frame === 4 && (
          <div className="de-stage" key="de4">
            <div className="de-mantra">
              <p><span className="de-key sm de-c1">的</span> 接 <b>名詞</b></p>
              <p><span className="de-key sm de-c2">得</span> 在 <b>動詞後</b></p>
              <p><span className="de-key sm de-c3">地</span> 在 <b>動詞前</b></p>
            </div>
          </div>
        )}

        {frame === 5 && (
          <div className="de-stage" key="de5">
            <p className="de-sentence">
              <span className="de-word">很漂亮</span>
              <span className="de-key de-c1">的</span>
              <span className="de-word de-noun">衣服<span className="de-tag de-tag--n">名詞</span></span>
            </p>
            <p className="de-rule">後面是名詞，所以用 <b className="de-c1">的</b></p>
          </div>
        )}

        {frame === 6 && (
          <div className="de-stage" key="de6">
            <p className="de-go">換你試試看！</p>
            <p className="de-hint">看句子，選出正確的字</p>
          </div>
        )}
      </div>
      <div className="ol-scene-mascot ol-scene-mascot--chinese"><OnionMascot action={action} frame={frame} size={54} /></div>
    </div>
  );
}

/* ===================== 場景分派器 ===================== */
export function LessonScene({ lessonId, frame, action }: { lessonId: string } & SceneProps) {
  if (lessonId === "water-cycle") return <WaterCycleScene frame={frame} action={action} />;
  if (lessonId === "fraction-add") return <FractionScene frame={frame} action={action} />;
  if (lessonId === "triangle-area") return <TriangleScene frame={frame} action={action} />;
  return <DeUsageScene frame={frame} action={action} />;
}
