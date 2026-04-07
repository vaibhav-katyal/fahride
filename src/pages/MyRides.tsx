import { ArrowLeft, CarFront } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import RideCard from "@/components/RideCard";
import { useRideContext } from "@/context/RideContext";

const MyRides = () => {
  const navigate = useNavigate();
  const { rides, currentUser } = useRideContext();
  const currentUserId = (currentUser as { id?: string }).id;

  const myPostedRides = rides.filter(
    (ride) => (currentUserId && ride.ownerId === currentUserId) || ride.driverEmail === currentUser.email
  );

  return (
    <div className="app-container desktop-premium-page bg-background min-h-screen pb-24 md:pb-8">
      <div className="relative px-4 pt-6 md:px-0 md:pt-0 md:max-w-[86rem] md:mx-auto md:min-h-[calc(100vh-9.5rem)] md:flex md:flex-col">
        <div className="flex items-center gap-3 mb-6 md:mb-5">
          <button onClick={() => navigate(-1)} className="text-foreground" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Rides</h1>
        </div>

        <section className="rounded-3xl border border-border/70 bg-card/65 p-4 md:p-5 md:flex-1 md:overflow-hidden md:backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Posted by you</p>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {myPostedRides.length} rides
            </span>
          </div>

          {myPostedRides.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 p-10 text-center">
              <div>
                <CarFront className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">You haven't posted any ride yet!</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:grid md:h-[calc(100%-4.25rem)] md:grid-cols-2 md:items-start md:content-start md:overflow-y-auto md:pr-1 lg:grid-cols-2 xl:grid-cols-2">
              {myPostedRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyRides;
