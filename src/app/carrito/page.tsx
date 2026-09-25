"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { Trash2, ShoppingCart, ArrowRight, Plus, Minus, Check } from "lucide-react";
import { useCart, type CartItem } from "../context/CartContextType";
import { useAuth } from "../context/AuthContext";
import PaymentModal from "../wompi/PaymentModal";

const COLOR_MAP: Record<string, string> = {
  "vino": "#6E2A35",
  "marrón rosado": "#A67F72",
  "dorado": "#D4AF37",
  "dorado claro": "#E6C88C",
  "rosa palo translúcido": "#E8CFC4",
  "rojo vino translúcido": "#B4485A",
  "carey/habana": "#A5673F",
  "negro": "#1A1A1A",
  "plateado": "#C7C9CC",
  "azul translúcido": "#6F8FA8",
  "café": "#6B4A3A",
  "negro mate": "#262626",
  "gris translúcido": "#B8B8B8",
  "dorado rosado": "#D9A79C",
  "negro brillante": "#0D0D0D",
};

const CATALOG_PRODUCT_IDS = new Set([
  "foto1", "foto2", "foto3", "foto4", "foto5", "foto6", "foto7", "foto8",
  "foto9", "foto10", "foto11", "foto12", "foto13", "foto14", "foto15",
  "foto16", "foto17", "foto18", "foto19", "foto20", "foto21",
  "gafas-de-sol1", "gafas-de-sol2", "gafas-de-sol3", "gafas-de-sol4",
  "gafas-de-sol5", "gafas-de-sol6", "gafas-redondas-negras",
]);

function colorHex(nombre: string): string {
  return COLOR_MAP[nombre.toLowerCase().trim()] || "#CCCCCC";
}

function esIDProductoValido(id: string): boolean {
  return CATALOG_PRODUCT_IDS.has(id.toLowerCase());
}

function obtenerIDsNoValidos(cartItems: CartItem[]): string[] {
  const noValidos: string[] = [];
  cartItems.forEach((item) => {
    if (!esIDProductoValido(item.id)) {
      noValidos.push(item.id);
    }
  });
  return noValidos;
}

function SelectorColor({
  colores,
  seleccionado,
  onSelect,
}: {
  colores: string[];
  seleccionado?: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {colores.map((color) => {
        const esSel = seleccionado === color;
        return (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 " +
                (esSel
                  ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/40 scale-110"
                  : "border-gray-300 hover:border-[#D4AF37] hover:scale-105")
              }
              style={{ backgroundColor: colorHex(color) }}
            >
              {esSel && (
                <Check
                  size={16}
                  className={
                    color.toLowerCase().trim() === "blanco"
                      ? "text-gray-700"
                      : "text-white"
                  }
                />
              )}
            </div>
            <span className="text-xs capitalize text-gray-600">{color}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function CarritoPage() {
  const { user, isLoading } = useAuth();
  const {
    cartItems,
    totalPrice,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    updateItemColor,
  } = useCart();

  const [isClient, setIsClient] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<{
    customerId: string;
    info: {
      email: string;
      full_name: string;
      phone_number?: string;
      legal_id?: string;
      legal_id_type?: string;
    };
  } | null>(null);
  const [pedidoCompletado, setPedidoCompletado] = useState(false);
  const [editColorId, setEditColorId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const obtenerColoresItem = (item: CartItem): string[] => {
    return (item.color?.split("/") ?? []).map((c) => c.trim()).filter(Boolean);
  };

  const handlePago = () => {
    if (!user) {
      return;
    }

    const idsNoValidos = obtenerIDsNoValidos(cartItems);
    if (idsNoValidos.length > 0) {
      const mensaje = idsNoValidos.length === 1
        ? `El producto con ID "${idsNoValidos[0]}" no es un ID de producto reconocido. `
        : `Los siguientes IDs de producto no son reconocidos: ${idsNoValidos.join(", ")}. ` +
          "Por favor verifique que sus productos estén en el catálogo.";
      
      console.error("Error de validación de productos:", mensaje);
      alert(mensaje + " Por favor, regrese al catálogo y vuelva a agregar los productos.");
      return;
    }
    
    setPaymentCustomer({
      customerId: user.id,
      info: {
        email: user.email,
        full_name: user.nombre,
        phone_number: undefined,
        legal_id: undefined,
        legal_id_type: undefined,
      },
    });
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setPedidoCompletado(true);
    clearCart();
  };

  if (isLoading) {
    return (
      <main className="w-full min-h-screen bg-[#f8fafc] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#f8fafc] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 mt-0.5">📦</span>
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Solo Medellín e Itagüí</p>
            <p className="text-amber-700/80">Envío gratis 24-48h en Valle de Aburrá. Si estás fuera, coordinamos por <a href="https://wa.me/573017391219" target="_blank" rel="noopener noreferrer" className="underline font-semibold">WhatsApp</a> antes de pagar.</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          <span className="flex items-center gap-1 text-[#008294]"><span className="h-6 w-6 rounded-full bg-[#008294] text-white flex items-center justify-center text-xs">1</span> Carrito</span>
          <span className="h-px w-8 bg-gray-300" />
          <span className="flex items-center gap-1"><span className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">2</span> Pago Wompi</span>
          <span className="h-px w-8 bg-gray-300" />
          <span className="flex items-center gap-1"><span className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">3</span> WhatsApp</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">
          Tu Carrito
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Revisa tus productos — precios con IVA incluido
        </p>

        {!isClient || cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-6 py-10">
            <ShoppingCart size={64} className="text-slate-300" />

            <h2 className="text-2xl font-bold text-slate-700">
              Tu carrito de compras volver al catalogo.
            </h2>

            <p className="text-slate-500">
              Parece que a\u00fan no has a\u00f1adido ninguna montura. \u00a1Explora nuestros
              productos!
            </p>

            <Link
              href="/lentes"
              className="mt-2 rounded-lg bg-[#008294] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Seguir comprando
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-4">
              {cartItems.map((item) => {
                const coloresDisponibles = obtenerColoresItem(item);
                const editando = editColorId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4"
                  >
                    <Image
                      src={
                        (Array.isArray(item.image)
                          ? item.image[0]
                          : item.image) as StaticImageData
                      }
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />

                    <div className="[flex-grow] w-full">
                      <h3 className="font-bold text-lg text-gray-800">
                        {item.name}
                      </h3>

                      <p className="text-[#008294] font-semibold">
                        $
                        {typeof item.price === "number"
                          ? item.price.toLocaleString("es-CO")
                          : "0"}
                      </p>

                      {item.lensType && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tipo: <span className="font-medium capitalize">{item.lensType.replace("con-formula-", "").replace(/-/g, " ")}</span>
                        </p>
                      )}

                      {item.color && (
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: colorHex(item.color) }}
                          />
                          <span className="text-xs text-gray-500 capitalize">
                            Color: {item.color}
                          </span>
                        </div>
                      )}

                      {editando && coloresDisponibles.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Cambiar color:
                          </p>
                          <SelectorColor
                            colores={coloresDisponibles}
                            seleccionado={item.color}
                            onSelect={(color) => {
                              updateItemColor(item.id, color);
                              setEditColorId(null);
                            }}
                          />
                        </div>
                      )}

                      {!editando && item.lensType === "solo-montura" && coloresDisponibles.length > 0 && (
                        <button
                          onClick={() =>
                            setEditColorId(editColorId === item.id ? null : item.id)
                          }
                          className="mt-1 text-xs font-medium text-[#008294] hover:text-[#005f6b] underline"
                        >
                          Cambiar color
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 rounded-md border border-slate-300 p-1">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          disabled={item.quantity <= 1}
                          className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>

                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="rounded p-1 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center mt-2">
                <Link
                  href="/lentes"
                  className="text-sm text-gray-500 hover:text-[#005f6b] font-medium"
                >
                  ← Volver al catálogo
                </Link>

                <button
                  onClick={clearCart}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border h-fit sticky top-[88px]">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Resumen — con IVA
              </h2>

              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Subtotal ({cartItems.length} {cartItems.length===1?"producto":"productos"})</span>
                <span className="font-semibold text-gray-800">
                  ${typeof totalPrice === "number" ? totalPrice.toLocaleString("es-CO") : "0"}
                </span>
              </div>

              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Envío Valle Aburrá</span>
                <span className="font-semibold text-green-600">Gratis</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Solo Medellín e Itagüí • Si estás fuera, te contactamos por WhatsApp</p>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-base font-bold">Total a pagar</span>
                <span className="text-2xl font-extrabold text-[#008294]">
                  ${typeof totalPrice === "number" ? totalPrice.toLocaleString("es-CO") : "0"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Financia con <span className="font-semibold">Addi</span> o <span className="font-semibold">Sistecredito</span> en el siguiente paso</p>

              <button
                onClick={handlePago}
                disabled={!user}
                className="w-full mt-5 bg-[#008294] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#005f6b] shadow-md hover:shadow-lg transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pagar con Wompi
                <ArrowRight size={20} />
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="h-2 w-3 bg-[#e8d5a3] rounded-sm border" aria-hidden /> <span className="h-2 w-3 bg-[#008294] rounded-sm" aria-hidden /> Pago seguro Wompi • SSL
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">Te llevaremos a WhatsApp si eliges Addi/Sistecredito</p>
              <div className="mt-4 rounded-lg bg-gray-50 border p-3 text-xs text-gray-600">
                <p className="font-semibold">¿Dudas?</p>
                <a href="https://wa.me/573017391219" target="_blank" rel="noopener noreferrer" className="text-[#008294] underline font-medium">Chatea por WhatsApp — respuesta en minutos</a>
              </div>
            </div>
          </div>
        )}

        {showPayment && paymentCustomer && (
          <PaymentModal
            customerId={paymentCustomer.customerId}
            customerInfo={paymentCustomer.info}
            onClose={() => setShowPayment(false)}
            onComplete={handlePaymentComplete}
          />
        )}

        {pedidoCompletado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
              <h2 className="mb-2 text-2xl font-bold text-gray-800">¡Pedido recibido!</h2>
              <p className="mb-6 text-sm text-gray-500">
                Te contactaremos pronto para confirmar tu pedido.
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-[#C39C4E]"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}