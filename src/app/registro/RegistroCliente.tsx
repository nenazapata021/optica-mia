"use client";

import { useState } from "react";
import { X } from "lucide-react";

const LS_CUSTOMER_KEY = "optica-mia-customer-data";

interface RegistroClienteProps {
  onClose: () => void;
  onSuccess: (customerId: string) => void;
}

export default function RegistroCliente({ onClose, onSuccess }: RegistroClienteProps) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim() || !form.direccion.trim()) {
      setError("Todos los campos son obligatorios");
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
      localStorage.setItem(LS_CUSTOMER_KEY, JSON.stringify(customerData));
      onSuccess(data.id);
    } catch {
      setError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="mb-2 text-2xl font-bold text-gray-800">Registro de Cliente</h2>
        <p className="mb-6 text-sm text-gray-500">
          Es tu primera compra. Completa tus datos para continuar.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre completo"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Correo electrónico"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
          <input
            name="telefono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            placeholder="Dirección de envío"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E] disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Confirmar registro"}
          </button>
        </form>
      </div>
    </div>
  );
}
