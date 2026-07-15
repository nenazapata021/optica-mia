"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContextType";
import { toast } from "sonner";
import { type Producto } from "../types/producto";

interface CatalogoProps {
  titulo: string;
  descripcion: string;
  listaProductos: Producto[];
}

export default function Catalogo({ titulo, descripcion, listaProductos = [] }: CatalogoProps) {
  const { addToCart } = useCart();
  const [filtro, setFiltro] = useState("todos");
  const router = useRouter();

  const productosFiltrados = listaProductos.filter((p) => {
    if (filtro === "todos") return true;
    return p.categoria === filtro;
  });

  const categorias = ["todos", ...Array.from(new Set(listaProductos.map(p => p.categoria)))];

  const handleAddToCart = (producto: Producto) => {
    const productoParaCarrito = {
      ...producto,
      image: Array.isArray(producto.image) ? producto.image[0] : producto.image,
    };
    addToCart(productoParaCarrito);
    toast.success(`${producto.name} agregado al carrito!`, {
      action: {
        label: "Ver carrito",
        onClick: () => router.push("/carrito"),
      },
    });
  };

  const getButtonClass = (cat: string) =>
    filtro === cat
      ? "px-5 py-2 text-sm font-semibold rounded-full capitalize transition text-white bg-[#008294]"
      : "px-5 py-2 text-sm font-medium rounded-full capitalize transition hover:opacity-80 bg-[#e0f2f4] text-[#005f6b]";

  return (
    <div className="w-full min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{titulo}</h1>
        <p className="text-gray-600 max-w-xl mx-auto">{descripcion}</p>

        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={getButtonClass(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {productosFiltrados.map((producto) => (
          <div key={producto.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 group">
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
              <Image 
                src={Array.isArray(producto.image) ? producto.image[0] : producto.image} 
                alt={producto.name} 
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="flex flex-col [flex-grow]">
              <h3 className="text-lg font-bold text-gray-800 truncate">
                {producto.name} 
              </h3>
              <p className="text-sm text-gray-500 capitalize mb-3">
                {producto.categoria}
              </p>
              <p className="text-xl font-bold text-[#005f6b] mb-4">
                {/* Asegúrate de usar 'producto.price' */}
                ${producto.price.toLocaleString("es-CO")}
              </p>
              <button
                onClick={() => handleAddToCart(producto)}
                className="mt-auto w-full py-2.5 rounded-lg font-semibold text-white bg-[#008294] hover:bg-[#006a7a] transition-colors"
              >
                Seleccionar Montura
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}