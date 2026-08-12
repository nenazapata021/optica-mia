"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useCart, type CartItem } from "../context/CartContextType";

type PaymentMethodType = "NEQUI" | "ADDI" | "SISTECREDITO";

interface PaymentModalProps {
  customerId: string;
  customerInfo: {
    email: string;
    full_name: string;
    phone_number?: string;
    legal_id?: string;
    legal_id_type?: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

const PAYMENT_METHODS: {
  type: PaymentMethodType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: "NEQUI",
    label: "Nequi",
    description: "Paga con Nequi, escanea el código QR",
    icon: "/icons/nequi.svg",
  },
  {
    type: "ADDI",
    label: "Addi",
    description: "Compra ahora y paga después con Addi",
    icon: "/icons/addi.svg",
  },
  {
    type: "SISTECREDITO",
    label: "Sistecredito",
    description: "Crédito fácil con Sistecredito",
    icon: "/icons/sistecredito.svg",
  },
];

const WHATSAPP_NUMBER = "573017391219";

function buildWhatsappUrl(
  method: PaymentMethodType,
  customerName: string,
  items: CartItem[]
): string {
  const metodo = method === "ADDI" ? "Addi" : "Sistecredito";
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productLines = items
    .map((item) => `- ${item.name} x${item.quantity} $${item.price.toLocaleString("es-CO")}`)
    .join("\n");
  const message =
    `Hola, quiero comprar con ${metodo}.\n` +
    `Cliente: ${customerName}\n` +
    `Productos:\n${productLines}\n` +
    `Total: $${total.toLocaleString("es-CO")}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function PaymentModal({
  customerId,
  customerInfo,
  onClose,
  onComplete,
}: PaymentModalProps) {
  const { cartItems, clearCart } = useCart();
  const [step, setStep] = useState<"select" | "processing" | "qr" | "success" | "error">("select");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [nequiQrUrl, setNequiQrUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const isCreditMethod =
    selectedMethod === "ADDI" || selectedMethod === "SISTECREDITO";
  const whatsappUrl =
    isCreditMethod && customerInfo
      ? buildWhatsappUrl(selectedMethod, customerInfo.full_name, cartItems)
      : null;

  const handleSelectMethod = async (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setStep("processing");
    setErrorMsg("");

    try {
      const items = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const res = await fetch("/api/wompi/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          items,
          paymentMethod: { type: method },
          customerInfo,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear transacción");
      }

      const data = await res.json();

      setTransactionId(data.transaction.id);

      if (method === "NEQUI" && data.transaction.nequiQrUrl) {
        setNequiQrUrl(data.transaction.nequiQrUrl);
        setStep("qr");
      } else if (
        (method === "ADDI" || method === "SISTECREDITO") &&
        (data.transaction.paymentUrl || data.transaction.redirectUrl)
      ) {
        setRedirectUrl(
          data.transaction.paymentUrl ?? data.transaction.redirectUrl
        );
        setStep("success");
      } else {
        setStep("success");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error al procesar el pago"
      );
      setStep("error");
    }
  };

  const checkStatus = useCallback(async () => {
    if (!transactionId) return;
    try {
      const res = await fetch(
        `/api/wompi/check-status?transactionId=${transactionId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.transaction.status === "APPROVED") {
        setStep("success");
        clearCart();
      }
    } catch {
      // silent
    }
  }, [transactionId, clearCart]);

  useEffect(() => {
    if (step !== "qr" || !transactionId) return;
    const interval = setInterval(() => {
      setPollCount((c) => c + 1);
      checkStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [step, transactionId, checkStatus]);

  const handleFinish = () => {
    if (step === "success") {
      clearCart();
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* Selección de método */}
        {step === "select" && (
          <>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">
              Método de pago
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Selecciona cómo deseas pagar tu pedido.
            </p>
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.type}
                  onClick={() => handleSelectMethod(method.type)}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-[#D4AF37] hover:shadow-md"
                >
                  <div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1.5">
                    <Image
                      src={method.icon}
                      alt={method.label}
                      width={96}
                      height={40}
                      className="h-full w-auto object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {method.label}
                    </p>
                    <p className="text-sm text-gray-500">
                      {method.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Procesando */}
        {step === "processing" && (
          <div className="flex flex-col items-center py-10 text-center">
            <Loader2 size={48} className="animate-spin text-[#D4AF37]" />
            <h3 className="mt-4 text-xl font-bold text-gray-800">
              Procesando pago...
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Estamos generando tu transacción con {selectedMethod === "NEQUI" ? "Nequi" : selectedMethod === "ADDI" ? "Addi" : "Sistecredito"}.
            </p>
          </div>
        )}

        {/* QR Nequi */}
        {step === "qr" && nequiQrUrl && (
          <div className="flex flex-col items-center py-4 text-center">
            <Clock size={40} className="text-[#D4AF37]" />
            <h3 className="mt-3 text-xl font-bold text-gray-800">
              Paga con Nequi
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Escanea el código QR con tu app de Nequi para pagar.
            </p>
            <div className="relative h-64 w-64 overflow-hidden rounded-xl border bg-white p-4">
              <Image
                src={nequiQrUrl}
                alt="Código QR Nequi"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Esperando confirmación...{" "}
              {pollCount > 0 && `(${pollCount * 5}s)`}
            </p>
            <Loader2 size={16} className="mt-1 animate-spin text-[#D4AF37]" />
          </div>
        )}

        {/* Éxito */}
        {step === "success" && (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle size={56} className="text-green-500" />
            <h3 className="mt-4 text-2xl font-bold text-gray-800">
              ¡Pago exitoso!
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {whatsappUrl
                ? `Completa tu compra con ${selectedMethod === "ADDI" ? "Addi" : "Sistecredito"} escríbenos por WhatsApp.`
                : redirectUrl
                  ? "Serás redirigido para completar el pago."
                  : "Tu pedido ha sido confirmado. Te contactaremos pronto."}
            </p>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20BD5C]"
              >
                <svg viewBox="0 0 24 24" fill="white" width="18" height="18" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Continuar por WhatsApp
              </a>
            )}
            {!whatsappUrl && redirectUrl && (
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
              >
                Ir a pagar
              </a>
            )}
            {!whatsappUrl && !redirectUrl && (
              <Link
                href="/"
                onClick={handleFinish}
                className="mt-6 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
              >
                Volver al inicio
              </Link>
            )}
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle size={56} className="text-red-500" />
            <h3 className="mt-4 text-xl font-bold text-gray-800">
              Error en el pago
            </h3>
            <p className="mt-2 text-sm text-red-500">{errorMsg}</p>
            <button
              onClick={() => setStep("select")}
              className="mt-6 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
