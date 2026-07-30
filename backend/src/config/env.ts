import "dotenv/config";
import { z } from "zod";

const WEAK_SECRETS = new Set([
  "change-me-in-dev",
  "dev-only-secret-change-me",
  "secret",
  "changeme",
]);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    // A short secret trivially weakens session signing — require real entropy.
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET must be at least 32 characters"),
    CLIENT_ORIGIN: z.string().url(),
    // Number of proxy hops to trust for client IP / secure cookies. Behind one
    // reverse proxy (or the Vite dev proxy) this is 1; raise it if you add more.
    TRUST_PROXY: z.coerce.number().int().nonnegative().default(1),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default(process.env.NODE_ENV === "production" ? "true" : "false")
      .transform((v) => v === "true"),

    // Public URL used to build links in emails (verification, password reset).
    APP_URL: z.string().url().default("http://localhost:5173"),

    // SMTP is optional: when SMTP_HOST is unset we fall back to an Ethereal
    // test inbox in development so email flows are still fully exercisable.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default("TechArt <no-reply@techart.local>"),

    // When true, accounts must verify their email before they can sign in.
    REQUIRE_EMAIL_VERIFICATION: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),

    // Khalti payment gateway. Leave the secret key unset to disable the option.
    // Sandbox base: https://dev.khalti.com/api/v2 · Live: https://khalti.com/api/v2
    KHALTI_BASE_URL: z
      .string()
      .url()
      .default("https://dev.khalti.com/api/v2"),
    KHALTI_SECRET_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().url().optional(),
    RECAPTCHA_SITE_KEY: z.string().optional(),
    RECAPTCHA_SECRET_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && WEAK_SECRETS.has(data.SESSION_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "Refusing to start in production with a known weak SESSION_SECRET",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
