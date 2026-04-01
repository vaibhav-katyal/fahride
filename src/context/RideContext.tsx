import React, { createContext, useContext, useState, useCallback } from "react";
import type { Ride } from "@/components/RideCard";
import { mockRides as initialMockRides } from "@/data/mockRides";

export interface RideRequest {
  id: string;
  rideId: string;
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
  addRide: (ride: Ride) => void;
  requests: RideRequest[];
  sendRequest: (rideId: string, seatsRequested: number) => { success: boolean; message: string };
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  getRequestForRide: (rideId: string) => RideRequest | undefined;
  getRequestsForMyRides: () => RideRequest[];
  chatMessages: ChatMessage[];
  sendMessage: (rideId: string, text: string, senderRole: "requester" | "offerer") => void;
  getMessagesForRide: (rideId: string) => ChatMessage[];
  currentUser: {
    name: string;
    email: string;
    phone?: string;
    rollNumber?: string;
    branch?: string;
    year?: string;
    organization?: string;
  };
}

const RideContext = createContext<RideContextType | null>(null);

export const useRideContext = () => {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRideContext must be used within RideProvider");
  return ctx;
};

export const RideProvider = ({ children }: { children: React.ReactNode }) => {
  const [rides, setRides] = useState<Ride[]>(initialMockRides);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const stored = localStorage.getItem("easyride_user");
  const currentUser = stored
    ? JSON.parse(stored)
    : {
        name: "Student",
        email: "student@chitkara.edu.in",
        phone: "",
        rollNumber: "",
        branch: "",
        year: "",
      };

  const addRide = useCallback((ride: Ride) => {
    setRides((prev) => [ride, ...prev]);
  }, []);

  const sendRequest = useCallback(
    (rideId: string) => {
      const targetRide = rides.find((r) => r.id === rideId);
      if (!targetRide) {
        return { success: false, message: "Ride not found" };
      }

      // Check if already requested this specific ride (pending or approved)
      const existingRide = requests.find(
        (r) =>
          r.rideId === rideId &&
          r.requesterEmail === currentUser.email &&
          (r.status === "pending" || r.status === "approved")
      );
      if (existingRide) {
        return { success: false, message: "You already requested this ride" };
      }

      // Check for overlapping rides (only if both rides have dates)
      if (targetRide.date && targetRide.departureTime) {
        const userRequests = requests.filter(
          (r) =>
            r.requesterEmail === currentUser.email &&
            r.status !== "rejected" &&
            r.rideId !== rideId
        );

        for (const req of userRequests) {
          const otherRide = rides.find((r) => r.id === req.rideId);
          if (!otherRide || !otherRide.date || !otherRide.departureTime) continue;

          // Only check overlaps on same date
          if (otherRide.date !== targetRide.date) continue;

          // Parse times (format: "HH:MM AM/PM" or "HH:MM")
          const parseTime = (timeStr: string) => {
            const parts = timeStr.trim().toUpperCase().split(" ");
            const [hours, mins] = parts[0].split(":").map(Number);
            const isPM = parts[1] === "PM";
            let hour = hours;
            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
            return hour * 60 + mins; // Return minutes since midnight
          };

          try {
            const targetMinutes = parseTime(targetRide.departureTime);
            const otherMinutes = parseTime(otherRide.departureTime);
            const timeDifference = Math.abs(targetMinutes - otherMinutes);

            // Check if rides depart within 30 minutes of each other
            if (timeDifference < 30) {
              return {
                success: false,
                message: "You already have a ride departing within 30 minutes",
              };
            }
          } catch (e) {
            // If time parsing fails, skip this check
            continue;
          }
        }
      }

      // Create request
      const req: RideRequest = {
        id: crypto.randomUUID(),
        rideId,
        requesterName: currentUser.name || currentUser.email.split("@")[0],
        requesterEmail: currentUser.email,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setRequests((prev) => [...prev, req]);
      return { success: true, message: "Ride request sent successfully" };
    },
    [requests, rides, currentUser]
  );

  const approveRequest = useCallback((requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r))
    );
  }, []);

  const rejectRequest = useCallback((requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r))
    );
  }, []);

  const getRequestForRide = useCallback(
    (rideId: string) =>
      requests.find(
        (r) => r.rideId === rideId && r.requesterEmail === currentUser.email
      ),
    [requests, currentUser]
  );

  const getRequestsForMyRides = useCallback(() => {
    // In mock mode, show all requests (as if current user is the offerer)
    return requests;
  }, [requests]);

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
