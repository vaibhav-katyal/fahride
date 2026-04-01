import { useState, useRef } from "react";
import { ArrowLeft, MapPin, Calendar, Clock, Car, IndianRupee, Camera, X, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { useRideContext } from "@/context/RideContext";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PostRide = () => {
  const navigate = useNavigate();
  const { addRide, currentUser } = useRideContext();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumberPlate, setCarNumberPlate] = useState("");
  const [carImageUrl, setCarImageUrl] = useState("");
  const [carImagePreview, setCarImagePreview] = useState<string | null>(null);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDay = (day: string) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCarImageUrl(base64);
      setCarImagePreview(base64);
      toast.success("Image selected successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCarImageUrl("");
    setCarImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !date || !time || !price || !carModel || !carNumberPlate) {
      toast.error("Please fill in all fields.");
      return;
    }
    const newRide = {
      id: crypto.randomUUID(),
      driverName: currentUser.name || "You",
      driverEmail: currentUser.email || "",
      driverPhone: currentUser.phone || "",
      driverRollNumber: currentUser.rollNumber || "",
      driverBranch: currentUser.branch || "",
      driverYear: currentUser.year || "",
      carModel,
      carNumberPlate,
      carImageUrl,
      from,
      to,
      date,
      departureTime: time,
      arrivalTime: "",
      pricePerSeat: `₹${price}`,
      seats,
      eta: "—",
      avatar: (currentUser.name || "Y").slice(0, 2).toUpperCase(),
    };
    addRide(newRide);
    toast.success("Ride posted successfully!");
    navigate("/home");
  };

  return (
    <div className="app-container bg-background min-h-screen pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Post Ride</h1>
        </div>

        <form onSubmit={handlePost} className="flex flex-col gap-4">
          {/* Route */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <input
                type="text"
                placeholder="Pickup location"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full border-2 border-foreground" />
              <input
                type="text"
                placeholder="Drop-off location"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Departure */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Departure</label>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
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
          <div className="flex gap-3">
            <div className="flex-1">
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
            <div className="flex-1">
              <label className="text-sm font-semibold text-foreground mb-2 block">Car Details</label>
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

          <div className="flex gap-3">
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
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 bg-card border border-border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-secondary transition-colors"
                >
                  <Camera className="w-6 h-6 text-primary" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">Take photo or choose from gallery</p>
                    <p className="text-[10px] text-muted-foreground">Max 5MB</p>
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
            className="bg-foreground text-card w-full py-4 rounded-2xl font-semibold text-sm mt-4 hover:opacity-90 transition-opacity"
          >
            Post Ride
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default PostRide;
