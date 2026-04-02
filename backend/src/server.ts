import { createApp } from "./app.js";
import { createServer } from "http";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./services/socket.service.js";

const bootstrap = async () => {
  await connectDB();
  const app = createApp();
  const httpServer = createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Backend running on port ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
