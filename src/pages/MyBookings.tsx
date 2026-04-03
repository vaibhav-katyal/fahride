import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useRideContext } from "@/context/RideContext";

const MyBookings = () => {
  const navigate = useNavigate();
  const { rides, requests, currentUser } = useRideContext();

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
              <p className="text-sm text-muted-foreground">Aapne abhi tak koi ride join nahi ki hai.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:h-[calc(100%-4.25rem)] md:grid-cols-2 md:gap-4 md:space-y-0 md:overflow-y-auto md:pr-1">
            {myBookings.map((booking) => {
              const ride = rides.find((item) => item.id === booking.rideId);
              if (!ride) return null;

              return (
                <div key={booking.id} className="bg-card border border-border rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md md:rounded-3xl">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground leading-snug">{ride.from} to {ride.to}</p>
                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${
                        booking.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="mb-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-1">Driver: {ride.driverName}</p>
                    <p className="text-xs text-muted-foreground">Price: {ride.pricePerSeat} per seat</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/ride/${ride.id}?requestId=${booking.id}`)}
                      className="flex-1 bg-secondary text-foreground py-2.5 rounded-xl text-xs font-semibold"
                    >
                      Ride Details
                    </button>
                    <button
                      onClick={() => navigate(`/notifications`)}
                      className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-semibold"
                    >
                      Open Requests
                    </button>
                  </div>
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
