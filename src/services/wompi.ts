import crypto from "crypto";

const WOMPI_API_URL =
  process.env.WOMPI_API_URL ?? "https://sandbox.wompi.co/v1";
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY ?? "";
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY ?? "";
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY ?? "";

export interface WompiCustomer {
  email: string;
  full_name: string;
  phone_number?: string;
  legal_id?: string;
  legal_id_type?: string;
}

export interface CreateTransactionParams {
  amountInCents: number;
  reference: string;
  currency?: string;
  customer: WompiCustomer;
  paymentMethod:
    | { type: "NEQUI" }
    | { type: "ADDI"; installments?: number }
    | { type: "SISTECREDITO" };
  redirectUrl?: string;
}

export interface WompiTransaction {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
  amountInCents: number;
  reference: string;
  paymentMethodType: string;
  nequiQrUrl?: string;
  redirectUrl?: string;
}

function generateSignature(
  reference: string,
  amountInCents: number,
  currency: string
): string {
  const text = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;
  return crypto.createHash("sha256").update(text).digest("hex");
}

class WompiApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "WompiApiError";
  }
}

async function wompiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WOMPI_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
      ...options.headers,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new WompiApiError(
      `Wompi API error: ${res.status}`,
      res.status,
      body
    );
  }
  return body as T;
}

export async function getMerchantInfo(): Promise<{
  data: {
    presigned_acceptance: { acceptance_token: string };
    presigned_personal_data_auth: { personal_data_auth_token: string };
  };
}> {
  return wompiFetch(`/merchants/${WOMPI_PUBLIC_KEY}`);
}

export async function createTransaction(
  params: CreateTransactionParams
): Promise<{ data: WompiTransaction }> {
  const { amountInCents, reference, customer, paymentMethod, redirectUrl } =
    params;
  const currency = params.currency ?? "COP";

  const signature = generateSignature(reference, amountInCents, currency);

  const body: Record<string, unknown> = {
    amount_in_cents: amountInCents,
    currency,
    reference,
    signature: signature,
    customer_information: {
      email: customer.email,
      full_name: customer.full_name,
      phone_number: customer.phone_number,
      ...(customer.legal_id
        ? {
            legal_id: customer.legal_id,
            legal_id_type: customer.legal_id_type ?? "CC",
          }
        : {}),
    },
    payment_method: {
      type: paymentMethod.type,
      ...(paymentMethod.type === "NEQUI"
        ? { financial_institution_code: "1507" }
        : {}),
      ...(paymentMethod.type === "ADDI" && paymentMethod.installments
        ? { installments: paymentMethod.installments }
        : {}),
    },
  };

  if (redirectUrl) {
    body.redirect_url = redirectUrl;
  }

  const response = await wompiFetch<{
    data: {
      id: string;
      status: string;
      amount_in_cents: number;
      reference: string;
      payment_method: { type: string; extra?: { nequi_qr_url?: string } };
      redirect_url?: string;
    };
  }>("/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const tx = response.data;
  return {
    data: {
      id: tx.id,
      status: tx.status as WompiTransaction["status"],
      amountInCents: tx.amount_in_cents,
      reference: tx.reference,
      paymentMethodType: tx.payment_method.type,
      nequiQrUrl: tx.payment_method.extra?.nequi_qr_url,
      redirectUrl: tx.redirect_url,
    },
  };
}

export async function getTransaction(
  transactionId: string
): Promise<{ data: WompiTransaction }> {
  const response = await wompiFetch<{
    data: {
      id: string;
      status: string;
      amount_in_cents: number;
      reference: string;
      payment_method: { type: string; extra?: { nequi_qr_url?: string } };
      redirect_url?: string;
    };
  }>(`/transactions/${transactionId}`);

  const tx = response.data;
  return {
    data: {
      id: tx.id,
      status: tx.status as WompiTransaction["status"],
      amountInCents: tx.amount_in_cents,
      reference: tx.reference,
      paymentMethodType: tx.payment_method.type,
      nequiQrUrl: tx.payment_method.extra?.nequi_qr_url,
      redirectUrl: tx.redirect_url,
    },
  };
}
