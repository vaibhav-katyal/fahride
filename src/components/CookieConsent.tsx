import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { toast } from "sonner";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
    toast.success("Cookie preferences saved.");
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
    toast.info("You can change this in settings anytime.");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg p-4 z-50">
      <div className="max-w-6xl mx-auto flex items-start gap-4">
        <Cookie className="w-5 h-5 text-primary flex-shrink-0 mt-1" />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">We use cookies</h3>
          <p className="text-sm text-muted-foreground">
            We use essential cookies for authentication and functional cookies to enhance your experience. Your tokens (access & refresh) are stored in secure, httpOnly cookies. No tracking or analytics cookies are used.
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground whitespace-nowrap"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Accept
          </button>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
