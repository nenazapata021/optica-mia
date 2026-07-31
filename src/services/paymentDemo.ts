import type { WompiTransaction } from "./wompi";

const PLACEHOLDER_PATTERN = /xxx/i;

export function isDemoMode(): boolean {
  const mode = process.env.PAYMENT_MODE?.trim().toLowerCase();
  if (mode === "live") return false;
  if (mode === "demo") return true;

  const keys = [
    process.env.WOMPI_PUBLIC_KEY,
    process.env.WOMPI_PRIVATE_KEY,
    process.env.WOMPI_INTEGRITY_KEY,
  ];
  return keys.some((key) => !key || PLACEHOLDER_PATTERN.test(key));
}

export interface DemoCreateParams {
  amountInCents: number;
  reference: string;
  paymentMethod:
    | { type: "NEQUI" }
    | { type: "ADDI"; installments?: number }
    | { type: "SISTECREDITO" };
  demoPagoUrl: string;
}

export function createDemoTransaction(
  params: DemoCreateParams
): { data: WompiTransaction } {
  const { amountInCents, reference, paymentMethod, demoPagoUrl } = params;
  const id = `demo-${Date.now()}-${reference.slice(-8)}`;
  const isNequi = paymentMethod.type === "NEQUI";
  const paymentUrl = isNequi
    ? undefined
    : `${demoPagoUrl}?tx=${encodeURIComponent(
        id
      )}&metodo=${paymentMethod.type}&monto=${amountInCents}`;

  return {
    data: {
      id,
      status: "PENDING",
      amountInCents,
      reference,
      paymentMethodType: paymentMethod.type,
      nequiQrUrl: isNequi ? "/qr-demo.svg" : undefined,
      paymentUrl,
    },
  };
}
