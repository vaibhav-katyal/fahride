import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  sendMessage: (rideId: string, requestId: string, content: string) => boolean;
  joinChat: (rideId: string, requestId: string) => void;
  leaveChat: () => void;
  setIsTyping: (typing: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
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
      setMessages((prev) => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    });

    newSocket.on("user-typing", () => {
      setIsTyping(true);
    });

    newSocket.on("user-stop-typing", () => {
      setIsTyping(false);
    });

    newSocket.on("error", (error: string) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinChat = useCallback((rideId: string, requestId: string) => {
    socket?.emit("join-chat", { rideId, requestId });
  }, [socket]);

  const leaveChat = useCallback(() => {
    socket?.emit("leave-chat");
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
        sendMessage,
        joinChat,
        leaveChat,
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
