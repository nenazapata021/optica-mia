"use client";

import React from 'react';
import { useCart } from '../context/CartContextType';
import { useRouter } from 'next/navigation';
import { Heart, Share2, ShoppingCart, Check } from 'lucide-react';
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
    <div className="flex flex-col p-4">
      <span className="text-sm font-semibold uppercase tracking-wider text-[#008294] mb-1">
        {producto.categoria}
      </span>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">{producto.name}</h2>
      <p className="text-gray-500 mb-4">{producto.descripcion || 'Una montura elegante y moderna para cualquier ocasión.'}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="font-semibold text-gray-600">Modelo</p>
          <p className="text-gray-800">{producto.modelo || 'N/A'}</p>
        </div>
      </div>

      {producto.color && (
        <div className="mb-6">
          <p className="font-semibold text-gray-600 mb-2">Color</p>
          <div className="flex flex-wrap gap-3">
            {producto.color.split('/').map((color) => (
              <button
                key={color}
                onClick={() => setColorSeleccionado(color)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${
                  colorSeleccionado === color
                    ? "bg-[#008294] text-white border-[#008294]"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {colorSeleccionado === color && <Check size={16} />}
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <p className="text-4xl font-bold text-[#008294]">${producto.price.toLocaleString('es-CO')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white text-base transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#008294" }}
        >
          <ShoppingCart size={20} /> Agregar al carrito
        </button>
        <div className="flex gap-3">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-gray-700 text-base border border-gray-300 bg-white transition hover:bg-gray-50 active:scale-95"
            onClick={() => toast.info("Función en desarrollo")}
          >
            <Heart size={20} /> Favoritos
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-gray-700 text-base border border-gray-300 bg-white transition hover:bg-gray-50 active:scale-95"
            onClick={() => toast.info("Función en desarrollo")}
          >
            <Share2 size={20} /> Compartir
          </button>
        </div>
      </div>
    </div>
  );
}