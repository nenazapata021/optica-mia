"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Producto } from "../types/producto";
import ProductInfo from "../producto info/ProductInfo";
import Carousel from "../carousel/carousel";
import { ArrowLeft, Glasses } from "lucide-react";
import { TRY_ON_CONFIG } from "../config/tryOn";

const VirtualTryOn = dynamic(() => import("../components/VirtualTryOn"), { ssr: false });

interface DatosSimulacion {
  fotoUrl: string;
  producto: Omit<Producto, "image"> & { image: string };
}

export default function SimulacionVirtual() {
  const [datos, setDatos] = useState<DatosSimulacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const preloaded = useRef(false);

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("optica-mia-try-on");
      if (guardado) setDatos(JSON.parse(guardado) as DatosSimulacion);
    } catch { /* ignore */ }
    setCargando(false);
  }, []);

  /* ── Preload MediaPipe WASM + model + montura ────────── */
  useEffect(() => {
    if (preloaded.current) return;
    preloaded.current = true;

    const links = [
      { rel: "preconnect", href: "https://storage.googleapis.com" },
      { rel: "preconnect", href: "https://cdn.jsdelivr.net" },
      { rel: "preload", href: TRY_ON_CONFIG.modelPreloadUrl, as: "fetch", crossOrigin: "anonymous" as const },
      { rel: "preload", href: TRY_ON_CONFIG.wasmPreloadBase + "/wasm_js/face_landmarker_v2.js", as: "script", crossOrigin: "anonymous" as const },
    ];
    links.forEach((l) => {
      const tag = document.createElement("link");
      tag.rel = l.rel;
      tag.href = l.href;
      if (l.as) tag.setAttribute("as", l.as);
      if (l.crossOrigin) tag.crossOrigin = "anonymous";
      document.head.appendChild(tag);
    });
  }, []);

  if (cargando) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#008294] border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando probador...</p>
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <Glasses size={48} className="text-slate-300" />
        <p className="text-lg font-medium text-slate-600">No hay una simulación pendiente.</p>
        <p className="text-sm text-slate-400">Selecciona una montura del catálogo para comenzar.</p>
        <Link
          href="/lentes"
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#008294] px-6 py-3 font-semibold text-white transition hover:bg-[#005f6b]"
        >
          <ArrowLeft size={18} />
          Ver catálogo
        </Link>
      </div>
    );
  }

  const imagenProducto = typeof datos.producto.image === "string" ? datos.producto.image : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/lentes" className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#008294]">
            <ArrowLeft size={18} />
            Volver al catálogo
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200">
              <Image src={imagenProducto} alt={datos.producto.name} fill className="object-contain p-0.5" sizes="32px" />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">Probando</p>
              <p className="text-sm font-semibold text-slate-700">{datos.producto.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <div className="rounded-xl bg-[#e0f2f4] px-3 py-2 mb-3 flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 animate-pulse" aria-hidden />
                <p className="text-xs text-[#005f6b]">
                  <span className="font-semibold">Probador activo:</span> mueve la cabeza suavemente. Si no detecta rostro, acércate a la luz.
                </p>
              </div>
              <VirtualTryOn
                glassesFrontalImageUrl={datos.producto.image}
                faceSrc={datos.fotoUrl}
                scaleMultiplier={datos.producto.scaleMultiplier ?? 1}
              />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white border p-3 text-center">
                  <p className="text-xs text-gray-500">Precio</p>
                  <p className="font-bold text-[#008294]">IVA incluido</p>
                </div>
                <div className="rounded-xl bg-white border p-3 text-center">
                  <p className="text-xs text-gray-500">Envío</p>
                  <p className="font-bold text-green-600">Gratis*</p>
                </div>
                <div className="rounded-xl bg-white border p-3 text-center">
                  <p className="text-xs text-gray-500">Financiación</p>
                  <p className="font-bold text-gray-700 text-xs">Addi/Sistecredito</p>
                </div>
              </div>
              <p className="text-[11px] text-center text-gray-400 mt-2">* Solo Medellín e Itagüí • Cambios sin probador disponibles</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <ProductInfo producto={datos.producto} />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Explora más monturas</h2>
            <p className="mt-1 text-sm text-slate-400">Descubre otras opciones para ti</p>
          </div>
          <Carousel />
        </div>
      </div>
    </div>
  );
}