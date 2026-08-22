import React from "react";
import { Radio } from "lucide-react";

type ObservatoryNavButtonProps = {
  onNavigate: (path: string) => void;
  onClose: () => void;
};

export function ObservatoryNavButton({ onNavigate, onClose }: ObservatoryNavButtonProps) {
  const activate = () => {
    onClose();
    onNavigate("/observatory");
  };

  return (
    <button
      type="button"
      className="nav-item"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      }}
      aria-label="開啟特攝影視觀測站"
      onClick={activate}
    >
      <Radio size={18} />
      <span>影視觀測站</span>
      <em>05</em>
    </button>
  );
}

export default ObservatoryNavButton;
