"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import Image from "next/image";
import { Camera, LoaderCircle, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Producto } from "../types/producto";

interface ModalProbadorProps { producto: Producto; onClose: () => void; }
type Paso = "opciones" | "camara" | "cargando";

export default function ModalProbador({ producto, onClose }: ModalProbadorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [paso, setPaso] = useState<Paso>("opciones");
  const [error, setError] = useState("");
  const imagenProducto = Array.isArray(producto.image) ? producto.image[0] : producto.image;
  const imagenProductoUrl = typeof imagenProducto === "string" ? imagenProducto : imagenProducto.src;

  const detenerCamara = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };
  useEffect(() => detenerCamara, []);

  const guardarYContinuar = (fotoUrl: string) => {
    detenerCamara();
    sessionStorage.setItem("optica-mia-try-on", JSON.stringify({
      fotoUrl,
      producto: { ...producto, image: imagenProductoUrl },
    }));
    setPaso("cargando");
    window.setTimeout(() => router.push(`/probador?productoId=${encodeURIComponent(producto.id)}`), 2500);
  };

  const abrirCamara = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setPaso("camara");
      window.setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } }, 0);
    } catch {
      setError("No fue posible acceder a la cámara. Revisa los permisos o sube una foto.");
    }
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    guardarYContinuar(canvas.toDataURL("image/jpeg", 0.92));
  };

  const seleccionarArchivo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) guardarYContinuar(URL.createObjectURL(file));
    event.target.value = "";
  };
  const detenerPropagacion = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl" onClick={detenerPropagacion}>
      {paso !== "cargando" && <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" aria-label="Cerrar"><X /></button>}
      {paso === "cargando" ? <div className="py-12"><LoaderCircle className="mx-auto mb-5 animate-spin text-[#008294]" size={54} /><h2 className="text-2xl font-bold text-slate-800">Generando simulación...</h2><p className="mt-3 text-slate-500">Estamos ajustando la montura a tu rostro.</p><div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-full origin-left animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-[#008294]" /></div></div> : paso === "camara" ? <><h2 className="mb-5 text-2xl font-extrabold text-[#005f6b]">Toma tu foto</h2><video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-2xl bg-slate-900 object-cover" /><button onClick={capturarFoto} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008294] py-3 font-semibold text-white"><Camera size={20} /> Capturar foto</button><button onClick={() => { detenerCamara(); setPaso("opciones"); }} className="mt-3 text-sm font-medium text-slate-500">Volver</button></> : <><h2 className="text-2xl font-extrabold text-[#005f6b]">Simulador Virtual IA</h2><p className="mb-6 mt-2 text-slate-500">Prueba cómo te queda esta montura antes de decidirte.</p><div className="mb-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"><div className="relative h-16 w-16 shrink-0"><Image src={Array.isArray(producto.image) ? producto.image[0] : producto.image} alt={producto.name} fill className="object-contain" /></div><div><p className="text-xs text-slate-500">Montura seleccionada</p><p className="font-bold text-slate-800">{producto.name}</p></div></div>{error && <p className="mb-4 text-sm text-red-600">{error}</p>}<div className="grid gap-4 sm:grid-cols-2"><button onClick={() => void abrirCamara()} className="flex flex-col items-center gap-2 rounded-2xl bg-[#008294] p-6 font-semibold text-white"><Camera size={30} />Tomar foto</button><button onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-6 font-semibold text-slate-700"><Upload size={30} />Subir foto</button></div><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={seleccionarArchivo} /></>}</div>
  </div>;
}
