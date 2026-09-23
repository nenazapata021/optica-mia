"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContextType";
import { useFavorites } from "../context/FavoritesContext";
import { type Producto } from "../types/producto";
import { Heart, LoaderCircle } from "lucide-react";
import ModalProbador from "../modal probador/modalProbador";
import TipoLenteModal from "../tipo-lente/TipoLenteModal";
import RegistroModal from "../components/RegistroModal";
import ProductImageHover from "../components/ProductImageHover";
import { type StaticImageData } from "next/image";

interface CatalogoProps {
  titulo: string;
  descripcion: string;
  listaProductos: Producto[];
  headingAs?: "h1" | "h2";
}

function getFirstImage(image: Producto["image"]): string | StaticImageData {
  if (Array.isArray(image)) return image[0];
  return image;
}

export default function Catalogo({ titulo, descripcion, listaProductos = [], headingAs = "h1" }: CatalogoProps) {
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
  const [productoPendiente, setProductoPendiente] = useState<Producto | null>(null);
  const [verificando, setVerificando] = useState(false);

  const [orden, setOrden] = useState<"relevancia" | "precio-asc" | "precio-desc">("relevancia");

  const router = useRouter();

  const productosBase = listaProductos.filter((p) => {
    if (filtro === "todos") return true;
    return p.categoria === filtro;
  });
  const productosFiltrados = [...productosBase].sort((a, b) => {
    if (orden === "precio-asc") return (a.price ?? 0) - (b.price ?? 0);
    if (orden === "precio-desc") return (b.price ?? 0) - (a.price ?? 0);
    return 0;
  });

  const categorias = ["todos", ...Array.from(new Set(listaProductos.map(p => p.categoria)))];

  const todosLosColores = Array.from(
    new Set(
      listaProductos.flatMap((p) => (p.color ?? "").trim()).filter(Boolean)
    )
  );

  const handleSeleccionarMontura = async (producto: Producto) => {
    const cached = localStorage.getItem("optica-mia-customer-data");
    if (cached) {
      setProductoParaLentes(producto);
      return;
    }

    setVerificando(true);
    try {
      const res = await fetch("/api/user/status");
      const data = await res.json().catch(() => ({ isFirstTime: true }));
      if (data.isFirstTime === false) {
        localStorage.setItem("optica-mia-customer-data", JSON.stringify({ nombre: "Cliente web" }));
        setProductoParaLentes(producto);
        return;
      }
      setProductoPendiente(producto);
    } catch {
      setProductoPendiente(producto);
    } finally {
      setVerificando(false);
    }
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

      {productoPendiente && (
        <RegistroModal
          producto={productoPendiente}
          onClose={() => setProductoPendiente(null)}
          onSuccess={(customer) => {
            localStorage.setItem(
              "optica-mia-customer-data",
              JSON.stringify({ id: customer.id, nombre: customer.nombre, email: customer.email })
            );
            const p = productoPendiente;
            setProductoPendiente(null);
            setProductoParaLentes(p);
          }}
        />
      )}

      {verificando && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-white/60 p-4">
          <LoaderCircle size={32} className="animate-spin text-[#008294]" />
        </div>
      )}

      <div className="w-full min-h-screen bg-slate-50 py-10 px-2">
        <div className="max-w-6xl mx-auto text-center mb-10">
          {headingAs === "h1" ? (
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{titulo}</h1>
          ) : (
            <h2 className="text-4xl font-bold text-gray-800 mb-2">{titulo}</h2>
          )}
          <p className="text-gray-600 max-w-xl mx-auto">{descripcion}</p>

          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex justify-center gap-2 flex-wrap" role="group" aria-label="Filtrar por categoría">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltro(cat)}
                  aria-pressed={filtro === cat}
                  className={`px-5 py-2 text-sm rounded-full capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294] min-h-[44px] ${filtro === cat ? "font-semibold text-white bg-[#008294]" : "font-medium bg-[#e0f2f4] text-[#005f6b] hover:opacity-80"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="orden-catalogo" className="text-sm text-gray-600">Ordenar:</label>
              <select
                id="orden-catalogo"
                value={orden}
                onChange={(e) => setOrden(e.target.value as typeof orden)}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#008294] focus:ring-2 focus:ring-[#008294]/20 min-h-[44px]"
              >
                <option value="relevancia">Relevancia</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
              </select>
              <span className="text-sm text-gray-500 ml-2" aria-live="polite">{productosFiltrados.length} productos</span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {productosFiltrados.map((producto, idx) => (
            <div key={producto.id} className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              
              <div className="relative w-full mb-4">
                <ProductImageHover
                  imageFront={getFirstImage(producto.image)}
                  imageSide={producto.imageSide}
                  alt={`${producto.name} ${producto.color ?? ""} - Montura ${producto.categoria} Óptica Mía Itagüí 452 Cra 49`.trim()}
                  priority={idx < 3}
                  href={`/producto/${producto.id}`}
                  className="w-full aspect-[4/3]"
                />
                <button
                  onClick={(e) => { e.preventDefault(); toggleFavorite(producto); }}
                  className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md transition hover:scale-110"
                  aria-label={isFavorite(producto.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Heart
                    size={20}
                    className={isFavorite(producto.id) ? "fill-red-500 text-red-500" : "text-gray-400"}
                  />
                </button>
              </div>
              <div className="flex flex-col [flex-grow]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col pr-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      <a href={`/producto/${producto.id}`} className="hover:text-[#008294] hover:underline">
                        {producto.name}
                      </a>
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
                    className="w-full py-3 rounded-xl font-medium text-[#005f6b] bg-white border-2 border-[#e0f2f4] hover:bg-[#e0f2f4] hover:border-[#008294]/20 transition-colors flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294]"
                    aria-label={`Probar ${producto.name} en probador virtual`}
                  >
                    <span aria-hidden>👓</span> Probar virtual
                  </button>
                  <button
                    onClick={() => handleSeleccionarMontura(producto)}
                    className="w-full py-3 rounded-xl font-bold text-white bg-[#008294] hover:bg-[#005f6b] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005f6b] focus-visible:ring-offset-2"
                    aria-label={`Seleccionar ${producto.name} y elegir lentes`}
                  >
                    Seleccionar — ${(producto.price ?? 0).toLocaleString("es-CO")}
                  </button>
                  <p className="text-[11px] text-center text-gray-400">IVA incluido • Envío gratis Medellín/Itagüí</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}