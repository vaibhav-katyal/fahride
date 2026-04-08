import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setIsMaintenanceMode: (value: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "https://fah-ride-dzg3aqhsfsdqh4fy.centralindia-01.azurewebsites.net/api";

// Check if we're in production (not localhost)
const isProduction = () => {
  const hostname = window.location.hostname;
  return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "[::1]";
};

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const production = isProduction();
  const [isMaintenanceMode, setIsMaintenanceModeState] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch maintenance status from server
  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/maintenance/status`);
      if (response.ok) {
        const data = await response.json();
        // Only apply maintenance mode in production
        if (production) {
          setIsMaintenanceModeState(data.isMaintenanceMode);
        }
      }
    } catch (error) {
      console.log("Failed to fetch maintenance status");
    }
  };

  // Initialize on mount - fetch once
  useEffect(() => {
    fetchMaintenanceStatus();
    setIsInitialized(true);
  }, [production]);

  // Update maintenance mode and sync with server
  const setIsMaintenanceMode = async (value: boolean) => {
    // Prevent setting maintenance mode on localhost
    if (!production) return;

    setIsMaintenanceModeState(value);
    
    try {
      await fetch(`${API_URL}/v1/maintenance/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isMaintenanceMode: value }),
      });
    } catch (error) {
      console.log("Failed to update maintenance mode");
    }
  };

  // Don't render children until initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, setIsMaintenanceMode }}>
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
