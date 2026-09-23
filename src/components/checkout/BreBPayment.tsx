"use client";

import { useState, useRef, useEffect } from "react";
import { BREB_KEY, getBrebDisplayValue } from "@/lib/breb";

export default function BreBPayment({ amount }: { amount: number }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brebKey = getBrebDisplayValue();

  const copyKey = async () => {
    setError("");
    if (!brebKey || brebKey === "No configurada") {
      setError("Llave no configurada");
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(brebKey);
      } else {
        // Fallback para navegadores sin clipboard API
        const ta = document.createElement("textarea");
        ta.value = brebKey;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("No se pudo copiar la llave:", err);
      setError("No se pudo copiar la llave. Cópiala manualmente.");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="rounded-xl border border-[#1A1A6B]/20 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A6B] text-xs font-bold text-white">B</span>
        <h2 className="text-xl font-semibold text-gray-900">Pagar con Bre-B</h2>
        <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Pago inmediato</span>
      </div>

      <p className="mt-3 text-sm text-gray-500">Total a pagar:</p>

      <p className="text-3xl font-extrabold text-[#008294]">${amount.toLocaleString("es-CO")} COP</p>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700">Llave Bre-B de Óptica Mía</p>
        <p className="text-xs text-gray-500">Úsala desde cualquier banco o billetera compatible con Bre-B</p>

        <div className="mt-3 flex items-stretch gap-2">
          <span
            className="flex-1 select-all rounded-lg border-2 border-dashed border-[#1A1A6B]/30 bg-[#1A1A6B]/5 px-4 py-3 text-center font-mono text-lg font-bold tracking-wide text-[#1A1A6B]"
            aria-label={`Llave Bre-B: ${brebKey}`}
          >
            {brebKey}
          </span>

          <button
            type="button"
            onClick={copyKey}
            aria-label="Copiar llave Bre-B al portapapeles"
            className={`shrink-0 rounded-lg px-5 py-3 text-sm font-semibold transition ${
              copied
                ? "bg-green-600 text-white"
                : "bg-[#1A1A6B] text-white hover:bg-[#15155a] active:scale-[0.98]"
            }`}
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
        <p className="mt-2 text-xs text-gray-400">Toca “Copiar” y pégala en tu app bancaria.</p>
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="font-medium text-gray-800">¿Cómo pagar?</p>

        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>Abre la aplicación de tu banco o billetera.</li>
          <li>Ingresa a la zona <span className="font-semibold">Bre-B</span>.</li>
          <li>Selecciona <span className="font-medium">Enviar dinero con llave</span>.</li>
          <li>Escribe la llave <span className="font-mono font-bold text-[#1A1A6B]">{brebKey}</span>.</li>
          <li>Ingresa el valor exacto: <span className="font-bold">${amount.toLocaleString("es-CO")} COP</span>.</li>
          <li>Verifica que el destinatario sea <span className="font-semibold">Óptica Mía</span> y confirma.</li>
        </ol>
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Confirma el pago por WhatsApp después de transferir para agilizar el despacho.
        </p>
      </div>
    </div>
  );
}