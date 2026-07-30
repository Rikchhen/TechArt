import http from "http";
import https from "https";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { httpsEnabled, httpsOptions } from "./config/https";

async function start() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const useHttps = httpsEnabled();
    const server = useHttps
      ? https.createServer(httpsOptions(), app)
      : http.createServer(app);
    const scheme = useHttps ? "https" : "http";

    server.listen(env.PORT, () => {
      console.log(
        `TechArt API listening on ${scheme}://localhost:${env.PORT} [${env.NODE_ENV}]`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
