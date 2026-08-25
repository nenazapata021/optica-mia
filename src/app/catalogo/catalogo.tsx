"use client";

import { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from 'next/image';
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContextType";
import { useFavorites } from "../context/FavoritesContext";
import { type Producto } from "../types/producto";
import { Heart } from "lucide-react";
import ModalProbador from "../modal probador/modalProbador";
import TipoLenteModal from "../tipo-lente/TipoLenteModal";

interface CatalogoProps {
  titulo: string;
  descripcion: string;
  listaProductos: Producto[];
}

// --- FUNCIÓN AUXILIAR PARA MANEJAR LA IMAGEN ---
// Esta función se encarga de obtener la fuente de la imagen de forma segura.
function getProductImageSrc(image: Producto['image']): string | StaticImageData | null {
  if (Array.isArray(image)) {
    // Si es un arreglo, devuelve la primera imagen (o null si está vacío)
    return image.length > 0 ? image[0] : null;
  }
  // Si no es un arreglo, devuelve la imagen directamente (o null si es nulo/undefined)
  return image || null;
}
export default function Catalogo({ titulo, descripcion, listaProductos = [] }: CatalogoProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [filtro, setFiltro] = useState("todos");
  const primerRender = useRef(true);

  useEffect(() => {
    const guardado = localStorage.getItem("optica-mia-filtro-categoria");
    const categoriasValidas = ["todos", ...Array.from(new Set(listaProductos.map(p => p.categoria)))];
    if (guardado && categoriasValidas.includes(guardado)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltro(guardado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    localStorage.setItem("optica-mia-filtro-categoria", filtro);
  }, [filtro]);
  const [productoParaProbar, setProductoParaProbar] = useState<Producto | null>(null);
  const [productoParaLentes, setProductoParaLentes] = useState<Producto | null>(null);

  const router = useRouter();

  const productosFiltrados = listaProductos.filter((p) => {
    if (filtro === "todos") return true;
    return p.categoria === filtro;
  });

  const categorias = ["todos", ...Array.from(new Set(listaProductos.map(p => p.categoria)))];

  const todosLosColores = Array.from(
    new Set(
      listaProductos.flatMap((p) => (p.color ?? "").trim()).filter(Boolean)
    )
  );

  const handleSeleccionarMontura = (producto: Producto) => {
    setProductoParaLentes(producto);
  };

  const handleLensSelect = (tipo: string, color?: string) => {
    if (!productoParaLentes) return;
    const producto = productoParaLentes;
    setProductoParaLentes(null);
    const productoParaCarrito = {
      ...producto,
      image: Array.isArray(producto.image) ? producto.image[0] : producto.image,
    };
    addToCart(productoParaCarrito, tipo, color);

    const customerData = JSON.parse(localStorage.getItem("optica-mia-customer-data") || "null");
    const order = {
      id: crypto.randomUUID(),
      items: [{ productId: producto.id, name: producto.name, quantity: 1, price: producto.price, lensType: tipo, color }],
      total: producto.price,
      date: new Date().toISOString(),
      customer: customerData?.nombre || "Cliente web",
    };
    const existing = JSON.parse(localStorage.getItem("optica-mia-orders") || "[]");
    existing.unshift(order);
    localStorage.setItem("optica-mia-orders", JSON.stringify(existing));

    router.push("/carrito");
  };

  const getButtonClass = (cat: string) =>
    filtro === cat
      ? "px-5 py-2 text-sm font-semibold rounded-full capitalize transition text-white bg-[#008294]"
      : "px-5 py-2 text-sm font-medium rounded-full capitalize transition hover:opacity-80 bg-[#e0f2f4] text-[#005f6b]";

  return (
    <>
      {productoParaProbar && (
        <ModalProbador
          producto={productoParaProbar}
          onClose={() => setProductoParaProbar(null)}
          listaMonturas={listaProductos}
        />
      )}
      {productoParaLentes && (
        <TipoLenteModal
          producto={productoParaLentes}
          colores={todosLosColores}
          onSelect={handleLensSelect}
          onClose={() => setProductoParaLentes(null)}
        />
      )}

      <div className="w-full min-h-screen bg-slate-50 py-10 px-2">
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

        <div className="mx-auto grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              
              {(() => {
                const imageSrc = getProductImageSrc(producto.image);
                return (
              <div className="relative w-full h-56 rounded-xl overflow-hidden mb-4 bg-gray-50">
                    {imageSrc && <Image 
                      src={imageSrc}
                      alt={producto.name}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />}
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(producto); }}
                      className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md transition hover:scale-110"
                      aria-label={isFavorite(producto.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                      <Heart
                        size={20}
                        className={isFavorite(producto.id) ? "fill-red-500 text-red-500" : "text-gray-400"}
                      />
                    </button>
              </div>
                );
              })()}
              <div className="flex flex-col [flex-grow]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col pr-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {producto.name}
                    </h3>
                    {producto.reference && (
                      <span className="text-sm text-gray-500">Ref: {producto.reference}</span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-[#008294] text-right whitespace-nowrap">
                    ${(producto.price ?? 0).toLocaleString("es-CO")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 capitalize mb-4">
                  <span>{producto.categoria}</span>
                  {producto.color && <span>{producto.color.split('/')[0]}</span>}
                </div>

                <div className="border-t border-gray-200 my-4"></div>

                <div className="mt-auto flex flex-col gap-2">
                   <button
                    onClick={() => setProductoParaProbar(producto)}
                    className="w-full py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    🕶️ Probar simulador
                  </button>
                  <button
                    onClick={() => handleSeleccionarMontura(producto)}
                    className="w-full py-2.5 rounded-lg font-semibold text-white bg-[#D4AF37] hover:bg-[#D4AF37] transition-colors"
                  >
                    Seleccionar Montura
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}