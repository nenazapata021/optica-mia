"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useCart } from "../context/CartContextType";
import WhatsAppCheckoutButton from "../whatsapp/WhatsAppCheckoutButton";
import type { WhatsAppOrderData } from "../whatsapp/WhatsAppCheckoutButton";
import BreBPayment from "../../components/checkout/BreBPayment";

type PaymentMethodType = "BREB" | "ADDI" | "SISTECREDITO";

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
    type: "BREB",
    label: "Bre-B",
    description: "Transferencia inmediata con tu llave Bre-B",
    icon: "/icons/breb.svg",
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
  const { cartItems, clearCart } = useCart();
  const [step, setStep] = useState<"select" | "processing" | "qr" | "success" | "error" | "whatsapp" | "breb">("select");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [nequiQrUrl, setNequiQrUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [whatsappOrderData, setWhatsappOrderData] = useState<WhatsAppOrderData | null>(null);

  const handleSelectMethod = async (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setErrorMsg("");

    // BRE-B: mostrar llave directamente sin llamar a la API (pago inmediato manual)
    if (method === "BREB") {
      setStep("breb");
      return;
    }

    setStep("processing");

    // Solo Addi/Sistecredito requieren phone validation y API call

    try {
      const items = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      // Todos los métodos (Nequi, Addi, Sistecredito) pasan por /api/wompi/create-transaction
      // que crea la orden en la BD y retorna requiresWhatsApp para Addi/Sistecredito
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

      if (data.requiresWhatsApp) {
        // ADDI / SISTECREDITO: mostrar bloque inline de WhatsApp
        setOrderId(data.orderId ?? null);
        setWhatsappOrderData({
          products: cartItems.map((item) => item.name),
          quantities: cartItems.map((item) => item.quantity),
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          customerName: customerInfo.full_name,
          paymentMethod: method as "ADDI" | "SISTECREDITO",
        });
        setStep("whatsapp");
      } else if (data.transactionId) {
        setTransactionId(data.transactionId);
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
      } else if (data.transaction.status === "DECLINED") {
        setErrorMsg(
          selectedMethod === "ADDI"
            ? "Addi rechazó la transacción. Intenta con otro método o contacta soporte."
            : selectedMethod === "SISTECREDITO"
              ? "Sistecredito rechazó la transacción. Intenta con otro método o contacta soporte."
              : "El pago fue rechazado"
        );
        setStep("error");
      }
    } catch {
      // silent
    }
  }, [transactionId, clearCart, selectedMethod]);

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
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 w-fit mb-3">🔒 Pago 100% seguro con Wompi</div>
            <h2 className="mb-1 text-2xl font-bold text-gray-800">
              Elige cómo pagar
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              Todos con IVA incluido. Después te confirmamos por WhatsApp.
            </p>
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.type}
                  onClick={() => handleSelectMethod(method.type)}
                  className="flex items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition hover:border-[#008294] hover:bg-[#e0f2f4]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294] min-h-[72px]"
                >
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-white border p-1.5">
                    <Image
                      src={method.icon}
                      alt={method.label}
                      width={80}
                      height={32}
                      className="h-full w-auto object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 flex items-center gap-2">
                      {method.label}
                      {method.type==="BREB" && <span className="text-[11px] font-semibold bg-[#e0f2f4] text-[#005f6b] px-2 py-0.5 rounded-full">Recomendado</span>}
                    </p>
                    <p className="text-sm text-gray-500 leading-tight">
                      {method.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {method.type==="BREB" ? "Llave • Inmediato" : method.type==="ADDI" ? "Cuotas • Te llevamos a WhatsApp" : "Crédito • Te llevamos a WhatsApp"}
                    </p>
                  </div>
                  <span className="text-gray-300" aria-hidden>›</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-gray-400 mt-3">Solo enviamos a Medellín e Itagüí • ¿Fuera de zona? Escríbenos antes de pagar</p>
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
              Estamos generando tu transacción con {selectedMethod === "BREB" ? "Bre-B" : selectedMethod === "ADDI" ? "Addi" : "Sistecredito"}.
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

        {/* Addi / Sistecredito: WhatsApp inline */}
        {step === "whatsapp" && whatsappOrderData && (
          <WhatsAppCheckoutButton
            orderData={whatsappOrderData}
            onBack={() => setStep("select")}
          />
        )}

        {/* Bre-B: pago inmediato con llave */}
        {step === "breb" && (
          <div>
            <BreBPayment amount={cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} />
            <button
              onClick={() => setStep("select")}
              className="mt-4 w-full text-center text-sm font-medium text-gray-500 underline hover:text-gray-700"
            >
              Volver
            </button>
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
              Tu pedido ha sido confirmado. Te contactaremos pronto.
            </p>
            <Link
              href="/"
              onClick={handleFinish}
              className="mt-6 rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle size={48} className="text-red-500" />
            <h3 className="mt-3 text-xl font-bold text-gray-800">
              No pudimos procesar tu pago
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm">
              {errorMsg 
                ? errorMsg.includes("Nequi") 
                  ? "Verifica tu número de teléfono (10 dígitos, ej. 3001234567) y vuelve a intentar." 
                  : errorMsg.includes("rechazado") 
                    ? `Tu pago con ${selectedMethod === "ADDI" ? "Addi" : "Sistecredito"} fue rechazado. Prueba con Bre-B o escribe a WhatsApp y te ayudamos a financiar.` 
                    : errorMsg.includes("Producto no existe")
                      ? "Una montura de tu carrito ya no está disponible. Vuelve al catálogo y agrégala de nuevo."
                      : errorMsg 
                    : "Hubo un error temporal. Intenta de nuevo o paga por Bre-B."}
            </p>
            <div className="mt-4 flex flex-col gap-2 w-full">
              <button
                onClick={() => setStep("select")}
                className="rounded-xl bg-[#008294] px-6 py-3 text-sm font-bold text-white hover:bg-[#005f6b] min-h-[44px]"
              >
                Probar otro método
              </button>
              <a href="https://wa.me/573017391219" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
                Hablar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
