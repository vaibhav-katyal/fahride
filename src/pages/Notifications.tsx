import { ArrowLeft, Bell, CheckCheck, CircleAlert, MessageCircle, Ticket, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useRideContext } from "@/context/RideContext";
import { toast } from "sonner";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, requests, markNotificationRead, approveRequest, rejectRequest, deleteAllNotifications } = useRideContext();
  const [actioningNotificationId, setActioningNotificationId] = useState<string | null>(null);
  const [resolvedActions, setResolvedActions] = useState<Record<string, "approved" | "rejected">>({});
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const result = await deleteAllNotifications();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsClearing(false);
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const getIcon = (kind: string) => {
    switch (kind) {
      case "request_sent":
        return MessageCircle;
      case "request_approved":
        return CheckCheck;
      case "request_rejected":
      case "ride_deleted":
        return CircleAlert;
      default:
        return Ticket;
    }
  };

  const getRequestIdFromLink = (link: string) => {
    try {
      const parsed = new URL(link, window.location.origin);
      return parsed.searchParams.get("requestId") || "";
    } catch {
      return "";
    }
  };

  const handleOpenNotification = async (item: { id: string; link: string }) => {
    const result = await markNotificationRead(item.id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    navigate(item.link);
  };

  return (
    <div className="app-container desktop-premium-page bg-background min-h-screen pb-24 md:pb-8">
      <div className="relative px-4 pt-6 md:px-0 md:pt-0 md:max-w-[86rem] md:mx-auto md:min-h-[calc(100vh-9.5rem)] md:flex md:flex-col">
        <div className="flex items-center justify-between gap-3 mb-6 md:mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-foreground" aria-label="Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors text-xs font-semibold disabled:opacity-50"
                title="Clear all notifications"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </>
                )}
              </button>
            )}
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {unreadCount} unread
            </span>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-card/80 py-16 text-center md:flex-1 md:flex md:flex-col md:items-center md:justify-center md:backdrop-blur-xl">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/70 bg-card/65 p-4 md:p-5 md:flex-1 md:overflow-hidden md:backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:grid md:h-full md:grid-cols-2 md:items-start md:content-start md:overflow-y-auto md:pr-1">
              {notifications.map((item) => {
                const localResolution = resolvedActions[item.id];
                const requestId = item.kind === "request_sent" ? getRequestIdFromLink(item.link) : "";
                const linkedRequest = requestId ? requests.find((req) => req.id === requestId) : undefined;
                const persistedResolution =
                  linkedRequest?.status === "approved"
                    ? "approved"
                    : linkedRequest?.status === "rejected"
                    ? "rejected"
                    : linkedRequest?.status === "pending"
                    ? null
                    : item.kind === "request_sent" && requestId
                    ? "resolved"
                    : null;
                const effectiveResolution = localResolution || persistedResolution;
                const effectiveKind =
                  effectiveResolution === "approved"
                    ? "request_approved"
                    : effectiveResolution === "rejected"
                    ? "request_rejected"
                    : item.kind;
                const Icon = getIcon(effectiveKind);
                const canModerateRequest =
                  item.kind === "request_sent" && Boolean(requestId) && linkedRequest?.status === "pending" && !localResolution;
                const isActioning = actioningNotificationId === item.id;
                const title =
                  effectiveResolution === "approved"
                    ? "Ride request approved"
                    : effectiveResolution === "rejected"
                    ? "Ride request rejected"
                    : effectiveResolution === "resolved"
                    ? "Ride request resolved"
                    : item.title;
                const body =
                  effectiveResolution === "approved"
                    ? "You approved this request from notifications."
                    : effectiveResolution === "rejected"
                    ? "You rejected this request from notifications."
                    : effectiveResolution === "resolved"
                    ? "This request is no longer pending."
                    : item.body;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      void handleOpenNotification(item);
                    }}
                    className={`rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      item.isRead ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                    } cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-secondary p-2 text-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{title}</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {effectiveResolution ? (
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            effectiveResolution === "approved"
                              ? "bg-primary/10 text-primary"
                              : effectiveResolution === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {effectiveResolution === "approved"
                            ? "Accepted"
                            : effectiveResolution === "rejected"
                            ? "Rejected"
                            : "Resolved"}
                        </span>
                      ) : !item.isRead ? (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                          New
                        </span>
                      ) : null}
                    </div>

                    {!effectiveResolution && <div className="mt-4 flex gap-2">
                      {canModerateRequest && (
                        <>
                          <button
                            type="button"
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (!requestId) return;
                              setActioningNotificationId(item.id);
                              try {
                                const result = await approveRequest(requestId);
                                if (!result.success) {
                                  toast.error(result.message);
                                  return;
                                }

                                await markNotificationRead(item.id);
                                setResolvedActions((prev) => ({ ...prev, [item.id]: "approved" }));
                                toast.success("Request approved");
                              } finally {
                                setActioningNotificationId(null);
                              }
                            }}
                            disabled={isActioning}
                            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                          >
                            {isActioning ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Accept"}
                          </button>

                          <button
                            type="button"
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (!requestId) return;
                              setActioningNotificationId(item.id);
                              try {
                                const result = await rejectRequest(requestId);
                                if (!result.success) {
                                  toast.error(result.message);
                                  return;
                                }

                                await markNotificationRead(item.id);
                                setResolvedActions((prev) => ({ ...prev, [item.id]: "rejected" }));
                                toast.success("Request rejected");
                              } finally {
                                setActioningNotificationId(null);
                              }
                            }}
                            disabled={isActioning}
                            className="flex-1 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          await handleOpenNotification(item);
                        }}
                        className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground"
                      >
                        Open
                      </button>
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            const result = await markNotificationRead(item.id);
                            if (!result.success) {
                              toast.error(result.message);
                              return;
                            }
                            toast.success("Marked as read");
                          }}
                          className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground"
                        >
                          Mark read
                        </button>
                      )}
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
