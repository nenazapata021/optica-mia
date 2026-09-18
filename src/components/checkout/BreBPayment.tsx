"use client";

import { useState } from "react";

export default function BreBPayment({ amount }: { amount: number }) {
  const [copied, setCopied] = useState(false);

  const brebKey = process.env.NEXT_PUBLIC_BREB_KEY;

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(brebKey ?? "");
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("No se pudo copiar la llave:", error);
    }
  };

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Pagar con Bre-B
      </h2>

      <p className="mt-2">
        Total a pagar:
      </p>

      <p className="text-2xl font-bold">
        ${amount.toLocaleString("es-CO")} COP
      </p>

      <div className="mt-6">
        <p className="text-sm text-gray-600">
          Llave Bre-B de Óptica Mia
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-lg bg-gray-100 px-4 py-3 font-mono">
            {brebKey}
          </span>

          <button
            type="button"
            onClick={copyKey}
            className="rounded-lg px-4 py-3"
          >
            {copied ? "Copiada ✓" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="font-medium">
          ¿Cómo pagar?
        </p>

        <ol className="mt-2 list-decimal pl-5 text-sm">
          <li>Abre la aplicación de tu banco.</li>
          <li>Ingresa a Bre-B.</li>
          <li>Selecciona pago con llave.</li>
          <li>Escribe la llave de Óptica Mia.</li>
          <li>Ingresa el valor de tu compra.</li>
          <li>Verifica el receptor antes de confirmar.</li>
        </ol>
      </div>
    </div>
  );
}