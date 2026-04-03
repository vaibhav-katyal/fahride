import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Plus, User, Bell } from "lucide-react";
import { useRideContext } from "@/context/RideContext";

const tabs = [
  { icon: Home, path: "/home", label: "Home" },
  { icon: Search, path: "/search", label: "Search" },
  { icon: Plus, path: "/post-ride", label: "Post", isCenter: true },
  { icon: Bell, path: "/notifications", label: "Alerts" },
  { icon: User, path: "/profile", label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getRequestsForMyRides } = useRideContext();

  const pendingCount = getRequestsForMyRides().filter(
    (r) => r.status === "pending"
  ).length;

  return (
    <>
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 md:hidden">
        <div className="bg-nav rounded-t-3xl px-4 py-3 flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            if (tab.isCenter) {
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center -mt-6 shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            }

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`relative flex flex-col items-center gap-0.5 transition-colors ${
                  isActive ? "text-nav-active" : "text-nav-foreground/60"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {tab.label === "Alerts" && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed left-1/2 top-4 z-50 hidden -translate-x-1/2 md:block">
        <div className="rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              const Icon = tab.icon;
              const desktopTabClass = isActive
                ? "bg-slate-900 text-white shadow-md"
                : tab.isCenter
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-slate-700 hover:bg-slate-100";

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${desktopTabClass}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.label === "Alerts" && pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomNav;
