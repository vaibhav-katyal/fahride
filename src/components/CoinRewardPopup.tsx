import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface CoinRewardPopupProps {
  coins: number;
  reason: string;
  /** If true, coins are deferred — shows "will be credited" instead of amount */
  pending?: boolean;
  onDismiss: () => void;
}

const CoinRewardPopup = ({ coins, reason, pending, onDismiss }: CoinRewardPopupProps) => {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // Enter → visible after a single frame
    const t1 = window.setTimeout(() => setPhase("visible"), 60);
    return () => window.clearTimeout(t1);
  }, []);

  const handleTap = () => {
    if (phase === "exit") return;
    setPhase("exit");
    window.setTimeout(onDismiss, 460);
  };

  const overlayClass = [
    "crp-overlay",
    phase === "enter" && "crp-overlay--entering",
    phase === "visible" && "crp-overlay--visible",
    phase === "exit" && "crp-overlay--exit",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div className={overlayClass} onClick={handleTap} role="presentation">
      {/* Particles */}
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * 360;
        const dist = 90 + (i % 5) * 24;
        const hue = [45, 38, 51, 28, 60][i % 5];
        return (
          <span
            key={`p-${i}`}
            className="crp-particle"
            style={{
              "--p-angle": `${angle}deg`,
              "--p-dist": `${dist}px`,
              "--p-hue": hue,
              "--p-delay": `${(i % 7) * 0.06}s`,
              "--p-size": `${i % 3 === 0 ? 6 : 4}px`,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Glow ring */}
      <div className="crp-glow" />

      {/* CSS-only spinning coin */}
      <div className="crp-coin-wrapper">
        <div className="crp-coin">
          <div className="crp-coin-face crp-coin-front">
            <span className="crp-coin-symbol">F</span>
            <div className="crp-coin-ring" />
            <div className="crp-coin-shine" />
          </div>
          <div className="crp-coin-face crp-coin-back">
            <span className="crp-coin-symbol">✦</span>
            <div className="crp-coin-ring" />
            <div className="crp-coin-shine" />
          </div>
          <div className="crp-coin-edge" />
        </div>
      </div>

      {/* Text card */}
      <div className="crp-text-card">
        {pending ? (
          <>
            <p className="crp-coins-amount crp-coins-amount--pending">🎉</p>
            <p className="crp-coins-label">Fah Coins Incoming!</p>
            <p className="crp-coins-reason">{reason}</p>
          </>
        ) : (
          <>
            <p className="crp-coins-amount">+{coins}</p>
            <p className="crp-coins-label">Fah Coin{coins > 1 ? "s" : ""} Earned</p>
            <p className="crp-coins-reason">{reason}</p>
          </>
        )}
      </div>

      {/* Confetti */}
      {Array.from({ length: 32 }).map((_, i) => {
        const hue = [45, 141, 210, 340, 28, 55][i % 6];
        const x = ((i * 7.3) % 100) - 50;
        const y = 100 + (i % 6) * 22;
        const rot = `${(i % 2 === 0 ? 1 : -1) * (200 + i * 11)}deg`;
        return (
          <span
            key={`c-${i}`}
            className="crp-confetti"
            style={{
              left: `${50 + x * 0.6}%`,
              top: `${12 + (i % 4) * 5}%`,
              background: `hsl(${hue} 88% 58%)`,
              borderRadius: i % 3 === 0 ? "999px" : "3px",
              width: i % 4 === 0 ? "7px" : "9px",
              height: i % 4 === 0 ? "22px" : "14px",
              "--cx": `${x * 2.2}px`,
              "--cy": `${y}px`,
              "--cr": rot,
              "--cd": `${(i % 8) * 0.07}s`,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Tap-to-dismiss hint */}
      <p className="crp-dismiss-hint">Tap anywhere to dismiss</p>
    </div>,
    document.body
  );
};

export default CoinRewardPopup;
