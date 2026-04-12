import { useEffect } from "react";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { useRideContext } from "@/context/RideContext";
import { trackPageView } from "@/lib/analytics";

const MyBookings = () => {
  const navigate = useNavigate();
  const { rides, requests, currentUser, cancelBooking } = useRideContext();

  useEffect(() => {
    trackPageView("/my-bookings");
  }, []);

  const myBookings = requests.filter(
    (request) => request.requesterEmail === currentUser.email && request.status !== "rejected"
  );

  return (
    <div className="app-container desktop-premium-page bg-background min-h-screen pb-24 px-4 pt-6 md:pb-8 md:px-0">
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      <div className="relative md:max-w-[86rem] md:mx-auto md:min-h-[calc(100vh-9.5rem)] md:flex md:flex-col">
      <div className="flex items-center gap-3 mb-6 md:mb-5">
        <button onClick={() => navigate(-1)} className="text-foreground" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Booked Rides</h1>
      </div>

      <section className="rounded-3xl border border-border/70 bg-card/70 p-4 md:p-5 md:flex-1 md:overflow-hidden md:backdrop-blur-2xl md:shadow-[0_22px_54px_rgba(15,23,42,0.1)]">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Joined rides</p>
            <p className="text-[11px] text-muted-foreground">All your accepted or pending ride bookings</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {myBookings.length} bookings
          </span>
        </div>

        {myBookings.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 p-10 text-center">
            <div>
              <BookOpenCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">You haven't joined any ride yet!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:h-[calc(100%-4.25rem)] md:grid-cols-2 md:gap-4 md:space-y-0 md:overflow-y-auto md:pr-1">
            {myBookings.map((booking) => {
              const ride = rides.find((item) => item.id === booking.rideId);
              if (!ride) return null;

              return (
                <div
                  key={booking.id}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/[0.07] to-transparent" />

                  <div className="relative z-[1] mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted text-sm font-bold text-foreground">
                        {ride.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold leading-tight text-foreground">{ride.driverName}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {ride.carModel} {ride.carNumberPlate ? `• ${ride.carNumberPlate}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        booking.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : "bg-yellow-500/15 text-yellow-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="relative z-[1] mb-4 rounded-2xl border border-border/60 bg-background/60 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                        <div className="h-7 w-px bg-border" />
                        <div className="h-2.5 w-2.5 rounded-full border-2 border-foreground" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">{ride.from}</p>
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{ride.departureTime}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">{ride.to}</p>
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{ride.arrivalTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-[1] mb-3 grid grid-cols-3 gap-2 border-t border-border/80 pt-3">
                    <div className="rounded-xl bg-secondary/60 px-2.5 py-2 text-center">
                      <p className="text-sm font-bold text-foreground">{ride.pricePerSeat}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">per seat</p>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-2.5 py-2 text-center">
                      <p className="text-sm font-bold text-foreground">{booking.seatsRequested}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">booked</p>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-2.5 py-2 text-center">
                      <p className="text-sm font-bold text-foreground">{ride.eta || "-"}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">arrival</p>
                    </div>
                  </div>

                  <div className="relative z-[1] flex gap-2">
                    <button
                      onClick={() => navigate(`/ride/${ride.id}?requestId=${booking.id}`)}
                      className="flex-1 rounded-xl bg-secondary py-2.5 text-xs font-semibold text-foreground"
                    >
                      Ride Details
                    </button>
                    <button
                      onClick={() => navigate(`/notifications`)}
                      className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground"
                    >
                      Open Requests
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm("Cancel this booking?");
                      if (!confirmed) return;

                      const result = await cancelBooking(booking.id);
                      if (!result.success) {
                        toast.error(result.message);
                        return;
                      }

                      toast.success("Booking cancelled");
                    }}
                    className="relative z-[1] mt-2 w-full rounded-xl border border-destructive/20 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive"
                  >
                    Cancel Booking
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      </div>

      <BottomNav />
    </div>
  );
};

export default MyBookings;
