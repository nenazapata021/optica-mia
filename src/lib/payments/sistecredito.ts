import type { PaymentProviderConfig } from "./types";

const sistecreditoBaseUrl = process.env.SISTECREDITO_API_BASE_URL ?? "https://api.sistecredito.co";
const sistecreditoPublicKey = process.env.SISTECREDITO_PUBLIC_KEY ?? "";
const sistecreditoSecretKey = process.env.SISTECREDITO_SECRET_KEY ?? "";

// TODO: Cuando se obtengan las credenciales de Sistecredito como aliado e-commerce,
// descomentar e implementar createCheckout que llame a su API REST:
// POST /v1/checkouts con { amount, customer, reference, redirect_url }

export function getManualPaymentLink(provider: "addi" | "sistecredito"): string {
  // Modo manual: el usuario genera el link de pago desde su panel de comercio
  // y el código simplemente lo usa como checkoutUrl
  return `/manual-${provider}-payment`;
}

export const sistecredito = {
  // Stub para futura llamada a API REST de Sistecredito
  // Cuando se tengan credenciales, descomentar y completar:
  // createCheckout: async (orderData: {
  //   amountInCents: number;
  //   reference: string;
  //   customer: { email: string; full_name: string; phone_number?: string };
  //   redirectUrl: string;
  // }): Promise<{ checkoutUrl: string; paymentReference: string }> => {
  //   const res = await fetch(`${sistecreditoBaseUrl}/v1/checkouts`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${sistecreditoSecretKey}`,
  //     },
  //     body: JSON.stringify(orderData),
  //   });
  //   const data = await res.json();
  //   return { checkoutUrl: data.data.checkout_url, paymentReference: data.data.reference };
  // },

  // Modo actual: link manual generado desde el panel de comercio
  getManualLink: getManualPaymentLink,

  // Nombre para mostrar en el selector
  name: "Sistecredito",
};