import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ChatModel } from "../models/Chat.model.js";
import { RideModel } from "../models/Ride.model.js";
import { RideRequestModel } from "../models/RideRequest.model.js";
import { UserModel } from "../models/User.model.js";

interface JwtPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
}

const getCookieValue = (cookieHeader: string | undefined, key: string) => {
  if (!cookieHeader) return "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${key}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : "";
};

export const initializeSocket = (httpServer: Server) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const authToken = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : "";
    const cookieToken = getCookieValue(socket.handshake.headers.cookie, "accessToken");
    const token = authToken || cookieToken;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      socket.data.userId = payload.sub;
      socket.data.userEmail = payload.email;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    // Join chat room: format is "chat:rideId:requestId"
    socket.on("join-chat", async (data: { rideId: string; requestId: string }) => {
      try {
        const { rideId, requestId } = data;
        const roomId = `chat:${rideId}:${requestId}`;

        // Verify user is authorized
        const ride = await RideModel.findById(rideId);
        if (!ride) {
          socket.emit("error", "Ride not found");
          return;
        }

        const request = await RideRequestModel.findById(requestId);
        if (!request || request.status !== "approved") {
          socket.emit("error", "Request not found or not approved");
          return;
        }

        const isDriver = String(ride.owner) === userId;
        const isRider = String(request.requester) === userId;

        if (!isDriver && !isRider) {
          socket.emit("error", "Not authorized");
          return;
        }

        // Cache chat session details for low-latency message send path.
        socket.data.currentRideId = rideId;
        socket.data.currentRequestId = requestId;
        socket.data.currentDriverId = String(ride.owner);
        socket.data.currentRiderId = String(request.requester);

        if (!socket.data.senderName || !socket.data.senderEmail) {
          const user = await UserModel.findById(userId).select("name email").lean();
          if (!user) {
            socket.emit("error", "User not found");
            return;
          }
          socket.data.senderName = user.name;
          socket.data.senderEmail = user.email;
        }

        // Join the room
        socket.join(roomId);
        socket.data.currentRoom = roomId;

        // Load and send chat history
        let chat = await ChatModel.findOne({ ride: rideId, rideRequest: requestId });
        if (!chat) {
          chat = await ChatModel.create({
            ride: rideId,
            rideRequest: requestId,
            driver: ride.owner,
            rider: request.requester,
            messages: [],
          });
        }

        // Update last read
        if (isDriver) {
          chat.lastReadByDriver = new Date();
        } else {
          chat.lastReadByRider = new Date();
        }
        await chat.save();

        socket.emit("chat-history", {
          messages: chat.messages,
          chatId: chat._id,
        });

        // Notify others in the room that user has joined
        socket.to(roomId).emit("user-joined", {
          userId,
          userEmail: socket.data.userEmail,
        });
      } catch (error) {
        socket.emit("error", "Failed to join chat");
      }
    });

    // Send message
    socket.on("new-message", async (data: { rideId: string; requestId: string; content: string }) => {
      try {
        const { rideId, requestId, content } = data;

        if (!content || content.trim().length === 0) {
          socket.emit("error", "Message content is required");
          return;
        }

        const currentRideId = socket.data.currentRideId as string | undefined;
        const currentRequestId = socket.data.currentRequestId as string | undefined;
        const driverId = socket.data.currentDriverId as string | undefined;
        const riderId = socket.data.currentRiderId as string | undefined;

        if (!currentRideId || !currentRequestId || currentRideId !== rideId || currentRequestId !== requestId) {
          socket.emit("error", "Join chat before sending messages");
          return;
        }

        if (userId !== driverId && userId !== riderId) {
          socket.emit("error", "Not authorized");
          return;
        }

        const message = {
          sender: {
            id: userId,
            name: (socket.data.senderName as string) || "User",
            email: (socket.data.senderEmail as string) || (socket.data.userEmail as string),
          },
          content: content.trim(),
          timestamp: new Date(),
        };

        // Emit message to room
        const roomId = `chat:${rideId}:${requestId}`;
        io.to(roomId).emit("message", {
          ...message,
        });

        // Persist asynchronously to keep perceived chat latency minimal.
        void ChatModel.updateOne(
          { ride: rideId, rideRequest: requestId },
          {
            $setOnInsert: {
              ride: rideId,
              rideRequest: requestId,
              driver: driverId,
              rider: riderId,
            },
            $push: { messages: message },
            $set: {
              lastMessage: {
                content: message.content,
                timestamp: message.timestamp,
              },
            },
          },
          { upsert: true }
        ).catch(() => {
          socket.emit("error", "Message saved with delay. Please retry if needed.");
        });
      } catch (error) {
        socket.emit("error", "Failed to send message");
      }
    });

    // Typing indicator
    socket.on("typing", (data: { rideId: string; requestId: string }) => {
      const roomId = `chat:${data.rideId}:${data.requestId}`;
      socket.to(roomId).emit("user-typing", {
        userId,
        userEmail: socket.data.userEmail,
      });
    });

    // Stop typing
    socket.on("stop-typing", (data: { rideId: string; requestId: string }) => {
      const roomId = `chat:${data.rideId}:${data.requestId}`;
      socket.to(roomId).emit("user-stop-typing", {
        userId,
      });
    });

    // Leave chat
    socket.on("leave-chat", () => {
      if (socket.data.currentRoom) {
        socket.to(socket.data.currentRoom).emit("user-left", { userId });
        socket.leave(socket.data.currentRoom);
      }
    });

    socket.on("disconnect", () => {
      if (socket.data.currentRoom) {
        socket.to(socket.data.currentRoom).emit("user-left", { userId });
      }
    });
  });

  return io;
};
