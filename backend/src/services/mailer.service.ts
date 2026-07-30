import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/*
  Provider-agnostic mailer.

  - If SMTP_HOST is configured we use real SMTP (SendGrid, Resend, Mailgun,
    Gmail app-password, corporate relay — anything speaking SMTP).
  - Otherwise we lazily create an Ethereal test inbox. That is a REAL SMTP
    transaction (so the whole flow is exercised), but the message is captured
    rather than delivered, and we log a preview URL to open it.

  Switching to production = setting env vars. No code changes.
*/
let transportPromise: Promise<Transporter> | null = null;

async function createTransport(): Promise<Transporter> {
  if (env.SMTP_HOST) {
    logger.info("Mailer: using configured SMTP", {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
    });
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  logger.warn(
    "Mailer: SMTP_HOST not set — using an Ethereal test inbox. Emails are captured, not delivered; a preview URL is logged for each message."
  );
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

function getTransport(): Promise<Transporter> {
  if (!transportPromise) transportPromise = createTransport();
  return transportPromise;
}

interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends an email. Never throws — a mail failure must not break the request that
 * triggered it (e.g. registration should still succeed).
 * Returns the Ethereal preview URL when available.
 */
export async function sendMail(input: MailInput): Promise<string | null> {
  try {
    const transport = await getTransport();
    const info = await transport.sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      logger.info(`Email sent — preview: ${preview}`, { to: input.to });
      return preview as string;
    }
    logger.info("Email sent", { to: input.to, subject: input.subject });
    return null;
  } catch (err) {
    logger.error("Failed to send email", {
      to: input.to,
      subject: input.subject,
      error: (err as Error).message,
    });
    return null;
  }
}

/* ---------------------------------------------------------------- templates */

const wrap = (title: string, body: string) => `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#12141a">
  <h1 style="font-size:20px;margin:0 0 16px;color:#0f766e">TechArt</h1>
  <h2 style="font-size:17px;margin:0 0 12px">${title}</h2>
  ${body}
  <p style="margin-top:28px;font-size:12px;color:#5b6472">
    If you weren't expecting this email you can safely ignore it.
  </p>
</div>`;

const button = (href: string, label: string) => `
  <p style="margin:20px 0">
    <a href="${href}" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;font-weight:600">${label}</a>
  </p>
  <p style="font-size:12px;color:#5b6472;word-break:break-all">Or paste this link: ${href}</p>`;

export function verificationEmail(name: string, link: string, code: string) {
  return {
    subject: "Verify your TechArt email",
    text: `Hi ${name}, verify your email: ${link}\n\nOr enter this code: ${code}\n\nThis expires in 30 minutes.`,
    html: wrap(
      "Confirm your email address",
      `<p>Hi ${name}, welcome to TechArt. Confirm your email to secure your account.</p>
       ${button(link, "Verify email")}
       <p>Prefer a code? Enter this on the verification page:</p>
       <p style="font-size:26px;font-weight:700;letter-spacing:6px;font-family:ui-monospace,monospace">${code}</p>
       <p style="font-size:13px;color:#5b6472">This link and code expire in 30 minutes.</p>`
    ),
  };
}

export function passwordResetEmail(name: string, link: string) {
  return {
    subject: "Reset your TechArt password",
    text: `Hi ${name}, reset your password: ${link}\n\nThis expires in 30 minutes. If you didn't request it, ignore this email.`,
    html: wrap(
      "Reset your password",
      `<p>Hi ${name}, we received a request to reset your TechArt password.</p>
       ${button(link, "Reset password")}
       <p style="font-size:13px;color:#5b6472">This link expires in 30 minutes and can be used once.</p>`
    ),
  };
}

export function securityAlertEmail(name: string, action: string, when: Date) {
  return {
    subject: `TechArt security alert: ${action}`,
    text: `Hi ${name}, this is a notification that ${action} on your TechArt account at ${when.toLocaleString()}.`,
    html: wrap(
      "Security alert",
      `<p>Hi ${name}, we're letting you know that <strong>${action}</strong> on your TechArt account.</p>
       <p style="font-size:13px;color:#5b6472">When: ${when.toLocaleString()}</p>
       <p>If this wasn't you, change your password immediately and review your active sessions.</p>`
    ),
  };
}
