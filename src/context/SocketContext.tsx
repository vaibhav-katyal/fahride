import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  sender: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  isTyping: boolean;
  typingUser: string | null;
  liveRideLocation: {
    rideId: string;
    requestId: string;
    lat: number;
    lon: number;
    heading?: number;
    speed?: number;
    timestamp?: string;
    updatedBy?: string;
  } | null;
  currentChatRideId: string | null;
  sendMessage: (rideId: string, requestId: string, content: string) => boolean;
  joinChat: (rideId: string, requestId: string) => void;
  leaveChat: () => void;
  joinLiveRide: (rideId: string, requestId: string) => void;
  leaveLiveRide: () => void;
  sendRideLocation: (payload: {
    rideId: string;
    requestId: string;
    lat: number;
    lon: number;
    heading?: number;
    speed?: number;
    timestamp?: string;
  }) => boolean;
  setIsTyping: (typing: boolean) => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [liveRideLocation, setLiveRideLocation] = useState<SocketContextType["liveRideLocation"]>(null);
  const [currentChatRideId, setCurrentChatRideId] = useState<string | null>(null);
  const currentUserEmailRef = useRef<string | null>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || "https://fah-ride-dzg3aqhsfsdqh4fy.centralindia-01.azurewebsites.net/api/v1";
    const socketBaseUrl = rawApiUrl.replace(/\/api\/v1\/?$/, "");

    const newSocket = io(socketBaseUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    newSocket.on("chat-history", (data: { messages: Message[] }) => {
      setMessages(data.messages.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
    });

    newSocket.on("message", (message: Message) => {
      const parsedMessage = { ...message, timestamp: new Date(message.timestamp) };
      setMessages((prev) => [...prev, parsedMessage]);
    });

    newSocket.on("user-typing", (payload: { userEmail?: string; userId?: string; userName?: string }) => {
      setIsTyping(true);
      setTypingUser(payload.userName || payload.userEmail || payload.userId || "Someone");
    });

    newSocket.on("user-stop-typing", () => {
      setIsTyping(false);
      setTypingUser(null);
    });

    newSocket.on("error", (error: string) => {
      console.error("Socket error:", error);
    });

    newSocket.on("ride-location-update", (payload: SocketContextType["liveRideLocation"]) => {
      setLiveRideLocation(payload);
    });

    newSocket.on("live-user-left", () => {
      // keep last known location visible, do not clear marker immediately
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinChat = useCallback((rideId: string, requestId: string) => {
    setCurrentChatRideId(rideId);
    socket?.emit("join-chat", { rideId, requestId });
  }, [socket]);

  const leaveChat = useCallback(() => {
    setCurrentChatRideId(null);
    socket?.emit("leave-chat");
  }, [socket]);

  const joinLiveRide = useCallback((rideId: string, requestId: string) => {
    socket?.emit("join-live-ride", { rideId, requestId });
  }, [socket]);

  const leaveLiveRide = useCallback(() => {
    socket?.emit("leave-live-ride");
    setLiveRideLocation(null);
  }, [socket]);

  const sendRideLocation = useCallback((payload: {
    rideId: string;
    requestId: string;
    lat: number;
    lon: number;
    heading?: number;
    speed?: number;
    timestamp?: string;
  }) => {
    if (!socket || !socket.connected) {
      return false;
    }

    socket.emit("ride-location:update", payload);
    return true;
  }, [socket]);

  const sendMessage = useCallback((rideId: string, requestId: string, content: string) => {
    if (!socket || !socket.connected) {
      return false;
    }
    socket.emit("new-message", { rideId, requestId, content });
    return true;
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        isTyping,
        typingUser,
        liveRideLocation,
        currentChatRideId,
        sendMessage,
        joinChat,
        leaveChat,
        joinLiveRide,
        leaveLiveRide,
        sendRideLocation,
        setMessages,
        setIsTyping: (typing) => {
          setIsTyping(typing);
        },
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
