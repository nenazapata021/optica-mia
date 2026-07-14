"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingCart, ArrowRight, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CarritoPage() {
  const { cartItems, cartTotal, eliminarDelCarrito, vaciarCarrito, actualizarCantidad } = useCart();

  return (
    <main className="w-full min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Tu Carrito de Compras
        </h1>
        <p className="text-center text-gray-500 mb-12">
          Revisa tus productos y procede al pago.
        </p>

        {cartItems.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center border flex flex-col items-center">
            <ShoppingCart size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-6">
              Tu carrito de compras está vacío.
            </p>
            <Link
              href="/lentes"
              className="rounded-lg bg-[#008294] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Seguir comprando
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4"
                >
                  <Image
                    src={item.imagen}
                    alt={item.nombre}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <div className="[flex-grow] w-full">
                    <h3 className="font-bold text-lg text-gray-800">
                      {item.nombre}
                    </h3>
                    <p className="text-[#005f6b] font-semibold">
                      ${item.precio.toLocaleString("es-CO")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Selector de Cantidad */}
                    <div className="flex items-center gap-2 rounded-md border border-slate-300 p-1">
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                        className="rounded p-1 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        disabled={item.cantidad <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium text-slate-800">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        className="rounded p-1 text-slate-600 transition hover:bg-slate-100"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full transition hover:bg-red-50"
                      aria-label={`Eliminar ${item.nombre}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={vaciarCarrito}
                className="text-sm text-gray-500 hover:text-red-600 self-start mt-2"
              >
                Vaciar carrito
              </button>
            </div>

            {/* Resumen de la compra */}
            <div className="bg-white p-6 rounded-xl border h-fit">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Resumen</h2>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${cartTotal.toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium text-green-600">Gratis</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-extrabold text-[#005f6b]">
                  ${cartTotal.toLocaleString("es-CO")}
                </span>
              </div>
              <button
                className="w-full mt-6 bg-[#C39C4E] text-slate-900 font-bold py-3 rounded-lg transition hover:opacity-90 flex items-center justify-center gap-2"
                onClick={() => alert("¡Procediendo al pago!")}
              >
                Proceder al pago <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}