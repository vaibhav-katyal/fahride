import { ArrowLeft, CheckCircle2, XCircle, Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRideContext } from "@/context/RideContext";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const Notifications = () => {
  const navigate = useNavigate();
  const { rides, getRequestsForMyRides, approveRequest, rejectRequest } =
    useRideContext();

  const allRequests = getRequestsForMyRides();

  const getRide = (rideId: string) => rides.find((r) => r.id === rideId);

  return (
    <div className="app-container bg-background min-h-screen pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Ride Requests</h1>
        </div>

        {allRequests.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No ride requests yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allRequests.map((req) => {
              const ride = getRide(req.rideId);
              return (
                <div
                  key={req.id}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {req.requesterName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.requesterEmail}
                      </p>
                      <p className="text-xs text-foreground/80 mt-1">
                        Seats requested: <span className="font-semibold">{req.seatsRequested}</span>
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                        req.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {ride && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <span>{ride.from}</span>
                      <span>→</span>
                      <span>{ride.to}</span>
                    </div>
                  )}

                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const result = await approveRequest(req.id);
                          if (result.success) {
                            toast.success("Request approved! 🎉");
                          } else {
                            toast.error(result.message);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          const result = await rejectRequest(req.id);
                          if (result.success) {
                            toast.error("Request rejected");
                          } else {
                            toast.error(result.message);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive py-2.5 rounded-xl text-xs font-semibold hover:bg-destructive/20 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {req.status !== "pending" && (
                    <button
                      onClick={() => navigate(`/ride/${req.rideId}?requestId=${req.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 bg-secondary text-foreground py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary/80 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> View Ride
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
