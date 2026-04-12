const DEFAULT_GA_ID = "G-M1XJVRDMS4";
const GA_ID = import.meta.env.VITE_GA_ID || DEFAULT_GA_ID;
const SCRIPT_ID = "google-analytics-gtag";
const ACCEPTED_CONSENT_VALUES = new Set(["accepted", "true", "1", "yes"]);
const SESSION_FLAG_KEY = "ga_session_started";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const COOKIE_CONSENT_KEY = "cookieConsent";

let gtagLoaded = false;
let gtagReady = false;

export const hasAnalyticsConsent = () => {
  const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) {
    return false;
  }

  return ACCEPTED_CONSENT_VALUES.has(raw.trim().toLowerCase());
};

export const loadGoogleAnalytics = () => {
  if (typeof window === "undefined" || !GA_ID) {
    return false;
  }

  if (gtagLoaded && window.gtag) {
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
    
    if (args[0] === "gtag" && args[1] === "consent" && args[2] === "update") {
      gtagReady = true;
    }
    
    if (args[0] === "js" && args[1]) {
      gtagLoaded = true;
    }
    
    if (args[0] === "config" && args[1] === GA_ID) {
      gtagReady = true;
    }
  };

  const existingScript = document.getElementById(SCRIPT_ID);
  if (!existingScript) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    script.onload = () => {
      gtagLoaded = true;
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    };
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    send_page_view: false,
    debug_mode: false,
  });
  
  window.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "granted",
  });

  return true;
};

export const trackPageView = (path: string) => {
  if (!window.gtag || !GA_ID) {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (!window.gtag || !GA_ID) {
    return;
  }

  window.gtag("event", name, {
    ...params,
    timestamp: Date.now(),
  });
};

export const trackSessionStart = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionStorage.getItem(SESSION_FLAG_KEY) === "1") {
    return;
  }

  sessionStorage.setItem(SESSION_FLAG_KEY, "1");
  trackEvent("session_start", {
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const trackEngagementPulse = () => {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return;
  }

  trackEvent("user_engagement", {
    engagement_time_msec: 1000,
    page_location: typeof window !== "undefined" ? window.location.href : "",
  });
};