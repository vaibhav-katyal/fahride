import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import CoinRewardPopup from "@/components/CoinRewardPopup";

interface CoinRewardPayload {
  coins: number;
  reason: string;
  /** If true, coins are not awarded yet — shows a "will be credited" message instead of a count */
  pending?: boolean;
  /** Called after the popup is dismissed (animation complete) */
  onComplete?: () => void;
}

interface CoinRewardContextType {
  showCoinReward: (payload: CoinRewardPayload) => void;
}

const CoinRewardContext = createContext<CoinRewardContextType | null>(null);

export const useCoinReward = () => {
  const ctx = useContext(CoinRewardContext);
  if (!ctx) throw new Error("useCoinReward must be used within CoinRewardProvider");
  return ctx;
};

export const CoinRewardProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeReward, setActiveReward] = useState<CoinRewardPayload | null>(null);
  const onCompleteRef = useRef<(() => void) | undefined>();

  const showCoinReward = useCallback((payload: CoinRewardPayload) => {
    onCompleteRef.current = payload.onComplete;
    setActiveReward(payload);
  }, []);

  const handleDismiss = useCallback(() => {
    setActiveReward(null);
    if (onCompleteRef.current) {
      onCompleteRef.current();
      onCompleteRef.current = undefined;
    }
  }, []);

  return (
    <CoinRewardContext.Provider value={{ showCoinReward }}>
      {children}
      {activeReward && (
        <CoinRewardPopup
          coins={activeReward.coins}
          reason={activeReward.reason}
          pending={activeReward.pending}
          onDismiss={handleDismiss}
        />
      )}
    </CoinRewardContext.Provider>
  );
};
