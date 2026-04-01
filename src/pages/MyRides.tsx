import { ArrowLeft, CarFront } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import RideCard from "@/components/RideCard";
import { useRideContext } from "@/context/RideContext";

const MyRides = () => {
  const navigate = useNavigate();
  const { rides, currentUser } = useRideContext();

  const myPostedRides = rides.filter(
    (ride) =>
      ride.driverName === currentUser.name ||
      ride.avatar === (currentUser.name || "Y").slice(0, 2).toUpperCase()
  );

  return (
    <div className="app-container bg-background min-h-screen pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Rides</h1>
        </div>

        {myPostedRides.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <CarFront className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aapne abhi tak koi ride post nahi ki hai.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myPostedRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyRides;
