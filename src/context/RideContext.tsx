import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Ride } from "@/components/RideCard";
import {
  AUTH_CHANGED_EVENT,
  getCurrentUser,
  hydrateCurrentUser,
  type UserAccount,
} from "@/lib/auth";
import { ApiError, apiRequest } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { useSocket } from "@/context/SocketContext";

export interface RideRequest {
  id: string;
  rideId: string;
  rideOwnerId?: string;
  rideOwnerEmail?: string;
  rideOwnerName: string;
  requesterId?: string;
  requesterName: string;
  requesterEmail: string;
  seatsRequested: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderName: string;
  senderRole: "requester" | "offerer";
  text: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  kind: "request_sent" | "request_approved" | "request_rejected" | "booking_cancelled" | "ride_deleted";
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface RideContextType {
  rides: Ride[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addRide: (ride: CreateRideInput) => Promise<{ success: boolean; message: string }>;
  updateRide: (
    rideId: string,
    ride: Partial<CreateRideInput>
  ) => Promise<{ success: boolean; message: string }>;
  deleteRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  requests: RideRequest[];
  sendRequest: (
    rideId: string,
    seatsRequested: number
  ) => Promise<{ success: boolean; message: string }>;
  approveRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  rejectRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  cancelBooking: (requestId: string) => Promise<{ success: boolean; message: string }>;
  getRequestForRide: (rideId: string) => RideRequest | undefined;
  getRequestsForMyRides: () => RideRequest[];
  chatMessages: ChatMessage[];
  notifications: NotificationItem[];
  sendMessage: (rideId: string, text: string, senderRole: "requester" | "offerer") => void;
  getMessagesForRide: (rideId: string) => ChatMessage[];
  markNotificationRead: (notificationId: string) => Promise<{ success: boolean; message: string }>;
  deleteAllNotifications: () => Promise<{ success: boolean; message: string }>;
  currentUser: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    branch?: string;
    year?: string;
    organization?: string;
    profileImageUrl?: string;
  };
}

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export interface CreateRideInput {
  from: string;
  to: string;
  date: string;
  departureTime: string;
  arrivalTime?: string;
  seats: number;
  pricePerSeat: number;
  carModel: string;
  carNumberPlate: string;
  carImageUrl?: string;
  paymentMethod?: string;
  repeatDays?: string[];
}

const RideContext = createContext<RideContextType | null>(null);

export const useRideContext = () => {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRideContext must be used within RideProvider");
  return ctx;
};

export const RideProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocket();
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const refreshInFlightRef = useRef(false);

  const guestUser: UserAccount = {
    name: "Student",
    email: "student@chitkara.edu.in",
    phone: "",
    branch: "",
    year: "",
  };

  const [currentUser, setCurrentUser] = useState<UserAccount>(getCurrentUser() || guestUser);

  const mergeRequests = useCallback((incoming: RideRequest[]) => {
    const map = new Map<string, RideRequest>();
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  const refreshData = useCallback(async () => {
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    setIsLoading(true);
    try {
      let activeUser = currentUser;

      // Resolve current user before firing protected requests.
      if (!activeUser?.id) {
        const hydratedUser = await hydrateCurrentUser();
        if (hydratedUser) {
          activeUser = hydratedUser;
          setCurrentUser(hydratedUser);
        }
      }

      if (!activeUser?.id) {
        setRides([]);
        setRequests([]);
        setNotifications([]);
        return;
      }

      const [allRidesResult, incomingResult, mineResult, notificationResult] = await Promise.allSettled([
        apiRequest<ApiResponse<Ride[]>>("/rides"),
        apiRequest<ApiResponse<RideRequest[]>>("/requests/incoming"),
        apiRequest<ApiResponse<RideRequest[]>>("/requests/mine"),
        apiRequest<ApiResponse<NotificationItem[]>>("/notifications"),
      ]);

      if (allRidesResult.status === "fulfilled") {
        const rideMap = new Map<string, Ride>();
        allRidesResult.value.data.forEach((ride) => {
          rideMap.set(ride.id, ride);
        });
        setRides(Array.from(rideMap.values()));
      }

      const incomingRequests =
        incomingResult.status === "fulfilled" ? (incomingResult.value.data || []) : [];
      const myRequests = mineResult.status === "fulfilled" ? (mineResult.value.data || []) : [];
      setRequests(mergeRequests([...incomingRequests, ...myRequests]));

      if (notificationResult.status === "fulfilled") {
        setNotifications(notificationResult.value.data || []);
      }
    } finally {
      refreshInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [currentUser?.id, mergeRequests]);

  const refreshInBackground = useCallback(() => {
    void refreshData().catch(() => {
      // background sync failures should not block UI
    });
  }, [refreshData]);

  useEffect(() => {
    const syncUserFromStorage = () => {
      setCurrentUser(getCurrentUser() || guestUser);
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncUserFromStorage);
    window.addEventListener("storage", syncUserFromStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUserFromStorage);
      window.removeEventListener("storage", syncUserFromStorage);
    };
  }, []);

  useEffect(() => {
    void hydrateCurrentUser();
  }, []);

  useEffect(() => {
    void refreshData().catch(() => {
      // Initial auth/data sync can fail during token rotation; UI recovers on next auth event.
    });
  }, [refreshData]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshInBackground();
      }
    }, 90000);

    const onFocus = () => refreshInBackground();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [currentUser?.id, refreshInBackground]);

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeRequestUpdate = () => {
      refreshInBackground();
    };

    socket.on("ride-request-updated", handleRealtimeRequestUpdate);

    return () => {
      socket.off("ride-request-updated", handleRealtimeRequestUpdate);
    };
  }, [socket, refreshInBackground]);

  const addRide = useCallback(
    async (ride: CreateRideInput) => {
      try {
        const response = await apiRequest<ApiResponse<Ride>>("/rides", {
          method: "POST",
          body: JSON.stringify(ride),
        });

        setRides((prev) => [response.data, ...prev]);
        trackEvent("post_ride", {
          seats: response.data.seats,
          price_per_seat: response.data.pricePerSeat,
        });
        refreshInBackground();
        return { success: true, message: response.message || "Ride posted successfully" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to post ride" };
      }
    },
    [refreshInBackground]
  );

  const updateRide = useCallback(
    async (rideId: string, ride: Partial<CreateRideInput>) => {
      try {
        const response = await apiRequest<ApiResponse<Ride>>(`/rides/${rideId}`, {
          method: "PATCH",
          body: JSON.stringify(ride),
        });

        setRides((prev) => prev.map((item) => (item.id === rideId ? response.data : item)));
        refreshInBackground();
        return { success: true, message: response.message || "Ride updated successfully" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to update ride" };
      }
    },
    [refreshInBackground]
  );

  const deleteRide = useCallback(
    async (rideId: string) => {
      try {
        const response = await apiRequest<ApiResponse<null>>(`/rides/${rideId}`, {
          method: "DELETE",
        });

        setRides((prev) => prev.filter((item) => item.id !== rideId));
        setRequests((prev) => prev.filter((request) => request.rideId !== rideId));
        refreshInBackground();
        return { success: true, message: response.message || "Ride deleted successfully" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to delete ride" };
      }
    },
    [refreshInBackground]
  );

  const sendRequest = useCallback(
    async (rideId: string, seatsRequested: number) => {
      try {
        const response = await apiRequest<ApiResponse<RideRequest>>(`/rides/${rideId}/requests`, {
          method: "POST",
          body: JSON.stringify({ seatsRequested }),
        });

        setRequests((prev) => mergeRequests([response.data, ...prev]));
        trackEvent("request_ride", {
          ride_id: rideId,
          seats_requested: seatsRequested,
        });
        refreshInBackground();
        return { success: true, message: response.message || "Ride request sent successfully" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to send request" };
      }
    },
    [mergeRequests, refreshInBackground]
  );

  const approveRequest = useCallback(
    async (requestId: string) => {
      try {
        const response = await apiRequest<ApiResponse<RideRequest>>(`/requests/${requestId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        });

        setRequests((prev) =>
          prev.map((request) =>
            request.id === requestId ? { ...request, status: "approved" } : request
          )
        );

        const approvedRequest = requests.find((r) => r.id === requestId);
        if (approvedRequest) {
          setRides((prev) =>
            prev.map((ride) =>
              ride.id === approvedRequest.rideId
                ? { ...ride, seats: Math.max(0, ride.seats - approvedRequest.seatsRequested) }
                : ride
            )
          );
        }

        refreshInBackground();
        return { success: true, message: response.message || "Request approved" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to approve request" };
      }
    },
    [requests, refreshInBackground]
  );

  const rejectRequest = useCallback(
    async (requestId: string) => {
      try {
        const response = await apiRequest<ApiResponse<RideRequest>>(`/requests/${requestId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "rejected" }),
        });

        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r))
        );

        refreshInBackground();
        return { success: true, message: response.message || "Request rejected" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to reject request" };
      }
    },
    [refreshInBackground]
  );

  const cancelBooking = useCallback(
    async (requestId: string) => {
      try {
        const response = await apiRequest<ApiResponse<null>>(`/requests/${requestId}`, {
          method: "DELETE",
        });

        setRequests((prev) => prev.filter((request) => request.id !== requestId));
        refreshInBackground();
        return { success: true, message: response.message || "Booking cancelled successfully" };
      } catch (error) {
        if (error instanceof ApiError) {
          return { success: false, message: error.message };
        }
        return { success: false, message: "Failed to cancel booking" };
      }
    },
    [refreshInBackground]
  );

  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      const response = await apiRequest<ApiResponse<NotificationItem>>(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );

      return { success: true, message: response.message || "Notification marked as read" };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: "Failed to update notification" };
    }
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiRequest(`/notifications/delete-all`, {
        method: "DELETE",
      });

      setNotifications([]);

      return { success: true, message: "All notifications cleared" };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: "Failed to clear notifications" };
    }
  }, []);

  const getRequestForRide = useCallback(
    (rideId: string) =>
      requests.find(
        (r) => r.rideId === rideId && ((currentUser?.id && r.requesterId === currentUser.id) || r.requesterEmail === currentUser?.email)
      ),
    [requests, currentUser]
  );

  const getRequestsForMyRides = useCallback(
    () =>
      requests.filter(
        (request) => (currentUser?.id && request.rideOwnerId === currentUser.id) || request.rideOwnerEmail === currentUser?.email
      ),
    [requests, currentUser]
  );

  const sendMessage = useCallback(
    (rideId: string, text: string, senderRole: "requester" | "offerer") => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        rideId,
        senderName: currentUser.name,
        senderRole,
        text,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, msg]);
    },
    [currentUser]
  );

  const getMessagesForRide = useCallback(
    (rideId: string) => chatMessages.filter((m) => m.rideId === rideId),
    [chatMessages]
  );

  return (
    <RideContext.Provider
      value={{
        rides,
        isLoading,
        refreshData,
        addRide,
        updateRide,
        deleteRide,
        requests,
        sendRequest,
        approveRequest,
        rejectRequest,
        cancelBooking,
        getRequestForRide,
        getRequestsForMyRides,
        chatMessages,
        notifications,
        sendMessage,
        getMessagesForRide,
        markNotificationRead,
        deleteAllNotifications,
        currentUser,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};
