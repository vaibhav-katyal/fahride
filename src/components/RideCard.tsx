import { Phone, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 cursor-not-allowed",
    success: "bg-primary/85 text-primary-foreground cursor-not-allowed",
    danger: "bg-rose-500/15 text-rose-700 dark:text-rose-300 cursor-not-allowed",
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
      className={`group relative shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)] ${
        isOwnRide
          ? "grayscale opacity-60 hover:opacity-75"
          : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-100/70 to-transparent" />

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

      <div className="relative z-[1] mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800">
            {ride.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-slate-900">{ride.driverName}</p>
            <p className="mt-0.5 truncate text-[12px] text-slate-500">
              {ride.carModel} {ride.carNumberPlate ? `• ${ride.carNumberPlate}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
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
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition-colors ${buttonClasses[buttonState.variant as keyof typeof buttonClasses]}`}
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
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

      <div className="relative z-[1] mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
            <div className="h-7 w-px bg-slate-300" />
            <div className="h-2.5 w-2.5 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="line-clamp-1 text-base font-medium text-slate-900">{ride.from}</p>
              <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[12px] font-medium text-slate-700">{ride.departureTime}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="line-clamp-1 text-base font-medium text-slate-900">{ride.to}</p>
              <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[12px] font-medium text-slate-700">{ride.arrivalTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[1] grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
        <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{ride.pricePerSeat}</p>
          <p className="mt-0.5 text-[11px] text-slate-600">per seat</p>
        </div>
        <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{ride.seats}</p>
          <p className="mt-0.5 text-[11px] text-slate-600">seats</p>
        </div>
        <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{ride.eta}</p>
          <p className="mt-0.5 text-[11px] text-slate-600">arrival</p>
        </div>
      </div>
    </div>
  );
};

export default RideCard;