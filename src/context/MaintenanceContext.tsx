import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setIsMaintenanceMode: (value: boolean) => void;
  isProduction: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

// Check if we're in production (not localhost)
const isProduction = () => {
  const hostname = window.location.hostname;
  return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "[::1]";
};

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const production = isProduction();
  
  const [isMaintenanceMode, setIsMaintenanceModeState] = useState(() => {
    // Only allow maintenance mode in production
    if (!production) return false;
    
    const stored = localStorage.getItem("maintenanceMode");
    return stored ? JSON.parse(stored) : false;
  });

  // Wrapper to prevent maintenance mode on localhost
  const setIsMaintenanceMode = (value: boolean) => {
    if (production) {
      setIsMaintenanceModeState(value);
    } else {
      // On localhost, always keep it off
      setIsMaintenanceModeState(false);
    }
  };

  // Update localStorage only in production
  useEffect(() => {
    if (production) {
      localStorage.setItem("maintenanceMode", JSON.stringify(isMaintenanceMode));
    }
  }, [isMaintenanceMode, production]);

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, setIsMaintenanceMode, isProduction: production }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within MaintenanceProvider");
  }
  return context;
};
