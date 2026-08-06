"use client";

import React from 'react';
import { useCart } from '../context/CartContextType';
import { useRouter } from 'next/navigation';
import { Heart, Share2, ShoppingCart, Check, Eye } from 'lucide-react';
import { type Producto } from '../types/producto';
import { toast } from 'sonner';

interface ProductInfoProps {
  producto: Producto;
}

export default function ProductInfo({ producto }: ProductInfoProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [colorSeleccionado, setColorSeleccionado] = React.useState(producto?.color?.split('/')[0] || '');

  if (!producto) return null;

  const handleAddToCart = () => {
    addToCart(producto);
    toast.success(`${producto.name} agregado al carrito!`, {
      action: {
        label: "Ver carrito",
        onClick: () => router.push("/carrito"),
      },
    });
  };

  return (
    <div className="flex flex-col p-5">
      {/* Badge de categoría */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#008294]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#008294]">
          <Eye size={12} />
          {producto.categoria}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          Probando virtualmente
        </span>
      </div>

      {/* Nombre y descripción */}
      <h2 className="text-2xl font-bold text-gray-800">{producto.name}</h2>
      <p className="mt-1 text-sm text-gray-500">{producto.descripcion || 'Una montura elegante y moderna para cualquier ocasión.'}</p>

      {/* Modelo */}
      {producto.modelo && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-400">Referencia</p>
          <p className="text-sm font-semibold text-slate-700">{producto.modelo}</p>
        </div>
      )}

      {/* Color */}
      {producto.color && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-gray-600">Color</p>
          <div className="flex flex-wrap gap-2">
            {producto.color.split('/').map((color) => (
              <button
                key={color}
                onClick={() => setColorSeleccionado(color)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  colorSeleccionado === color
                    ? "border-[#008294] bg-[#008294] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {colorSeleccionado === color && <Check size={12} />}
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Precio */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-3xl font-bold text-[#008294]">${producto.price.toLocaleString('es-CO')}</p>
        <p className="mt-1 text-xs text-slate-400">Precio en tienda</p>
      </div>

      {/* Acciones */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[#008294]/20"
          style={{ backgroundColor: "#008294" }}
        >
          <ShoppingCart size={18} /> Agregar al carrito
        </button>
        <div className="flex gap-3">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold text-gray-600 text-sm border border-gray-200 bg-white transition hover:bg-gray-50 active:scale-[0.98]"
            onClick={() => toast.info("Función en desarrollo")}
          >
            <Heart size={16} /> Favoritos
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold text-gray-600 text-sm border border-gray-200 bg-white transition hover:bg-gray-50 active:scale-[0.98]"
            onClick={() => toast.info("Función en desarrollo")}
          >
            <Share2 size={16} /> Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
