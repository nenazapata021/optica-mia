"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContextType";

type PaymentMethod = "wompi" | "addi" | "sistecredito" | "breb";

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: "breb",
    label: "Bre-B",
    description: "Transferencia inmediata con llave @MGA313",
    icon: "/icons/breb.svg",
  },
  {
    value: "wompi",
    label: "Wompi (Tarjeta/PSE/Nequi)",
    description: "Pago con tarjeta, PSE o Nequi",
    icon: "/icons/wompi.svg",
  },
  {
    value: "addi",
    label: "Addi",
    description: "Compra ahora, paga después con Addi",
    icon: "/icons/addi.svg",
  },
  {
    value: "sistecredito",
    label: "Sistecredito",
    description: "Crédito fácil con Sistecredito",
    icon: "/icons/sistecredito.svg",
  },
];

export function PaymentMethodSelector() {
  const { totalPrice, clearCart } = useCart();
  const router = useRouter();

  const handleContinue = async (provider: PaymentMethod) => {
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear pago");
      }

      const data = await res.json();
      router.push(data.checkoutUrl);
    } catch (err) {
      console.error("Error al iniciar pago:", err);
    }
  };

  return (
    <div className="space-y-4">
      {PAYMENT_METHODS.map((method) => (
        <div
          key={method.value}
          onClick={() => handleContinue(method.value)}
          className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-[#D4AF37] transition-colors"
        >
          <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1.5">
            <img
              src={method.icon}
              alt={method.label}
              width={96}
              height={40}
              className="h-full w-auto object-contain"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{method.label}</p>
            <p className="text-sm text-gray-500">{method.description}</p>
          </div>
        </div>
      ))}

      {totalPrice > 0 && (
        <p className="text-right text-sm text-gray-400">
          Total: {totalPrice.toLocaleString("es-CO")}
        </p>
      )}
    </div>
  );
}