import { useEffect, useState } from "react";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import HomeLiveMap from "@/components/HomeLiveMap";
import RideCard from "@/components/RideCard";
import { useRideContext } from "@/context/RideContext";
import { reverseGeocode } from "@/lib/location";
import { toast } from "sonner";

type Coordinate = [number, number];

const Home = () => {
  const navigate = useNavigate();
  const { rides, sendRequest, requests, currentUser } = useRideContext();
  const [showFilters, setShowFilters] = useState(false);
  const [appliedMinSeats, setAppliedMinSeats] = useState(0);
  const [appliedMaxPricePerMile, setAppliedMaxPricePerMile] = useState<number | null>(null);
  const [draftMinSeats, setDraftMinSeats] = useState(0);
  const [draftMaxPricePerMile, setDraftMaxPricePerMile] = useState<number | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [seatsToRequest, setSeatsToRequest] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [locationLabel, setLocationLabel] = useState("Detecting your location...");
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationLabel("Location not supported in this browser");
      setIsLocating(false);
      return;
    }

    const resolveLabel = async (lat: number, lon: number) => {
      try {
        const label = await reverseGeocode(lat, lon);
        setLocationLabel(label);
      } catch {
        setLocationLabel(`Lat ${lat.toFixed(4)}, Lng ${lon.toFixed(4)}`);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinate = [position.coords.latitude, position.coords.longitude];
        setCurrentLocation(coords);
        setIsLocating(false);
        void resolveLabel(coords[0], coords[1]);
      },
      () => {
        setLocationLabel("Location permission denied");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const filteredRides = rides.filter((ride) => {
    const priceValue = Number.parseFloat(ride.pricePerSeat.replace(/[^\d.]/g, ""));
    const seatMatch = appliedMinSeats === 0 || ride.seats >= appliedMinSeats;
    const priceMatch = appliedMaxPricePerMile === null || priceValue <= appliedMaxPricePerMile;
    return seatMatch && priceMatch;
  });

  const handleLocationClick = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location services are not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinate = [position.coords.latitude, position.coords.longitude];
        setCurrentLocation(coords);
        toast.success("Map recentered to your live location.");
      },
      () => {
        toast.error("Unable to get your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const handleFilterClick = () => {
    setDraftMinSeats(appliedMinSeats);
    setDraftMaxPricePerMile(appliedMaxPricePerMile);
    setShowFilters(true);
  };

  const handleApplyFilters = () => {
    setAppliedMinSeats(draftMinSeats);
    setAppliedMaxPricePerMile(draftMaxPricePerMile);
    setShowFilters(false);
    toast.success("Filter changes applied.");
  };

  const handleResetFilters = () => {
    setDraftMinSeats(0);
    setDraftMaxPricePerMile(null);
  };

  return (
    <div className="app-container bg-background min-h-screen pb-24">
      {/* Live map view */}
      <div className="relative h-64 bg-secondary overflow-hidden">
        <HomeLiveMap currentLocation={currentLocation} locationLabel={locationLabel} isLocating={isLocating} />

        <div className="absolute bottom-4 left-4 right-16 z-[4]">
          <button
            onClick={() => navigate("/search")}
            className="w-full bg-card rounded-xl px-4 py-3 flex items-center gap-3 shadow-md border border-border"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Where are you going?</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleLocationClick}
          className="absolute bottom-4 right-4 z-[4] bg-card w-10 h-10 rounded-xl flex items-center justify-center shadow-md border border-border"
        >
          <MapPin className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Nearby Rides */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Nearby Rides</h2>
          <button
            type="button"
            onClick={handleFilterClick}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {filteredRides.map((ride) => {
            const isOwnRide = ride.driverEmail === currentUser.email;
            const request = requests.find(
              (r) => r.rideId === ride.id && r.requesterEmail === currentUser.email
            );
            return (
              <RideCard
                key={ride.id}
                ride={ride}
                request={request}
                onRequest={
                  isOwnRide
                    ? undefined
                    : () => {
                        setSelectedRideId(ride.id);
                        setSeatsToRequest(1);
                      }
                }
              />
            );
          })}

          {filteredRides.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">
              No rides match current filters.
            </p>
          )}
        </div>
      </div>

      {/* Seat Selection Modal */}
      {selectedRideId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-4 border border-b-0 border-border pb-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">How many seats?</h3>
              <button
                onClick={() => setSelectedRideId(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRideId && (
              <>
                <div className="flex gap-2 mb-4">
                  {Array.from(
                    { length: rides.find((r) => r.id === selectedRideId)?.seats || 1 },
                    (_, i) => i + 1
                  ).map((seat) => (
                    <button
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

                <button
                  onClick={async () => {
                    const ride = rides.find((r) => r.id === selectedRideId);
                    const result = await sendRequest(selectedRideId, seatsToRequest);
                    setSelectedRideId(null);
                    if (result.success) {
                      toast.success(
                        `Requested ${seatsToRequest} ${seatsToRequest === 1 ? "seat" : "seats"} from ${ride?.driverName}!`
                      );
                    } else {
                      toast.error(result.message);
                    }
                  }}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Confirm Request
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={() => setShowFilters(false)}
            className="absolute inset-0 bg-black/30"
            aria-label="Close filter sidebar"
          />

          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-card border-l border-border p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-foreground">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground mb-2">Minimum Seats</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Any", value: 0 },
                  { label: "2+", value: 2 },
                  { label: "3+", value: 3 },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setDraftMinSeats(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      draftMinSeats === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-foreground mb-2">Max Price / Seat</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Any", value: null },
                  { label: "<= 150", value: 150 },
                  { label: "<= 200", value: 200 },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setDraftMaxPricePerMile(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      draftMaxPricePerMile === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm"
              >
                Apply Changes
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full bg-secondary text-foreground py-3 rounded-xl font-semibold text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Home;
