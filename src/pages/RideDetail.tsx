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
    currentUser,
    sendRequest,
    getRequestForRide,
    sendMessage,
    getMessagesForRide,
  } = useRideContext();
  const [chatText, setChatText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [request, setRequest] = useState<ReturnType<typeof getRequestForRide>>(undefined);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [seatsToRequest, setSeatsToRequest] = useState(1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ride = rides.find((r) => r.id === id);
  const messages = id ? getMessagesForRide(id) : [];
  const isRideOwner = ride?.driverEmail === currentUser.email;
  const canSeePhone = isRideOwner || request?.status === "approved";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (id) {
      setRequest(getRequestForRide(id));
    }
  }, [id, getRequestForRide]);

  if (!ride) {
    return (
      <div className="app-container bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Ride not found.</p>
      </div>
    );
  }

  const handleRequest = () => {
    setShowSeatSelection(true);
  };

  const handleConfirmRequest = () => {
    const result = sendRequest(ride.id, seatsToRequest);
    setShowSeatSelection(false);
    if (result.success) {
      toast.success(
        `Requested ${seatsToRequest} ${seatsToRequest === 1 ? "seat" : "seats"} from ${ride.driverName}!`
      );
    } else {
      toast.error(result.message);
    }
  };

  const handleSendMessage = () => {
    if (!chatText.trim() || !id) return;
    sendMessage(id, chatText.trim(), "requester");
    setChatText("");
  };

  const handlePhoneClick = () => {
    if (!canSeePhone) {
      toast.info("Driver number will be visible after your booking is approved.");
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
              <p className="text-xs text-muted-foreground">
                {ride.carModel} {ride.carNumberPlate ? `• ${ride.carNumberPlate}` : ""}
              </p>
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

        {/* Driver Details */}
        <div className="bg-secondary/50 rounded-xl p-3 mb-3 flex flex-col gap-2">
          {ride.driverEmail && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Email:</span>
              <p className="text-xs text-foreground break-all">{ride.driverEmail}</p>
            </div>
          )}
          {ride.driverRollNumber && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Roll No:</span>
              <p className="text-xs text-foreground">{ride.driverRollNumber}</p>
            </div>
          )}
          {ride.driverBranch && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Branch:</span>
              <p className="text-xs text-foreground">{ride.driverBranch}</p>
            </div>
          )}
          {ride.driverYear && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Year:</span>
              <p className="text-xs text-foreground">{ride.driverYear}</p>
            </div>
          )}
          {canSeePhone && ride.driverPhone ? (
            <div className="flex items-start gap-2 pt-1 border-t border-border">
              <span className="text-[10px] font-semibold text-primary min-w-16">Phone:</span>
              <p className="text-xs text-primary font-semibold">{ride.driverPhone}</p>
            </div>
          ) : (
            !isRideOwner && (
              <div className="flex items-start gap-2 pt-1 border-t border-border">
                <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Phone:</span>
                <p className="text-[10px] text-muted-foreground italic">Once ride is accepted, phone number will be visible</p>
              </div>
            )
          )}
        </div>

        {ride.carImageUrl && (
          <img
            src={ride.carImageUrl}
            alt="Car preview"
            className="w-full h-32 object-cover rounded-xl border border-border mb-3"
          />
        )}

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
              <p className="font-bold text-sm text-foreground">{ride.pricePerSeat}</p>
              <p className="text-[10px] text-muted-foreground">per seat</p>
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
                    : request.status === "approved"
                    ? "Booking approved. Contact unlocked."
                    : "Request was declined"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seat Selection Modal */}
      {showSeatSelection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-3xl p-6 border border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 text-center">
              How many seats?
            </h2>
            <div className="flex gap-2 mb-6">
              {Array.from({ length: ride.seats }, (_, i) => i + 1).map((seat) => (
                <button
                  key={seat}
                  onClick={() => setSeatsToRequest(seat)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                    seatsToRequest === seat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {seat}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSeatSelection(false)}
                className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequest}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

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
