import React from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { Heart, Share2, ShoppingCart } from 'lucide-react';

export default function ProductInfo({ producto }) {
  const { agregarAlCarrito } = useCart();
  const router = useRouter();

  if (!producto) return null;

  const handleAddToCart = () => {
    agregarAlCarrito(producto);
    router.push(`/carrito?productoAgregado=${encodeURIComponent(producto.nombre)}`);
  };

  return (
    <div className="flex flex-col p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">{producto.nombre}</h2>
      <p className="text-gray-500 mb-4">{producto.descripcion || 'Una montura elegante y moderna para cualquier ocasión.'}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="font-semibold text-gray-600">Modelo</p>
          <p className="text-gray-800">{producto.modelo || 'Clásico'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-600">Material</p>
          <p className="text-gray-800">{producto.material || 'Acetato'}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="font-semibold text-gray-600 mb-2">Color</p>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-black border-2 border-blue-500" title="Negro"></button>
          <button className="w-8 h-8 rounded-full bg-transparent border-2 border-gray-300" title="Transparente"></button>
          <button className="w-8 h-8 rounded-full bg-red-700 border-2 border-gray-300" title="Vino"></button>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-4xl font-bold text-[#005f6b]">${producto.precio.toLocaleString('es-CO')}</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white text-base transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#008294" }}
        >
          <ShoppingCart size={20} /> Agregar al carrito
        </button>
        <div className="flex gap-3">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-gray-700 text-base border border-gray-300 bg-white transition hover:bg-gray-50 active:scale-95"
          >
            <Heart size={20} /> Favoritos
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-gray-700 text-base border border-gray-300 bg-white transition hover:bg-gray-50 active:scale-95"
          >
            <Share2 size={20} /> Compartir
          </button>
        </div>
      </div>
    </div>
  );
}