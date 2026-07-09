"use client";
// src/components/Carrito.jsx
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../context/CartContext.jsx';

export default function Carrito() {
  const searchParams = useSearchParams();
  const productoAgregado = searchParams.get('productoAgregado');
  // Extraemos todos los estados y funciones globales directamente del Contexto
  const { 
    cart, 
    incrementarCantidad, 
    decrementarCantidad, 
    eliminarProducto, 
    totalItems, 
    totalDinero 
  } = useCart();

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Tu Carrito de Compras</h1>

        {productoAgregado && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            {productoAgregado} se agregó al carrito correctamente.
          </div>
        )}
        
        {cart.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500 text-lg">Tu carrito de compras está vacío.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna de Productos */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md flex flex-col gap-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="img-zoom-wrap w-16 h-16 rounded-md bg-gray-100 shrink-0">
                      <image src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
                      <p className="text-sm text-gray-500">{item.color}</p>
                      <p className="text-sm font-medium text-teal-600">${item.precio.toLocaleString('es-CO')}</p>
                    </div>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button onClick={() => decrementarCantidad(item.id)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">-</button>
                      <span className="px-3 py-1 text-gray-800 font-medium">{item.quantity}</span>
                      <button onClick={() => incrementarCantidad(item.id)} className="px-3 py-1 text-gray-600 hover:bg-gray-100">+</button>
                    </div>
                    
                    <button
                      onClick={() => eliminarProducto(item.id)}
                      title="Eliminar montura"
                      className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Columna de Resumen de Compra */}
            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Resumen del pedido</h2>
              <div className="flex justify-between mb-4 text-gray-600">
                <span>Productos ({totalItems})</span>
                <span>${totalDinero.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between mb-4 text-gray-600">
                <span>Envío</span>
                <span className="text-green-600 font-semibold">Gratis</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4 text-gray-900">
                <span>Total</span>
                <span>${totalDinero.toLocaleString('es-CO')}</span>
              </div>
              <button className="w-full mt-6 text-white font-bold py-3 rounded-lg transition-colors hover:opacity-90" style={{ backgroundColor: "#008294" }}>
                Proceder al pago
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}