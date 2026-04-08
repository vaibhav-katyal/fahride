import { MapPin, Phone, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { RideRequest } from "@/context/RideContext";
import { getRideAvailabilityState, formatRideDate } from "@/lib/rideStatus";

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
  const availability = getRideAvailabilityState(ride);

  const getButtonState = () => {
    if (!request) {
      if (!availability.canRequest) {
        return {
          label: availability.ctaLabel || "Unavailable",
          icon: <XCircle className="w-3.5 h-3.5" />,
          disabled: true,
          variant: "danger",
        };
      }

      return {
        label: "Request",
        icon: null,
        disabled: false,
        variant: "primary",
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
    danger: "bg-rose-500/15 text-rose-700 dark:text-rose-300 cursor-not-allowed opacity-90",
  };

  const showExpiredOverlay = availability.kind === "expired";
  const showAvailabilityTag = availability.kind !== "available" && availability.kind !== "expired" && Boolean(availability.headline);
  const availabilityTagStyles = {
    expired: "border-slate-300 bg-slate-100/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200",
    full: "border-rose-200 bg-rose-50/90 text-rose-700 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    last_seat: "border-amber-200 bg-amber-50/90 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    available: "",
  };

  const availabilityIcon = availability.kind === "expired" ? <XCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />;


  return (
    <div
      onClick={() => navigate(`/ride/${ride.id}`)}
      className={`relative overflow-hidden bg-card rounded-2xl p-4 shadow-sm border border-border cursor-pointer hover:shadow-md transition-all ${
        isOwnRide
          ? "grayscale opacity-60 hover:opacity-75"
          : ""
      }`}
    >
      {showExpiredOverlay && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-slate-100/45 via-slate-100/32 to-slate-50/18 backdrop-blur-[1.5px] dark:from-slate-950/28 dark:via-slate-950/18 dark:to-slate-900/10">
          <div className="absolute right-4 top-4">
            <span className="rounded-full border border-white/60 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-slate-950/45 dark:text-slate-100">
              {availability.badgeLabel}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="flex max-w-[17rem] items-center gap-3 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-slate-700 dark:text-slate-200">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{availability.headline}</p>
                {availability.subtext && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{availability.subtext}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="relative z-[1] flex items-center gap-3">
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
        <div className="relative z-[1] flex flex-col items-end gap-2">
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
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${buttonClasses[buttonState.variant as keyof typeof buttonClasses]}`}
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
          <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-full bg-secondary/60">
            {formatRideDate(ride.date)}
          </div>
        </div>
      </div>

      {showAvailabilityTag && (
        <div
          className={`mb-3 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${availabilityTagStyles[availability.kind]}`}
        >
          {availabilityIcon}
          <span className="truncate">{availability.headline}</span>
        </div>
      )}

      <div className="relative z-[1] flex items-start gap-3 mb-3">
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

      <div className="relative z-[1] flex items-center justify-between pt-3 border-t border-border">
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