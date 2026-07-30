"use client";

import { useEffect, useState, useCallback } from "react";
import { type Producto } from "../types/producto";
import ProductInfo from "../producto info/ProductInfo";
import Carousel from "../carousel/carousel";
import { useFaceDetection } from "../hooks/useFaceDetection";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { Download, AlertTriangle } from "lucide-react";

interface DatosSimulacion {
  fotoUrl: string;
  producto: Omit<Producto, "image"> & { image: string };
}

export default function SimulacionVirtual() {
  const [datos, setDatos] = useState<DatosSimulacion | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  const { detectFromImage, loadModel } = useFaceDetection();
  const { canvasRef: rendererCanvasRef, render, renderFallback } = useCanvasRenderer();

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("optica-mia-try-on");
      if (guardado) {
        setDatos(JSON.parse(guardado) as DatosSimulacion);
      }
    } catch {
      setError("No se pudo cargar la simulación.");
    }
    setCargandoDatos(false);
  }, []);

  const iniciarIA = useCallback(
    async (fotoUrl: string, overlayUrl: string) => {
      setProcesando(true);
      setError("");
      setUsedFallback(false);
      setStatusText("Cargando inteligencia artificial...");

      const modelErr = await loadModel();
      if (modelErr) {
        setStatusText("No se pudo cargar la IA. Usando posición automática.");
        setUsedFallback(true);
        await renderFallback(fotoUrl, overlayUrl);
        setProcesando(false);
        return;
      }

      setStatusText("Detectando tu rostro...");
      const result = await detectFromImage(fotoUrl);

      if ("error" in result) {
        setStatusText("No se detectó el rostro. Usando posición estimada.");
        setUsedFallback(true);
        await renderFallback(fotoUrl, overlayUrl);
      } else {
        setUsedFallback(false);
        await render(fotoUrl, overlayUrl, result.landmarks);
      }

      setProcesando(false);
    },
    [loadModel, detectFromImage, render, renderFallback]
  );

  useEffect(() => {
    if (!datos) return;
    const overlayUrl = datos.producto.image;
    iniciarIA(datos.fotoUrl, overlayUrl);
  }, [datos]);

  const descargar = () => {
    const canvas = rendererCanvasRef.current;
    if (!canvas) return;
    const enlace = document.createElement("a");
    enlace.download = "simulacion-optica-mia.jpg";
    enlace.href = canvas.toDataURL("image/jpeg", 0.92);
    enlace.click();
  };

  if (cargandoDatos) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#008294] border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando simulaci&oacute;n...</p>
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-600">
        No hay una simulaci&oacute;n pendiente. Selecciona una montura para comenzar.
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-100 shadow-lg">
            <canvas ref={rendererCanvasRef} className="block h-auto w-full" />

            {procesando && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#008294] border-t-transparent" />
                  <span className="text-xs font-medium text-slate-700">{statusText}</span>
                </div>
              </div>
            )}
          </div>

          {usedFallback && !procesando && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>Posici&oacute;n estimada. Para mejor resultado, usa una foto frontal con buena iluminaci&oacute;n.</span>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={descargar}
              disabled={procesando || !!error}
              className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b] disabled:opacity-50"
            >
              <Download size={18} />
              Descargar imagen
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <p className="mt-1 text-xs text-red-400">Vuelve a intentar o selecciona otra foto.</p>
            </div>
          )}
        </div>

        <ProductInfo producto={datos.producto} />
      </div>

      <section className="mx-auto mt-12 max-w-7xl">
        <h2 className="px-4 text-center text-2xl font-bold text-slate-800">
          Explora m&aacute;s monturas
        </h2>
        <Carousel />
      </section>
    </div>
  );
}