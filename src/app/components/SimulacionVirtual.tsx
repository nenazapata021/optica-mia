"use client";
/* eslint-disable @next/next/no-img-element -- MediaPipe requiere elementos HTMLImageElement para analizar la foto local. */

import { useRef, useState } from "react";
import { type Producto } from "../types/producto";
import ProductInfo from "./ProductInfo";
import Carousel from "./carousel";

interface DatosSimulacion { fotoUrl: string; producto: Omit<Producto, "image"> & { image: string }; }
interface Punto { x: number; y: number; }
interface Montura { x: number; y: number; ancho: number; angulo: number; }

const MODELO = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export default function SimulacionVirtual() {
  const fotoRef = useRef<HTMLImageElement>(null);
  const [datos] = useState<DatosSimulacion | null>(() => {
    if (typeof window === "undefined") return null;
    const guardado = sessionStorage.getItem("optica-mia-try-on");
    return guardado ? JSON.parse(guardado) as DatosSimulacion : null;
  });
  const [montura, setMontura] = useState<Montura | null>(null);
  const [mensaje, setMensaje] = useState("Analizando rostro…");

  const detectarRostro = async (imagenCargada?: HTMLImageElement) => {
    const imagen = imagenCargada ?? fotoRef.current;

    if (!imagen || !imagen.complete || imagen.naturalWidth === 0 || imagen.naturalHeight === 0) {
      setMensaje("La imagen aún no está lista para analizarse. Intenta nuevamente.");
      return;
    }

    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM);
      const detector = await FaceLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODELO }, runningMode: "IMAGE", numFaces: 1 });
      let resultado;
      try {
        resultado = await detector.detect(imagen);
      } catch (error) {
        console.error("Error en detector.detect:", error);
        setMensaje("Ocurrió un error al procesar la imagen. Por favor, intenta con otra foto.");
        return;
      } finally { detector.close(); }
      if (!resultado?.faceLandmarks?.length) { setMensaje("No pudimos detectar el rostro. Intenta con una foto frontal y bien iluminada."); return; }
      const puntos = resultado.faceLandmarks[0];
      const izquierdo = puntos[33] as Punto; const derecho = puntos[263] as Punto;
      const dx = derecho.x - izquierdo.x; const dy = derecho.y - izquierdo.y;
      setMontura({ x: (izquierdo.x + derecho.x) / 2, y: (izquierdo.y + derecho.y) / 2, ancho: Math.sqrt(dx * dx + dy * dy) * 2.35, angulo: Math.atan2(dy, dx) * 180 / Math.PI });
      setMensaje("");
    } catch { setMensaje("No se pudo cargar la detección facial. Verifica tu conexión e inténtalo de nuevo."); }
  };

  
  if (!datos) return <div
   className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-600">No hay una simulación pendiente. Selecciona una montura para comenzar.</div>;
  return <div
   className="bg-slate-50 py-12">
    <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2">
      <div>
        <div className="relative overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-100 shadow-lg">
          <img ref={fotoRef} src={datos.fotoUrl} alt="Usuario con montura" onLoad={({ currentTarget }) => void detectarRostro(currentTarget)} onError={() => setMensaje("No fue posible cargar la imagen para la simulación.")} className="block h-auto w-full" />
          {montura && <img src={datos.producto.image} alt={`Montura ${datos.producto.name}`} className="pointer-events-none absolute" style={{ left: `${montura.x * 100}%`, top: `${montura.y * 100}%`, width: `${montura.ancho * 100}%`, transform: `translate(-50%, -50%) rotate(${montura.angulo}deg)`, mixBlendMode: "multiply" }} />}
        </div>{mensaje && <p className="mt-4 text-center text-sm text-slate-500">{mensaje}</p>}</div><ProductInfo producto={datos.producto} />
    </div>
    <section className="mx-auto mt-12 max-w-7xl">
      <h2 className="px-4 text-center text-2xl font-bold text-slate-800">Explora más monturas</h2><Carousel />
    </section>
  </div>;
}
