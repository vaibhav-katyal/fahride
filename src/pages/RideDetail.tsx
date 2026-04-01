import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Users,
  DollarSign,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useRideContext } from "@/context/RideContext";
import { toast } from "sonner";

const RideDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    rides,
    sendRequest,
    getRequestForRide,
    sendMessage,
    getMessagesForRide,
  } = useRideContext();
  const [chatText, setChatText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ride = rides.find((r) => r.id === id);
  const request = id ? getRequestForRide(id) : undefined;
  const messages = id ? getMessagesForRide(id) : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!ride) {
    return (
      <div className="app-container bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Ride not found.</p>
      </div>
    );
  }

  const handleRequest = () => {
    sendRequest(ride.id);
    toast.success(`Ride request sent to ${ride.driverName}!`);
  };

  const handleSendMessage = () => {
    if (!chatText.trim() || !id) return;
    sendMessage(id, chatText.trim(), "requester");
    setChatText("");
  };

  const handlePhoneClick = () => {
    if (request?.status !== "approved") {
      toast.info("Call option unlocks after the ride request is approved.");
      return;
    }
    toast.success(`Calling ${ride.driverName}...`);
  };

  const statusColor =
    request?.status === "approved"
      ? "text-primary"
      : request?.status === "rejected"
      ? "text-destructive"
      : "text-yellow-600";

  const StatusIcon =
    request?.status === "approved"
      ? CheckCircle2
      : request?.status === "rejected"
      ? XCircle
      : Loader2;

  return (
    <div className="app-container bg-background min-h-screen pb-6">
      {/* Header */}
      <div className="px-4 pt-6 flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Ride Details</h1>
      </div>

      {/* Map Placeholder */}
      <div className="mx-4 h-44 rounded-2xl bg-secondary border border-border overflow-hidden relative mb-4">
        {request?.status === "approved" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-foreground" />
              <div className="w-24 h-0.5 bg-primary" />
              <div className="w-20 h-0.5 bg-primary" />
              <div className="w-3 h-3 rounded-full border-2 border-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{ride.from} → {ride.to}</p>
            <p className="text-[10px] text-primary font-semibold mt-1">Route Active</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                Map available after approval
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Driver Info */}
      <div className="mx-4 bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold">
              {ride.avatar}
            </div>
            <div>
              <p className="font-bold text-foreground">{ride.driverName}</p>
              <p className="text-xs text-muted-foreground">{ride.carModel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePhoneClick}
            className="bg-primary text-primary-foreground w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex flex-col items-center mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
            <div className="w-px h-8 bg-border" />
            <div className="w-2.5 h-2.5 rounded-full border-2 border-foreground" />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{ride.from}</p>
              <span className="text-xs text-muted-foreground">{ride.departureTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{ride.to}</p>
              <span className="text-xs text-muted-foreground">{ride.arrivalTime}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm text-foreground">{ride.pricePerMile}</p>
              <p className="text-[10px] text-muted-foreground">per mile</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm text-foreground">{ride.seats}</p>
              <p className="text-[10px] text-muted-foreground">seats</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm text-foreground">{ride.eta}</p>
              <p className="text-[10px] text-muted-foreground">ETA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Status / Button */}
      <div className="mx-4 mb-4">
        {!request ? (
          <button
            onClick={handleRequest}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Request This Ride
          </button>
        ) : (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`w-5 h-5 ${statusColor} ${
                  request.status === "pending" ? "animate-spin" : ""
                }`}
              />
              <div>
                <p className="font-semibold text-sm text-foreground capitalize">
                  Status: {request.status}
                </p>
                <p className="text-xs text-muted-foreground">
                {request.status === "pending"
                    ? "Waiting for driver to respond"
                    : "Request was declined"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Section */}
      {request && (
        <div className="mx-4">
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-2xl py-3 mb-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {showChat ? "Hide Chat" : "Chat with Driver"}
          </button>

          {showChat && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Messages */}
              <div className="h-48 overflow-y-auto p-3 flex flex-col gap-2">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Start a conversation with {ride.driverName}
                  </p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                      msg.senderRole === "requester"
                        ? "bg-primary text-primary-foreground self-end rounded-br-sm"
                        : "bg-secondary text-foreground self-start rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-[9px] opacity-70 mt-0.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RideDetail;
