"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Producto } from "../types/producto";
import ProductInfo from "../producto info/ProductInfo";
import Carousel from "../carousel/carousel";
import { ArrowLeft, Glasses } from "lucide-react";

const VirtualTryOn = dynamic(() => import("../components/VirtualTryOn"), { ssr: false });

interface DatosSimulacion {
  fotoUrl: string;
  producto: Omit<Producto, "image"> & { image: string };
}

export default function SimulacionVirtual() {
  const [datos, setDatos] = useState<DatosSimulacion | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("optica-mia-try-on");
      if (guardado) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDatos(JSON.parse(guardado) as DatosSimulacion);
      }
    } catch {
      // ignore
    }
    setCargandoDatos(false);
  }, []);

  if (cargandoDatos) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#008294] border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando simulaci&oacute;n...</p>
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <Glasses size={48} className="text-slate-300" />
        <p className="text-lg font-medium text-slate-600">No hay una simulaci&oacute;n pendiente.</p>
        <p className="text-sm text-slate-400">Selecciona una montura del cat&aacute;logo para comenzar.</p>
        <Link
          href="/probador-landing"
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#008294] px-6 py-3 font-semibold text-white transition hover:bg-[#005f6b]"
        >
          <ArrowLeft size={18} />
          Ver cat&aacute;logo
        </Link>
      </div>
    );
  }

  const overlayUrl = datos.producto.image;
  const imagenProducto = typeof overlayUrl === "string" ? overlayUrl : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header con navegación */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/probador-landing"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#008294]"
          >
            <ArrowLeft size={18} />
            Volver al cat&aacute;logo
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200">
              <Image
                src={imagenProducto}
                alt={datos.producto.name}
                fill
                className="object-contain p-0.5"
                sizes="32px"
              />
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
          {/* Probador virtual - Columna principal */}
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <VirtualTryOn
          glassesFrontalImageUrl={datos.producto.image}
          glassesTempleLeftImageUrl={datos.producto.image}
          glassesTempleRightImageUrl={datos.producto.image}
          faceSrc={datos.fotoUrl}
          scaleMultiplier={datos.producto.scaleMultiplier}
        />

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                El motor detecta tu rostro y superpone la montura sobre tus ojos
              </div>
            </div>
          </div>

          {/* Info del producto - Columna lateral */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <ProductInfo producto={datos.producto} />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel de exploración */}
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Explora m&aacute;s monturas</h2>
            <p className="mt-1 text-sm text-slate-400">Descubre otras opciones para ti</p>
          </div>
          <Carousel />
        </div>
      </div>
    </div>
  );
}