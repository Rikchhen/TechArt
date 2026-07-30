import { env } from "../config/env";
import { AppError } from "../utils/appError";

export function isRecaptchaEnabled() {
  return Boolean(env.RECAPTCHA_SITE_KEY && env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptcha(token: unknown): Promise<void> {
  if (!isRecaptchaEnabled()) return;
  if (typeof token !== "string" || !token) {
    throw new AppError("Please complete the reCAPTCHA challenge", 400);
  }
  const body = new URLSearchParams({ secret: env.RECAPTCHA_SECRET_KEY!, response: token });
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const result = (await response.json()) as { success?: boolean };
    if (!result.success) throw new AppError("reCAPTCHA verification failed", 400);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Could not verify reCAPTCHA", 502);
  }
}
