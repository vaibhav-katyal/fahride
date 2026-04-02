import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Plus, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import RideCard from "@/components/RideCard";
import { useRideContext } from "@/context/RideContext";
import { fetchPlaceSuggestions, type PlaceSuggestion } from "@/lib/location";
import { toast } from "sonner";

const SearchRide = () => {
  const navigate = useNavigate();
  const { rides, sendRequest, requests, currentUser } = useRideContext();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedMinSeats, setAppliedMinSeats] = useState(0);
  const [appliedMaxPricePerMile, setAppliedMaxPricePerMile] = useState<number | null>(null);
  const [draftMinSeats, setDraftMinSeats] = useState(0);
  const [draftMaxPricePerMile, setDraftMaxPricePerMile] = useState<number | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [seatsToRequest, setSeatsToRequest] = useState(1);

  useEffect(() => {
    if (from.trim().length < 3) {
      setFromSuggestions([]);
      setIsSearchingFrom(false);
      return;
    }

    setIsSearchingFrom(true);
    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await fetchPlaceSuggestions(from);
        setFromSuggestions(suggestions);
      } catch {
        setFromSuggestions([]);
      } finally {
        setIsSearchingFrom(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [from]);

  useEffect(() => {
    if (to.trim().length < 3) {
      setToSuggestions([]);
      setIsSearchingTo(false);
      return;
    }

    setIsSearchingTo(true);
    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await fetchPlaceSuggestions(to);
        setToSuggestions(suggestions);
      } catch {
        setToSuggestions([]);
      } finally {
        setIsSearchingTo(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [to]);

  const applyFromSuggestion = (value: string) => {
    setFrom(value);
    setFromSuggestions([]);
    setActiveField(null);
  };

  const applyToSuggestion = (value: string) => {
    setTo(value);
    setToSuggestions([]);
    setActiveField(null);
  };

  const filteredRides = rides.filter((r) => {
    const matchFrom = !from || r.from.toLowerCase().includes(from.toLowerCase());
    const matchTo = !to || r.to.toLowerCase().includes(to.toLowerCase());
    const priceValue = Number.parseFloat(r.pricePerSeat.replace(/[^\d.]/g, ""));
    const seatMatch = appliedMinSeats === 0 || r.seats >= appliedMinSeats;
    const priceMatch = appliedMaxPricePerMile === null || priceValue <= appliedMaxPricePerMile;
    return matchFrom && matchTo && seatMatch && priceMatch;
  });

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
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Search</h1>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <input
                type="text"
                placeholder="Pickup location"
                value={from}
                onFocus={() => setActiveField("from")}
                onChange={(e) => setFrom(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>

            {activeField === "from" && (isSearchingFrom || fromSuggestions.length > 0) && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {isSearchingFrom && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Searching locations...</p>
                )}
                {!isSearchingFrom && fromSuggestions.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No location found</p>
                )}
                {!isSearchingFrom &&
                  fromSuggestions.map((item) => (
                    <button
                      key={item.place_id}
                      type="button"
                      onClick={() => applyFromSuggestion(item.display_name)}
                      className="w-full border-b border-border last:border-b-0 px-3 py-2 text-left text-xs text-foreground hover:bg-secondary"
                    >
                      {item.display_name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full border-2 border-foreground" />
              <input
                type="text"
                placeholder="Drop-off location"
                value={to}
                onFocus={() => setActiveField("to")}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>

            {activeField === "to" && (isSearchingTo || toSuggestions.length > 0) && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {isSearchingTo && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Searching locations...</p>
                )}
                {!isSearchingTo && toSuggestions.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No location found</p>
                )}
                {!isSearchingTo &&
                  toSuggestions.map((item) => (
                    <button
                      key={item.place_id}
                      type="button"
                      onClick={() => applyToSuggestion(item.display_name)}
                      className="w-full border-b border-border last:border-b-0 px-3 py-2 text-left text-xs text-foreground hover:bg-secondary"
                    >
                      {item.display_name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Available Rides</h2>
          <button
            type="button"
            onClick={handleFilterClick}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {filteredRides.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No rides found. Try different locations.</p>
          ) : (
            filteredRides.map((ride) => {
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
            })
          )}
        </div>
      </div>

      {/* Seat Selection Modal */}
      {selectedRideId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-4 border border-b-0 border-border">
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

export default SearchRide;
