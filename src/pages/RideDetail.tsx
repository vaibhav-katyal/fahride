import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Users,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  X,
} from "lucide-react";
import Chat from "@/components/Chat";
import BottomNav from "@/components/BottomNav";
import LiveRideMap from "@/components/LiveRideMap";
import { useRideContext } from "@/context/RideContext";
import { getCurrentUser } from "@/lib/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { apiRequest, ApiError } from "@/lib/api";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { getRideAvailabilityState, formatRideDate } from "@/lib/rideStatus";
import { toast } from "sonner";

type DriverReview = {
  id: string;
  rating: number | null;
  comment: string;
  createdAt: string;
  rideFrom: string;
  rideTo: string;
  authorName: string;
  authorBranch: string;
  authorYear: string;
};

const RideDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { rides, requests, currentUser, sendRequest, getRequestForRide, updateRide, deleteRide, cancelBooking, approveRequest, rejectRequest } = useRideContext();

  const [request, setRequest] = useState<ReturnType<typeof getRequestForRide>>(undefined);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [seatsToRequest, setSeatsToRequest] = useState(1);
  const [isEditingRide, setIsEditingRide] = useState(false);
  const [isSavingRide, setIsSavingRide] = useState(false);
  const [isDeletingRide, setIsDeletingRide] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isLoadingDriverReviews, setIsLoadingDriverReviews] = useState(false);
  const [driverReviewsError, setDriverReviewsError] = useState("");
  const [driverReviews, setDriverReviews] = useState<DriverReview[]>([]);
  const [feedbackKind, setFeedbackKind] = useState<"review" | "report">("review");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");
  const [editRideForm, setEditRideForm] = useState({
    from: "",
    to: "",
    date: "",
    departureTime: "",
    arrivalTime: "",
    pricePerSeat: "",
    seats: "1",
    carModel: "",
    carNumberPlate: "",
    paymentMethod: "Cash",
    repeatDays: "",
    carImageUrl: "",
  });
  const editFileRef = useRef<HTMLInputElement | null>(null);

  const ride = rides.find((r) => r.id === id);
  const isRideOwner = ride?.driverEmail === currentUser.email;
  const availability = ride ? getRideAvailabilityState(ride) : null;
  const requestedRequestId = searchParams.get("requestId");
  const selectedRequest = requestedRequestId
    ? requests.find((r) => r.id === requestedRequestId && r.rideId === id)
    : undefined;

  const fallbackApprovedRequest = isRideOwner
    ? requests.find((r) => r.rideId === id && r.status === "approved")
    : undefined;

  const activeRequest = isRideOwner
    ? selectedRequest || fallbackApprovedRequest
    : selectedRequest || request;

  const canViewMap = isRideOwner || activeRequest?.status === "approved";

  const canSeePhone = isRideOwner || activeRequest?.status === "approved";
  const sessionUser = getCurrentUser();
  const resolvedDriverPhone = ride?.driverPhone || (isRideOwner ? sessionUser?.phone || "" : "");
  const isChatEnabled = isFeatureEnabled("VITE_CHAT_ENABLED", false);

  useEffect(() => {
    if (id) {
      setRequest(getRequestForRide(id));
    }
  }, [id, getRequestForRide]);

  useEffect(() => {
    if (!ride) return;

    setEditRideForm({
      from: ride.from,
      to: ride.to,
      date: ride.date || "",
      departureTime: ride.departureTime,
      arrivalTime: ride.arrivalTime || "",
      pricePerSeat: ride.pricePerSeat.replace(/^₹/, ""),
      seats: String(ride.seats),
      carModel: ride.carModel,
      carNumberPlate: ride.carNumberPlate || "",
      paymentMethod: "Cash",
      repeatDays: "",
      carImageUrl: ride.carImageUrl || "",
    });
  }, [ride]);

  useEffect(() => {
    if (showSeatSelection && availability && !availability.canRequest) {
      setShowSeatSelection(false);
    }
  }, [availability, showSeatSelection]);

  useEffect(() => {
    let active = true;

    const loadDriverReviews = async () => {
      setIsLoadingDriverReviews(true);
      setDriverReviewsError("");

      try {
        let targetOwnerId = ride?.ownerId;
        if (targetOwnerId === "undefined" || targetOwnerId === "null") {
          targetOwnerId = "";
        }

        // Fallback for stale cached ride payloads that may miss ownerId.
        if (!targetOwnerId && id) {
          const rideResponse = await apiRequest<{ success: boolean; data?: { ownerId?: string } }>(
            `/rides/${id}`
          );
          targetOwnerId = rideResponse.data?.ownerId;
          if (targetOwnerId === "undefined" || targetOwnerId === "null") {
            targetOwnerId = "";
          }
        }

        if (!targetOwnerId) {
          if (!active) return;
          setDriverReviews([]);
          return;
        }

        const response = await apiRequest<{ success: boolean; data: DriverReview[] }>(
          `/feedback/users/${targetOwnerId}/reviews`
        );

        if (!active) return;
        setDriverReviews(response.data || []);
      } catch (error) {
        if (!active) return;
        const message = error instanceof ApiError ? error.message : "Failed to load reviews";
        setDriverReviewsError(message);
      } finally {
        if (active) {
          setIsLoadingDriverReviews(false);
        }
      }
    };

    void loadDriverReviews();

    return () => {
      active = false;
    };
  }, [ride?.ownerId, id]);

  if (!ride) {
    return (
      <div className="app-container desktop-premium-page bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Ride not found.</p>
      </div>
    );
  }

  const requestCtaLabel =
    availability?.kind === "last_seat"
      ? "Grab the last seat"
      : availability?.kind === "full"
      ? "Seats full"
      : availability?.kind === "expired"
      ? "Ride ended"
      : "Request This Ride";

  const handleRequest = () => {
    if (isRideOwner) {
      toast.info("You cannot request your own ride.");
      return;
    }

    if (!availability?.canRequest) {
      toast.info(availability?.headline || "This ride is no longer available.");
      return;
    }

    setShowSeatSelection(true);
  };

  const handleConfirmRequest = async () => {
    const result = await sendRequest(ride.id, seatsToRequest);
    setShowSeatSelection(false);
    if (result.success) {
      toast.success(
        `Requested ${seatsToRequest} ${seatsToRequest === 1 ? "seat" : "seats"} from ${ride.driverName}!`
      );
    } else {
      toast.error(result.message);
    }
  };

  const handlePhoneClick = () => {
    if (!canSeePhone) {
      toast.info("Driver number will be visible after your booking is approved.");
      return;
    }

    const dialTarget = resolvedDriverPhone.replace(/[^\d+]/g, "").trim();
    const digitOnly = resolvedDriverPhone.replace(/\D/g, "");
    const whatsappTarget =
      digitOnly.length === 10 ? `91${digitOnly}` : digitOnly.startsWith("0") ? digitOnly.slice(1) : digitOnly;

    if (!dialTarget || !whatsappTarget) {
      toast.error("Phone number is unavailable for this ride.");
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (isDesktop) {
      const whatsappUrl = `https://wa.me/${whatsappTarget}`;
      const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = whatsappUrl;
      }
      return;
    }

    setShowContactOptions(true);
  };

  const handleDialRedirect = () => {
    const dialTarget = resolvedDriverPhone.replace(/[^\d+]/g, "").trim();
    if (!dialTarget) {
      toast.error("Phone number is unavailable for this ride.");
      return;
    }
    setShowContactOptions(false);
    window.location.href = `tel:${dialTarget}`;
  };

  const handleWhatsAppRedirect = () => {
    const digitOnly = resolvedDriverPhone.replace(/\D/g, "");
    const whatsappTarget =
      digitOnly.length === 10 ? `91${digitOnly}` : digitOnly.startsWith("0") ? digitOnly.slice(1) : digitOnly;

    if (!whatsappTarget) {
      toast.error("Phone number is unavailable for this ride.");
      return;
    }

    setShowContactOptions(false);
    const whatsappUrl = `https://wa.me/${whatsappTarget}`;
    const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = whatsappUrl;
    }
  };

  const handleEditCarImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB.");
      return;
    }

    setIsUploadingEditImage(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file, "car");
      setEditRideForm((prev) => ({ ...prev, carImageUrl: imageUrl }));
      toast.success("Car image uploaded successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const handleSaveRide = async () => {
    setIsSavingRide(true);
    try {
      const repeatDays = editRideForm.repeatDays
        .split(",")
        .map((day) => day.trim())
        .filter(Boolean);

      const result = await updateRide(ride.id, {
        from: editRideForm.from.trim(),
        to: editRideForm.to.trim(),
        date: editRideForm.date.trim(),
        departureTime: editRideForm.departureTime.trim(),
        arrivalTime: editRideForm.arrivalTime.trim(),
        pricePerSeat: Number(editRideForm.pricePerSeat),
        seats: Number(editRideForm.seats),
        carModel: editRideForm.carModel.trim(),
        carNumberPlate: editRideForm.carNumberPlate.trim(),
        paymentMethod: editRideForm.paymentMethod.trim(),
        repeatDays,
        carImageUrl: editRideForm.carImageUrl,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Ride updated successfully.");
      setIsEditingRide(false);
    } finally {
      setIsSavingRide(false);
    }
  };

  const handleDeleteRide = async () => {
    const confirmed = window.confirm("Delete this ride permanently?");
    if (!confirmed) return;

    setIsDeletingRide(true);
    try {
      const result = await deleteRide(ride.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Ride deleted.");
      navigate("/my-rides");
    } finally {
      setIsDeletingRide(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackComment.trim()) {
      toast.error("Please add a comment.");
      return;
    }

    if (feedbackKind === "review" && feedbackRating < 1) {
      toast.error("Please select a rating.");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(`/feedback/${ride.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          kind: feedbackKind,
          rating: feedbackKind === "review" ? feedbackRating : undefined,
          comment: feedbackComment.trim(),
        }),
      });

      toast.success(response.message);
      setFeedbackComment("");
      setFeedbackRating(5);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to submit feedback";
      toast.error(message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!request?.id) return;

    setIsCancellingRequest(true);
    try {
      const result = await cancelBooking(request.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setRequest(undefined);
      toast.success(request.status === "pending" ? "Request cancelled." : "Booking cancelled.");
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const result = await approveRequest(requestId);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success("Request approved!");
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const result = await rejectRequest(requestId);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success("Request rejected");
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  const statusColor =
    request?.status === "approved"
      ? "text-primary"
      : request?.status === "rejected"
      ? "text-destructive"
      : "text-yellow-500";

  const StatusIcon =
    request?.status === "approved"
      ? CheckCircle2
      : request?.status === "rejected"
      ? XCircle
      : Loader2;

  return (
    <div className="app-container desktop-premium-page bg-background min-h-screen pb-24 md:pb-10">
      <div className="px-4 pt-6 flex items-center gap-3 mb-4 md:px-0 md:pt-0 md:max-w-[86rem] md:mx-auto">
        <button type="button" onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Ride Details</h1>
      </div>

      <div className="mx-4 md:mx-auto md:max-w-[86rem] md:grid md:grid-cols-12 md:gap-5 md:min-h-[430px]">
      <div className="h-56 md:col-span-7 md:h-full rounded-2xl bg-secondary border border-border overflow-hidden relative mb-4 md:mb-0 md:desktop-glass-card">
        {canViewMap ? (
          <>
            <LiveRideMap
              from={ride.from}
              to={ride.to}
              rideId={ride.id}
              requestId={activeRequest?.id ?? ""}
              isDriver={isRideOwner}
            />

            <div className="absolute left-3 top-3 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground">
              {ride.from} -&gt; {ride.to}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Map available after approval</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border mb-4 md:col-span-5 md:mb-0 md:h-full md:desktop-glass-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold">
              {ride.avatar}
            </div>
            <div>
              <p className="font-bold text-foreground">{ride.driverName}</p>
              <p className="text-xs text-muted-foreground">
                {ride.carModel} {ride.carNumberPlate ? `- ${ride.carNumberPlate}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handlePhoneClick}
              className="bg-primary text-primary-foreground w-10 h-10 rounded-xl flex items-center justify-center"
            >
              <Phone className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-full bg-secondary/60">
              {formatRideDate(ride.date)}
            </div>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-xl p-3 mb-3 flex flex-col gap-2">
          {ride.driverEmail && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Email:</span>
              <p className="text-xs text-foreground break-all">{ride.driverEmail}</p>
            </div>
          )}
          {ride.driverBranch && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Branch:</span>
              <p className="text-xs text-foreground">{ride.driverBranch}</p>
            </div>
          )}
          {ride.driverYear && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Year:</span>
              <p className="text-xs text-foreground">{ride.driverYear}</p>
            </div>
          )}
          {canSeePhone && resolvedDriverPhone ? (
            <div className="flex items-start gap-2 pt-1 border-t border-border">
              <span className="text-[10px] font-semibold text-primary min-w-16">Phone:</span>
              <p className="text-xs text-primary font-semibold">{resolvedDriverPhone}</p>
            </div>
          ) : (
            !isRideOwner && (
              <div className="flex items-start gap-2 pt-1 border-t border-border">
                <span className="text-[10px] font-semibold text-muted-foreground min-w-16">Phone:</span>
                <p className="text-[10px] text-muted-foreground italic">
                  Once ride is accepted, phone number will be visible
                </p>
              </div>
            )
          )}
        </div>

        <div className="mb-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Car image</p>
            {ride.carImageUrl ? (
              <span className="text-[10px] font-medium text-primary">Uploaded</span>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground">No car image</span>
            )}
          </div>
          {ride.carImageUrl ? (
            <div className="relative">
              <img
                src={ride.carImageUrl}
                alt={`${ride.carModel} car preview`}
                className="w-full h-36 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => {
                  setFullImageUrl(ride.carImageUrl);
                  setShowFullImage(true);
                }}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
                title="View full image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border bg-background/60">
              <p className="text-xs text-muted-foreground">Car image will appear here when uploaded.</p>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="flex flex-col items-center mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
            <div className="w-px h-8 bg-border" />
            <div className="w-2.5 h-2.5 rounded-full border-2 border-foreground" />
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{ride.from}</p>
              <span className="text-xs text-muted-foreground">{ride.departureTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{ride.to}</p>
              <span className="text-xs text-muted-foreground">{ride.arrivalTime}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm text-foreground">{ride.pricePerSeat}</p>
              <p className="text-[10px] text-muted-foreground">per seat</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm text-foreground">{ride.seats}</p>
              <p className="text-[10px] text-muted-foreground">seats</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm text-foreground">{ride.eta}</p>
              <p className="text-[10px] text-muted-foreground">ETA</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="mx-4 mb-4 md:mx-auto md:max-w-[86rem] md:mt-5">
        {isRideOwner ? (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm font-semibold text-foreground">This is your ride</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isChatEnabled
                ? activeRequest?.status === "approved"
                  ? `Chat enabled with ${activeRequest.requesterName}.`
                  : "Approve a request from Notifications to unlock chat."
                : "Manage ride requests from Notifications."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingRide((prev) => !prev)}
                className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground"
              >
                {isEditingRide ? "Close editor" : "Edit ride"}
              </button>
              <button
                type="button"
                onClick={handleDeleteRide}
                disabled={isDeletingRide}
                className="flex-1 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive disabled:opacity-60"
              >
                {isDeletingRide ? "Deleting..." : "Delete ride"}
              </button>
            </div>
          </div>
        ) : !request ? (
          <div className="bg-card rounded-2xl p-4 border border-border">
            {availability && availability.kind !== "available" && (
              <div
                className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm ${
                  availability.kind === "last_seat"
                    ? "border-amber-200 bg-amber-50/80 text-amber-900"
                    : "border-rose-200 bg-rose-50/80 text-rose-900"
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.16em] opacity-80">
                  {availability.badgeLabel}
                </span>
                <span className="h-1 w-1 rounded-full bg-current/40" />
                <span>{availability.headline}</span>
              </div>
            )}
            {availability?.kind === "expired" && (
              <p className="mb-3 text-xs text-muted-foreground">{availability.subtext}</p>
            )}
            <button
              type="button"
              onClick={handleRequest}
              disabled={availability ? !availability.canRequest : false}
              className={`w-full rounded-2xl py-4 font-semibold text-sm transition-colors ${
                availability?.canRequest === false
                  ? "cursor-not-allowed border border-border bg-background text-muted-foreground opacity-80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {requestCtaLabel}
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`w-5 h-5 ${statusColor} ${request.status === "pending" ? "animate-spin" : ""}`}
              />
              <div>
                <p className="font-semibold text-sm text-foreground capitalize">Status: {request.status}</p>
                <p className="text-xs text-muted-foreground">
                  {request.status === "pending"
                    ? "Waiting for driver to respond"
                    : request.status === "approved"
                    ? "Booking approved. Contact unlocked."
                    : "Request was declined"}
                </p>
              </div>
            </div>

            {request.status !== "rejected" && (
              <button
                type="button"
                onClick={handleCancelRequest}
                disabled={isCancellingRequest}
                className="mt-4 w-full rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive disabled:opacity-60"
              >
                {isCancellingRequest
                  ? "Cancelling..."
                  : request.status === "pending"
                  ? "Cancel request"
                  : "Cancel booking"}
              </button>
            )}
          </div>
        )}

        {isRideOwner && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Booking Requests</p>
                <p className="text-xs text-muted-foreground">Manage incoming ride requests</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1">
                <Users className="w-4 h-4 text-foreground" />
                <span className="text-xs font-semibold text-foreground">{requests.filter(r => r.rideId === id).length}</span>
              </div>
            </div>

            {requests.filter(r => r.rideId === id).length === 0 ? (
              <p className="text-xs text-muted-foreground">No requests yet for this ride.</p>
            ) : (
              <div className="space-y-2">
                {requests.filter(r => r.rideId === id).map((req) => (
                  <div key={req.id} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{req.requesterName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            req.status === "pending" ? "bg-yellow-500/10 text-yellow-700" :
                            req.status === "approved" ? "bg-primary/10 text-primary" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {req.status === "pending" ? "Pending" : req.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{req.requesterEmail}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-foreground">
                          <Users className="w-3 h-3" />
                          <span>{req.seatsRequested} seats requested</span>
                        </div>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={processingRequestId === req.id}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
                            title="Approve request"
                          >
                            {processingRequestId === req.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={processingRequestId === req.id}
                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-60"
                            title="Reject request"
                          >
                            {processingRequestId === req.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ThumbsDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Driver reviews</p>
            <span className="text-xs text-muted-foreground">{driverReviews.length}</span>
          </div>

          {isLoadingDriverReviews ? (
            <p className="text-xs text-muted-foreground">Loading reviews...</p>
          ) : driverReviewsError ? (
            <p className="text-xs text-destructive">{driverReviewsError}</p>
          ) : driverReviews.length === 0 ? (
            <p className="text-xs text-muted-foreground">No reviews yet for this driver.</p>
          ) : (
            <div className="space-y-2">
              {driverReviews.slice(0, 6).map((review) => (
                <div key={review.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">{review.authorName}</p>
                    <p className="text-xs text-muted-foreground">{review.rating ? `${review.rating}/5` : "-"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {review.authorBranch || "Branch"} {review.authorYear ? `• ${review.authorYear}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{review.comment}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {review.rideFrom && review.rideTo ? `${review.rideFrom} → ${review.rideTo}` : "Ride review"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {isRideOwner && isEditingRide && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Edit ride</p>
                <p className="text-xs text-muted-foreground">Update ride details and car photo.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingRide(false)}
                className="text-xs font-semibold text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={editRideForm.from} onChange={(e) => setEditRideForm((prev) => ({ ...prev, from: e.target.value }))} placeholder="Pickup" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={editRideForm.to} onChange={(e) => setEditRideForm((prev) => ({ ...prev, to: e.target.value }))} placeholder="Drop-off" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" type="date" value={editRideForm.date} onChange={(e) => setEditRideForm((prev) => ({ ...prev, date: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" type="time" value={editRideForm.departureTime} onChange={(e) => setEditRideForm((prev) => ({ ...prev, departureTime: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" type="time" value={editRideForm.arrivalTime} onChange={(e) => setEditRideForm((prev) => ({ ...prev, arrivalTime: e.target.value }))} placeholder="ETA" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" type="number" min="1" value={editRideForm.pricePerSeat} onChange={(e) => setEditRideForm((prev) => ({ ...prev, pricePerSeat: e.target.value }))} placeholder="Price per seat" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" type="number" min="1" max="6" value={editRideForm.seats} onChange={(e) => setEditRideForm((prev) => ({ ...prev, seats: e.target.value }))} placeholder="Seats" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={editRideForm.carModel} onChange={(e) => setEditRideForm((prev) => ({ ...prev, carModel: e.target.value }))} placeholder="Car model" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={editRideForm.carNumberPlate} onChange={(e) => setEditRideForm((prev) => ({ ...prev, carNumberPlate: e.target.value.toUpperCase() }))} placeholder="Number plate" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={editRideForm.paymentMethod} onChange={(e) => setEditRideForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} placeholder="Payment method" />
              <input className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={editRideForm.repeatDays} onChange={(e) => setEditRideForm((prev) => ({ ...prev, repeatDays: e.target.value }))} placeholder="Repeat days comma separated" />
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-border p-3">
              <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditCarImage} className="hidden" />
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Car photo</p>
                  <p className="text-[11px] text-muted-foreground">Upload a fresh image if needed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => editFileRef.current?.click()}
                  disabled={isUploadingEditImage}
                  className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-60"
                >
                  {isUploadingEditImage ? "Uploading..." : "Replace image"}
                </button>
              </div>
              {editRideForm.carImageUrl ? (
                <img src={editRideForm.carImageUrl} alt="Car preview" className="h-36 w-full rounded-lg border border-border object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border bg-background/60">
                  <p className="text-xs text-muted-foreground">No car image uploaded.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSaveRide}
                disabled={isSavingRide}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isSavingRide ? "Saving..." : "Save ride"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingRide(false)}
                className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isRideOwner && request && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedbackKind("review")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  feedbackKind === "review" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                Review
              </button>
              <button
                type="button"
                onClick={() => setFeedbackKind("report")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  feedbackKind === "report" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"
                }`}
              >
                Report
              </button>
            </div>

            {feedbackKind === "review" && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate your ride</p>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackRating(value)}
                      className={`h-10 w-10 rounded-xl border text-sm font-semibold ${
                        feedbackRating === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder={feedbackKind === "review" ? "Write a short review" : "Tell us what went wrong"}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            />

            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={isSubmittingFeedback}
              className={`mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
                feedbackKind === "review"
                  ? "bg-primary text-primary-foreground"
                  : "bg-destructive text-destructive-foreground"
              }`}
            >
              {isSubmittingFeedback
                ? "Submitting..."
                : feedbackKind === "review"
                ? "Submit review"
                : "Submit report"}
            </button>
          </div>
        )}
      </div>

      {showSeatSelection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center md:p-6">
          <div className="w-full bg-card rounded-t-3xl p-6 border border-t border-border pb-24 md:max-w-lg md:rounded-3xl md:pb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 text-center">How many seats?</h2>
            <div className="flex gap-2 mb-6">
              {Array.from({ length: ride.seats }, (_, i) => i + 1).map((seat) => (
                <button
                  type="button"
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSeatSelection(false)}
                className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactOptions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:hidden">
          <div className="w-full rounded-t-3xl border border-b-0 border-border bg-card p-5 pb-8">
            <p className="text-base font-bold text-foreground">Contact {ride.driverName}</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose how you want to connect</p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleDialRedirect}
                className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground"
              >
                Call via Phone Dialer
              </button>
              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                Open WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setShowContactOptions(false)}
                className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={fullImageUrl}
              alt="Full car view"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {isChatEnabled && id && (
        <div className="mx-4 h-96 md:mx-auto md:max-w-[86rem] md:h-[420px]">
          {activeRequest?.status === "approved" && activeRequest.id ? (
            <Chat
              rideId={id}
              requestId={activeRequest.id}
              driverName={ride.driverName}
              riderName={activeRequest.requesterName || "Rider"}
              driverEmail={ride.driverEmail || ""}
              riderEmail={activeRequest.requesterEmail || ""}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center backdrop-blur-xl">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Chat is locked for now</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chat will appear here once the ride is accepted.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default RideDetail;