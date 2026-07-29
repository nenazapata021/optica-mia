"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { Trash2, ShoppingCart, ArrowRight, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContextType";
import RegistroCliente from "../registro/RegistroCliente";
import PaymentModal from "../wompi/PaymentModal";

const LS_CUSTOMER_KEY = "optica-mia-customer-data";

export default function CarritoPage() {
  const {
    cartItems,
    totalPrice,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const [isClient, setIsClient] = useState(false);
  const [showRegistro, setShowRegistro] = useState(false);
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePago = () => {
    const raw = localStorage.getItem(LS_CUSTOMER_KEY);
    if (!raw) {
      setShowRegistro(true);
      return;
    }
    const customerData = JSON.parse(raw);
    setPaymentCustomer({
      customerId: customerData.id,
      info: {
        email: customerData.email,
        full_name: customerData.nombre,
        phone_number: customerData.telefono,
      },
    });
    setShowPayment(true);
  };

  const handleRegistroSuccess = (customerId: string) => {
    setShowRegistro(false);
    const raw = localStorage.getItem(LS_CUSTOMER_KEY);
    const customerData = raw ? JSON.parse(raw) : {};
    setPaymentCustomer({
      customerId,
      info: {
        email: customerData.email,
        full_name: customerData.nombre,
        phone_number: customerData.telefono,
      },
    });
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setPedidoCompletado(true);
    clearCart();
  };

  return (
    <main className="w-full min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Tu Carrito de Compras
        </h1>

        <p className="text-center text-gray-500 mb-12">
          Revisa tus productos y procede al pago.
        </p>

        {!isClient || cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-6 py-10">
            <ShoppingCart size={64} className="text-slate-300" />

            <h2 className="text-2xl font-bold text-slate-700">
              Tu carrito de compras está vacío.
            </h2>

            <p className="text-slate-500">
              Parece que aún no has añadido ninguna montura. ¡Explora nuestros
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
              {cartItems.map((item) => (
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
              ))}

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

            <div className="bg-white p-6 rounded-xl border h-fit">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Resumen
              </h2>

              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span className="text-[#008294]">
                  ${typeof totalPrice === "number" ? totalPrice.toLocaleString("es-CO") : "0"}
                </span>
              </div>

              <div className="flex justify-between mb-6">
                <span>Envío</span>
                <span className="text-green-600">Gratis</span>
              </div>

              <div className="border-t pt-4 flex justify-between">
                <span className="text-lg font-bold">Total</span>

                <span className="text-2xl font-bold text-[#008294]">
                  $
                  {typeof totalPrice === "number"
                    ? totalPrice.toLocaleString("es-CO")
                    : "0"}
                </span>
              </div>

              <button
                onClick={handlePago}
                className="w-full mt-6 bg-[#C39C4E] text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90"
              >
                Proceder al pago
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {showRegistro && (
          <RegistroCliente
            onClose={() => setShowRegistro(false)}
            onSuccess={handleRegistroSuccess}
          />
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
