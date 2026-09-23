"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContextType";
import { useFavorites } from "../context/FavoritesContext";
import { type Producto } from "../types/producto";
import { toast } from "sonner";
import { Heart, Share2, ShoppingCart, Check, ScanFace } from "lucide-react";
import ModalProbador from "../modal probador/modalProbador";
import ProductGallery from "../components/ProductGallery";
import { normalizeProductImages } from "../utils/productImages";

interface DetalleProductoProps {
  producto: Producto;
}

export default function DetalleProducto({ producto }: DetalleProductoProps) {
  const [colorSeleccionado, setColorSeleccionado] = useState(producto.color?.split('/')[0]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const galleryImages = useMemo(() => normalizeProductImages(producto), [producto]);

const { addToCart } = useCart();
   const { toggleFavorite, isFavorite } = useFavorites();
   const router = useRouter();

  if (!producto) return null;

  const handleAddToCart = () => {
    const mainUrl = galleryImages[0]?.url ?? (Array.isArray(producto.image) ? producto.image[0] : producto.image);
    const productoParaCarrito: Producto = {
      ...producto,
      image: mainUrl as never,
      images: galleryImages,
    };
    addToCart(productoParaCarrito);
    toast.success(`${producto.name} agregado al carrito!`, {
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
          {/* Columna Izquierda: Galería de Imágenes — 55-60% ancho en desktop */}
          <ProductGallery images={galleryImages} productName={producto.name} className="w-full" />

          {/* Columna Derecha: Información del Producto */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#008294]">
              {producto.categoria}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mt-1 mb-3">
              {producto.name}
            </h1>
            <p className="text-sm text-slate-500 mb-4">Modelo: {producto.modelo}</p>

            <p className="text-4xl font-bold text-[#008294] mb-6">
              ${producto.price.toLocaleString("es-CO")}
            </p>

            <div className="prose prose-slate max-w-none text-slate-600 mb-8">
              <p>{producto.descripcion}</p>
            </div>

            {/* Selector de Color */}
            {producto.color && (
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
            )}

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
                <ScanFace size={22} />
                Probar en Simulador
              </button>
              <div className="grid grid-cols-2 gap-3">
                  <button
                  onClick={() => toggleFavorite(producto)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-slate-700 bg-white border border-slate-300 transition hover:bg-slate-100 active:scale-[0.98]"
                  aria-label={isFavorite(producto.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Heart size={20} className={isFavorite(producto.id) ? "fill-red-500 text-red-500" : ""} />
                  {isFavorite(producto.id) ? "Quitar de Favoritos" : "Agregar a Favoritos"}
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
