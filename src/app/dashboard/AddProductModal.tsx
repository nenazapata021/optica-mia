"use client";

import { useState, useEffect } from "react";
import { X, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface AddProductModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddProductModal({ onClose, onCreated }: AddProductModalProps) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    categoria: "lentes",
    color: "",
    descripcion: "",
    modelo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.price || !form.image.trim() || !form.categoria) {
      setError("Nombre, precio, imagen y categoría son obligatorios.");
      return;
    }

    const priceNum = Number(form.price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: priceNum,
          image: form.image.trim(),
          categoria: form.categoria,
          color: form.color.trim() || null,
          descripcion: form.descripcion.trim() || "",
          modelo: form.modelo.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "No se pudo crear el producto.");
        return;
      }

      toast.success("Producto creado correctamente");
      onCreated();
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        <h2 id="add-product-title" className="text-xl font-bold text-slate-900 pr-8">
          Añadir producto
        </h2>
        <p className="mt-1 text-sm text-slate-500">Completa los datos para crear un nuevo producto.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Gafas Aviador Classic"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="129000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]"
                required
              >
                <option value="lentes">Lentes</option>
                <option value="sol">Gafas de Sol</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Imagen (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://.../foto.jpg"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Negro, Carey..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Modelo</label>
              <input
                type="text"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="AV-2024"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción breve del producto..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008294] focus:ring-1 focus:ring-[#008294] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#008294] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#005f6b] disabled:opacity-50 transition"
            >
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? "Guardando..." : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
