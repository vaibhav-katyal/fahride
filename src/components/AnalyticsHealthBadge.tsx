import { useEffect, useMemo, useState } from "react";
import { COOKIE_CONSENT_KEY, hasAnalyticsConsent } from "@/lib/analytics";

type AnalyticsHealth = {
  consentRaw: string;
  consentAccepted: boolean;
  scriptLoaded: boolean;
  gtagReady: boolean;
  dataLayerSize: number;
  lastSignal: string;
};

const CONSENT_EVENT = "cookie-consent-changed";
const SCRIPT_ID = "google-analytics-gtag";
const DEFAULT_GA_ID = "G-M1XJVRDMS4";

const AnalyticsHealthBadge = () => {
  const [health, setHealth] = useState<AnalyticsHealth>({
    consentRaw: "(empty)",
    consentAccepted: false,
    scriptLoaded: false,
    gtagReady: false,
    dataLayerSize: 0,
    lastSignal: "none",
  });

  const measurementId = useMemo(() => import.meta.env.VITE_GA_ID || DEFAULT_GA_ID, []);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const readLastSignal = () => {
      const dataLayer = window.dataLayer || [];
      if (dataLayer.length === 0) {
        return "none";
      }

      const lastEntry = dataLayer[dataLayer.length - 1];
      if (Array.isArray(lastEntry) && typeof lastEntry[0] === "string") {
        return lastEntry[0];
      }

      return "unknown";
    };

    const updateHealth = () => {
      const consentRawValue = localStorage.getItem(COOKIE_CONSENT_KEY);
      setHealth({
        consentRaw: consentRawValue ?? "(empty)",
        consentAccepted: hasAnalyticsConsent(),
        scriptLoaded: Boolean(document.getElementById(SCRIPT_ID)),
        gtagReady: typeof window.gtag === "function",
        dataLayerSize: window.dataLayer?.length ?? 0,
        lastSignal: readLastSignal(),
      });
    };

    updateHealth();

    const intervalId = window.setInterval(updateHealth, 1500);
    window.addEventListener(CONSENT_EVENT, updateHealth);
    window.addEventListener("storage", updateHealth);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(CONSENT_EVENT, updateHealth);
      window.removeEventListener("storage", updateHealth);
    };
  }, []);

  if (!import.meta.env.DEV) {
    return null;
  }

  const allHealthy = health.consentAccepted && health.scriptLoaded && health.gtagReady;

  return (
    <div className="pointer-events-none fixed bottom-20 left-3 z-[70] md:bottom-4 md:left-4">
      <div className="pointer-events-auto w-[18rem] rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Analytics Health</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              allHealthy ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-700"
            }`}
          >
            {allHealthy ? "healthy" : "needs check"}
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Measurement:</span> {measurementId}
          </p>
          <p>
            <span className="font-semibold text-foreground">Consent:</span> {health.consentAccepted ? "accepted" : "not accepted"} ({health.consentRaw})
          </p>
          <p>
            <span className="font-semibold text-foreground">Script:</span> {health.scriptLoaded ? "loaded" : "missing"}
          </p>
          <p>
            <span className="font-semibold text-foreground">gtag:</span> {health.gtagReady ? "ready" : "not ready"}
          </p>
          <p>
            <span className="font-semibold text-foreground">dataLayer:</span> {health.dataLayerSize} events
          </p>
          <p>
            <span className="font-semibold text-foreground">Last signal:</span> {health.lastSignal}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHealthBadge;
