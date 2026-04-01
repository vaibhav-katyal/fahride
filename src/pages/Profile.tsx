import { useNavigate } from "react-router-dom";
import { Car, LogOut, User, Mail, Phone, Pencil, BookOpenCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useRideContext } from "@/context/RideContext";

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, rides, requests } = useRideContext();

  const myPostedRides = rides.filter(
    (r) => r.driverName === currentUser.name || r.avatar === (currentUser.name || "Y").slice(0, 2).toUpperCase()
  );
  const myRequests = requests.filter((r) => r.requesterEmail === currentUser.email);
  const myBookedRides = myRequests.filter((r) => r.status !== "rejected");

  const handleLogout = () => {
    localStorage.removeItem("easyride_user");
    navigate("/");
  };

  return (
    <div className="app-container bg-background min-h-screen pb-24 px-4 pt-6">
      <h1 className="text-xl font-bold text-foreground mb-8">Profile</h1>

      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{currentUser.name || "Student"}</h2>
        <p className="text-sm text-muted-foreground">{currentUser.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-lg font-bold text-foreground">{myPostedRides.length}</p>
          <p className="text-xs text-muted-foreground">Offered Rides</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <p className="text-lg font-bold text-foreground">{myBookedRides.length}</p>
          <p className="text-xs text-muted-foreground">Booked Rides</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground">{currentUser.email}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
          <Phone className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium text-foreground">{currentUser.phone || "Not added"}</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/my-rides")}
          className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-colors"
        >
          <Car className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">My Rides</p>
            <p className="text-sm font-medium text-foreground">{myPostedRides.length} rides offered by me</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/my-bookings")}
          className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-colors"
        >
          <BookOpenCheck className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Booked Rides</p>
            <p className="text-sm font-medium text-foreground">{myBookedRides.length} rides joined by me</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-colors"
        >
          <Pencil className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Edit Profile</p>
            <p className="text-sm font-medium text-foreground">Update personal details</p>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center justify-center gap-2 bg-destructive/10 text-destructive rounded-xl py-3 font-semibold text-sm hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
