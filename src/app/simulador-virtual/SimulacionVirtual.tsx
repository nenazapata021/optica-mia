"use client";

import { useEffect, useRef, useState } from "react";
import { type Producto } from "../types/producto";
import ProductInfo from "../producto info/ProductInfo";
import Carousel from "../carousel/carousel";
import { Download } from "lucide-react";

interface DatosSimulacion {
  fotoUrl: string;
  producto: Omit<Producto, "image"> & { image: string };
}

export default function SimulacionVirtual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [datos, setDatos] = useState<DatosSimulacion | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("optica-mia-try-on");
      if (guardado) {
        setDatos(JSON.parse(guardado) as DatosSimulacion);
      }
    } catch {
      // ignore
    }
    setCargandoDatos(false);
  }, []);

  useEffect(() => {
    if (!datos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelado = false;
    setProcesando(true);
    setError("");

    const faceImg = new Image();
    const glassesImg = new Image();
    let cargadas = 0;

    function componer() {
      if (cargadas < 2 || cancelado) return;
      const c = canvasRef.current;
      if (!c) return;

      const maxW = 800;
      let w = faceImg.naturalWidth;
      let h = faceImg.naturalHeight;
      if (w > maxW) {
        h = Math.round((h / w) * maxW);
        w = maxW;
      }

      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) { setError("Error al crear el canvas"); setProcesando(false); return; }

      ctx.drawImage(faceImg, 0, 0, w, h);

      const centerX = 0.5;
      const centerY = 0.37;
      const glassesWidth = 0.65;

      const targetW = Math.round(glassesWidth * w);
      const aspect = glassesImg.naturalHeight / glassesImg.naturalWidth;
      const targetH = Math.round(targetW * aspect);

      const x = Math.round(centerX * w - targetW / 2);
      const y = Math.round(centerY * h - targetH / 2);

      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(glassesImg, x, y, targetW, targetH);
      ctx.globalCompositeOperation = "source-over";

      if (!cancelado) { setProcesando(false); }
    }

    faceImg.onload = () => { cargadas++; componer(); };
    faceImg.onerror = () => { if (!cancelado) { setError("No se pudo cargar tu foto."); setProcesando(false); } };
    glassesImg.onload = () => { cargadas++; componer(); };
    glassesImg.onerror = () => { if (!cancelado) { setError("No se pudo cargar la imagen de la montura."); setProcesando(false); } };

    faceImg.src = datos.fotoUrl;
    glassesImg.src = datos.producto.image;

    return () => { cancelado = true; };
  }, [datos]);

  const descargar = () => {
    const canvas = canvasRef.current;
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
            <canvas ref={canvasRef} className="block h-auto w-full" />

            {procesando && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#008294] border-t-transparent" />
                  <span className="text-xs font-medium text-slate-700">Generando simulaci&oacute;n...</span>
                </div>
              </div>
            )}
          </div>

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
