"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, Heart, Menu, X, MapPin } from "lucide-react";
import UserProfileIcon from "../dashboard/UserProfileIcon";
import { useCart } from "../context/CartContextType";
import { useFavorites } from "../context/FavoritesContext";
import logoOpticaMia from "../assets//logos/optica-mia.jpeg";

export default function Header() {
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;
  const navLinkClass = (href: string) =>
    `font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d5a3] rounded-md px-1 py-1 md:font-semibold ${
      isActive(href) ? "text-white underline underline-offset-4" : "text-[#e8d5a3] hover:text-white"
    }`;

  return (
    <header className="w-full bg-[#008294] shadow-md shadow-slate-950/20 sticky top-0 z-40">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:min-h-[72px] md:px-12 lg:px-16">
        <Link
          href="/"
          className="flex items-center gap-3 whitespace-nowrap text-2xl font-semibold tracking-wide text-[#e8d5a3] hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d5a3] rounded-lg md:text-[30px]"
        >
          <Image
            src={logoOpticaMia}
            alt="Logo Óptica Mía"
            className="h-10 w-10 rounded-full object-cover border-2 border-[#e8d5a3]/50 shadow-sm md:h-12 md:w-12"
            width={48}
            height={48}
          />
          <span>Óptica Mía</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Principal" className="hidden flex-wrap items-center gap-x-6 text-base md:flex lg:gap-x-8">
          <Link href="/" className={navLinkClass("/")}>Inicio</Link>
          <Link href="/lentes" className={navLinkClass("/lentes")}>Lentes</Link>
          <Link href="/gafas-de-sol" className={navLinkClass("/gafas-de-sol")}>Gafas de Sol</Link>
          <Link href="/probador-landing" className="font-semibold text-white bg-[#005f6b] px-3 py-1.5 rounded-full hover:bg-[#004e59] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d5a3]">
            Probador Virtual IA
          </Link>
          <Link href="/ubicacion" className={navLinkClass("/ubicacion")}>
            <span className="inline-flex items-center gap-1"><MapPin size={16} /> Nuestras Tiendas</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/favoritas" aria-label={`Favoritas ${isMounted ? favorites.length : 0} items`} className="relative flex items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-[#e8d5a3] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d5a3] md:text-base">
            <Heart size={20} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
            <span className="hidden lg:inline">Favoritas</span>
            {isMounted && favorites.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{favorites.length}</span>
            )}
          </Link>
          <Link href="/dashboard" aria-label="Mi cuenta" className="hidden md:flex relative items-center rounded-md bg-[#D4AF37] p-2 text-slate-900 hover:bg-[#C39C4E] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <UserProfileIcon size={22} />
          </Link>
          <Link href="/carrito" aria-label={`Carrito ${isMounted ? totalItems : 0} items`} className="relative flex items-center rounded-md bg-[#D4AF37] p-2.5 text-slate-900 hover:bg-[#C39C4E] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px] min-w-[44px] justify-center">
            <ShoppingCart size={22} />
            {isMounted && totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">{totalItems}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-md text-[#e8d5a3] hover:text-white hover:bg-[#005f6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d5a3] min-h-[44px] min-w-[44px]"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#005f6b] bg-[#008294] px-4 py-4">
          <nav aria-label="Principal móvil" className="flex flex-col gap-1">
            <Link href="/" className="py-3 px-2 text-[#e8d5a3] hover:text-white hover:bg-[#005f6b] rounded-lg font-medium">Inicio</Link>
            <Link href="/lentes" className="py-3 px-2 text-[#e8d5a3] hover:text-white hover:bg-[#005f6b] rounded-lg font-medium">Lentes — Graduados y monturas</Link>
            <Link href="/gafas-de-sol" className="py-3 px-2 text-[#e8d5a3] hover:text-white hover:bg-[#005f6b] rounded-lg font-medium">Gafas de Sol</Link>
            <Link href="/probador-landing" className="py-3 px-3 bg-white text-[#005f6b] rounded-lg font-bold mt-2">✨ Probador Virtual IA — Prueba sin cámara</Link>
            <Link href="/ubicacion" className="py-3 px-2 text-[#e8d5a3] hover:text-white hover:bg-[#005f6b] rounded-lg font-medium flex items-center gap-2"><MapPin size={18}/> Nuestras Tiendas — Cra 49 Itagüí</Link>
            <div className="border-t border-[#005f6b] mt-3 pt-3">
              <p className="text-xs text-[#e8d5a3]/70 px-2 mb-1">Solo Medellín e Itagüí • Envío gratis 24-48h</p>
              <Link href="/dashboard" className="py-3 px-2 text-[#e8d5a3] hover:text-white hover:bg-[#005f6b] rounded-lg font-medium block">Mi Cuenta</Link>
            </div>
          </nav>
        </div>
      )}

      {/* Zona banner */}
      <div className="bg-[#005f6b] text-center text-xs text-[#e8d5a3] py-1.5 px-4">
        <span className="hidden sm:inline">Solo vendemos en Medellín e Itagüí • </span>Envío gratis Valle de Aburrá • Examen visual en Cra 49
      </div>
    </header>
  );
}