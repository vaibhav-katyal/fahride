import React, { useState, useEffect } from "react";
import { X, Trophy, ArrowRight, ShieldCheck, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FahCoinBannerProps {
  dismissibleId?: string;
  className?: string;
}

const FahCoinBanner: React.FC<FahCoinBannerProps> = ({ dismissibleId, className = "" }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (dismissibleId) {
      const isDismissed = localStorage.getItem(`fah_coin_banner_${dismissibleId}`);
      if (isDismissed) setIsVisible(false);
    }
  }, [dismissibleId]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    if (dismissibleId) {
      localStorage.setItem(`fah_coin_banner_${dismissibleId}`, "true");
    }
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={() => navigate("/profile")}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A1A1A] to-[#252525] border border-[#d4af37]/30 p-[1px] shadow-lg cursor-pointer group transition-transform active:scale-[0.98] ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent translate-x-[-100%] animate-[shimmer_2.5s_infinite]" />
      
      <div className="relative h-full w-full rounded-[15px] bg-[#1a1a1ae6] backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4 flex flex-col justify-between overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-[#d4af37] opacity-20 blur-[60px] pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-[#FFDF73] to-[#B8860B] p-1.5 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              <Trophy className="w-4 h-4 text-[#4A3500]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold bg-gradient-to-r from-[#FFF5C3] to-[#D4AF37] bg-clip-text text-transparent">
              Earn Real Money While You Ride
            </h3>
          </div>
          
          {dismissibleId && (
            <button
              onClick={handleDismiss}
              className="text-[#a0a0a0] hover:text-white transition-colors p-1 z-10 rounded-full hover:bg-white/10"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-[#bcbcbc] mb-3 leading-relaxed max-w-[90%]">
          Collect Fah Coins on every ride. Post a ride to earn <span className="font-semibold text-[#FFDF73]">20 Coins</span>, join to earn <span className="font-semibold text-[#FFDF73]">10 Coins</span>.
        </p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-[#4ade80]" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              500 Coins = ₹50 to Bank
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-[#d4af37] group-hover:translate-x-1 transition-transform">
            <span>Redeem Now</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default FahCoinBanner;
