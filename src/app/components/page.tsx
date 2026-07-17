"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContextType";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export default function CarritoPage() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalPrice,
    totalItems,
  } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-92px)] max-w-4xl flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <ShoppingCart size={64} className="text-slate-400" />
        <h1 className="text-3xl font-bold text-slate-800">Tu carrito está vacío</h1>
        <p className="text-lg text-slate-600">
          Parece que aún no has añadido ninguna montura. ¡Explora nuestros productos y encuentra tu estilo!
        </p>
        <Link
          href="/lentes"
          className="mt-4 rounded-md bg-[#008294] px-6 py-3 text-lg font-semibold text-white transition hover:bg-[#006a7a]"
        >
          Ver Lentes
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-92px)] bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Carrito de Compras
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Columna Izquierda: Artículos del carrito */}
          <div className="lg:col-span-2">
            <ul className="space-y-6">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={Array.isArray(item.image) ? item.image[0] : item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-md border object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {item.name}
                      </h3>
                      <p className="text-base text-[#008294]">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    {/* Selector de Cantidad */}
                    <div className="flex items-center gap-2 rounded-md border border-slate-300 p-1">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="rounded p-1 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="rounded p-1 text-slate-600 transition hover:bg-slate-100"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Botón de Eliminar */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-500 transition hover:text-red-600"
                      aria-label="Eliminar artículo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna Derecha: Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 border-b pb-4 text-xl font-semibold text-slate-900">
                Resumen del Pedido
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal ({totalItems} productos)</span>
                  <span className="font-medium text-[#008294]">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Envío</span>
                  <span className="font-medium text-green-600">Gratis</span>
                </div>
                <div className="flex justify-between border-t pt-4 text-lg font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-[#008294]">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <button className="mt-6 w-full rounded-md bg-[#D4AF37] py-3 text-lg font-semibold text-slate-900 transition hover:bg-[#C39C4E]">
                Proceder al Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
