import rateLimit from "express-rate-limit";

/*
  Rate limiters. `standardHeaders` emits RateLimit-* headers; legacy X-RateLimit-*
  are disabled. IP is derived via Express `trust proxy` (see app.ts / env), so
  these work correctly behind the Vite dev proxy and a production reverse proxy.
*/

const fifteenMinutes = 15 * 60 * 1000;

// Broad safety net for the whole API.
export const apiLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Strict limiter for credential endpoints (login / register) to slow brute force.
// Set above the per-account lockout threshold (15) so the account lockout is the
// effective limit a single account hits, not this per-IP net.
export const authLimiter = rateLimit({
  windowMs: fifteenMinutes,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in a few minutes." },
});
