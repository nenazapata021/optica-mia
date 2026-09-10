import crypto from "crypto";

const wompiApiUrl = process.env.WOMPI_API_URL ?? "https://sandbox.wompi.co/v1";
const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
const wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY ?? "";
const wompiIntegrityKey = process.env.WOMPI_INTEGRITY_KEY ?? "";
const wompiEventSecret = process.env.WOMPI_EVENT_SECRET ?? "";

export function generateWebCheckoutSignature(
  reference: string,
  amountInCents: number,
  currency: string = "COP"
): string {
  // Wompi requiere: SHA256(reference + amount_in_cents + currency + integrity_key)
  const text = `${reference}${amountInCents}${currency}${wompiIntegrityKey}`;
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  // Wompi envía firma como HMAC-SHA256 del payload body
  const expected = crypto
    .createHmac("sha256", wompiEventSecret)
    .update(payload)
    .digest("hex");
  return signature === expected;
}

export interface CreateWebCheckoutParams {
  reference: string;
  amountInCents: number;
  currency?: string;
  customer: {
    email: string;
    full_name: string;
    phone_number?: string;
    legal_id?: string;
    legal_id_type?: string;
  };
  paymentMethod: "NEQUI" | "ADDI" | "SISTECREDITO";
  redirectUrl?: string;
  acceptanceToken: string;
  personalAuthToken: string;
  installments?: number;
}

export async function createWebCheckout(params: CreateWebCheckoutParams): Promise<{
  checkoutUrl: string;
  paymentReference: string;
}> {
  const signature = generateWebCheckoutSignature(
    params.reference,
    params.amountInCents,
    params.currency ?? "COP"
  );

  const body: Record<string, unknown> = {
    amount_in_cents: params.amountInCents,
    currency: params.currency ?? "COP",
    reference: params.reference,
    signature,
    customer_email: params.customer.email,
    acceptance_token: params.acceptanceToken,
    accept_personal_auth: params.personalAuthToken,
    customer_information: {
      email: params.customer.email,
      full_name: params.customer.full_name,
      phone_number: params.customer.phone_number,
      ...(params.customer.legal_id
        ? { legal_id: params.customer.legal_id, legal_id_type: params.customer.legal_id_type ?? "CC" }
        : {}),
    },
    payment_method: {
      type: params.paymentMethod,
      ...(params.paymentMethod === "NEQUI"
        ? { financial_institution_code: "1507" }
        : {}),
      ...(params.paymentMethod === "ADDI" && params.installments
        ? { installments: params.installments }
        : {}),
      ...(params.paymentMethod === "SISTECREDITO" ? {} : {}),
    },
  };

  if (params.redirectUrl) {
    body.redirect_url = params.redirectUrl;
  }

  const url = `${wompiApiUrl}/transactions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wompiPrivateKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Wompi error: ${res.status} ${JSON.stringify(data)}`);
  }

  return {
    checkoutUrl: data.data.payment_url ?? data.data.redirect_url ?? "",
    paymentReference: data.data.reference,
  };
}