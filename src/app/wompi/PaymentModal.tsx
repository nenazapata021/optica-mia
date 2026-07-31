"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useCart } from "../context/CartContextType";

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

export default function PaymentModal({
  customerId,
  customerInfo,
  onClose,
  onComplete,
}: PaymentModalProps) {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<"select" | "processing" | "qr" | "success" | "error">("select");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [nequiQrUrl, setNequiQrUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

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
              {redirectUrl
                ? "Serás redirigido para completar el pago."
                : "Tu pedido ha sido confirmado. Te contactaremos pronto."}
            </p>
            {redirectUrl && (
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
              >
                Ir a pagar
              </a>
            )}
            {!redirectUrl && (
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
