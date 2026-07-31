"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";

const LS_ONBOARDING_KEY = "optica-mia-onboarding-complete";

interface WelcomeFormModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function WelcomeFormModal({ onClose, onComplete }: WelcomeFormModalProps) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre y correo son obligatorios");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al registrar");
      const data = await res.json();
      const customerData = { ...form, id: data.id };
      localStorage.setItem("optica-mia-customer-data", JSON.stringify(customerData));
      localStorage.setItem(LS_ONBOARDING_KEY, "true");
      setStep("done");
    } catch {
      setError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Cerrar">
          <X size={20} />
        </button>

        <div className="mx-auto mb-8 flex flex-col items-center gap-3">
          <h1 className="text-center text-2xl font-bold text-gray-800">Bienvenido a Óptica Mía</h1>
          <p className="text-center text-sm text-gray-500">Completa tus datos para comenzar</p>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Correo electrónico"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
            <input
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Teléfono (opcional)"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E] disabled:opacity-50"
            >
              {loading ? (
                "Guardando..."
              ) : (
                <>
                  Continuar
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">¡Todo listo!</h2>
            <p className="text-center text-sm text-gray-500">{form.nombre}, gracias por registrarte. Ya puedes explorar nuestros productos.</p>
            <button
              onClick={onComplete}
              className="mt-2 w-full rounded-lg bg-[#D4AF37] py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
            >
              Ir a la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}