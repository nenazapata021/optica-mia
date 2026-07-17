"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { useCart } from "../context/CartContextType";
import { useFavorites } from "../context/FavoritesContext";
import logoOpticaMia from "../assets/optica-mia.jpg";

export default function Header() {
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <header className="w-full bg-[#008294] shadow-md shadow-slate-950/20">
      {/* CORRECCIÓN: Se eliminaron los corchetes externos: [min-h-[92px]] -> min-h-[92px] */}
      <div className="mx-auto flex [min-h-[92px]] max-w-[1600px] flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-12 lg:px-16">
        
        {/* Logo e Imagen */}
        <Link href="/" className="flex items-center gap-3 whitespace-nowrap text-3xl font-semibold tracking-wide text-[#D4AF37] md:text-[34px] hover:opacity-90 transition">
          <Image
            src={logoOpticaMia}
            alt="Logo Óptica Mia"
            className="h-12 w-12 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-sm"
            width={48}
            height={48}
            style={{ width: "auto", height: "auto" }}
          />
          <span>Óptica Mia</span>
        </Link>

        {/* Menú */}
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-base md:text-lg lg:gap-x-10">
          <Link href="/" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Inicio</Link>
          <Link href="/lentes" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Lentes</Link>
          <Link href="/gafas-de-sol" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Gafas de Sol</Link>
          <Link href="/probador-landing" className="font-medium text-[#C39C4E] transition hover:text-white md:font-semibold">Probador Virtual</Link>
        </nav>

        {/* Carrito y Favoritos */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/favoritas" className="relative flex items-center gap-1 rounded-md px-3 py-2 text-base font-semibold text-[#D4AF37] transition hover:text-white md:text-lg">
            <Heart size={20} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
            <span className="hidden sm:inline">Favoritas</span>
            {isMounted && favorites.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>
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