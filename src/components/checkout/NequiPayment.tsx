"use client";

import { useState } from "react";
import Image from "next/image";

interface NequiPaymentProps {
  amount: number;
  transactionId?: string;
  nequiQrUrl?: string;
  onStatusChange?: (status: string) => void;
}

export default function NequiPayment({
  amount,
  transactionId,
  nequiQrUrl,
  onStatusChange,
}: NequiPaymentProps) {
  const [polling, setPolling] = useState(false);
  const [status, setStatus] = useState<string>("PENDING");

  const checkStatus = async () => {
    if (!transactionId) return;
    setPolling(true);
    try {
      const res = await fetch(
        `/api/payments/nequi/status?transactionId=${transactionId}`
      );
      if (res.ok) {
        const data = await res.json();
        const newStatus = data.transaction?.status ?? "PENDING";
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch {
      // silent
    } finally {
      setPolling(false);
    }
  };

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-xl font-semibold">Pagar con Nequi</h2>

      <p className="mt-2">Total a pagar:</p>

      <p className="text-2xl font-bold text-[#008294]">
        ${amount.toLocaleString("es-CO")} COP
      </p>

      {nequiQrUrl && (
        <div className="mt-6 flex flex-col items-center">
          <div className="relative h-56 w-56 overflow-hidden rounded-xl border bg-white p-4">
            <Image
              src={nequiQrUrl}
              alt="Código QR Nequi"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Escanea el código QR con tu app de Nequi
          </p>
        </div>
      )}

      {!nequiQrUrl && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Se generará un código QR al proceder al pago.
          </p>
        </div>
      )}

      {transactionId && status === "PENDING" && (
        <button
          onClick={checkStatus}
          disabled={polling}
          className="mt-4 w-full rounded-lg border border-[#008294] py-2 text-sm font-medium text-[#008294] transition hover:bg-[#008294] hover:text-white disabled:opacity-50"
        >
          {polling ? "Verificando..." : "Verificar estado del pago"}
        </button>
      )}

      {status === "APPROVED" && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
          Pago aprobado
        </div>
      )}

      {status === "DECLINED" && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm font-medium text-red-700">
          Pago rechazado. Intenta con otro método.
        </div>
      )}

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="font-medium">¿Cómo pagar con Nequi?</p>

        <ol className="mt-2 list-decimal pl-5 text-sm">
          <li>Abre la app de Nequi en tu celular.</li>
          <li>Escanea el código QR mostrado arriba.</li>
          <li>Verifica el monto y el receptor.</li>
          <li>Confirma el pago.</li>
        </ol>
      </div>
    </div>
  );
}
