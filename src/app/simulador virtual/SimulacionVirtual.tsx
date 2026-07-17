"use client";
/* eslint-disable @next/next/no-img-element -- MediaPipe requiere elementos HTMLImageElement para analizar la foto local. */
/* eslint-disable @typescript-eslint/no-explicit-any -- @mediapipe/face_mesh es UMD y no expone tipos/exports estáticos utilizables aquí. */

import { useEffect, useRef, useState } from "react";
import { type Producto } from "../types/producto";
import ProductInfo from "../producto info/ProductInfo";
import Carousel from "../carousel/carousel";

interface DatosSimulacion {
  fotoUrl: string;
  producto: Omit<Producto, "image"> & { image: string };
}
interface Punto {
  x: number;
  y: number;
}
interface Montura {
  x: number;
  y: number;
  ancho: number;
  angulo: number;
}
interface FaceMeshResults {
  multiFaceLandmarks?: Punto[][];
}
interface FaceMeshInstance {
  setOptions: (opts: Record<string, unknown>) => void;
  onResults: (cb: (results: FaceMeshResults) => void) => void;
  send: (input: { image: HTMLImageElement }) => Promise<void>;
  close?: () => void;
}

export default function SimulacionVirtual() {
  const fotoRef = useRef<HTMLImageElement>(null);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);

  const [datos] = useState<DatosSimulacion | null>(() => {
    if (typeof window === "undefined") return null;
    const guardado = sessionStorage.getItem("optica-mia-try-on");
    return guardado ? (JSON.parse(guardado) as DatosSimulacion) : null;
  });

  const [montura, setMontura] = useState<Montura | null>(null);
  const [mensaje, setMensaje] = useState("Analizando rostro…");

  useEffect(() => {
    let cancelado = false;

    const iniciarFaceMesh = async () => {
      try {
        const mod: any = await import("@mediapipe/face_mesh");
        const FaceMeshCtor = mod.FaceMesh ?? mod.default?.FaceMesh ?? mod.default;

        if (!FaceMeshCtor) {
          setMensaje("No se pudo cargar el módulo de detección facial.");
          return;
        }

        const faceMesh: FaceMeshInstance = new FaceMeshCtor({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: FaceMeshResults) => {
          if (!results.multiFaceLandmarks?.length) {
            setMontura(null);
            setMensaje(
              "No pudimos detectar el rostro. Intenta con una foto frontal y bien iluminada."
            );
            return;
          }

          const puntos = results.multiFaceLandmarks[0];
          const izquierdo = puntos[33];
          const derecho = puntos[263];

          const dx = derecho.x - izquierdo.x;
          const dy = derecho.y - izquierdo.y;

          setMontura({
            x: (izquierdo.x + derecho.x) / 2,
            y: (izquierdo.y + derecho.y) / 2,
            ancho: Math.sqrt(dx * dx + dy * dy) * 2.35,
            angulo: (Math.atan2(dy, dx) * 180) / Math.PI,
          });

          setMensaje("");
        });

        if (!cancelado) {
          faceMeshRef.current = faceMesh;
          // Si la imagen ya estaba cargada antes de terminar de inicializar, la analizamos ahora.
          if (fotoRef.current?.complete && fotoRef.current.naturalWidth > 0) {
            detectarRostro(fotoRef.current);
          }
        }
      } catch {
        setMensaje("No se pudo cargar la detección facial. Verifica tu conexión e inténtalo de nuevo.");
      }
    };

    iniciarFaceMesh();

    return () => {
      cancelado = true;
      faceMeshRef.current?.close?.();
      faceMeshRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectarRostro = async (imagenCargada?: HTMLImageElement) => {
    const imagen = imagenCargada ?? fotoRef.current;

    if (!imagen) {
      setMensaje("La imagen aún no está lista para analizarse. Intenta nuevamente.");
      return;
    }

    if (!imagen.complete || imagen.naturalWidth === 0 || imagen.naturalHeight === 0) {
      setMensaje("La imagen aún no está lista para analizarse. Intenta nuevamente.");
      return;
    }

    const detector = faceMeshRef.current;
    if (!detector) {
      // El modelo aún se está inicializando; se reintentará automáticamente cuando esté listo.
      return;
    }

    try {
      await detector.send({ image: imagen });
    } catch {
      setMensaje("No se pudo cargar la detección facial. Verifica tu conexión e inténtalo de nuevo.");
    }
  };

  if (!datos)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-600">
        No hay una simulación pendiente. Selecciona una montura para comenzar.
      </div>
    );

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-100 shadow-lg">
            <img
              ref={fotoRef}
              src={datos.fotoUrl}
              alt="Usuario con montura"
              onLoad={({ currentTarget }) => {
                detectarRostro(currentTarget).catch((e) => {
                  console.error("Unhandled rejection in detectarRostro:", e);
                  setMensaje(`Error: ${e?.message || String(e)}`);
                });
              }}
              onError={() => setMensaje("No fue posible cargar la imagen para la simulación.")}
              className="block h-auto w-full"
            />
            {montura && (
              <img
                src={datos.producto.image}
                alt={`Montura ${datos.producto.name}`}
                className="pointer-events-none absolute"
                style={{
                  left: `${montura.x * 100}%`,
                  top: `${montura.y * 100}%`,
                  width: `${montura.ancho * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${montura.angulo}deg)`,
                  mixBlendMode: "multiply",
                }}
              />
            )}
          </div>
          {mensaje && <p className="mt-4 text-center text-sm text-slate-500">{mensaje}</p>}
        </div>
        <ProductInfo producto={datos.producto} />
      </div>
      <section className="mx-auto mt-12 max-w-7xl">
        <h2 className="px-4 text-center text-2xl font-bold text-slate-800">Explora más monturas</h2>
        <Carousel />
      </section>
    </div>
  );
}