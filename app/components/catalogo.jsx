"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function Catalogo({
  titulo,
  descripcion,
  listaProductos = [],
}) {
  const router = useRouter();
  const { agregarAlCarrito } = useCart();

  const [filtro, setFiltro] = useState("todos");

  const productosFiltrados = listaProductos.filter((p) => {
    if (filtro === "todos") return true;
    return p.categoria === filtro;
  });

  const handleFiltroClick = (categoria) => {
    setFiltro(categoria);
  };

  const getButtonClass = (categoria) =>
    filtro === categoria
      ? "px-4 py-2 rounded-full text-sm font-semibold text-white transition"
      : "px-4 py-2 rounded-full text-sm font-medium transition hover:opacity-80";

  const getButtonStyle = (categoria) =>
    filtro === categoria
      ? {
          backgroundColor: "#008294",
          color: "#fff",
        }
      : {
          backgroundColor: "#e0f2f4",
          color: "#005f6b",
        };

  const handleProbarSimulador = (producto) => {
    agregarAlCarrito(producto, { silencioso: true });
    router.push("/probador");
  };

  const handleSeleccionar = (producto) => {
    agregarAlCarrito(producto, { silencioso: true });
    router.push("/carrito");
  };

  return (
    <section className="catalogo py-12 max-w-7xl mx-auto px-4 bg-[#e2f1ee]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {titulo || "Catálogo de Productos"}
        </h1>

        <p className="text-gray-600">{descripcion}</p>
      </div>

      <div className="categorias flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={() => handleFiltroClick("mujer")}
          className={getButtonClass("mujer")}
          style={getButtonStyle("mujer")}
        >
          Mujer
        </button>

        <button
          onClick={() => handleFiltroClick("hombre")}
          className={getButtonClass("hombre")}
          style={getButtonStyle("hombre")}
        >
          Hombre
        </button>

        <button
          onClick={() => handleFiltroClick("niños")}
          className={getButtonClass("niños")}
          style={getButtonStyle("niños")}
        >
          Niños
        </button>

        <button
          onClick={() => handleFiltroClick("sol")}
          className={getButtonClass("sol")}
          style={getButtonStyle("sol")}
        >
          Sol
        </button>

        <button
          onClick={() => handleFiltroClick("todos")}
          className={getButtonClass("todos")}
          style={getButtonStyle("todos")}
        >
          Todos
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-8 capitalize text-left">
        {filtro}

        <span className="text-gray-500 text-lg font-normal">
          {" "}
          ({productosFiltrados.length})
        </span>
      </h2>

      <div className="productos grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {productosFiltrados.map((producto) => (
          <div
            key={producto.id}
            className="hover-scale border rounded-lg shadow-sm p-4 flex flex-col bg-white"
          >
            <div className="rounded-md mb-4 h-48 flex justify-center items-center">
              <Image
                src={producto.imagen}
                alt={producto.nombre}
                width={250}
                height={190}
                className="h-48 object-cover"
              />
            </div>

            <div className="flex flex-col [flex-grow]">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">
                  {producto.nombre}
                </span>

                <strong className="text-blue-600">
                  ${producto.precio.toLocaleString("es-CO")}
                </strong>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 capitalize mb-4">
                <span>{producto.categoria}</span>

                {producto.color && <span>{producto.color}</span>}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleProbarSimulador(producto)}
                  className="w-full bg-gray-100 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium"
                >
                  🥽 Probar simulador
                </button>

                <button
                  onClick={() => handleSeleccionar(producto)}
                  className="w-full mt-2 text-white py-2 rounded-md transition text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: "#008294" }}
                >
                  Seleccionar Montura
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}