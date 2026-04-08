import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import HomeLiveMap from "@/components/HomeLiveMap";
import RideCard from "@/components/RideCard";
import WhatsAppCommunityButton from "@/components/WhatsAppCommunityButton";
import { useRideContext } from "@/context/RideContext";
import { reverseGeocode, geocodeLocationName, haversineDistanceKm } from "@/lib/location";
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
  const [desktopSplit, setDesktopSplit] = useState(66);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const rideCoordinatesRef = useRef<Map<string, Coordinate>>(new Map());
  const [, setGeocodingTrigger] = useState(0); // Trigger re-renders when coords are cached

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

    // Distance filter: only show rides within 5km of current location
    let distanceMatch = true;
    if (currentLocation && rideCoordinatesRef.current.has(ride.id)) {
      const rideCoords = rideCoordinatesRef.current.get(ride.id);
      if (rideCoords) {
        const distance = haversineDistanceKm(currentLocation, rideCoords);
        distanceMatch = distance <= 5; // 5km radius
      }
    }

    return seatMatch && priceMatch && distanceMatch;
  });

  // Geocode ride starting locations asynchronously
  useEffect(() => {
    const geocodeRides = async () => {
      for (const ride of rides) {
        // Skip if already cached
        if (rideCoordinatesRef.current.has(ride.id)) continue;

        try {
          const coords = await geocodeLocationName(ride.from);
          rideCoordinatesRef.current.set(ride.id, coords);
          // Trigger re-render to update filtered rides
          setGeocodingTrigger((prev) => prev + 1);
        } catch {
          // Silently fail for rides we can't geocode
        }
      }
    };

    void geocodeRides();
  }, [rides]);

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

  const activeFilterCount = Number(appliedMinSeats > 0) + Number(appliedMaxPricePerMile !== null);
  const showTwoColumnRides = desktopSplit <= 58;

  useEffect(() => {
    if (!isDraggingSplit) return;

    const clampSplit = (value: number) => Math.min(78, Math.max(44, value));

    const handleMouseMove = (event: MouseEvent) => {
      if (window.innerWidth < 768) return;

      const sidePadding = window.innerWidth >= 1024 ? 40 : 32;
      const usableWidth = Math.max(420, window.innerWidth - sidePadding * 2);
      const nextValue = ((event.clientX - sidePadding) / usableWidth) * 100;
      setDesktopSplit(clampSplit(nextValue));
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSplit]);

  const handleDividerKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setDesktopSplit((prev) => Math.max(44, prev - 2));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setDesktopSplit((prev) => Math.min(78, prev + 2));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setDesktopSplit(44);
    }

    if (event.key === "End") {
      event.preventDefault();
      setDesktopSplit(78);
    }
  };

  return (
    <div className="app-container bg-background min-h-screen pb-24 md:max-w-none md:mx-0 md:h-screen md:overflow-hidden md:px-8 md:pt-24 md:pb-6 lg:px-10">
      <div className="fixed right-4 top-4 z-40 md:hidden">
        <WhatsAppCommunityButton compact className="rounded-full px-4 py-2 text-[11px] shadow-[0_14px_34px_rgba(22,163,74,0.38)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute left-[-140px] top-[-200px] h-[460px] w-[460px] rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute right-[-160px] top-[-90px] h-[390px] w-[390px] rounded-full bg-teal-200/35 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[28%] h-[460px] w-[460px] rounded-full bg-lime-100/30 blur-3xl" />
      </div>

      <div className="relative z-[1] md:grid md:h-[calc(100vh-8.5rem)] md:grid-cols-12 md:grid-rows-[auto,minmax(0,1fr)] md:gap-6 lg:gap-8">
        <section className="hidden md:col-span-12 md:flex md:items-center md:justify-between md:rounded-3xl md:border md:border-white/70 md:bg-white/65 md:px-6 md:py-4 md:shadow-[0_22px_48px_rgba(15,23,42,0.12)] md:backdrop-blur-2xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Live Commute Deck</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Hey {currentUser.name}, your ride grid is live</h1>
            <p className="mt-1 text-sm text-slate-600">Scan traffic, compare nearby seats, and jump in before prices spike.</p>
          </div>

          <div className="flex items-center gap-3">
            <WhatsAppCommunityButton compact className="rounded-2xl px-5 py-3 text-xs uppercase tracking-[0.08em]" />
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="rounded-2xl border border-emerald-100 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm"
            >
              Explore Routes
            </button>
            <button
              type="button"
              onClick={handleFilterClick}
              className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white"
            >
              Tune Filters
            </button>
          </div>
        </section>

        <section
          className="md:col-span-12 md:row-start-2 md:flex md:min-h-0 md:items-stretch md:gap-2 lg:gap-3"
          style={{ ["--desktop-split" as string]: `${desktopSplit}%` }}
        >
          {/* Live map view */}
          <section className="w-full md:flex md:min-h-0 md:w-[var(--desktop-split)] md:flex-col md:gap-4">
            <div className="relative h-64 overflow-hidden bg-secondary md:h-[52vh] md:min-h-[380px] md:rounded-[28px] md:border md:border-border/70 md:shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
              <HomeLiveMap 
                currentLocation={currentLocation} 
                locationLabel={locationLabel} 
                isLocating={isLocating}
                filteredRides={filteredRides}
                rideCoordinates={rideCoordinatesRef.current}
                currentUser={currentUser}
              />

              <div className="absolute bottom-4 left-4 right-16 z-[4] md:bottom-6 md:left-6 md:right-24">
                <button
                  onClick={() => navigate("/search")}
                  className="w-full bg-card rounded-xl px-4 py-3 flex items-center gap-3 shadow-md border border-border md:rounded-2xl md:px-5 md:py-4"
                >
                  <Search className="w-4 h-4 text-muted-foreground md:h-5 md:w-5" />
                  <span className="text-sm text-muted-foreground md:text-base">Where are you going?</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleLocationClick}
                className="absolute bottom-4 right-4 z-[4] bg-card w-10 h-10 rounded-xl flex items-center justify-center shadow-md border border-border md:bottom-6 md:right-6 md:h-12 md:w-12 md:rounded-2xl"
              >
                <MapPin className="w-4 h-4 text-foreground md:h-5 md:w-5" />
              </button>

              <div className="pointer-events-none absolute right-6 top-6 z-[4] hidden rounded-2xl border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 shadow-lg backdrop-blur-xl md:block">
                Live Ride Radar
              </div>
            </div>

            <div className="hidden rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.1)] backdrop-blur-2xl md:grid md:grid-cols-3 md:gap-4">
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Available rides</p>
                <p className="mt-1 text-2xl font-bold leading-none">{filteredRides.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Filter status</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{activeFilterCount > 0 ? `${activeFilterCount} active` : "All open"}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Location mode</p>
                <p className="mt-1 text-lg font-bold text-emerald-900">{isLocating ? "Syncing" : "Live locked"}</p>
              </div>
            </div>
          </section>

          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              setIsDraggingSplit(true);
            }}
            onKeyDown={handleDividerKeyboard}
            onDoubleClick={() => setDesktopSplit(66)}
            className="hidden cursor-col-resize select-none rounded-full border border-white/80 bg-white/80 p-1 shadow-md transition-colors hover:bg-white md:flex md:w-3 md:items-center md:justify-center"
            role="separator"
            aria-label="Resize map and ride panels"
            aria-orientation="vertical"
            aria-valuemin={44}
            aria-valuemax={78}
            aria-valuenow={Math.round(desktopSplit)}
          >
            <span className={`h-14 w-1 rounded-full bg-slate-400 ${isDraggingSplit ? "bg-slate-700" : ""}`} />
          </button>

          {/* Nearby Rides */}
          <section className="w-full px-4 pt-6 md:flex md:min-h-0 md:w-[calc(100%-var(--desktop-split))] md:flex-col md:rounded-[28px] md:border md:border-border/70 md:bg-card/75 md:px-4 md:pt-4 md:pb-4 md:shadow-[0_24px_54px_rgba(15,23,42,0.09)] md:backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between md:mb-4 md:border-b md:border-border/70 md:pb-3">
              <h2 className="text-lg font-bold text-foreground md:text-xl">Nearby Rides</h2>
              <button
                type="button"
                onClick={handleFilterClick}
                className="flex items-center gap-1 text-xs text-muted-foreground md:rounded-full md:border md:border-border md:bg-background/80 md:px-3 md:py-1.5 md:text-[11px] md:font-semibold md:uppercase md:tracking-[0.12em]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div
              className={`md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1 ${
                showTwoColumnRides ? "flex flex-col gap-4 md:grid md:grid-cols-2" : "flex flex-col gap-4"
              }`}
            >
              {/* Show skeleton loaders while location is syncing */}
              {isLocating ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded w-24" />
                            <div className="h-2.5 bg-muted rounded w-32" />
                          </div>
                        </div>
                        <div className="h-6 bg-muted rounded px-2 w-16" />
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="h-2.5 bg-muted rounded w-full" />
                        <div className="h-2.5 bg-muted rounded w-5/6" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-8 bg-muted rounded flex-1" />
                        <div className="h-8 bg-muted rounded w-20" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
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
                        isOwnRide={isOwnRide}
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
                    <p className="py-6 text-center text-sm text-muted-foreground md:rounded-xl md:border md:border-dashed md:border-border md:bg-card/60 md:col-span-2">
                      No rides match current filters.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </section>
      </div>

      {/* Seat Selection Modal */}
      {selectedRideId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center md:p-6">
          <div className="w-full rounded-t-2xl border border-b-0 border-border bg-card p-4 pb-24 md:max-w-md md:rounded-2xl md:border md:pb-6 md:shadow-2xl">
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

          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col border-l border-border bg-card p-5 md:right-8 md:top-8 md:h-auto md:max-h-[calc(100vh-4rem)] md:w-full md:rounded-2xl md:border md:shadow-2xl">
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
