"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const METODO_LABEL: Record<string, string> = {
  ADDI: "Addi",
  SISTECREDITO: "Sistecredito",
};

function PagoDemoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tx = params.get("tx") ?? "";
  const metodo = params.get("metodo") ?? "";
  const monto = Number(params.get("monto") ?? "0") / 100;

  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [mensaje, setMensaje] = useState("");

  const aprobar = async () => {
    setEstado("loading");
    try {
      const res = await fetch("/api/wompi/demo-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: tx }),
      });
      if (!res.ok) throw new Error("No se pudo aprobar el pago");
      setEstado("ok");
      setTimeout(() => router.push("/carrito?pago=demo-aprobado"), 1200);
    } catch {
      setMensaje("Ocurrió un error al aprobar el pago en modo demo.");
      setEstado("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        {estado === "ok" ? (
          <>
            <CheckCircle size={56} className="mx-auto text-green-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-800">
              ¡Pago aprobado!
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Redirigiendo a tu carrito...
            </p>
          </>
        ) : (
          <>
            <ShieldCheck size={56} className="mx-auto text-[#008294]" />
            <h1 className="mt-4 text-2xl font-bold text-gray-800">
              Pago en modo demo
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Estás simulando un pago con{" "}
              <span className="font-semibold text-gray-700">
                {METODO_LABEL[metodo] ?? metodo}
              </span>
              .
            </p>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Método</span>
                <span className="font-medium text-gray-800">
                  {METODO_LABEL[metodo] ?? metodo}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Total</span>
                <span className="font-bold text-[#008294]">
                  ${monto.toLocaleString("es-CO")}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Referencia</span>
                <span className="max-w-[180px] truncate font-mono text-xs text-gray-700">
                  {tx}
                </span>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              Esto es una simulación. No se realiza ningún cargo real.
            </p>

            {estado === "error" && (
              <p className="mt-4 flex items-center justify-center gap-1 text-sm text-red-500">
                <AlertCircle size={16} /> {mensaje}
              </p>
            )}

            <button
              onClick={aprobar}
              disabled={estado === "loading"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C39C4E] px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#D4AF37] disabled:opacity-60"
            >
              {estado === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Aprobando...
                </>
              ) : (
                "Aprobar pago"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaginaPagoDemo() {
  return (
    <Suspense fallback={null}>
      <PagoDemoContent />
    </Suspense>
  );
}
