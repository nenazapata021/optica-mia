"use client";

import { useState, useRef, useEffect } from "react";
import { BREB_KEY } from "@/lib/breb";

export default function BreBPayment({ amount }: { amount: number }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brebKey = BREB_KEY;

  const copyKey = async () => {
    setError("");
    if (!brebKey) {
      setError("Llave no configurada");
      return;
    }
    if (!navigator?.clipboard?.writeText) {
      setError("Tu navegador no soporta la copia automática");
      return;
    }
    try {
      await navigator.clipboard.writeText(brebKey);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("No se pudo copiar la llave:", error);
      setError("No se pudo copiar la llave");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
            {brebKey ?? "No configurada"}
          </span>

          <button
            type="button"
            onClick={copyKey}
            aria-label="Copiar llave Bre-B al portapapeles"
            className="rounded-lg px-4 py-3"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        {error && (
          <p role="alert" aria-live="assertive" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {copied && (
          <span aria-live="polite" className="sr-only">
            Llave copiada
          </span>
        )}
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