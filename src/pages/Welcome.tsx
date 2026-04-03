import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import carpoolImg from "@/assets/carpool-illustration.png";
import { AUTH_CHANGED_EVENT, getCurrentUser } from "@/lib/auth";

const Welcome = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getCurrentUser()?.id));

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(getCurrentUser()?.id));
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, []);

  return (
    <div className="app-container flex flex-col items-center justify-between bg-background px-6 py-10 min-h-screen">
      <div className="flex items-center gap-1 mt-4">
        <img
          src="/chitpoo_logo.png"
          alt="Chit Pool Logo"
          width={80}
          height={80}
          className="w-30 h-30"
        />
        <span className="text-2xl font-bold text-foreground leading-tight">
          Chit <span className="text-primary">Pool</span>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <img
          src={carpoolImg}
          alt="Carpooling illustration"
          width={800}
          height={600}
          className="w-72 h-auto"
        />
      </div>

      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
          Share rides easily<br />
          with <span className="text-primary">Chit Pool</span>
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
          Share your rides daily while commuting to save money and reduce pollution. Exclusively for Chitkara University students.
        </p>
      </div>

      <button
        onClick={() => navigate(isAuthenticated ? "/home" : "/login")}
        className="bg-primary hover:bg-primary/90 text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 mb-6"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Welcome;
