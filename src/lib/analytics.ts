const DEFAULT_GA_ID = "G-M1XJVRDMS4";
const GA_ID = import.meta.env.VITE_GA_ID || DEFAULT_GA_ID;
const SCRIPT_ID = "google-analytics-gtag";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const COOKIE_CONSENT_KEY = "cookieConsent";

export const hasAnalyticsConsent = () => localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";

export const loadGoogleAnalytics = () => {
  if (typeof window === "undefined" || !GA_ID) {
    return false;
  }

  if (window.gtag) {
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  const existingScript = document.getElementById(SCRIPT_ID);
  if (!existingScript) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });

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