import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Ride } from "@/components/RideCard";
import {
  AUTH_CHANGED_EVENT,
  getCurrentUser,
  hydrateCurrentUser,
  type UserAccount,
} from "@/lib/auth";
import { ApiError, apiRequest } from "@/lib/api";

export interface RideRequest {
  id: string;
  rideId: string;
  rideOwnerEmail?: string;
  rideOwnerName: string;
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

interface RideContextType {
  rides: Ride[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addRide: (ride: CreateRideInput) => Promise<{ success: boolean; message: string }>;
  requests: RideRequest[];
  sendRequest: (
    rideId: string,
    seatsRequested: number
  ) => Promise<{ success: boolean; message: string }>;
  approveRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  rejectRequest: (requestId: string) => Promise<{ success: boolean; message: string }>;
  getRequestForRide: (rideId: string) => RideRequest | undefined;
  getRequestsForMyRides: () => RideRequest[];
  chatMessages: ChatMessage[];
  sendMessage: (rideId: string, text: string, senderRole: "requester" | "offerer") => void;
  getMessagesForRide: (rideId: string) => ChatMessage[];
  currentUser: {
    name: string;
    email: string;
    phone?: string;
    branch?: string;
    year?: string;
    organization?: string;
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
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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
    if (!currentUser?.id) {
      setRides([]);
      setRequests([]);
      return;
    }

    refreshInFlightRef.current = true;
    setIsLoading(true);
    try {
      const [allRides, incoming, mine] = await Promise.all([
        apiRequest<ApiResponse<Ride[]>>("/rides"),
        apiRequest<ApiResponse<RideRequest[]>>("/requests/incoming"),
        apiRequest<ApiResponse<RideRequest[]>>("/requests/mine"),
      ]);

      const rideMap = new Map<string, Ride>();
      allRides.data.forEach((ride) => {
        rideMap.set(ride.id, ride);
      });

      setRides(Array.from(rideMap.values()));
      setRequests(mergeRequests([...(incoming.data || []), ...(mine.data || [])]));
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
    void refreshData();
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

  const addRide = useCallback(
    async (ride: CreateRideInput) => {
      try {
        const response = await apiRequest<ApiResponse<Ride>>("/rides", {
          method: "POST",
          body: JSON.stringify(ride),
        });

        setRides((prev) => [response.data, ...prev]);
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

  const sendRequest = useCallback(
    async (rideId: string, seatsRequested: number) => {
      try {
        const response = await apiRequest<ApiResponse<RideRequest>>(`/rides/${rideId}/requests`, {
          method: "POST",
          body: JSON.stringify({ seatsRequested }),
        });

        setRequests((prev) => mergeRequests([response.data, ...prev]));
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

  const getRequestForRide = useCallback(
    (rideId: string) =>
      requests.find((r) => r.rideId === rideId && r.requesterEmail === currentUser.email),
    [requests, currentUser]
  );

  const getRequestsForMyRides = useCallback(
    () => requests.filter((request) => request.rideOwnerEmail === currentUser.email),
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
        requests,
        sendRequest,
        approveRequest,
        rejectRequest,
        getRequestForRide,
        getRequestsForMyRides,
        chatMessages,
        sendMessage,
        getMessagesForRide,
        currentUser,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};
