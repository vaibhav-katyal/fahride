import { createContext, useContext, useState, useCallback } from "react";

export interface ChatNotification {
  id: string;
  senderName: string;
  messageContent: string;
  rideId: string;
  timestamp: number;
}

interface NotificationContextType {
  notifications: ChatNotification[];
  addNotification: (notification: Omit<ChatNotification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);

  const addNotification = useCallback((notification: Omit<ChatNotification, "id" | "timestamp">) => {
    const id = `${notification.rideId}-${Date.now()}`;
    const newNotification: ChatNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after 1.5 seconds
    const timer = setTimeout(() => {
      removeNotification(id);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};
