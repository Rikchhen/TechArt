import { env } from "./env";
import { AppError } from "../utils/appError";

export type KhaltiInitiatePayload = {
  return_url: string;
  website_url: string;
  amount: number;
  purchase_order_id: string;
  purchase_order_name: string;
};

export type KhaltiInitiateResponse = {
  pidx: string;
  payment_url: string;
};

export type KhaltiLookupResponse = {
  pidx: string;
  status: string;
  total_amount: number;
  transaction_id?: string;
  purchase_order_id?: string;
};

export function isKhaltiEnabled(): boolean {
  return Boolean(env.KHALTI_SECRET_KEY);
}

async function khaltiRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!env.KHALTI_SECRET_KEY) {
    throw new AppError("Khalti payments are not configured", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${env.KHALTI_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError("Could not reach Khalti", 502);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : "Khalti request failed";
    throw new AppError(detail, 502);
  }

  return payload as T;
}

export function initiateKhaltiPayment(data: KhaltiInitiatePayload) {
  return khaltiRequest<KhaltiInitiateResponse>("/epayment/initiate/", data);
};

export function verifyKhaltiPayment(pidx: string) {
  return khaltiRequest<KhaltiLookupResponse>("/epayment/lookup/", { pidx });
};
