"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import logoOpticaMia from "@/public/optica-mia.jpg";

export default function Header() {
  const { totalItems } = useCart();

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
          />
          <span>Óptica Mia</span>
        </Link>

        {/* Menú */}
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-base md:text-lg lg:gap-x-10">
          <Link href="/" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Inicio</Link>
          <Link href="/lentes" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Lentes</Link>
          <Link href="/gafas" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Gafas de Sol</Link>
          <Link href="/probador-landing" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Probador Virtual</Link>
        </nav>

        {/* Derecha */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Carrito */}
          <Link href="/carrito" className="relative flex items-center gap-2 rounded-full border border-[#D4AF37]/30 px-4 py-2 text-[#D4AF37] transition hover:border-white/40 hover:text-white">
            <span className="font-semibold text-base md:text-lg">Carrito</span>
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
              {totalItems}
            </span>
          </Link>

        </div>
      </div>
    </header>
  );
}