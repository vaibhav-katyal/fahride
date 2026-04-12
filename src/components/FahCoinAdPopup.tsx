import React, { useEffect, useState } from "react";
import { X, Sparkles, MoveRight, ReceiptText } from "lucide-react";

interface FahCoinAdPopupProps {
  onClose: () => void;
}

const FahCoinAdPopup: React.FC<FahCoinAdPopupProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay for dramatic entrance
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent pointer-events-none"}`}>
      <div 
        className={`relative w-full max-w-sm rounded-[24px] bg-[#121212] border border-[#d4af37]/30 shadow-2xl overflow-hidden transition-all duration-500 transform ${isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"}`}
      >
        {/* Ad Badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold tracking-widest text-[#d4af37] border border-[#d4af37]/30 z-10">
          SPONSORED
        </div>

        {/* Close Button */}
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 400); // Wait for exit animation
          }}
          className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white/70 hover:text-white p-1.5 rounded-full z-10 transition-colors border border-transparent hover:border-white/20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Rich Header Background */}
        <div className="relative h-40 bg-gradient-to-br from-[#2a2100] via-[#4A3500] to-[#121212] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          {/* Central glowing coin icon */}
          <div className="relative group perspective-1000">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFDF73] to-[#B8860B] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] border-2 border-[#FFE88D] transform rotate-y-12 transition-transform duration-700 hover:rotate-y-[360deg]">
              <span className="text-3xl font-extrabold text-[#4A3500] drop-shadow-sm">F</span>
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#FFE88D] animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-[#FFF5C3] animate-pulse delay-300" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-black bg-gradient-to-r from-[#FFF5C3] to-[#D4AF37] bg-clip-text text-transparent mb-2">
            Unlock Real Rewards
          </h2>
          <p className="text-[#a0a0a0] text-sm mb-6 leading-relaxed">
            Welcome to RideME! Complete your signup today to instantly receive a welcome bonus. Exchange coins direct to your bank!
          </p>

          <div className="space-y-3 text-left bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#d4af37]">1</span>
              </div>
              <p className="text-xs text-white">Post or Join rides to collect <span className="font-semibold text-[#FFDF73]">Fah Coins</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#4ade80]/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#4ade80]">2</span>
              </div>
              <p className="text-xs text-white">Reach <span className="font-semibold text-[#4ade80]">500 Coins</span> in your wallet</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <ReceiptText className="w-3 h-3 text-blue-400" />
              </div>
              <p className="text-xs text-white font-semibold">Redeem ₹50 straight to Bank/UPI!</p>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 400);
            }}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-[#FFDF73] to-[#D4AF37] text-[#4A3500] font-black py-3.5 rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 active:scale-95"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative flex items-center justify-center gap-2">
              Start Earning Now
              <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FahCoinAdPopup;
