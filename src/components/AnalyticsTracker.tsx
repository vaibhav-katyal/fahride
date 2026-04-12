import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  hasAnalyticsConsent,
  loadGoogleAnalytics,
  trackEngagementPulse,
  trackPageView,
  trackSessionStart,
} from "@/lib/analytics";

const CONSENT_EVENT = "cookie-consent-changed";

const AnalyticsTracker = () => {
  const location = useLocation();
  const [isEnabled, setIsEnabled] = useState(hasAnalyticsConsent());

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    loadGoogleAnalytics();
    trackSessionStart();
    trackPageView(`${location.pathname}${location.search}`);
  }, [isEnabled, location.pathname, location.search]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      trackEngagementPulse();
    }, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isEnabled]);

  useEffect(() => {
    const handleConsentChange = () => {
      const consentGranted = hasAnalyticsConsent();
      setIsEnabled(consentGranted);

      if (consentGranted) {
        loadGoogleAnalytics();
        trackSessionStart();
        trackPageView(`${location.pathname}${location.search}`);
      }
    };

    window.addEventListener(CONSENT_EVENT, handleConsentChange);
    window.addEventListener("storage", handleConsentChange);

    return () => {
      window.removeEventListener(CONSENT_EVENT, handleConsentChange);
      window.removeEventListener("storage", handleConsentChange);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;