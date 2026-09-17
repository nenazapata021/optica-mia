"use client";

import Image from "next/image";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface WhatsAppCheckoutModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  paymentMethod: "ADDI" | "SISTECREDITO";
  orderSummary: {
    products: string[];
    total: number;
    quantity?: number[];
  };
  customerData: {
    name: string;
    phone?: string;
    email?: string;
  };
  orderId?: string;
  onClose: () => void;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573017391219";

function buildWhatsAppMessage(
  paymentMethod: "ADDI" | "SISTECREDITO",
  customerName: string,
  products: string[],
  total: number,
  quantity?: number[]
): string {
  const metodo = paymentMethod === "ADDI" ? "Addi" : "Sistecredito";
  const productLines = products
    .map((product, index) => `- ${product} x${quantity?.[index] || 1}`)
    .join("\n");

  const message =
    `Hola, quiero comprar con ${metodo}.\n` +
    `Cliente: ${customerName}\n` +
    `Productos:\n${productLines}\n` +
    `Total: $${total.toLocaleString("es-CO")}`;

  return message;
}

export default function WhatsAppCheckoutModal({
  open,
  setOpen,
  paymentMethod,
  orderSummary,
  customerData,
  onClose,
}: WhatsAppCheckoutModalProps) {
const whatsappMessage = buildWhatsAppMessage(
    paymentMethod,
    customerData.name,
    orderSummary.products,
    orderSummary.total,
    orderSummary.quantity
  );

  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573017391219"}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl transform scale-100 transition-all duration-300"
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Finaliza tu compra por WhatsApp
        </h2>

        <p className="mb-8 text-sm text-gray-500">
          Para finalizar tu compra con {paymentMethod === "ADDI" ? "Addi" : "Sistecredito"},
          un asesor te va a atender por WhatsApp.
        </p>

        <div className="mb-8 p-6 rounded-xl bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-2">Resumen del pedido</h3>
          <p className="text-gray-600">
            {orderSummary.products.map((product, index) => (
              <span key={index}>
                {"- "}{product}{" x"}{orderSummary.quantity?.[index] || 1}
                <br />
              </span>
            ))}
            <strong>Total: ${orderSummary.total.toLocaleString("es-CO")}</strong>
          </p>
        </div>

        {/* Botón principal: Continuar por WhatsApp */}
        <div className="mb-8">
          <button
            onClick={() => {
              window.open(whatsappUrl, "_blank");
              setOpen(false);
            }}
            className="w-full rounded-xl bg-[#25D366] px-8 py-3 text-sm font-semibold text-white hover:bg-[#20BD5C] transition-colors flex items-center justify-center gap-3"
            aria-label="Continuar por WhatsApp"
          >
            <svg
              viewBox="0 0 24 24"
              fill="#ffffff"
              width="20"
              height="20"
              aria-hidden="true"
            >
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
            Continuar por WhatsApp
          </button>
        </div>

        {/* Link secundario: Volver */}
        <div className="flex justify-end">
          <a
            onClick={() => setOpen(false)}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Volver
          </a>
        </div>
      </div>
    </div>
  );
}