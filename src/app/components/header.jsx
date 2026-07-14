"use client";

import { useState, useEffect } from "react"; // 💡 Importamos los hooks necesarios para controlar la hidratación
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import logoOpticaMia from "../assets/optica-mia.jpg";

export default function Header() {
  const { totalItems } = useCart();
  const [isMounted, setIsMounted] = useState(false); // 💡 Creamos el estado para saber cuándo estamos en el cliente

  // 💡 Este efecto solo se ejecuta una vez que el componente ya cargó en el navegador (cliente)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <header className="w-full bg-[#008294] shadow-md shadow-slate-950/20">
      <div className="mx-auto flex [min-h-[92px]] max-w-[1600px] flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-12 lg:px-16">
        {/* Logo e Imagen alineados */}
        <Link href="/" className="flex items-center gap-3 whitespace-nowrap text-3xl font-semibold tracking-wide text-[#D4AF37] md:text-[34px] hover:opacity-90 transition">
          <Image
            src={logoOpticaMia}
            alt="Logo Óptica Mia"
            className="h-12 w-12 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-sm"
            width={48}
            height={48}
            style={{ width: "auto", height: "auto" }} // Agregar esta línea
          />
          <span>Óptica Mia</span>
        </Link>

        {/* Menú */}
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-base md:text-lg lg:gap-x-10">
          <Link href="/" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Inicio</Link>
          <Link href="/lentes" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Lentes</Link>
          <Link href="/gafas-de-sol" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Gafas de Sol</Link>
          <Link href="/probador-landing" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Probador Virtual</Link>
          {/* <Link href="/carrito" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Carrito</Link> */}
        </nav>

        {/* Derecha */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Carrito */}
          <Link href="/carrito" className="relative flex items-center gap-2 rounded-md bg-[#D4AF37] px-4 py-2 text-base font-semibold text-slate-900 transition hover:bg-[#C39C4E] md:text-lg">
            <ShoppingCart size={20} />
            <span>Carrito</span>
            {isMounted && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}