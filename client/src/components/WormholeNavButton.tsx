import React from "react";
import { ArrowUpRight, Orbit } from "lucide-react";

type Props = { onNavigate: (path: string) => void };

export default function WormholeNavButton({ onNavigate }: Props) {
  const navigate = () => onNavigate("/principles");
  return (
    <button
      type="button"
      className="wormhole-map-entry"
      aria-label="進入人類火種躍遷蟲洞世界原理探索"
      aria-describedby="wormhole-map-description"
      onClick={navigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate();
        }
      }}
    >
      <span className="wormhole-vortex" aria-hidden="true">
        <span className="wormhole-gravity-lens" />
        <span className="wormhole-vortex-aura" />
        <span className="wormhole-biolume-ring wormhole-biolume-ring-a" />
        <span className="wormhole-biolume-ring wormhole-biolume-ring-b" />
        <span className="wormhole-vortex-streak wormhole-vortex-streak-a" />
        <span className="wormhole-vortex-streak wormhole-vortex-streak-b" />
        <span className="wormhole-fibonacci-arm wormhole-fibonacci-arm-a" />
        <span className="wormhole-fibonacci-arm wormhole-fibonacci-arm-b" />
        <span className="wormhole-vortex-ring wormhole-vortex-ring-a" />
        <span className="wormhole-vortex-ring wormhole-vortex-ring-b" />
        <span className="wormhole-anchor-array">
          <span className="wormhole-anchor wormhole-anchor-n" />
          <span className="wormhole-anchor wormhole-anchor-e" />
          <span className="wormhole-anchor wormhole-anchor-s" />
          <span className="wormhole-anchor wormhole-anchor-w" />
        </span>
        <span className="wormhole-plasma-bolt wormhole-plasma-bolt-a" />
        <span className="wormhole-plasma-bolt wormhole-plasma-bolt-b" />
        <span className="wormhole-vortex-particle wormhole-vortex-particle-1" />
        <span className="wormhole-vortex-particle wormhole-vortex-particle-2" />
        <span className="wormhole-vortex-particle wormhole-vortex-particle-3" />
        <span className="wormhole-vortex-particle wormhole-vortex-particle-4" />
        <span className="wormhole-vortex-particle wormhole-vortex-particle-5" />
        <span className="wormhole-vortex-particle wormhole-vortex-particle-6" />
        <span className="wormhole-vortex-core"><Orbit size={26} strokeWidth={1.6} /></span>
      </span>
      <span id="wormhole-map-description" className="wormhole-map-tooltip" role="tooltip">
        <strong>人類火種<br />躍遷蟲洞</strong>
        <small>世界原理 · 7 個觀測點</small>
        <ArrowUpRight size={15} aria-hidden="true" />
      </span>
    </button>
  );
}
