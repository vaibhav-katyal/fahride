import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { createApp } from "./app.js";
import { createServer } from "http";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./services/socket.service.js";

const bootstrap = async () => {
  try {
    await connectDB();

    const app = createApp();
    const httpServer = createServer(app);
    initializeSocket(httpServer);

    // ✅ Azure compatible PORT logic
    const PORT = process.env.PORT || env.PORT || 5000;

    httpServer.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

bootstrap();