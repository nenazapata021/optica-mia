"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { Heart, Share2, ShoppingCart, Check } from "lucide-react";
import ModalProbador from "./ModalProbador"; // Importamos el nuevo modal

export default function DetalleProducto({ producto }) {
  const [imagenPrincipal, setImagenPrincipal] = useState(producto.imagen[0]);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("M");
  const [colorSeleccionado, setColorSeleccionado] = useState(producto.color.split('/')[0]);
  const [mostrarModal, setMostrarModal] = useState(false); // Estado para el modal
  
  const { agregarAlCarrito } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    const productoParaCarrito = {
      ...producto,
      imagen: producto.imagen[0], // Siempre usa la primera imagen para el carrito
    };
    agregarAlCarrito(productoParaCarrito);
    toast.success(`${producto.nombre} agregado al carrito!`, {
      action: {
        label: "Ver carrito",
        onClick: () => router.push("/carrito"),
      },
    });
  };

  return (
    <>
      {/* Renderizado condicional del modal */}
      {mostrarModal && (
        <ModalProbador producto={producto} onClose={() => setMostrarModal(false)} />
      )}
    <div className="bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
              <Image
                src={imagenPrincipal}
                alt={`Imagen principal de ${producto.nombre}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {producto.imagen.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImagenPrincipal(img)}
                  className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    imagenPrincipal.src === img.src
                      ? "border-[#008294] ring-2 ring-[#008294]/50"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Miniatura ${index + 1} de ${producto.nombre}`}
                    fill
                    sizes="25vw"
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Información del Producto */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#008294]">
              {producto.categoria}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mt-1 mb-3">
              {producto.nombre}
            </h1>
            <p className="text-sm text-slate-500 mb-4">Modelo: {producto.modelo}</p>

            <p className="text-4xl font-bold text-[#005f6b] mb-6">
              ${producto.precio.toLocaleString("es-CO")}
            </p>

            <div className="prose prose-slate max-w-none text-slate-600 mb-8">
              <p>{producto.descripcion}</p>
            </div>

            {/* Selector de Talla */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Talla</label>
              <div className="flex gap-2">
                {["S", "M", "L"].map((talla) => (
                  <button
                    key={talla}
                    onClick={() => setTallaSeleccionada(talla)}
                    className={`w-12 h-12 rounded-lg border text-sm font-semibold transition ${
                      tallaSeleccionada === talla
                        ? "bg-[#008294] text-white border-[#008294]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Color */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Color</label>
              <div className="flex gap-3">
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

            {/* Botones de Acción */}
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-4 px-6 font-bold text-lg text-slate-900 transition hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{ backgroundColor: "#C39C4E" }}
              >
                <ShoppingCart size={22} />
                Agregar al Carrito
              </button>
              <button
                onClick={() => setMostrarModal(true)}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-4 px-6 font-bold text-lg text-white transition hover:opacity-90 active:scale-[0.98] shadow-lg"
                style={{ backgroundColor: "#008294" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9h2a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-1"/><path d="M22 9h-2a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-1"/><line x1="2" x2="22" y1="9"/></svg>
                Probar en Simulador
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toast.info("Agregado a favoritos (función en desarrollo)")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-slate-700 bg-white border border-slate-300 transition hover:bg-slate-100 active:scale-[0.98]"
                >
                  <Heart size={20} />
                  Favoritos
                </button>
                <button
                  onClick={() => toast.info("Enlace copiado (función en desarrollo)")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-slate-700 bg-white border border-slate-300 transition hover:bg-slate-100 active:scale-[0.98]"
                >
                  <Share2 size={20} />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}