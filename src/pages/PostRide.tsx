import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin, Calendar, Clock, Car, IndianRupee, Camera, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { apiRequest } from "@/lib/api";
import { useRideContext } from "@/context/RideContext";
import { useCoinReward } from "@/context/CoinRewardContext";
import {
  fetchPlaceSuggestions,
  getBrowserCurrentLocation,
  getLocationBaseName,
  getLocationInputLabel,
  reverseGeocode,
  type PlaceSuggestion,
} from "@/lib/location";
import { trackEvent } from "@/lib/analytics";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PostRide = () => {
  const navigate = useNavigate();
  const { addRide } = useRideContext();
  const { showCoinReward } = useCoinReward();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumberPlate, setCarNumberPlate] = useState("");
  const [carImageUrl, setCarImageUrl] = useState("");
  const [carImagePreview, setCarImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCurrentLocation, setIsFetchingCurrentLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFrom(getLocationInputLabel(value));
    setFromSuggestions([]);
    setActiveField(null);
  };

  const applyToSuggestion = (value: string) => {
    setTo(getLocationInputLabel(value));
    setToSuggestions([]);
    setActiveField(null);
  };

  const handleUseCurrentLocation = async () => {
    setIsFetchingCurrentLocation(true);

    try {
      const [lat, lon] = await getBrowserCurrentLocation();
      const placeLabel = await reverseGeocode(lat, lon);
      setFrom(getLocationBaseName(placeLabel));
      setFromSuggestions([]);
      setActiveField("from");
      toast.success("Pickup location filled from your live location.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to get your current location.";
      toast.error(message);
    } finally {
      setIsFetchingCurrentLocation(false);
    }
  };

  const toggleDay = (day: string) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB.");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setCarImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, "car");
      setCarImageUrl(imageUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
      setCarImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setCarImageUrl("");
    setCarImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !date || !time || !price || !carModel || !carNumberPlate) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    const result = await addRide({
      carModel,
      carNumberPlate,
      carImageUrl,
      from,
      to,
      date,
      departureTime: time,
      arrivalTime: "",
      pricePerSeat: Number(price),
      seats,
      paymentMethod,
      repeatDays,
    });
    setIsSubmitting(false);

    if (!result.success) {
      trackEvent("post_ride_error", {
        from,
        to,
        date,
        time,
        error: result.message,
      });
      toast.error(result.message);
      return;
    }

    trackEvent("post_ride", {
      from,
      to,
      date,
      time,
      seats,
      price: Number(price),
      car_model: carModel,
      has_repeat: repeatDays.length > 0,
    });
    
    try {
      const walletRes = await apiRequest<{ data: { weeklyEarned: number; weeklyCap: number; daily: { postRewardsUsed: number; postRewardsLimit: number } } }>("/wallet/me");
      
      const willExceedDaily = walletRes.data.daily.postRewardsUsed >= walletRes.data.daily.postRewardsLimit;
      const willExceedWeekly = walletRes.data.weeklyEarned + 20 > walletRes.data.weeklyCap;

      if (willExceedDaily || willExceedWeekly) {
        toast.success("Ride posted successfully");
        navigate("/home");
      } else {
        showCoinReward({
          coins: 20,
          reason: "Coins will be credited to your wallet when a rider joins your ride",
          pending: true,
          onComplete: () => navigate("/home"),
        });
      }
    } catch {
      toast.success("Ride posted successfully");
      navigate("/home");
    }
  };

  return (
    <div className="app-container desktop-premium-page bg-background min-h-screen pb-24 md:pb-8">
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-lime-200/25 blur-3xl" />
      </div>

      <div className="relative px-4 pt-6 md:px-0 md:pt-0 md:max-w-[86rem] md:mx-auto md:min-h-[calc(100vh-9.5rem)]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Post Ride</h1>
        </div>

        <form onSubmit={handlePost} className="flex flex-col gap-4 md:desktop-glass-card md:p-6">
          {/* Route */}
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
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
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isFetchingCurrentLocation}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Use current location"
                  title="Use current location"
                >
                  <MapPin className={`w-4 h-4 ${isFetchingCurrentLocation ? "animate-pulse" : ""}`} />
                </button>
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
                <MapPin className="w-4 h-4 text-muted-foreground" />
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

          {/* Departure */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Departure</label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none min-w-0"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none min-w-0"
                />
              </div>
            </div>
          </div>

          {/* Seats */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Seats Available</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeats(s)}
                  className={`w-12 h-10 rounded-xl text-sm font-semibold transition-colors ${
                    seats === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Car */}
          <div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Price per seat</label>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  step="0.5"
                  placeholder="120"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block mt-3">Car Details</label>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                <Car className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Honda City"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <label className="text-sm font-semibold text-foreground mb-2 block">Number Plate</label>
              <input
                type="text"
                placeholder="PB10AB1234"
                value={carNumberPlate}
                onChange={(e) => setCarNumberPlate(e.target.value.toUpperCase())}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-foreground mb-2 block">Car Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              {carImagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img
                    src={carImagePreview}
                    alt="Car preview"
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 bg-card border border-border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Camera className="w-6 h-6 text-primary" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">
                      {isUploadingImage ? "Uploading..." : "Take photo or choose from gallery"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Max 10MB</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">🔁 Repeat</label>
            <div className="flex gap-2 flex-wrap">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold transition-colors ${
                    repeatDays.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Payment Method</label>
            <div className="flex gap-2">
              {["Cash", "Cards", "Paypal"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    paymentMethod === method
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-foreground text-card w-full py-4 rounded-2xl font-semibold text-sm mt-4 hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Posting..." : "Post Ride"}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default PostRide;
