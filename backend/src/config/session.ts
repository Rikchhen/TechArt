import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "./env";

export const SESSION_COOKIE_NAME = "gadgetstore.sid";

export const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // Rolling: each response refreshes the cookie, so maxAge acts as an idle
  // timeout (2h of inactivity) rather than a fixed lifetime.
  rolling: true,
  store: MongoStore.create({
    mongoUrl: env.MONGO_URI,
    // Refresh the stored session at most once per 10 min to avoid a DB write
    // on every request while rolling is on.
    touchAfter: 10 * 60,
  }),
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies over HTTPS (prod, or local dev once certs are present).
    secure: env.COOKIE_SECURE,
    maxAge: 1000 * 60 * 60 * 2,
  },
});
