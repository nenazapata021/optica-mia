"use client";

import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { LoaderCircle, Upload, X, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Producto } from "../types/producto";
import { TRY_ON_CONFIG } from "../config/tryOn";
import { normalizeImage } from "@/lib/normalizeImage";

interface ModalProbadorProps {
  producto: Producto;
  onClose: () => void;
  listaMonturas?: Producto[];
}

type ModalStatus = "idle" | "normalizing" | "loading";

export default function ModalProbador({ producto, onClose }: ModalProbadorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cargando, setCargando] = useState(false);
  const [status, setStatus] = useState<ModalStatus>("idle");
  const [error, setError] = useState("");
  const [modoVideo, setModoVideo] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [, setFotoPreview] = useState<string | null>(null);

  const imagenProductoUrl = typeof producto.image === "string"
    ? producto.image
    : Array.isArray(producto.image)
      ? typeof producto.image[0] === "string"
        ? producto.image[0]
        : producto.image[0].src
      : (producto.image as { src: string }).src;

  const detenerPropagacion = (event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation();

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const guardarYContinuar = async (fotoUrl: string) => {
    sessionStorage.setItem(TRY_ON_CONFIG.overlay.storageKey, JSON.stringify({
      fotoUrl,
      producto: { ...producto, image: imagenProductoUrl },
    }));
    setCargando(true);
    setTimeout(() => router.push(`/probador?productoId=${encodeURIComponent(producto.id)}`), 2500);
  };

  const validarTipo = (file: File): boolean => {
    return (TRY_ON_CONFIG.upload.acceptedTypes as readonly string[]).includes(file.type);
  };

  /**
   * Normaliza un File a 1024×1024 PNG y retorna data URL para sessionStorage.
   */
  const procesarYGuarda = async (file: File) => {
    setStatus("normalizing");
    setError("");

    try {
      // Validar tamaño mínimo intrínseco antes de normalizar
      const img = await loadImageFromUrl(URL.createObjectURL(file));
      if (img.naturalWidth < 256 || img.naturalHeight < 256) {
        setError(`La imagen es demasiado pequeña (${img.naturalWidth}×${img.naturalHeight}px). Usa una foto más grande.`);
        setStatus("idle");
        return;
      }

      // Normalizar a 1024×1024 cuadrado
      const result = await normalizeImage(file, 1024);

      // Convertir blob a data URL para sessionStorage
      const dataUrl = await blobToDataUrl(result.blob);
      setFotoPreview(dataUrl);
      setStatus("loading");
      guardarYContinuar(dataUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al procesar la imagen.";
      setError(msg);
      setStatus("idle");
    }
  };

  const seleccionarArchivo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validarTipo(file)) {
      setError(TRY_ON_CONFIG.messages.uploadError);
      event.target.value = "";
      return;
    }
    event.target.value = "";
    void procesarYGuarda(file);
  };

  const iniciarVideo = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setStream(s);
      setModoVideo(true);
      setError("");
    } catch {
      setError("No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  const detenerVideo = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setModoVideo(false);
  };

  const capturarFoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setStatus("normalizing");

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("No se pudo capturar la foto.");
        setStatus("idle");
        return;
      }

      try {
        // Crear File desde el blob para usar normalizeImage
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const result = await normalizeImage(file, 1024);

        const dataUrl = await blobToDataUrl(result.blob);
        setFotoPreview(dataUrl);
        detenerVideo();
        setStatus("loading");
        guardarYContinuar(dataUrl);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al procesar la foto.";
        setError(msg);
        setStatus("idle");
      }
    }, "image/jpeg", 0.9);
  };

  const isBusy = cargando || status === "normalizing" || status === "loading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="probador-title">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl" onClick={detenerPropagacion}>
        {!cargando && (
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100" aria-label="Cerrar probador">
            <X size={24} />
          </button>
        )}

        {cargando ? (
          <div className="py-8">
            <LoaderCircle className="mx-auto mb-4 animate-spin text-[#008294]" size={48} aria-hidden />
            <h2 className="text-xl font-bold text-slate-800">Generando simulación...</h2>
            <p className="mt-2 text-sm text-slate-500">Ajustando la montura <span className="font-semibold">{producto.name}</span> a tu rostro con IA.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuetext="Cargando probador">
              <div className="h-full w-full origin-left animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-[#008294]" />
            </div>
            <p className="mt-3 text-xs text-slate-400">Esto toma 2-3 segundos • No cierres la ventana</p>
          </div>
        ) : (
          <>
            <h2 id="probador-title" className="text-xl sm:text-2xl font-extrabold text-[#005f6b] pr-8">Probador Virtual IA</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">Mira cómo te queda <span className="font-semibold text-slate-700">{producto.name}</span> antes de comprar. Solo Medellín/Itagüí.</p>

            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
              <div className="relative h-14 w-14 shrink-0 bg-white rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagenProductoUrl} alt={`${producto.name} - vista previa`} className="h-14 w-14 object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">Probando ahora</p>
                <p className="font-bold text-slate-800 truncate">{producto.name}</p>
                <p className="text-xs text-[#008294] font-semibold">Desde ${(producto as unknown as {price?:number}).price?.toLocaleString?.("es-CO") ?? "—"} • <a href={`/producto/${producto.id}`} className="underline hover:text-[#005f6b]">Ver detalles sin probador</a></p>
              </div>
            </div>

            {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-left">{error}</div>}

            {status === "normalizing" && (
              <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#e0f2f4] p-4">
                <LoaderCircle size={20} className="animate-spin text-[#008294]" />
                <p className="text-sm font-medium text-[#005f6b]">Normalizando imagen a 1024×1024...</p>
              </div>
            )}

            {!modoVideo && status !== "normalizing" && (
              <>
                <div className="rounded-xl bg-[#e0f2f4] px-3 py-2 mb-3 text-left">
                  <p className="text-xs font-semibold text-[#005f6b]">¿Cómo funciona?</p>
                  <ol className="text-xs text-[#005f6b]/80 list-decimal list-inside mt-1 space-y-0.5">
                    <li>Permite el acceso a la cámara o sube una foto frontal</li>
                    <li>La IA detecta tu rostro y superpone la montura</li>
                    <li>Si falla, usa el catálogo tradicional abajo</li>
                  </ol>
                </div>
                <div className="mb-3 flex gap-3">
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={isBusy}
                    className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 sm:p-5 font-semibold text-slate-600 transition hover:border-[#008294] hover:bg-slate-50 disabled:opacity-50 min-h-[96px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294]"
                  >
                    <Upload size={24} aria-hidden />
                    <span className="text-sm">Subir foto</span>
                    <span className="text-[11px] font-normal text-slate-400">JPG/PNG, rostro frontal</span>
                  </button>
                  <button
                    onClick={iniciarVideo}
                    disabled={isBusy}
                    className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-4 sm:p-5 font-semibold text-slate-600 transition hover:border-[#008294] hover:bg-slate-50 disabled:opacity-50 min-h-[96px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294]"
                  >
                    <Camera size={24} aria-hidden />
                    <span className="text-sm">Usar cámara</span>
                    <span className="text-[11px] font-normal text-slate-400">Frontal del celular</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">Foto frontal con buena luz • Se ajusta a 1024×1024 • <a href="/lentes" onClick={onClose} className="underline text-[#008294]">Prefiero elegir sin probador</a></p>

                <input
                  ref={inputRef}
                  type="file"
                  accept={TRY_ON_CONFIG.upload.acceptedTypes.join(",")}
                  className="hidden"
                  onChange={seleccionarArchivo}
                />
              </>
            )}

            {modoVideo && (
              <div className="mb-4 flex flex-col items-center gap-3">
                <div className="relative h-56 w-full max-w-xs rounded-xl border-2 border-[#008294]/20 bg-black overflow-hidden">
                  <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" aria-label="Vista previa de tu rostro" />
                  <div className="absolute inset-0 pointer-events-none border-4 border-white/20 rounded-xl m-2" aria-hidden />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full">Centra tu rostro • Mira al frente</div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={capturarFoto}
                    disabled={isBusy}
                    className="flex-1 rounded-xl bg-[#008294] px-5 py-3 font-bold text-white transition hover:bg-[#005f6b] disabled:opacity-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008294]"
                    aria-live="polite"
                  >
                    {status === "normalizing" ? "Procesando..." : "📸 Capturar"}
                  </button>
                  <button
                    onClick={detenerVideo}
                    disabled={isBusy}
                    className="rounded-xl bg-white border border-gray-300 px-5 py-3 font-semibold text-slate-700 shadow transition hover:bg-gray-50 disabled:opacity-50 min-h-[44px] min-w-[88px]"
                  >
                    Cancelar
                  </button>
                </div>
                <p className="text-xs text-slate-400">Tip móvil: usa la cámara frontal • Buena iluminación</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Carga un File como HTMLImageElement desde un object URL.
 */
function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

/**
 * Convierte un Blob a data URL (Promise wrapper).
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error al convertir imagen"));
    reader.readAsDataURL(blob);
  });
}
