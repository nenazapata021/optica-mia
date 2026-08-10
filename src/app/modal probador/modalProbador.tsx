"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { LoaderCircle, Upload, X, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Producto } from "../types/producto";
import { TRY_ON_CONFIG } from "../config/tryOn";
import { useStaticFaceDetection } from "../hooks/useStaticFaceDetection";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import type { OverlayConfig } from "../types/tryOn";

interface ModalProbadorProps {
  producto: Producto;
  onClose: () => void;
  listaMonturas?: Producto[];
}

export default function ModalProbador({ producto, onClose }: ModalProbadorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasFace, setHasFace] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { detectFromImage, isLoading: staticLoading, error: staticError } = useStaticFaceDetection();
  const { canvasRef, drawImageFrame } = useCanvasRenderer();

  const imagenProducto = Array.isArray(producto.image) ? producto.image[0] : producto.image;
  const imagenProductoUrl = typeof imagenProducto === "string" ? imagenProducto : imagenProducto.src;

  const guardarYContinuar = async (fotoUrl: string) => {
    sessionStorage.setItem(TRY_ON_CONFIG.overlay.storageKey, JSON.stringify({
      fotoUrl,
      producto: { ...producto, image: imagenProductoUrl },
    }));
    setCargando(true);
    setTimeout(() => router.push(`/probador?productoId=${encodeURIComponent(producto.id)}`), 2500);
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

  const handleCameraStart = async () => {
    try {
      const video = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (cameraRef.current) {
        cameraRef.current.srcObject = video;
      }
      setCameraStream(video);
      setUseCamera(true);
      setHasFace(true);
    } catch {
      setError("No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  const handleCameraStop = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setUseCamera(false);
    setHasFace(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl" onClick={detenerPropagacion}>
        {!cargando && (
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            <X size={24} />
          </button>
        )}

        {cargando ? (
          <div className="py-12">
            <LoaderCircle className="mx-auto mb-5 animate-spin text-[#008294]" size={54} />
            <h2 className="text-2xl font-bold text-slate-800">Generando simulaci&oacute;n...</h2>
            <p className="mt-3 text-slate-500">Estamos ajustando la montura a tu rostro.</p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full origin-left animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-[#008294]" />
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-[#005f6b]">Simulador Virtual IA</h2>
            <p className="mb-6 mt-2 text-slate-500">Prueba c&oacute;lo te queda esta montura antes de decidirte.</p>

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

            {!useCamera && (
              <>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-6 font-semibold text-slate-600 transition hover:border-[#008294] hover:bg-slate-50"
                >
                  <Upload size={30} />
                  Subir foto
                </button>
                <p className="mt-3 text-xs text-slate-400">Usa una foto frontal con buena iluminaci&oacute;n.</p>

                <input
                  ref={inputRef}
                  type="file"
                  accept={TRY_ON_CONFIG.upload.acceptedTypes.join(",")}
                  className="hidden"
                  onChange={seleccionarArchivo}
                />
              </>
            )}

            {useCamera && (
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="relative h-20 w-20 rounded-xl border border-slate-300 bg-slate-900 overflow-hidden">
                  <video
                    ref={cameraRef}
                    playsWhenPlaybackActive
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
                <button
                  onClick={handleCameraStart}
                  className="flex items-center gap-2 rounded-xl bg-[#008294] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005f6b]">
                  <Camera size={18} />
                  Usar cámara
                </button>
                {cameraStream && (
                  <button
                    onClick={handleCameraStop}
                    className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:bg-white">
                    <X size={16} />
                    Detener cámara
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}