"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Producto } from "../types/producto";
import ProductInfo from "../producto info/ProductInfo";
import Carousel from "../carousel/carousel";
import { useRealisticTryOn } from "../hooks/useRealisticTryOn";
import { ArrowLeft, Download, Glasses, Loader2, RefreshCw, Sparkles } from "lucide-react";

const VirtualTryOn = dynamic(() => import("../components/VirtualTryOn"), { ssr: false });

interface DatosSimulacion {
  fotoUrl: string;
  producto: Omit<Producto, "image"> & { image: string };
}

export default function SimulacionVirtual() {
  const [datos, setDatos] = useState<DatosSimulacion | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const { estado, imagenResultado, error, generar, descargar } = useRealisticTryOn();
  const resultadoRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (estado === "listo") {
      resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [estado]);

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

              {/* Generación fotorrealista con IA (Gemini Image) */}
              <div
                ref={resultadoRef}
                className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008294]/10">
                    <Sparkles size={18} className="text-[#008294]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Foto realista con IA
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Genera una fotograf&iacute;a fotorrealista de ti usando esta montura.
                      Puede tardar unos segundos.
                    </p>
                  </div>
                </div>

                {estado === "listo" && imagenResultado ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagenResultado}
                      alt={`Foto realista usando ${datos.producto.name}`}
                      className="mt-4 w-full rounded-xl border border-slate-100"
                    />
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => generar(datos.fotoUrl, imagenProducto)}
                        className="flex items-center gap-2 rounded-xl bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white"
                      >
                        <RefreshCw size={16} />
                        Regenerar
                      </button>
                      <button
                        onClick={descargar}
                        className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]"
                      >
                        <Download size={18} />
                        Descargar foto
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => generar(datos.fotoUrl, imagenProducto)}
                      disabled={estado === "generando"}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#008294] px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {estado === "generando" ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generando foto realista... esto puede tardar hasta 15 segundos
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Generar foto realista
                        </>
                      )}
                    </button>
                    {error && (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                        {error}
                      </p>
                    )}
                  </>
                )}
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