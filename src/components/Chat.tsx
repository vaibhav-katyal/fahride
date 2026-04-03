import { useState, useEffect, useRef } from "react";
import { Send, Loader2, CheckCheck, Check } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { useRideContext } from "@/context/RideContext";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface ChatProps {
  rideId: string;
  requestId: string;
  driverName: string;
  riderName: string;
  driverEmail: string;
  riderEmail: string;
}

const Chat = ({ rideId, requestId, driverName, riderName, driverEmail, riderEmail }: ChatProps) => {
  const { messages, setMessages, sendMessage, joinChat, leaveChat, isTyping, typingUser, socket } = useSocket();
  const { currentUser } = useRideContext();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const lastReadRef = useRef<{ lastReadByDriver?: string; lastReadByRider?: string }>({});
  const lastNotifiedMessageRef = useRef<string>("");
  const chatLoadedAtRef = useRef<number>(Date.now());
  const initialMessagesLoadedRef = useRef(false);

  // Request/ensure notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await apiRequest<{
          success: boolean;
          data?: {
            messages?: Array<{
              sender: { id: string; name: string; email: string };
              content: string;
              timestamp: string;
            }>;
            lastReadByDriver?: string;
            lastReadByRider?: string;
          };
        }>(`/chat/${rideId}/${requestId}`);

        const historyMessages = response.data?.messages || [];
        lastReadRef.current = {
          lastReadByDriver: response.data?.lastReadByDriver,
          lastReadByRider: response.data?.lastReadByRider,
        };
        setMessages(
          historyMessages.map((message) => ({
            sender: message.sender,
            content: message.content,
            timestamp: new Date(message.timestamp),
          }))
        );
        // Mark that initial messages have been loaded
        initialMessagesLoadedRef.current = true;
        chatLoadedAtRef.current = Date.now();
      } catch {
        // If REST history fails, socket join will still try to restore the thread.
      }
    };

    void loadChatHistory();
    joinChat(rideId, requestId);
    return () => {
      leaveChat();
    };
  }, [rideId, requestId, joinChat, leaveChat, setMessages]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send browser notification when message arrives from other party
  useEffect(() => {
    // Don't notify during initial load
    if (!initialMessagesLoadedRef.current || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Only notify if message is from the OTHER party (not current user)
    if (lastMessage.sender.email === currentUser?.email) {
      return;
    }

    // Only notify for messages that arrived AFTER chat was loaded
    // (not historical messages)
    if (lastMessage.timestamp.getTime() < chatLoadedAtRef.current) {
      return;
    }

    // Prevent duplicate notifications for the same message
    const messageKey = `${rideId}-${lastMessage.sender.email}-${lastMessage.content}`;
    if (lastNotifiedMessageRef.current === messageKey) {
      return;
    }
    lastNotifiedMessageRef.current = messageKey;

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`New message from ${lastMessage.sender.name}`, {
        body: lastMessage.content,
        icon: "/app-icon.png",
        tag: `chat-${rideId}`,
        requireInteraction: false,
      });
    }
  }, [messages, currentUser?.email, rideId]);

  useEffect(() => {
    return () => {
      socket?.emit("stop-typing", { rideId, requestId });
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, [socket, rideId, requestId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSending(true);
    const wasSent = sendMessage(rideId, requestId, content);
    if (!wasSent) {
      toast.error("Chat disconnected. Please refresh and try again.");
      setIsSending(false);
      return;
    }
    setContent("");
    setIsSending(false);
    socket?.emit("stop-typing", { rideId, requestId });
  };

  const handleTyping = (value: string) => {
    setContent(value);
    socket?.emit("typing", { rideId, requestId });
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      socket?.emit("stop-typing", { rideId, requestId });
      typingTimerRef.current = null;
    }, 1000);
  };

  const otherPartyReadAt = currentUser.email === driverEmail
    ? lastReadRef.current.lastReadByRider
    : currentUser.email === riderEmail
      ? lastReadRef.current.lastReadByDriver
      : undefined;

  const typingLabel = typingUser && typingUser !== currentUser.email ? `${typingUser} is typing...` : "";

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Chat</h3>
          <p className="text-xs text-muted-foreground">
            {currentUser?.name === driverName ? riderName : driverName}
          </p>
          {(typingLabel || otherPartyReadAt) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {typingLabel || (otherPartyReadAt ? `Seen ${new Date(otherPartyReadAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "")}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender.email === currentUser?.email ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender.email === currentUser?.email
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-xs font-semibold mb-1">{msg.sender.name}</p>
                <p className="text-sm break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender.email === currentUser?.email
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {msg.sender.email === currentUser?.email && otherPartyReadAt && new Date(msg.timestamp).getTime() <= new Date(otherPartyReadAt).getTime() && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <CheckCheck className="h-3 w-3" /> Seen
                    </span>
                  )}
                  {msg.sender.email === currentUser?.email && !otherPartyReadAt && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Check className="h-3 w-3" /> Sent
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 px-4 py-2 text-muted-foreground text-sm">
              <span>Typing</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-border p-4 flex gap-2 bg-card">
        <input
          type="text"
          value={content}
          onChange={(e) => handleTyping(e.target.value)}
          onBlur={() => socket?.emit("stop-typing", { rideId, requestId })}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default Chat;
