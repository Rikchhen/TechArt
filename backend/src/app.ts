import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { env } from "./config/env";
import { sessionMiddleware } from "./config/session";
import apiRoutes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { verifyOrigin } from "./middlewares/verifyOrigin";
import { csrfProtection } from "./middlewares/csrf";
import { apiLimiter } from "./middlewares/rateLimit";
import { UPLOAD_DIR } from "./middlewares/upload";

const app = express();

// Trust the reverse proxy (and the Vite dev proxy) so client IP and the secure
// session cookie work correctly. Must be set before rate limiting and sessions.
app.set("trust proxy", env.TRUST_PROXY);

// Security headers (HSTS, nosniff, frame-guard, CSP, etc.).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
        frameSrc: ["'self'", "https://www.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://www.google.com", "https://www.gstatic.com"],
        connectSrc: ["'self'", "https://www.google.com"],
      },
    },
  })
);

// Request logging.
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "10kb" }));

// Strip Mongo operator characters ($ and .) from keys to block NoSQL injection,
// and collapse duplicated query/body params (HTTP parameter pollution).
app.use(mongoSanitize());
app.use(hpp());

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// CSRF defense-in-depth on mutating requests (pairs with the SameSite cookie).
app.use(verifyOrigin);

app.use(sessionMiddleware);

// Uploaded product images. Static GETs, so they sit outside the API rate limit.
// `index:false` + `dotfiles:deny` keep directory listing and dotfiles off.
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: "deny",
    maxAge: "7d",
  })
);

// Broad rate limit + CSRF double-submit token check across the API; auth routes
// add a stricter limiter of their own.
app.use("/api", apiLimiter, csrfProtection, apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorHandler);

export default app;
