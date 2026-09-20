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
import type { OnionAction, OnionProp } from "@/game/onionAcademyLessons";

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

/* ===================== 課程 5：自然 — 光合作用綠色工廠 ===================== */
function PhotosynthesisScene({ frame, action }: SceneProps) {
  // frame: 0 開場 1 三原料 2 水上升 3 CO2進氣孔 4 葉綠體亮 5 陽光開機 6 養分送出 7 放氧 8 公式 9 口訣
  const water = frame >= 2;
  const co2 = frame >= 3;
  const chloro = frame >= 4;
  const power = frame >= 5;
  const glucose = frame >= 6;
  const oxygen = frame >= 7;
  const formula = frame === 8;
  const mantra = frame === 9;
  const banner = formula ? "CO₂ ＋ H₂O →（陽光・葉綠體）養分 ＋ O₂"
    : mantra ? "口訣：根送水、孔進氣，變養分、吐氧氣"
    : "";

  return (
    <div className={`ol-scene ol-scene--photo ph-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="光合作用工廠動畫">
        <defs>
          <linearGradient id="phSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff3d6" />
            <stop offset="100%" stopColor="#e8f7e4" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="340" height="232" rx="16" fill="url(#phSky)" />
        {/* 土壤與植物主體 */}
        <rect x="0" y="200" width="340" height="32" rx="10" fill="#c9a06b" />
        <path d="M118 200 C 116 176 118 158 122 138" stroke="#4c8c46" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M100 200 C 102 186 106 174 116 164 M136 200 C 134 188 130 178 124 168" stroke="#3f7a3c" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        {/* 葉片（工廠主體） */}
        <g className={`ph-leaf ${power ? "is-power" : ""}`}>
          <path d="M122 138 C 96 108 104 62 158 52 C 226 40 264 78 258 108 C 252 138 208 156 168 152 C 148 150 132 146 122 138 Z"
            fill="#7cc66a" stroke="#3f7a3c" strokeWidth="2.6" />
          <path d="M126 136 C 160 120 210 100 252 92" stroke="#3f7a3c" strokeWidth="2.2" fill="none" />
          {[[160, 92], [186, 82], [212, 76], [172, 116], [198, 106], [224, 96]].map(([x, y], i) => (
            <circle key={i} className="ph-chloro" cx={x} cy={y} r="6" fill="#4c9e3c"
              style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
        {/* 太陽 */}
        <g className={`ph-sun ${power ? "is-power" : ""}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="40" y="9" width="4" height="10" rx="2" fill="#ffc531" transform={`rotate(${i * 45} 42 40)`} />
          ))}
          <circle cx="42" cy="40" r="18" fill="#ffd45e" stroke="#f5b301" strokeWidth="2" />
          {power && <path d="M60 56 L110 84 M66 74 L104 92" stroke="#ffca28" strokeWidth="3" strokeLinecap="round" className="ph-ray" />}
        </g>
        {/* 水滴沿莖上升 */}
        <g className={`ph-layer ${water ? "is-active" : ""}`}>
          {[196, 176, 156].map((y, i) => (
            <circle key={i} className="ph-drop" cx="119" cy={y} r="3.6" fill="#57b0e8" style={{ animationDelay: `${i * 0.8}s` }} />
          ))}
          <text x="86" y="182" fontSize="12" fontWeight="900" fill="#2f74b8">H₂O↑</text>
        </g>
        {/* CO₂ 從右側氣孔進入 */}
        <g className={`ph-layer ${co2 ? "is-active" : ""}`}>
          {[0, 1, 2].map((i) => (
            <g key={i} className="ph-co2" style={{ animationDelay: `${i * 1.1}s` }}>
              <circle cx={306} cy={86 + i * 16} r="7" fill="#ffffff" stroke="#8a9bb0" strokeWidth="1.6" />
              <text x={306} y={90 + i * 16} textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#5b6b80">CO₂</text>
            </g>
          ))}
          <text x="290" y="132" fontSize="11" fontWeight="900" fill="#5b6b80">氣孔</text>
        </g>
        {/* 葡萄糖養分輸出 */}
        <g className={`ph-layer ${glucose ? "is-active" : ""}`}>
          {[0, 1, 2].map((i) => (
            <g key={i} className="ph-sugar" style={{ animationDelay: `${i * 0.9}s` }}>
              <polygon points="0,-8 7,-4 7,4 0,8 -7,4 -7,-4" fill="#f2b53c" stroke="#c98a1e" strokeWidth="1.6"
                transform={`translate(${120 - i * 26} ${192 + (i % 2) * 10})`} />
            </g>
          ))}
          <text x="150" y="196" fontSize="11" fontWeight="900" fill="#a06a12">養分→全身</text>
        </g>
        {/* 氧氣冒出 */}
        <g className={`ph-layer ${oxygen ? "is-active" : ""}`}>
          {[0, 1, 2].map((i) => (
            <g key={i} className="ph-o2" style={{ animationDelay: `${i * 0.9}s` }}>
              <circle cx={230 + i * 14} cy={40 - i * 6} r="8" fill="#dff1ff" stroke="#4a9fd8" strokeWidth="1.8" />
              <text x={230 + i * 14} y={44 - i * 6} textAnchor="middle" fontSize="8" fontWeight="900" fill="#2f74b8">O₂</text>
            </g>
          ))}
        </g>
        {/* 公式／口訣橫幅 */}
        {banner && (
          <g className="ph-banner">
            <rect x="12" y="8" width="316" height="30" rx="15" fill={mantra ? "#2f9e6e" : "#ffffff"} stroke={mantra ? "#2f9e6e" : "#3f7a3c"} strokeWidth="1.6" />
            <text x="170" y="28" textAnchor="middle" fontSize="14" fontWeight="900" fill={mantra ? "#fff" : "#2f6b2c"}>{banner}</text>
          </g>
        )}
      </svg>
      <div className="ol-scene-mascot"><OnionMascot action={action} frame={frame} size={70} /></div>
    </div>
  );
}

/* ===================== 課程 6：數學 — 負數與數線（溫度計＋小船） ===================== */
function NegativeLineScene({ frame, action }: SceneProps) {
  // frame: 0 零下情境 1 負號 2 數線展開 3 三要素 4 船到-4 5 再到2 6 大小排序 7 負比負 8 相反數 9 口訣
  const neg = frame >= 1;
  const line = frame >= 2;
  const elements = frame === 3;
  const boatPos = frame >= 5 ? 2 : frame >= 4 ? -4 : 0;
  const order = frame === 6;
  const far = frame === 7;
  const opposite = frame === 8;
  const mantra = frame === 9;
  const banner = frame <= 1 ? "零下 3 度 ＝ −3°C"
    : frame === 2 ? "數線：右邊正、左邊負，中間是 0"
    : frame === 3 ? "數線三要素：原點・正方向・單位長度"
    : frame === 4 ? "往左 4 格 → −4"
    : frame === 5 ? "−4 ＋ 6 ＝ 2"
    : frame === 6 ? "越右邊越大：−4 ＜ −1 ＜ 0 ＜ 2"
    : frame === 7 ? "離 0 越遠的負數越小：−5 ＜ −2"
    : frame === 8 ? "−3 與 3 互為相反數"
    : "口訣：右大左小，負數離零越遠越小";
  const ticks = Array.from({ length: 13 }, (_, i) => i - 6);
  const boatX = 170 + boatPos * 26;

  return (
    <div className={`ol-scene ol-scene--negline nl-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="負數與數線動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#eef6fd" />
        {/* 溫度計 */}
        <g className={`nl-thermo ${neg ? "is-neg" : ""}`}>
          <rect x="34" y="34" width="20" height="118" rx="10" fill="#fff" stroke="#c3d6ec" strokeWidth="2" />
          <circle cx="44" cy="164" r="16" fill="#fff" stroke="#c3d6ec" strokeWidth="2" />
          <rect className="nl-mercury" x="39" y="52" width="10" height="98" rx="5" fill="#e8624f" />
          <circle cx="44" cy="164" r="11" fill="#e8624f" />
          {[0, -1, -2, -3].map((v) => (
            <text key={v} x="62" y={92 - v * 12} fontSize="8.5" fontWeight="800" fill="#7d92a8">{v}</text>
          ))}
          {neg && <text x="16" y="26" fontSize="13" fontWeight="900" fill="#d0483a">−3°C</text>}
        </g>
        {/* 數線 */}
        <g className={`nl-line ${line ? "is-show" : ""}`}>
          <line x1="90" y1="150" x2="326" y2="150" stroke="#3a7bbf" strokeWidth="2.6" />
          <path d="M326 150 l-9 -5 l0 10 Z" fill="#3a7bbf" />
          <text x="308" y="140" fontSize="11" fontWeight="900" fill="#3a7bbf">正方向</text>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={170 + v * 26} y1="144" x2={170 + v * 26} y2="156" stroke={v === 0 ? "#e07a2f" : "#3a7bbf"} strokeWidth={v === 0 ? 3 : 1.8} />
              <text x={170 + v * 26} y="172" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={v === 0 ? "#e07a2f" : "#3a5a8c"}>{v}</text>
            </g>
          ))}
          {elements && (
            <g className="nl-elements">
              <text x="170" y="132" textAnchor="middle" fontSize="11" fontWeight="900" fill="#e07a2f">原點</text>
              <line x1="248" y1="118" x2="272" y2="118" stroke="#3a7bbf" strokeWidth="1.6" strokeDasharray="4 3" />
              <text x="260" y="112" textAnchor="middle" fontSize="10" fontWeight="800" fill="#3a7bbf">單位長度</text>
            </g>
          )}
        </g>
        {/* 加法箭頭（-4 → 2） */}
        {frame >= 5 && (
          <g className="nl-jump">
            <path d="M66 118 L212 118" stroke="#2f9e6e" strokeWidth="2.4" fill="none" strokeDasharray="5 4" />
            <path d="M212 118 l-8 -4 l0 8 Z" fill="#2f9e6e" />
            <text x="139" y="110" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2f9e6e">＋6</text>
          </g>
        )}
        {/* 大小排序 / 負比負 / 相反數 */}
        {order && (
          <g className="nl-order">
            <text x="170" y="196" textAnchor="middle" fontSize="13" fontWeight="900" fill="#3a5a8c">−4 ＜ −1 ＜ 0 ＜ 2</text>
          </g>
        )}
        {far && (
          <g className="nl-far">
            <path d="M92 190 Q 106 176 120 190" fill="none" stroke="#d0483a" strokeWidth="2" />
            <path d="M144 190 Q 158 176 172 190" fill="none" stroke="#3a7bbf" strokeWidth="2" />
            <text x="132" y="206" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#d0483a">−5 ＜ −2</text>
          </g>
        )}
        {opposite && (
          <g className="nl-opposite">
            <path d="M92 190 Q 131 164 170 190" fill="none" stroke="#8a5fb0" strokeWidth="2.2" strokeDasharray="5 4" />
            <text x="131" y="182" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8a5fb0">距離 3</text>
            <text x="131" y="206" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#8a5fb0">−3 ↔ 3</text>
          </g>
        )}
        {/* 小船（含洋蔥船長） */}
        {line && (
          <g className="nl-boat" style={{ transform: `translateX(${boatX - 170}px)` }}>
            <path d="M-20 8 L20 8 L14 20 L-14 20 Z" fill="#b0793c" stroke="#8a5a26" strokeWidth="1.8" />
            <path d="M0 8 L0 -12 L14 0 Z" fill="#fff" stroke="#8a5a26" strokeWidth="1.6" className="nl-sail" />
            <circle cx="-8" cy="2" r="6" fill="#b794d6" stroke="#8a5fb0" strokeWidth="1.4" />
            <text x="0" y="34" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8a5a26">{boatPos}</text>
          </g>
        )}
        {/* 橫幅 */}
        <g className={`nl-banner ${mantra ? "is-mantra" : ""}`}>
          <rect x="104" y="8" width="228" height="28" rx="14" fill={mantra ? "#3a7bbf" : "#ffffff"} stroke={mantra ? "#3a7bbf" : "#c3d6ec"} strokeWidth="1.6" />
          <text x="218" y="26" textAnchor="middle" fontSize="12.5" fontWeight="900" fill={mantra ? "#fff" : "#3a5a8c"}>{banner}</text>
        </g>
      </svg>
      <div className="ol-scene-mascot ol-scene-mascot--br-sm"><OnionMascot action={action} frame={frame} size={54} /></div>
    </div>
  );
}

/* ===================== 課程 7：數學 — 一元一次方程式（天平） ===================== */
function EquationBalanceScene({ frame, action }: SceneProps) {
  // frame: 0 天平平衡 1 寫式子 2 目標 3 兩邊同減 4 x=5 5 檢驗 6 移項 7 口訣 8 再試一題 9 總整理
  const removed = frame >= 3;
  const solved = frame >= 4;
  const checked = frame === 5;
  const moving = frame === 6;
  const mantra = frame === 7;
  const example = frame === 8;
  const finale = frame === 9;
  const banner = frame <= 1 ? "天平平衡 → x ＋ 3 ＝ 8"
    : frame === 2 ? "目標：讓 x 一個人留在左邊"
    : frame === 3 ? "兩邊同時拿走 3 個砝碼，仍平衡"
    : frame === 4 ? "x ＝ 5，解開了！"
    : frame === 5 ? "檢驗：5 ＋ 3 ＝ 8 ✓"
    : frame === 6 ? "＋3 搬到右邊變 −3（移項變號）"
    : frame === 7 ? "口訣：移項要變號，加變減、減變加"
    : frame === 8 ? "x − 2 ＝ 6 → x ＝ 6 ＋ 2 ＝ 8"
    : "天平兩邊同進退，移項要變號";

  return (
    <div className={`ol-scene ol-scene--equation eq-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="天平方程式動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#fdf6ee" />
        {/* 支架 */}
        <path d="M170 78 L170 196 M140 196 L200 196" stroke="#8a6a4a" strokeWidth="7" strokeLinecap="round" />
        <path d="M170 78 L158 96 L182 96 Z" fill="#8a6a4a" />
        {/* 橫樑（解開時輕微上翹慶祝） */}
        <g className={`eq-beam ${solved ? "is-solved" : ""} ${removed ? "is-steady" : ""}`}>
          <line x1="70" y1="72" x2="270" y2="72" stroke="#a07850" strokeWidth="6" strokeLinecap="round" />
          {/* 吊繩與左盤 */}
          <line x1="80" y1="72" x2="80" y2="98" stroke="#a07850" strokeWidth="2.4" />
          <line x1="260" y1="72" x2="260" y2="98" stroke="#a07850" strokeWidth="2.4" />
          <path d="M46 98 L114 98 L104 122 L56 122 Z" fill="#e8d9c2" stroke="#b99a6c" strokeWidth="2" />
          <path d="M226 98 L294 98 L284 122 L236 122 Z" fill="#e8d9c2" stroke="#b99a6c" strokeWidth="2" />
          {/* 左盤：x 箱 + 3 砝碼（同減時 3 砝碼飛走） */}
          <g className="eq-box">
            <rect x="52" y="72" width="28" height="24" rx="5" fill="#b794d6" stroke="#8a5fb0" strokeWidth="2" />
            <text x="66" y="89" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">x</text>
          </g>
          {[88, 100, 112].map((x, i) => (
            <g key={x} className="eq-block eq-remove" style={{ animationDelay: `${i * 0.25}s` }}>
              <rect x={x - 5} y="76" width="10" height="20" rx="3" fill="#d99a3c" stroke="#b0793c" strokeWidth="1.5" />
            </g>
          ))}
          {/* 右盤：8 砝碼兩排（同減時只飛走 3 個，留 5 個） */}
          {[228, 242, 256, 270].map((x, i) => (
            <g key={x} className={`eq-block ${i < 3 ? "eq-remove" : "eq-keep"}`} style={{ animationDelay: `${(i + 3) * 0.2}s` }}>
              <rect x={x} y="80" width="10" height="18" rx="3" fill="#7fa8c9" stroke="#5b87ab" strokeWidth="1.5" />
            </g>
          ))}
          {[228, 242, 256, 270].map((x) => (
            <g key={`u${x}`} className="eq-block eq-keep">
              <rect x={x} y="60" width="10" height="18" rx="3" fill="#7fa8c9" stroke="#5b87ab" strokeWidth="1.5" />
            </g>
          ))}
        </g>
        {/* 移項：＋3 晶片飛越變 −3 */}
        {moving && (
          <g className="eq-movechip">
            <rect x="0" y="-12" width="44" height="24" rx="12" fill="#ffe1c2" stroke="#ef8a3c" strokeWidth="1.8" />
            <text className="eq-movechip-plus" x="22" y="5" textAnchor="middle" fontSize="14" fontWeight="900" fill="#b35a12">＋3</text>
            <text className="eq-movechip-minus" x="22" y="5" textAnchor="middle" fontSize="14" fontWeight="900" fill="#2f63a0">−3</text>
          </g>
        )}
        {/* 檢驗勾勾 */}
        {checked && (
          <g className="eq-check">
            <circle cx="170" cy="42" r="16" fill="#2f9e6e" />
            <path d="M162 42 L168 48 L179 36" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {/* 第二例題 */}
        {example && (
          <g className="eq-example">
            <text x="170" y="50" textAnchor="middle" fontSize="17" fontWeight="900" fill="#3a5a8c">x − 2 ＝ 6　→　x ＝ 6 ＋ 2 ＝ 8</text>
          </g>
        )}
        {/* 橫幅 */}
        <g className={`eq-banner ${finale || mantra ? "is-solid" : ""}`}>
          <rect x="14" y="180" width="312" height="34" rx="17" fill={finale || mantra ? "#8a5fb0" : "#ffffff"} stroke={finale || mantra ? "#8a5fb0" : "#d8c9ae"} strokeWidth="1.8" />
          <text x="170" y="202" textAnchor="middle" fontSize="14.5" fontWeight="900" fill={finale || mantra ? "#fff" : "#6b4a2a"}>{banner}</text>
        </g>
      </svg>
      <div className="ol-scene-mascot ol-scene-mascot--br-sm"><OnionMascot action={action} frame={frame} size={54} /></div>
    </div>
  );
}

/* ===================== 課程 8：自然 — 洋蔥表皮細胞（顯微鏡視野） ===================== */
function CellScene({ frame, action }: SceneProps) {
  // frame: 0 彩蛋開場 1 細胞是基本單位 2 顯微鏡視野 3 細胞壁 4 細胞膜 5 細胞核 6 液泡 7 動植物差別 8 階層 9 口訣
  const scope = frame >= 2;
  const wall = frame === 3;
  const membrane = frame === 4;
  const nucleus = frame === 5;
  const vacuole = frame === 6;
  // 構造採「累積式」標註：講過的構造要留在畫面上，學生才有完整的細胞圖可對照。
  // wall／membrane／… 只決定「這一幀聚焦誰（發光）」，seen 決定「是否已出現」。
  const wallSeen = frame >= 3;
  const membraneSeen = frame >= 4;
  const nucleusSeen = frame >= 5;
  const vacuoleSeen = frame >= 6;
  const diff = frame === 7;
  const hierarchy = frame === 8;
  const mantra = frame === 9;
  // 顯微鏡視野裡的磚牆細胞格
  const cells = [
    [92, 46, 78, 44], [174, 46, 82, 44], [84, 94, 86, 46], [174, 94, 82, 46], [92, 144, 78, 42], [174, 144, 82, 42],
  ];

  return (
    <div className={`ol-scene ol-scene--cell ce-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="洋蔥表皮細胞動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#f3eefa" />
        <defs>
          <clipPath id="ceScope"><circle cx="150" cy="116" r="94" /></clipPath>
        </defs>
        {/* 顯微鏡圓形視野 */}
        <g className={`ce-scope ${scope ? "is-show" : ""}`}>
          <circle cx="150" cy="116" r="98" fill="#ffffff" stroke="#8a5fb0" strokeWidth="5" />
          <circle cx="150" cy="116" r="94" fill="#f7f2ff" />
          <g clipPath="url(#ceScope)">
            {cells.map(([x, y, w, h], i) => (
              <g key={i}>
                <rect x={x} y={y} width={w} height={h} rx="8"
                  fill={i === 1 ? "#fbf7ff" : "#f1e8fb"} stroke={wallSeen ? "#b04fd8" : "#c9aee0"}
                  strokeWidth={wall ? 3.4 : wallSeen ? 2.8 : 2}
                  className={wallSeen ? `ce-wall${wall ? " is-focus" : ""}` : ""} />
                {membraneSeen && i === 1 && (
                  <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx="6" fill="none" stroke="#3a7bbf" strokeWidth={membrane ? 2.8 : 2.2} strokeDasharray="5 3" className={`ce-membrane${membrane ? " is-focus" : ""}`} />
                )}
                {nucleusSeen && i === 1 && (
                  <g className={`ce-nucleus${nucleus ? " is-focus" : ""}`}>
                    <circle cx={x + w / 2 - 14} cy={y + h / 2} r="10" fill="#7a4a9e" />
                    <circle cx={x + w / 2 - 14} cy={y + h / 2 - 3} r="3" fill="#a97cc9" opacity="0.7" />
                  </g>
                )}
                {vacuoleSeen && i === 1 && (
                  <g className={`ce-vacuole${vacuole ? " is-focus" : ""}`}>
                    <ellipse cx={x + w / 2 + 12} cy={y + h / 2} rx="16" ry="12" fill="#dff1ff" stroke="#4a9fd8" strokeWidth={vacuole ? 2.4 : 1.8} opacity="0.9" />
                  </g>
                )}
              </g>
            ))}
          </g>
          {/* 標註線 */}
          {wallSeen && <g className="ce-callout"><line x1="238" y1="62" x2="205" y2="66" stroke="#b04fd8" strokeWidth="1.8" /><text x="242" y="66" fontSize="12.5" fontWeight="900" fill="#b04fd8">細胞壁</text></g>}
          {membraneSeen && <g className="ce-callout"><line x1="238" y1="102" x2="252" y2="102" stroke="#3a7bbf" strokeWidth="1.8" /><text x="256" y="106" fontSize="12.5" fontWeight="900" fill="#3a7bbf">細胞膜</text></g>}
          {nucleusSeen && <g className="ce-callout"><line x1="238" y1="140" x2="228" y2="128" stroke="#7a4a9e" strokeWidth="1.8" /><text x="242" y="144" fontSize="12.5" fontWeight="900" fill="#7a4a9e">細胞核</text></g>}
          {vacuoleSeen && <g className="ce-callout"><line x1="238" y1="178" x2="226" y2="164" stroke="#2f74b8" strokeWidth="1.8" /><text x="242" y="182" fontSize="12.5" fontWeight="900" fill="#2f74b8">液泡</text></g>}
        </g>
        {/* 動植物細胞比較 */}
        {diff && (
          <g className="ce-diff">
            <g>
              <rect x="26" y="52" width="86" height="62" rx="8" fill="#f1e8fb" stroke="#b04fd8" strokeWidth="2.6" />
              <text x="34" y="46" fontSize="11.5" fontWeight="900" fill="#b04fd8">植物細胞</text>
              <circle cx="56" cy="96" r="6" fill="#4c9e3c" />
              <text x="66" y="100" fontSize="9.5" fontWeight="800" fill="#2f6b2c">葉綠體</text>
            </g>
            <g>
              <ellipse cx="260" cy="86" rx="44" ry="30" fill="#fdeef0" stroke="#d86a8a" strokeWidth="2.4" />
              <text x="260" y="44" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#d86a8a">動物細胞</text>
              <text x="260" y="130" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#a84a66">沒有細胞壁・葉綠體</text>
            </g>
          </g>
        )}
        {/* 階層圖 */}
        {hierarchy && (
          <g className="ce-hierarchy">
            {["細胞", "組織", "器官", "系統", "個體"].map((t, i) => (
              <g key={t} className="ce-step" style={{ animationDelay: `${i * 0.35}s` }}>
                <rect x={16 + i * 62} y="104" width="52" height="28" rx="14" fill={i === 4 ? "#8a5fb0" : "#ffffff"} stroke="#8a5fb0" strokeWidth="1.8" />
                <text x={42 + i * 62} y="123" textAnchor="middle" fontSize="12" fontWeight="900" fill={i === 4 ? "#fff" : "#7a4a9e"}>{t}</text>
                {i < 4 && <path d={`M${70 + i * 62} 118 l10 0 m-4 -4 l4 4 l-4 4`} stroke="#8a5fb0" strokeWidth="2" fill="none" strokeLinecap="round" />}
              </g>
            ))}
          </g>
        )}
        {/* 口訣橫幅 */}
        {mantra && (
          <g className="ce-banner">
            <rect x="24" y="100" width="292" height="34" rx="17" fill="#8a5fb0" />
            <text x="170" y="122" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fff">口訣：牆保護、門進出、核指揮、泡儲水</text>
          </g>
        )}
      </svg>
      <div className="ol-scene-mascot"><OnionMascot action={action} frame={frame} size={66} /></div>
    </div>
  );
}

/* ===================== 場景分派器 ===================== */
/* ===================== 課程 9：畢氏定理（兩杯水倒進大杯子） ===================== */
function PythagoreanScene({ frame, action }: SceneProps) {
  // frame: 0 開場 1 認識股與斜邊 2 蓋上三個正方形 3 標邊長 4 面積 9/16/25 5 倒水 6 裝滿 7 換 6-8-10 8 公式 9 口訣
  const showSides = frame >= 1;
  const squares = frame >= 2;
  const showAreas = frame >= 3;
  const pouring = frame === 4;
  const formula = frame === 7 || frame === 8;

  // 直角在 A(60,110)：水平股 4（56px）、垂直股 3（42px）、斜邊 5（70px），比例 14px＝1 單位
  const AX = 60, AY = 110, BX = 116, BY = 110, CX = 60, CY = 68;
  // 斜邊上的正方形：以 B→C 向量 (−56,−42) 的外法向量 (42,−56) 推出
  const big = `${BX},${BY} ${CX},${CY} ${CX + 42},${CY - 56} ${BX + 42},${BY - 56}`;

  // 小正方形的「水量」：0＝空、1＝滿
  const smallLevel = frame <= 3 ? 1 : pouring ? 0.45 : 0;
  const bigLevel = frame <= 3 ? 0 : pouring ? 0.5 : 1;

  const banner =
    frame === 0 ? "直角對面的邊叫「斜邊」，它是最長的"
    : frame === 1 ? "夾著直角的兩條邊叫「股」：3 和 4"
    : frame === 2 ? "在三條邊上各蓋一個正方形，像三個杯子"
    : frame === 3 ? "邊長 3、4、5，面積就是 3²、4²、5²"
    : frame === 4 ? "把兩個小杯子的水倒進大杯子"
    : frame === 5 ? "9 ＋ 16 ＝ 25，剛好裝滿！"
    : frame === 6 ? "6² ＋ 8² ＝ 36 ＋ 64 ＝ 100，斜邊 ＝ 10"
    : frame === 7 ? "畢氏定理：a² ＋ b² ＝ c²（c 是斜邊）"
    : frame === 8 ? "反求一股：13² − 5² ＝ 144，另一股 ＝ 12"
    : "口訣：斜邊平方 ＝ 兩股平方和";

  return (
    <div className={`ol-scene ol-scene--pythagorean py-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="畢氏定理兩杯水倒入大杯子的推導動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#eef6fb" />
        <defs>
          <clipPath id="py-clip-big"><polygon points={big} /></clipPath>
          <clipPath id="py-clip-a"><rect x={AX} y={AY} width="56" height="56" /></clipPath>
          <clipPath id="py-clip-b"><rect x="18" y={CY} width="42" height="42" /></clipPath>
        </defs>

        {/* 三個正方形（杯子） */}
        {squares && (
          <g className="py-squares">
            <rect x={AX} y={AY} width="56" height="56" fill="#fdf6e6" stroke="#c9a227" strokeWidth="2" />
            <rect x="18" y={CY} width="42" height="42" fill="#fdf6e6" stroke="#c9a227" strokeWidth="2" />
            <polygon points={big} fill="#fdf6e6" stroke="#c9a227" strokeWidth="2" />
          </g>
        )}

        {/* 水：由 clipPath 限制在各自的杯子裡 */}
        {squares && (
          <g className="py-water">
            <rect clipPath="url(#py-clip-b)" x="18" y={CY + 42 * (1 - smallLevel)} width="42" height={42 * smallLevel} fill="#7fc4e8" opacity="0.85" />
            <rect clipPath="url(#py-clip-a)" x={AX} y={AY + 56 * (1 - smallLevel)} width="56" height={56 * smallLevel} fill="#7fc4e8" opacity="0.85" />
            <rect clipPath="url(#py-clip-big)" x="50" y={110 - 98 * bigLevel} width="130" height={98 * bigLevel} fill="#3a9fd8" opacity="0.8" />
          </g>
        )}

        {/* 三角形本身 */}
        <path d={`M${AX} ${AY} L${BX} ${BY} L${CX} ${CY} Z`} fill="#bcd8f5" stroke="#2f63a0" strokeWidth="2.8" />
        {/* 直角記號 */}
        <path d={`M${AX} ${AY} L${AX + 12} ${AY} L${AX + 12} ${AY - 12}`} fill="none" stroke="#d8602f" strokeWidth="2" />

        {/* 邊長標示 */}
        {showSides && (
          <g className="py-labels">
            <text x="88" y={AY + 16} textAnchor="middle" fontSize="13" fontWeight="900" fill="#2f63a0">4</text>
            <text x={AX - 8} y="92" textAnchor="end" fontSize="13" fontWeight="900" fill="#2f63a0">3</text>
            <text x="150" y="50" fontSize="13" fontWeight="900" fill="#b07d1e">5</text>
            {!squares && <text x="150" y="30" fontSize="12.5" fontWeight="800" fill="#6b5d44">斜邊</text>}
          </g>
        )}

        {/* 面積標示 9 / 16 / 25 */}
        {showAreas && (
          <g className="py-areas">
            <text x={AX + 28} y={AY + 34} textAnchor="middle" fontSize="15" fontWeight="900" fill="#1f5c8b">16</text>
            <text x="39" y={CY + 26} textAnchor="middle" fontSize="14" fontWeight="900" fill="#1f5c8b">9</text>
            <text x="118" y="52" textAnchor="middle" fontSize="17" fontWeight="900" fill="#b07d1e">25</text>
          </g>
        )}

        {/* 倒水的箭頭（第 5 幀） */}
        {pouring && (
          <g className="py-pour">
            <path d="M96 96 Q120 60 132 44" fill="none" stroke="#3a9fd8" strokeWidth="2.4" strokeDasharray="5 4" />
            <path d="M40 112 Q80 70 124 52" fill="none" stroke="#3a9fd8" strokeWidth="2.4" strokeDasharray="5 4" />
          </g>
        )}

        {/* 公式／口訣橫幅 */}
        <g className={`py-banner ${formula ? "is-formula" : ""}`} key={banner}>
          <rect x="10" y="184" width="278" height="34" rx="17"
            fill={formula ? "#2f63a0" : "#ffffff"} stroke={formula ? "#2f63a0" : "#c3d6ec"} strokeWidth="1.6" />
          <text x="149" y="206" textAnchor="middle" fontSize="13" fontWeight="900"
            fill={formula ? "#fff" : "#3a5a8c"}>{banner}</text>
        </g>
      </svg>
      <div className="ol-scene-mascot ol-scene-mascot--br-sm"><OnionMascot action={action} frame={frame} size={56} /></div>
    </div>
  );
}

/* ===================== 課程 10：二次函數（拋物線） ===================== */
function QuadraticScene({ frame, action }: SceneProps) {
  // frame: 0 一次函數直線 1 座標平面 2 描左半邊點 3 描右半邊點 4 連成曲線 5 頂點與開口 6 開口向下 7 上移 8 右移 9 口訣
  const plane = frame >= 1;
  const dotLeft = frame >= 2;
  const dotRight = frame >= 3;
  const curve = frame >= 4;
  const vertex = frame >= 5;
  const flipped = frame === 6;
  const shiftUp = frame === 7;
  const shiftRight = frame === 8;

  // 座標：原點 (170,140)，1 單位＝30px（x）／20px（y）
  const curvePath = flipped
    ? "M80 320 Q170 -40 260 320"          // y ＝ −x²
    : shiftUp
      ? "M80 -100 Q170 260 260 -100"      // y ＝ x² ＋ 3（上移 3 格＝60px）
      : shiftRight
        ? "M140 -40 Q230 320 320 -40"     // y ＝ (x−2)²（右移 2 格＝60px）
        : "M80 -40 Q170 320 260 -40";     // y ＝ x²

  const points: Array<[number, number, number, number]> = [
    [110, 60, -2, 4], [140, 120, -1, 1], [170, 140, 0, 0], [200, 120, 1, 1], [230, 60, 2, 4],
  ];

  const banner =
    frame === 0 ? "y ＝ 2x 畫出來是一條直直的線"
    : frame === 1 ? "y ＝ x²：x 自己乘自己，線會轉彎"
    : frame === 2 ? "描點：(−2,4) (−1,1) (0,0)"
    : frame === 3 ? "右邊對稱：(1,1) (2,4)"
    : frame === 4 ? "連成平滑曲線，這叫「拋物線」"
    : frame === 5 ? "最低點叫頂點，y ＝ x² 的頂點是 (0,0)"
    : frame === 6 ? "y ＝ −x²：開口朝下，頂點變最高點"
    : frame === 7 ? "y ＝ x² ＋ 3：整條往上平移 3 格"
    : frame === 8 ? "y ＝ (x−2)²：往右平移 2 格"
    : "口訣：a 正開口上、a 負開口下";

  return (
    <div className={`ol-scene ol-scene--quadratic qd-f${frame}`}>
      <svg viewBox="0 0 340 232" className="ol-scene-svg" role="img" aria-label="二次函數拋物線與平移動畫">
        <rect x="0" y="0" width="340" height="232" rx="16" fill="#f7f4fb" />

        {/* 開場：一次函數的直線 */}
        {frame === 0 && (
          <g className="qd-line">
            <line x1="80" y1="180" x2="260" y2="60" stroke="#8a9aa4" strokeWidth="3" />
            <text x="128" y="76" fontSize="13" fontWeight="900" fill="#6b7a86">y ＝ 2x</text>
          </g>
        )}

        {/* 座標平面 */}
        {plane && (
          <g className="qd-plane">
            <line x1="20" y1="140" x2="320" y2="140" stroke="#5a6b78" strokeWidth="2" />
            <line x1="170" y1="18" x2="170" y2="200" stroke="#5a6b78" strokeWidth="2" />
            <path d="M320 140 L310 135 L310 145 Z" fill="#5a6b78" />
            <path d="M170 18 L165 28 L175 28 Z" fill="#5a6b78" />
            <text x="326" y="137" fontSize="11" fontWeight="800" fill="#5a6b78">x</text>
            <text x="158" y="16" fontSize="11" fontWeight="800" fill="#5a6b78">y</text>
            <text x="182" y="152" fontSize="11" fontWeight="700" fill="#8a9aa4">O</text>
          </g>
        )}

        {/* 描點 */}
        {plane && points.map(([x, y, ux, uy], i) => {
          const visible = i <= 2 ? dotLeft : dotRight;
          if (!visible) return null;
          const shifted = shiftUp || shiftRight;
          // 平移時連點一起移動，避免點與曲線分離
          const px = shiftRight ? x + 60 : x;
          const py = shiftUp ? y - 60 : y;
          return (
            <g key={i} className={`qd-point ${shifted ? "is-shifted" : ""}`}>
              <circle cx={px} cy={py} r="4.5" fill="#8a5fb0" />
              <text x={px + 7} y={py - 6} fontSize="10.5" fontWeight="800" fill="#6b4a8a">
                {shifted ? "" : `(${ux},${uy})`}
              </text>
            </g>
          );
        })}

        {/* 拋物線 */}
        {curve && (
          <path className="qd-curve" d={curvePath} fill="none"
            stroke={flipped ? "#d8602f" : "#8a5fb0"} strokeWidth="3.2" strokeLinecap="round" />
        )}

        {/* 頂點 */}
        {vertex && (
          <g className="qd-vertex">
            <circle cx={shiftRight ? 230 : 170} cy={shiftUp ? 80 : 140} r="6" fill="#fff" stroke="#c9a227" strokeWidth="3" />
            <text x={shiftRight ? 240 : 180} y={shiftUp ? 74 : 134} fontSize="12" fontWeight="900" fill="#b07d1e">
              頂點
            </text>
          </g>
        )}

        {/* 開口方向提示 */}
        {frame === 5 && <text x="252" y="120" fontSize="12" fontWeight="900" fill="#8a5fb0">開口↑</text>}
        {flipped && <text x="252" y="120" fontSize="12" fontWeight="900" fill="#d8602f">開口↓</text>}

        {/* 公式／口訣橫幅 */}
        <g className="qd-banner" key={banner}>
          <rect x="10" y="184" width="278" height="34" rx="17" fill="#ffffff" stroke="#d9cbe8" strokeWidth="1.6" />
          <text x="149" y="206" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5a4a72">{banner}</text>
        </g>
      </svg>
      <div className="ol-scene-mascot ol-scene-mascot--br-sm"><OnionMascot action={action} frame={frame} size={56} /></div>
    </div>
  );
}

/* ===================== 資料驅動的通用教具舞台 =====================
 * 每一堂課都手寫一個專屬場景，等於每加一個知識點就要寫一組 SVG 動畫，
 * 課程量永遠上不去。這裡改成「frame.prop 直接決定舞台長什麼樣子」：
 * 新增課程只要寫資料（prop kind + 參數），不必再碰動畫邏輯。
 * 有專屬場景的舊課繼續走 LessonScene 的專屬分支，沒有的就落到這裡。
 */
function BarsView({ items, unit, active }: { items: Array<{ label: string; value: number }>; unit?: string; active?: number }) {
  const max = Math.max(1, ...items.map((it) => it.value));
  return (
    <div className="gp-bars">
      {items.map((it, i) => (
        <div className={`gp-bar-row ${active === i ? "is-active" : ""}`} key={`${it.label}-${i}`}>
          <span className="gp-bar-label">{it.label}</span>
          <span className="gp-bar-track">
            <span className="gp-bar-fill" style={{ width: `${(it.value / max) * 100}%` }} />
            <span className="gp-bar-value">
              {it.value}
              {unit ? <small>{unit}</small> : null}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function FlowView({ steps, active }: { steps: string[]; active?: number }) {
  return (
    <div className="gp-flow">
      {steps.map((step, i) => (
        <React.Fragment key={`${step}-${i}`}>
          {i > 0 ? <span className="gp-flow-arrow" aria-hidden="true">→</span> : null}
          <span className={`gp-flow-step ${active === i ? "is-active" : ""}`}>{step}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function NumberLineView({
  from,
  to,
  marks,
  cursor,
}: {
  from: number;
  to: number;
  marks?: Array<{ at: number; label?: string; tone?: "ok" | "warn" }>;
  cursor?: number;
}) {
  const pos = (v: number) => ((v - from) / (to - from || 1)) * 100;
  const ticks = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div className="gp-line">
      <div className="gp-line-axis">
        {ticks.map((t) => (
          <span className="gp-line-tick" style={{ left: `${pos(t)}%` }} key={t}>
            <small>{t}</small>
          </span>
        ))}
        {(marks ?? []).map((m, i) => (
          <span
            className={`gp-line-mark ${m.tone === "warn" ? "is-warn" : "is-ok"}`}
            style={{ left: `${pos(m.at)}%` }}
            key={`m-${i}`}
          >
            {m.label ?? m.at}
          </span>
        ))}
        {typeof cursor === "number" ? (
          <span className="gp-line-cursor" style={{ left: `${pos(cursor)}%` }} aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}

function BalanceView({ left, right, tip }: { left: string; right: string; tip?: string }) {
  return (
    <div className="gp-balance">
      <div className="gp-balance-beam">
        <span className="gp-balance-pan">{left}</span>
        <span className="gp-balance-mid">＝</span>
        <span className="gp-balance-pan">{right}</span>
      </div>
      {tip ? <p className="gp-balance-tip">{tip}</p> : null}
    </div>
  );
}

function CycleView({ nodes, active }: { nodes: string[]; active?: number }) {
  const radius = 34;
  return (
    <div className="gp-cycle">
      <svg viewBox="0 0 200 200" className="gp-cycle-svg" role="img" aria-label="循環圖">
        <circle cx="100" cy="100" r={radius + 20} className="gp-cycle-ring" />
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = 100 + Math.cos(angle) * radius;
          const y = 100 + Math.sin(angle) * radius;
          return (
            <g key={node}>
              <circle cx={x} cy={y} r="22" className={`gp-cycle-node ${active === i ? "is-active" : ""}`} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="gp-cycle-text">
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PieView({ a, b, label }: { a: number; b: number; label?: string }) {
  const frac = b ? a / b : 0;
  const angle = frac * Math.PI * 2;
  const x = 60 + Math.cos(angle - Math.PI / 2) * 44;
  const y = 60 + Math.sin(angle - Math.PI / 2) * 44;
  const large = angle > Math.PI ? 1 : 0;
  return (
    <div className="gp-pie">
      <svg viewBox="0 0 120 120" className="gp-pie-svg" role="img" aria-label={`${a} / ${b} 圓餅圖`}>
        <circle cx="60" cy="60" r="44" className="gp-pie-base" />
        {frac > 0 ? (
          <path d={`M60 60 L60 16 A44 44 0 ${large} 1 ${x} ${y} Z`} className="gp-pie-slice" />
        ) : null}
        {label ? (
          <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="gp-pie-label">
            {label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function TextView({ text, sub, tone }: { text: string; sub?: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`gp-text ${tone === "warn" ? "is-warn" : "is-ok"}`}>
      <p className="gp-text-main">{text}</p>
      {sub ? <p className="gp-text-sub">{sub}</p> : null}
    </div>
  );
}

function ShapeView({
  shape,
  base,
  height,
  label,
}: {
  shape: "triangle" | "rect" | "circle";
  base: number;
  height: number;
  label?: string;
}) {
  return (
    <div className="gp-shape">
      <svg viewBox="0 0 200 140" className="gp-shape-svg" role="img" aria-label="幾何圖形">
        {shape === "triangle" ? (
          <polygon points="30,120 170,120 100,20" className="gp-shape-fill" />
        ) : shape === "rect" ? (
          <rect x="40" y="30" width="120" height="80" className="gp-shape-fill" />
        ) : (
          <circle cx="100" cy="70" r="55" className="gp-shape-fill" />
        )}
        <text x="100" y="132" textAnchor="middle" className="gp-shape-note">
          底 {base} ‧ 高 {height}
        </text>
      </svg>
      {label ? <p className="gp-shape-label">{label}</p> : null}
    </div>
  );
}

/** 依 frame.prop 渲染舞台；新增課程只要給資料，不必寫動畫元件。 */
export function PropScene({ prop, action, frame }: { prop: OnionProp } & SceneProps) {
  let body: React.ReactNode = null;
  switch (prop.kind) {
    case "bars":
      body = <BarsView items={prop.items} unit={prop.unit} active={prop.active} />;
      break;
    case "flow":
      body = <FlowView steps={prop.steps} active={prop.active} />;
      break;
    case "numberLine":
      body = <NumberLineView from={prop.from} to={prop.to} marks={prop.marks} cursor={prop.cursor} />;
      break;
    case "balance":
      body = <BalanceView left={prop.left} right={prop.right} tip={prop.tip} />;
      break;
    case "cycle":
      body = <CycleView nodes={prop.nodes} active={prop.active} />;
      break;
    case "pie":
      body = <PieView a={prop.a} b={prop.b} label={prop.label} />;
      break;
    case "pies":
      body = (
        <div className="gp-pies">
          <PieView a={prop.left.a} b={prop.left.b} />
          <span className="gp-pies-op">＋</span>
          <PieView a={prop.right.a} b={prop.right.b} />
          {prop.result ? (
            <>
              <span className="gp-pies-op">＝</span>
              <PieView a={prop.result.a} b={prop.result.b} label={`${prop.result.a}/${prop.result.b}`} />
            </>
          ) : null}
        </div>
      );
      break;
    case "text":
      body = <TextView text={prop.text} sub={prop.sub} tone={prop.tone} />;
      break;
    case "shape":
      body = <ShapeView shape={prop.shape} base={prop.base} height={prop.height} label={prop.label} />;
      break;
    default:
      body = <div className="gp-empty" aria-hidden="true" />;
  }
  return (
    <div className="ol-scene ol-scene--generic">
      <div className="gp-body">{body}</div>
      <div className="ol-scene-mascot ol-scene-mascot--br-sm">
        <OnionMascot action={action} frame={frame} size={54} />
      </div>
    </div>
  );
}

/**
 * 課堂舞台統一入口：有專屬動畫場景的課走 LessonScene，
 * 純資料驅動的新課自動落到 PropScene（看 frame.prop 畫教具）。
 */
export function LessonStage({
  lessonId,
  prop,
  frame,
  action,
}: { lessonId: string; prop: OnionProp } & SceneProps) {
  const bespoke = LessonScene({ lessonId, frame, action });
  return bespoke ?? <PropScene prop={prop} frame={frame} action={action} />;
}

export function LessonScene({ lessonId, frame, action }: { lessonId: string } & SceneProps) {
  if (lessonId === "water-cycle") return <WaterCycleScene frame={frame} action={action} />;
  if (lessonId === "fraction-add") return <FractionScene frame={frame} action={action} />;
  if (lessonId === "triangle-area") return <TriangleScene frame={frame} action={action} />;
  if (lessonId === "photosynthesis") return <PhotosynthesisScene frame={frame} action={action} />;
  if (lessonId === "negative-number") return <NegativeLineScene frame={frame} action={action} />;
  if (lessonId === "linear-equation") return <EquationBalanceScene frame={frame} action={action} />;
  if (lessonId === "onion-cell") return <CellScene frame={frame} action={action} />;
  if (lessonId === "pythagorean") return <PythagoreanScene frame={frame} action={action} />;
  if (lessonId === "quadratic") return <QuadraticScene frame={frame} action={action} />;
  if (lessonId === "de-usage") return <DeUsageScene frame={frame} action={action} />;
  return null;
}
