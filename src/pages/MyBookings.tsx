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
    <div className="app-container bg-background min-h-screen pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-foreground" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Booked Rides</h1>
      </div>

      {myBookings.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <BookOpenCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aapne abhi tak koi ride join nahi ki hai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myBookings.map((booking) => {
            const ride = rides.find((item) => item.id === booking.rideId);
            if (!ride) return null;

            return (
              <div key={booking.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{ride.from} to {ride.to}</p>
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

                <p className="text-xs text-muted-foreground mb-1">Driver: {ride.driverName}</p>
                <p className="text-xs text-muted-foreground mb-3">Price: {ride.pricePerSeat} per seat</p>

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

      <BottomNav />
    </div>
  );
};

export default MyBookings;
