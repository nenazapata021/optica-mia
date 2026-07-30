"use client";

import React, { useState, useEffect, useCallback } from "react";
import { type StaticImageData } from "next/image";
import ProductInfo from "../producto info/ProductInfo";
import ColeccionCarousel from "../ColeccionCarousel/ColeccionCarousel";
import { productosLentes, productosGafasSol } from "../data/productos.js";
import { type Producto } from "../types/producto";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { LoaderCircle, AlertTriangle } from "lucide-react";

interface ProductoJs {
  id: string;
  nombre: string;
  precio: number;
  imagen: StaticImageData;
  color: string;
}

function transformarProducto(productoJs: ProductoJs, categoria: "lentes" | "sol"): Producto {
  return {
    id: productoJs.id,
    name: productoJs.nombre,
    price: productoJs.precio,
    image: productoJs.imagen,
    color: productoJs.color,
    categoria,
    descripcion: `Montura modelo ${productoJs.nombre}.`,
    modelo: productoJs.id,
  };
}

const coleccionCompleta: Producto[] = [
  ...(productosLentes as ProductoJs[]).map((p) => transformarProducto(p, "lentes")),
  ...(productosGafasSol as ProductoJs[]).map((p) => transformarProducto(p, "sol")),
];

function getImageUrl(img: Producto["image"]): string {
  if (Array.isArray(img)) return typeof img[0] === "string" ? img[0] : img[0].src;
  return typeof img === "string" ? img : img.src;
}

interface ProductoDestacadoProps {
  productoInicial: Producto;
  imagenUsuario: string | StaticImageData;
}

export default function ProductoDestacado({ productoInicial, imagenUsuario }: ProductoDestacadoProps) {
  const { detectFromImage, isLoading: isModelLoading, loadModel } = useFaceDetection();
  const { canvasRef, render, renderFallback } = useCanvasRenderer();

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>(productoInicial);
  const [processing, setProcessing] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);
  const [statusText, setStatusText] = useState("");

  const userPhotoUrl = typeof imagenUsuario === "string" ? imagenUsuario : imagenUsuario.src;
  const overlayUrl = getImageUrl(productoSeleccionado.image);

  const initTryOn = useCallback(async (photoUrl: string) => {
    setProcessing(true);
    setStatusText("Cargando inteligencia artificial...");

    const modelErr = await loadModel();
    if (modelErr) {
      setStatusText("No se pudo cargar la IA. Usando posición automática.");
      setUsedFallback(true);
      await renderFallback(photoUrl, overlayUrl);
      setProcessing(false);
      return;
    }

    setStatusText("Detectando tu rostro...");
    const result = await detectFromImage(photoUrl);

    if ("error" in result) {
      setStatusText("No se detectó el rostro automáticamente. Usando posición estimada.");
      setUsedFallback(true);
      await renderFallback(photoUrl, overlayUrl);
    } else {
      setUsedFallback(false);
      await render(photoUrl, overlayUrl, result.landmarks);
    }

    setProcessing(false);
  }, [loadModel, detectFromImage, render, renderFallback, overlayUrl]);

  useEffect(() => {
    if (userPhotoUrl) initTryOn(userPhotoUrl);
  }, [userPhotoUrl, initTryOn]);

  useEffect(() => {
    if (!userPhotoUrl) return;
    const nextOverlay = getImageUrl(productoSeleccionado.image);
    if (usedFallback) {
      renderFallback(userPhotoUrl, nextOverlay);
    } else {
      const detectFn = async () => {
        const r = await detectFromImage(userPhotoUrl);
        if (!("error" in r)) {
          await render(userPhotoUrl, nextOverlay, r.landmarks);
        } else {
          await renderFallback(userPhotoUrl, nextOverlay);
        }
      };
      detectFn();
    }
  }, [productoSeleccionado, userPhotoUrl, detectFromImage, render, renderFallback, usedFallback]);

  return (
    <div className="w-full bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-lg">
            <div className="relative overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-100 shadow-lg">
              <canvas ref={canvasRef} className="block h-auto w-full" />

              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg">
                    <LoaderCircle size={20} className="animate-spin text-[#008294]" />
                    <span className="text-sm font-medium text-slate-700">{statusText}</span>
                  </div>
                </div>
              )}
            </div>

            {usedFallback && !processing && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>Posición estimada. Para mejor resultado, usa una foto frontal con buena iluminación.</span>
              </div>
            )}
          </div>

          <ProductInfo producto={productoSeleccionado} />
        </div>

        <div className="mb-8 text-center">
          <h3 className="text-3xl font-bold text-gray-800">Explora Nuestra Colección</h3>
        </div>
        <ColeccionCarousel productos={coleccionCompleta} onSelectProduct={setProductoSeleccionado} />
      </div>
    </div>
  );
}
