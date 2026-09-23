import type { PaymentProviderConfig } from "./types";

const addiBaseUrl = process.env.ADDI_API_BASE_URL ?? "https://api.addi.mx";
const addiPublicKey = process.env.ADDI_PUBLIC_KEY ?? "";
const addiSecretKey = process.env.ADDI_SECRET_KEY ?? "";

// TODO: Cuando se obtengan las credenciales de Addi como aliado e-commerce,
// descomentar e implementar createCheckout que llame a su API REST:
// POST /v1/checkouts con { amount, customer, reference, redirect_url }

export function getManualPaymentLink(provider: "addi" | "sistecredito"): string {
  // Modo manual: el usuario genera el link de pago desde su panel de comercio
  // y el código simplemente lo usa como checkoutUrl
  return `/manual-${provider}-payment`;
}

export const addi = {
  // Stub para futura llamada a API REST de Addi
  // Cuando se tengan credenciales, descomentar y completar:
  // createCheckout: async (orderData: {
  //   amountInCents: number;
  //   reference: string;
  //   customer: { email: string; full_name: string; phone_number?: string };
  //   redirectUrl: string;
  // }): Promise<{ checkoutUrl: string; paymentReference: string }> => {
  //   const res = await fetch(`${addiBaseUrl}/v1/checkouts`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${addiSecretKey}`,
  //     },
  //     body: JSON.stringify(orderData),
  //   });
  //   const data = await res.json();
  //   return { checkoutUrl: data.data.checkout_url, paymentReference: data.data.reference };
  // },

  // Modo actual: link manual generado desde el panel de comercio
  getManualLink: getManualPaymentLink,

  // Nombre para mostrar en el selector
  name: "Addi",
};