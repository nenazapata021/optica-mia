"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Camera, LoaderCircle, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Producto } from "../types/producto";
import { useCamera } from "../hooks/useCamera";
import { TRY_ON_CONFIG } from "../config/tryOn";

interface ModalProbadorProps {
  producto: Producto;
  onClose: () => void;
  listaMonturas?: Producto[];
}

type Paso = "opciones" | "camara" | "cargando";

export default function ModalProbador({ producto, onClose }: ModalProbadorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { videoRef, cameraError, isCameraActive, startCamera, stopCamera, capturePhoto } = useCamera();
  const [paso, setPaso] = useState<Paso>("opciones");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const imagenProducto = Array.isArray(producto.image) ? producto.image[0] : producto.image;
  const imagenProductoUrl = typeof imagenProducto === "string" ? imagenProducto : imagenProducto.src;

  const guardarYContinuar = (fotoUrl: string) => {
    stopCamera();
    sessionStorage.setItem(TRY_ON_CONFIG.overlay.storageKey, JSON.stringify({
      fotoUrl,
      producto: { ...producto, image: imagenProductoUrl },
    }));
    setPaso("cargando");
    setTimeout(() => router.push(`/probador?productoId=${encodeURIComponent(producto.id)}`), 2500);
  };

  const abrirCamara = async () => {
    setError("");
    await startCamera();
    if (!cameraError) setPaso("camara");
  };

  const capturarFoto = () => {
    const url = capturePhoto();
    if (url) guardarYContinuar(url);
  };

  const seleccionarArchivo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(TRY_ON_CONFIG.upload.acceptedTypes as readonly string[]).includes(file.type)) {
      setError(TRY_ON_CONFIG.messages.uploadError);
      event.target.value = "";
      return;
    }
    guardarYContinuar(URL.createObjectURL(file));
    event.target.value = "";
  };

  const detenerPropagacion = (event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl" onClick={detenerPropagacion}>
        {paso !== "cargando" && (
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X />
          </button>
        )}

        {paso === "cargando" ? (
          <div className="py-12">
            <LoaderCircle className="mx-auto mb-5 animate-spin text-[#008294]" size={54} />
            <h2 className="text-2xl font-bold text-slate-800">Generando simulaci&oacute;n...</h2>
            <p className="mt-3 text-slate-500">Estamos ajustando la montura a tu rostro.</p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full origin-left animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-[#008294]" />
            </div>
          </div>
        ) : paso === "camara" ? (
          <>
            <h2 className="mb-5 text-2xl font-extrabold text-[#005f6b]">Toma tu foto</h2>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-video w-full rounded-2xl bg-slate-900 object-cover"
            />
            {!isCameraActive && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={16} className="animate-spin" />
                Iniciando c&aacute;mara...
              </div>
            )}
            <button
              onClick={capturarFoto}
              disabled={!isCameraActive}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008294] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Camera size={20} /> Capturar foto
            </button>
            <button
              onClick={() => { stopCamera(); setPaso("opciones"); }}
              className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Volver
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-[#005f6b]">Simulador Virtual IA</h2>
            <p className="mb-6 mt-2 text-slate-500">Prueba c&oacute;mo te queda esta montura antes de decidirte.</p>

            <div className="mb-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src={Array.isArray(producto.image) ? producto.image[0] : producto.image}
                  alt={producto.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500">Montura seleccionada</p>
                <p className="font-bold text-slate-800">{producto.name}</p>
              </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {cameraError && <p className="mb-4 text-sm text-amber-600">{cameraError}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => { void abrirCamara(); }}
                className="flex flex-col items-center gap-2 rounded-2xl bg-[#008294] p-6 font-semibold text-white transition hover:opacity-90"
              >
                <Camera size={30} />
                Tomar foto
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-6 font-semibold text-slate-600 transition hover:border-[#008294] hover:bg-slate-50"
              >
                <Upload size={30} />
                Subir foto
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={TRY_ON_CONFIG.upload.acceptedTypes.join(",")}
              className="hidden"
              onChange={seleccionarArchivo}
            />
          </>
        )}
      </div>
    </div>
  );
}
