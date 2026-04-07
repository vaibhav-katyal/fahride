import { CalendarDays, Phone, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { RideRequest } from "@/context/RideContext";
import { getRepeatRideLiveStatus, isRideRequestWindowClosed } from "@/lib/rideTime";

export interface Ride {
  id: string;
  ownerId?: string;
  driverName: string;
  driverEmail?: string;
  driverPhone?: string;
  driverBranch?: string;
  driverYear?: string;
  carModel: string;
  carNumberPlate?: string;
  carImageUrl?: string;
  from: string;
  to: string;
  date?: string;
  repeatDays?: string[];
  departureTime: string;
  arrivalTime: string;
  pricePerSeat: string;
  seats: number;
  eta: string;
  avatar: string;
}

const RideCard = ({
  ride,
  onRequest,
  request,
  isOwnRide = false,
}: {
  ride: Ride;
  onRequest?: () => void;
  request?: RideRequest;
  isOwnRide?: boolean;
}) => {
  const navigate = useNavigate();
  const isLateRide = isRideRequestWindowClosed(ride.date, ride.departureTime);

  const formattedRideDate = ride.date
    ? new Date(`${ride.date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date not set";
  const repeatRideLiveStatus = getRepeatRideLiveStatus(ride.repeatDays);

  const getButtonState = () => {
    if (!request) {
      return {
        label: isLateRide ? "Late" : "Request",
        icon: null,
        disabled: isLateRide,
        variant: isLateRide ? "late" : "primary",
      };
    }

    if (request.status === "pending") {
      return {
        label: "Requested",
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        disabled: true,
        variant: "pending",
      };
    }

    if (request.status === "approved") {
      return {
        label: "Approved",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        disabled: true,
        variant: "success",
      };
    }

    if (request.status === "rejected") {
      return {
        label: "Request Again",
        icon: null,
        disabled: false,
        variant: "primary",
      };
    }

    return {
      label: "Request",
      icon: null,
      disabled: false,
      variant: "primary",
    };
  };

  const buttonState = getButtonState();

  const buttonClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    pending: "bg-yellow-600/20 text-yellow-700 dark:text-yellow-400 cursor-not-allowed opacity-75",
    success: "bg-primary text-primary-foreground cursor-not-allowed opacity-75",
    late: "bg-destructive/10 text-destructive cursor-not-allowed opacity-80",
  };


  return (
    <div
      onClick={() => navigate(`/ride/${ride.id}`)}
      className={`relative bg-card rounded-2xl p-4 shadow-sm border border-border cursor-pointer hover:shadow-md transition-all ${
        isOwnRide
          ? "grayscale opacity-60 hover:opacity-75"
          : ""
      }`}
    >
      {isLateRide && !request && !isOwnRide && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-[1px] pointer-events-none">
          <p className="rounded-full border border-destructive/30 bg-card px-3 py-1 text-[11px] font-semibold text-destructive">
            Sorry, you are late for this ride.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">
            {ride.avatar}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{ride.driverName}</p>
            <p className="text-[11px] text-muted-foreground">
              {ride.carModel} {ride.carNumberPlate ? `• ${ride.carNumberPlate}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRequest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!buttonState.disabled) {
                  onRequest();
                }
              }}
              disabled={buttonState.disabled}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                buttonClasses[buttonState.variant as keyof typeof buttonClasses]
              }`}
            >
              {buttonState.icon}
              {buttonState.label}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.info(`Contact ${ride.driverName} from ride details after approval.`);
            }}
            className="bg-primary text-primary-foreground w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center mt-1">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <div className="w-px h-6 bg-border" />
          <div className="w-2 h-2 rounded-full border-2 border-foreground" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{ride.from}</p>
            <span className="text-[11px] text-muted-foreground">{ride.departureTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{ride.to}</p>
            <span className="text-[11px] text-muted-foreground">{ride.arrivalTime}</span>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[11px] font-medium text-foreground">{formattedRideDate}</p>
      </div>

      {repeatRideLiveStatus && (
        <div
          className={`mb-3 rounded-lg px-2.5 py-1.5 ${
            repeatRideLiveStatus.tone === "live-today"
              ? "border border-emerald-300/50 bg-emerald-500/10"
              : "border border-amber-300/50 bg-amber-500/10"
          }`}
        >
          <p
            className={`text-[11px] font-medium ${
              repeatRideLiveStatus.tone === "live-today" ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {repeatRideLiveStatus.message}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <span className="font-bold text-foreground">{ride.pricePerSeat}</span>
          <span className="text-[11px] text-muted-foreground ml-1">per seat</span>
        </div>
        <div>
          <span className="font-bold text-foreground">{ride.seats}</span>
          <span className="text-[11px] text-muted-foreground ml-1">Seats</span>
        </div>
        <div>
          <span className="font-bold text-foreground">{ride.eta}</span>
          <span className="text-[11px] text-muted-foreground ml-1">Arrival</span>
        </div>
      </div>
    </div>
  );
};

export default RideCard;
