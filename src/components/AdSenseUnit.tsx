import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdSenseUnitProps = {
  slot: string;
  className?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  style?: React.CSSProperties;
};

const AdSenseUnit = ({
  slot,
  className,
  format = "auto",
  responsive = true,
  style,
}: AdSenseUnitProps) => {
  const hasRequestedAd = useRef(false);

  useEffect(() => {
    if (!slot || hasRequestedAd.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      hasRequestedAd.current = true;
    } catch {
      // Ignore AdSense runtime errors to avoid affecting app usage.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <ins
      className={`adsbygoogle block overflow-hidden ${className ?? ""}`.trim()}
      style={{ display: "block", ...style }}
      data-ad-client="ca-pub-1276535117819440"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
};

export default AdSenseUnit;