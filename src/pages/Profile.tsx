import { useNavigate } from "react-router-dom";
import { Car, LogOut, User, Mail, Phone, Pencil, BookOpenCheck, ChevronRight, Camera, Star, Flag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import WhatsAppCommunityButton from "@/components/WhatsAppCommunityButton";
import { useRideContext } from "@/context/RideContext";
import { logoutFromServer, setCurrentUserFromAccount } from "@/lib/auth";
import { ApiError, apiRequest } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

type ProfileFeedbackItem = {
  id: string;
  rideId: string;
  rideFrom: string;
  rideTo: string;
  kind: "review" | "report";
  rating: number | null;
  comment: string;
  createdAt: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, rides, requests } = useRideContext();
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [myFeedback, setMyFeedback] = useState<{
    received: ProfileFeedbackItem[];
    given: ProfileFeedbackItem[];
  }>({
    received: [],
    given: [],
  });
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || "",
    phone: currentUser.phone || "",
    branch: currentUser.branch || "",
    year: currentUser.year || "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = (currentUser as { id?: string }).id;

  useEffect(() => {
    setProfileForm({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      branch: currentUser.branch || "",
      year: currentUser.year || "",
    });
  }, [currentUser.name, currentUser.phone, currentUser.branch, currentUser.year]);

  useEffect(() => {
    let isActive = true;

    const loadFeedback = async () => {
      if (!currentUserId) return;

      setIsLoadingFeedback(true);
      setFeedbackError("");

      try {
        const response = await apiRequest<{
          success: boolean;
          data: {
            received: ProfileFeedbackItem[];
            given: ProfileFeedbackItem[];
          };
        }>("/feedback/mine");

        if (!isActive) return;
        setMyFeedback(response.data);
      } catch (error) {
        if (!isActive) return;
        const message = error instanceof ApiError ? error.message : "Failed to load feedback";
        setFeedbackError(message);
      } finally {
        if (isActive) {
          setIsLoadingFeedback(false);
        }
      }
    };

    loadFeedback();

    return () => {
      isActive = false;
    };
  }, [currentUserId]);

  const myPostedRides = rides.filter(
    (r) => (currentUserId && r.ownerId === currentUserId) || r.driverEmail === currentUser.email
  );
  const myRequests = requests.filter(
    (r) => (currentUserId && r.requesterId === currentUserId) || r.requesterEmail === currentUser.email
  );
  const myBookedRides = myRequests.filter((r) => r.status !== "rejected");
  const reviewCount = myFeedback.received.filter((item) => item.kind === "review").length;
  const reportCount = myFeedback.received.filter((item) => item.kind === "report").length;

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-xs text-muted-foreground">No rating</span>;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`h-3.5 w-3.5 ${index < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
    );
  };

  const feedbackGroups = [
    {
      title: "Reviews about you",
      icon: Star,
      items: myFeedback.received.filter((item) => item.kind === "review"),
      emptyText: "No reviews yet.",
    },
    {
      title: "Reports about you",
      icon: Flag,
      items: myFeedback.received.filter((item) => item.kind === "report"),
      emptyText: "No reports found.",
    },
  ];

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingProfileImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, "profile");
      setCurrentUserFromAccount({ ...currentUser, profileImageUrl: imageUrl });
      toast.success("Profile picture updated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileForm.name.trim() || !profileForm.phone.trim() || !profileForm.branch.trim() || !profileForm.year.trim()) {
      toast.error("Please fill in all profile fields.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await apiRequest<{ success: boolean; data: { user: typeof currentUser } }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          branch: profileForm.branch.trim(),
          year: profileForm.year.trim(),
        }),
      });

      setCurrentUserFromAccount(response.data.user);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <WhatsAppCommunityButton compact className="rounded-lg px-3 py-2 text-[11px] md:text-xs" />
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 md:inline-flex">
              {myPostedRides.length} offered
            </span>
            <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 md:inline-flex">
              {myBookedRides.length} booked
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/75 p-4 md:col-span-4 md:h-fit md:sticky md:top-24 md:p-5 md:backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingProfileImage}
            className="mb-3 relative group"
          >
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-[0_10px_30px_rgba(34,197,94,0.22)] overflow-hidden">
              {(currentUser as any)?.profileImageUrl ? (
                <img
                  src={(currentUser as any).profileImageUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3" />
            </div>
          </button>
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

        <div className="mt-4 rounded-2xl border border-border bg-background/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Community feedback</p>
              <p className="text-xs text-muted-foreground">Reviews and reports linked to your account.</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{reviewCount} reviews</p>
              <p>{reportCount} reports</p>
            </div>
          </div>

          {isLoadingFeedback ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              Loading feedback...
            </div>
          ) : feedbackError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-5 text-sm text-destructive">
              {feedbackError}
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackGroups.map((group) => (
                <div key={group.title} className="rounded-xl border border-border p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">{group.title}</p>
                    <span className="ml-auto text-xs text-muted-foreground">{group.items.length}</span>
                  </div>

                  {group.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{group.emptyText}</p>
                  ) : (
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="rounded-lg bg-card p-3 text-left border border-border/70">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              {item.rideFrom && item.rideTo ? `${item.rideFrom} → ${item.rideTo}` : "Ride feedback"}
                            </p>
                            {item.kind === "review" ? renderStars(item.rating) : <Flag className="h-3.5 w-3.5 text-destructive" />}
                          </div>
                          <p className="text-sm text-foreground">{item.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
          onClick={() => setIsEditingProfile((prev) => !prev)}
          className="group bg-card rounded-xl p-4 border border-border flex items-center gap-3 text-left hover:bg-secondary transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Pencil className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Edit Profile</p>
            <p className="text-sm font-medium text-foreground">Update personal details</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        {isEditingProfile && (
          <div className="md:col-span-2 rounded-2xl border border-border bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Edit profile</p>
                <p className="text-xs text-muted-foreground">Your changes will update your account immediately.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-xs font-semibold text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              />
              <input
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              />
              <input
                value={profileForm.branch}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, branch: e.target.value }))}
                placeholder="Branch"
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              />
              <input
                value={profileForm.year}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, year: e.target.value }))}
                placeholder="Year"
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isSavingProfile ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
