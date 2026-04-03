import { useNavigate } from "react-router-dom";
import { Car, LogOut, User, Mail, Phone, Pencil, BookOpenCheck, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useRideContext } from "@/context/RideContext";
import { logoutFromServer } from "@/lib/auth";

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, rides, requests } = useRideContext();
  const currentUserId = (currentUser as { id?: string }).id;

  const myPostedRides = rides.filter(
    (r) => (currentUserId && r.ownerId === currentUserId) || r.driverEmail === currentUser.email
  );
  const myRequests = requests.filter(
    (r) => (currentUserId && r.requesterId === currentUserId) || r.requesterEmail === currentUser.email
  );
  const myBookedRides = myRequests.filter((r) => r.status !== "rejected");

  const handleLogout = async () => {
    await logoutFromServer();
    navigate("/");
  };

  return (
    <div className="app-container desktop-premium-page bg-background min-h-screen pb-24 px-4 pt-6 md:pb-8 md:px-0 md:pt-32">
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative md:max-w-[86rem] md:mx-auto md:min-h-[calc(100vh-8.6rem)] md:grid md:grid-cols-12 md:gap-4 md:content-start">
      <section className="mb-1 md:col-span-12 rounded-2xl border border-border/70 bg-gradient-to-r from-card/85 via-card/70 to-card/60 px-4 py-3 backdrop-blur-xl md:px-5 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Profile</h1>
            <p className="text-xs text-muted-foreground md:text-sm">Manage your account and ride activity</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {myPostedRides.length} offered
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {myBookedRides.length} booked
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/75 p-4 md:col-span-4 md:h-fit md:sticky md:top-24 md:p-5 md:backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-[0_10px_30px_rgba(34,197,94,0.22)]">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{currentUser.name || "Student"}</h2>
          <p className="text-sm text-muted-foreground text-center break-all">{currentUser.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-xl p-3 border border-border text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg font-bold text-foreground">{myPostedRides.length}</p>
            <p className="text-xs text-muted-foreground">Offered Rides</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg font-bold text-foreground">{myBookedRides.length}</p>
            <p className="text-xs text-muted-foreground">Booked Rides</p>
          </div>
        </div>

      </section>

      <section className="mt-3 rounded-3xl border border-border/70 bg-card/75 p-4 md:col-span-8 md:mt-0 md:p-6 md:backdrop-blur-xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account Actions</p>
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:items-start">
        <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium text-foreground break-all">{currentUser.email}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Phone className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="text-sm font-medium text-foreground">{currentUser.phone || "Not added"}</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/my-rides")}
          className="group bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Car className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">My Rides</p>
            <p className="text-sm font-medium text-foreground">{myPostedRides.length} rides offered by me</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => navigate("/my-bookings")}
          className="group bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <BookOpenCheck className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Booked Rides</p>
            <p className="text-sm font-medium text-foreground">{myBookedRides.length} rides joined by me</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="group bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Pencil className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Edit Profile</p>
            <p className="text-sm font-medium text-foreground">Update personal details</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive rounded-xl py-3 font-semibold text-sm hover:bg-destructive/20 transition-all hover:-translate-y-0.5 hover:shadow-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
      </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
