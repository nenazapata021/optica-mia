export interface PaymentProviderConfig {
  name: "Wompi" | "Addi" | "Sistecredito";
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}

export interface PaymentOrderData {
  orderId: string;
  totalInCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  cityValidated: boolean;
}

export interface CreatePaymentResponse {
  checkoutUrl: string;
  paymentReference: string;
  provider: "Wompi" | "Addi" | "Sistecredito";
}

export interface WebhookVerificationResult {
  valid: boolean;
  provider: "Wompi" | "Addi" | "Sistecredito";
  signatureValid: boolean;
}

export interface ProviderSpecificData {
  wompi?: {
    signature: string;
    acceptanceToken?: string;
    personalAuthToken?: string;
  };
  addi?: {
    manualLink?: string;
  };
  sistecredito?: {
    manualLink?: string;
  };
}