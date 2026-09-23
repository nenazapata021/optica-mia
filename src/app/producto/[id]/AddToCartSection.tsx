"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "../../context/CartContextType";
import TipoLenteModal from "../../tipo-lente/TipoLenteModal";
import type { Producto } from "../../types/producto";

export default function AddToCartSection({ product }: { product: Producto }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const handleSelect = (tipo: string, color?: string) => {
    setShow(false);
    addToCart({ ...product, image: product.image }, tipo, color);
    const raw = localStorage.getItem("optica-mia-customer-data");
    const customerData = raw ? JSON.parse(raw) : { nombre: "Cliente web" };
    const order = { id: crypto.randomUUID(), items: [{ productId: product.id, name: product.name, quantity: 1, price: product.price, lensType: tipo, color }], total: product.price, date: new Date().toISOString(), customer: customerData?.nombre || "Cliente web" };
    const existing = JSON.parse(localStorage.getItem("optica-mia-orders") || "[]");
    existing.unshift(order); localStorage.setItem("optica-mia-orders", JSON.stringify(existing));
    router.push("/carrito");
  };
  return (
    <>
      {show && <TipoLenteModal producto={product} colores={product.color ? [product.color] : []} onSelect={handleSelect} onClose={() => setShow(false)} />}
      <button onClick={() => setShow(true)} className="mt-6 w-full rounded-xl bg-[#D4AF37] py-3.5 font-bold text-slate-900 hover:bg-[#C39C4E] transition">Seleccionar montura — ${product.price.toLocaleString("es-CO")} COP</button>
      <p className="mt-2 text-center text-xs text-gray-500">Elige tipo de lente y pagos Wompi (Nequi/Addi/Sistecredito/Bre-B) en el siguiente paso</p>
    </>
  );
}
