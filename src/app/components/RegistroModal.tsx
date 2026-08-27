"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { type Producto } from "../types/producto";

interface RegistroModalProps {
  producto: Producto;
  onClose: () => void;
  onSuccess: (customer: { id: string; nombre: string; email: string }) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Colombia: móvil 3 + 9 dígitos; fijo 7-10 dígitos; acepta prefijo +57.
const PHONE_RE = /^(?:\+57)?\s?(?:3\d{9}|[1-7]\d{6,9})$/;

export default function RegistroModal({ producto, onClose, onSuccess }: RegistroModalProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading && !success) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [loading, success, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre completo es obligatorio.");
    if (!email.trim()) return setError("El correo electrónico es obligatorio.");
    if (!EMAIL_RE.test(email.trim())) return setError("Ingresa un correo electrónico válido.");
    if (telefono.trim() && !PHONE_RE.test(telefono.trim()))
      return setError("Ingresa un teléfono colombiano válido (ej. 3123456789 o +57 3123456789).");

    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "No se pudo completar el registro. Intenta de nuevo.");

      setSuccess(true);
      setTimeout(() => onSuccess({ id: data.id, nombre: nombre.trim(), email: email.trim() }), 1100);
    } catch {
      setError("Error de conexión con el servidor. Verifica tu red e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => { if (!loading && !success) onClose(); }}
      role="dialog" aria-modal="true" aria-labelledby="registro-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} disabled={loading || success} aria-label="Cerrar"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 disabled:opacity-40">
          <X size={22} />
        </button>

        <div className="mb-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#008294]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[#005f6b]">Óptica Mía</span>
        </div>
        <h2 id="registro-title" className="text-2xl font-bold text-slate-800">Bienvenido a Óptica Mía</h2>
        <p className="mt-1 text-sm text-slate-500">
          Regístrate para continuar con <span className="font-medium text-slate-700">{producto.name}</span> y guardar tu información.
        </p>

        {success ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 py-8 text-center">
            <CheckCircle2 size={48} className="text-[#008294]" />
            <p className="text-base font-semibold text-slate-800">¡Registro completado!</p>
            <p className="text-sm text-slate-500">Te estamos llevando a tu selección…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="reg-nombre" className="block text-sm font-medium text-slate-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input id="reg-nombre" ref={firstFieldRef} type="text" value={nombre}
                onChange={(e) => setNombre(e.target.value)} placeholder="Ej: María Fernanda López"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]" required />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input id="reg-email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]" required />
            </div>

            <div>
              <label htmlFor="reg-telefono" className="block text-sm font-medium text-slate-700">
                Teléfono <span className="text-slate-400">(opcional)</span>
              </label>
              <input id="reg-telefono" type="tel" value={telefono}
                onChange={(e) => setTelefono(e.target.value)} placeholder="3123456789"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]" />
              <p className="mt-1 text-xs text-slate-400">Número colombiano (móvil 10 dígitos o fijo).</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#008294] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005f6b] disabled:opacity-60">
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? "Guardando…" : "Continuar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
