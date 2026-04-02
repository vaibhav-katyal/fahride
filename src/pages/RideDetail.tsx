import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import Chat from "@/components/Chat";
import LiveRideMap from "@/components/LiveRideMap";
import { useRideContext } from "@/context/RideContext";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";

const RideDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { rides, requests, currentUser, sendRequest, getRequestForRide } = useRideContext();

  const [request, setRequest] = useState<ReturnType<typeof getRequestForRide>>(undefined);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [seatsToRequest, setSeatsToRequest] = useState(1);

  const ride = rides.find((r) => r.id === id);
  const isRideOwner = ride?.driverEmail === currentUser.email;
  const requestedRequestId = searchParams.get("requestId");
  const selectedRequest = requestedRequestId
    ? requests.find((r) => r.id === requestedRequestId && r.rideId === id)
    : undefined;

  const fallbackApprovedRequest = isRideOwner
    ? requests.find((r) => r.rideId === id && r.status === "approved")
    : undefined;

  const activeRequest = isRideOwner
    ? selectedRequest || fallbackApprovedRequest
    : selectedRequest || request;

  const canViewMap = isRideOwner || activeRequest?.status === "approved";

  const canSeePhone = isRideOwner || activeRequest?.status === "approved";
  const sessionUser = getCurrentUser();
  const resolvedDriverPhone = ride?.driverPhone || (isRideOwner ? sessionUser?.phone || "" : "");

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
    if (isRideOwner) {
      toast.info("You cannot request your own ride.");
      return;
    }
    setShowSeatSelection(true);
  };

  const handleConfirmRequest = async () => {
    const result = await sendRequest(ride.id, seatsToRequest);
    setShowSeatSelection(false);
    if (result.success) {
      toast.success(
        `Requested ${seatsToRequest} ${seatsToRequest === 1 ? "seat" : "seats"} from ${ride.driverName}!`
      );
    } else {
      toast.error(result.message);
    }
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
      : "text-yellow-500";

  const StatusIcon =
    request?.status === "approved"
      ? CheckCircle2
      : request?.status === "rejected"
      ? XCircle
      : Loader2;

  return (
    <div className="app-container bg-background min-h-screen pb-6">
      <div className="px-4 pt-6 flex items-center gap-3 mb-4">
        <button type="button" onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Ride Details</h1>
      </div>

      <div className="mx-4 h-56 md:h-64 rounded-2xl bg-secondary border border-border overflow-hidden relative mb-4">
        {canViewMap ? (
          <>
            <LiveRideMap from={ride.from} to={ride.to} />

            <div className="absolute left-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground">
              {ride.from} -&gt; {ride.to}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Map available after approval</p>
            </div>
          </div>
        )}
      </div>

      <div className="mx-4 bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold">
              {ride.avatar}
            </div>
            <div>
              <p className="font-bold text-foreground">{ride.driverName}</p>
              <p className="text-xs text-muted-foreground">
                {ride.carModel} {ride.carNumberPlate ? `- ${ride.carNumberPlate}` : ""}
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

        <div className="bg-secondary/50 rounded-xl p-3 mb-3 flex flex-col gap-2">
          {ride.driverEmail && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Email:</span>
              <p className="text-xs text-foreground break-all">{ride.driverEmail}</p>
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
          {canSeePhone && resolvedDriverPhone ? (
            <div className="flex items-start gap-2 pt-1 border-t border-border">
              <span className="text-[10px] font-semibold text-primary min-w-16">Phone:</span>
              <p className="text-xs text-primary font-semibold">{resolvedDriverPhone}</p>
            </div>
          ) : (
            !isRideOwner && (
              <div className="flex items-start gap-2 pt-1 border-t border-border">
                <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Phone:</span>
                <p className="text-[10px] text-muted-foreground italic">
                  Once ride is accepted, phone number will be visible
                </p>
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

      <div className="mx-4 mb-4">
        {isRideOwner ? (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm font-semibold text-foreground">This is your ride</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeRequest?.status === "approved"
                ? `Chat enabled with ${activeRequest.requesterName}.`
                : "Approve a request from Notifications to unlock chat."}
            </p>
          </div>
        ) : !request ? (
          <button
            type="button"
            onClick={handleRequest}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Request This Ride
          </button>
        ) : (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`w-5 h-5 ${statusColor} ${request.status === "pending" ? "animate-spin" : ""}`}
              />
              <div>
                <p className="font-semibold text-sm text-foreground capitalize">Status: {request.status}</p>
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

      {showSeatSelection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-3xl p-6 border border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-4 text-center">How many seats?</h2>
            <div className="flex gap-2 mb-6">
              {Array.from({ length: ride.seats }, (_, i) => i + 1).map((seat) => (
                <button
                  type="button"
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
                type="button"
                onClick={() => setShowSeatSelection(false)}
                className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRequest?.status === "approved" && id && activeRequest.id && (
        <div className="mx-4 h-96">
          <Chat
            rideId={id}
            requestId={activeRequest.id}
            driverName={ride.driverName}
            riderName={activeRequest.requesterName || "Rider"}
          />
        </div>
      )}
    </div>
  );
};

export default RideDetail;
