"use client";
/* eslint-disable @next/next/no-img-element -- MediaPipe requiere elementos HTMLImageElement para analizar la foto local. */
/* eslint-disable @typescript-eslint/no-explicit-any -- @mediapipe/face_mesh es UMD y no expone tipos/exports estáticos utilizables aquí. */

import { useCallback, useEffect, useRef, useState } from "react";
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
interface LandmarksResultado {
  centerX: number;
  centerY: number;
  glassesWidth: number;
  rotation: number;
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

function dist(a: Punto, b: Punto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function promedio(pts: Punto[]): Punto {
  const s = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

function calcularLandmarks(puntos: Punto[]): LandmarksResultado {
  const leftInner = puntos[133];
  const rightInner = puntos[263];
  const leftOuter = puntos[33];
  const rightOuter = puntos[362];

  const leftTop = puntos[159];
  const leftBottom = puntos[145];
  const rightTop = puntos[386];
  const rightBottom = puntos[374];

  const noseBridge = puntos[168];

  const leftEyeCenter = promedio([leftInner, leftOuter, leftTop, leftBottom]);
  const rightEyeCenter = promedio([rightInner, rightOuter, rightTop, rightBottom]);

  const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
  const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

  const verticalOffset = (noseBridge.y - centerY) * 0.15;
  const adjustedCenterY = centerY + verticalOffset;

  const interEyeDistance = dist(leftOuter, rightOuter);
  const glassesWidth = interEyeDistance * 2.3;

  const dx = rightOuter.x - leftOuter.x;
  const dy = rightOuter.y - leftOuter.y;
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

  return { centerX, centerY: adjustedCenterY, glassesWidth, rotation };
}

function cargarImagenBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1024;
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h / w) * maxDim); w = maxDim; }
        else { w = Math.round((w / h) * maxDim); h = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No se pudo crear canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = url;
  });
}

function dataUrlABase64(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith("data:")) return Promise.resolve(dataUrl);
  return fetch(dataUrl)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }),
    );
}

export default function SimulacionVirtual() {
  const fotoRef = useRef<HTMLImageElement>(null);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const datosRef = useRef<DatosSimulacion | null>(null);
  const apiLlamadaRef = useRef(false);
  const imagenDetectadaRef = useRef(false);

  const [datos, setDatos] = useState<DatosSimulacion | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [montura, setMontura] = useState<LandmarksResultado | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [procesandoAPI, setProcesandoAPI] = useState(false);
  const [imagenCompuesta, setImagenCompuesta] = useState<string | null>(null);
  const [errorAPI, setErrorAPI] = useState<string | null>(null);

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem("optica-mia-try-on");
      if (guardado) {
        const parsed = JSON.parse(guardado) as DatosSimulacion;
        datosRef.current = parsed;
        setDatos(parsed);
        setMensaje("Analizando rostro con IA...");
      } else {
        setMensaje("");
      }
    } catch {
      setMensaje("");
    }
    setCargandoDatos(false);
  }, []);

  const llamarAPI = useCallback(
    async (landmarks: LandmarksResultado) => {
      const d = datosRef.current;
      if (!d) return;

      setProcesandoAPI(true);
      setErrorAPI(null);
      try {
        const faceBase64 = await dataUrlABase64(d.fotoUrl);
        const glassesBase64 = await cargarImagenBase64(d.producto.image);

        const response = await fetch("/api/try-on", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faceImage: faceBase64,
            glassesImage: glassesBase64,
            landmarks,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Error en la API");
        }

        const result = await response.json();
        setImagenCompuesta(result.compositedImage);
      } catch (err) {
        console.error("API try-on error:", err);
        setErrorAPI(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setProcesandoAPI(false);
      }
    },
    [],
  );

  const onFaceMeshResults = useCallback(
    (results: FaceMeshResults) => {
      if (!results.multiFaceLandmarks?.length) {
        setMontura(null);
        setMensaje("No pudimos detectar el rostro. Intenta con una foto frontal y bien iluminada.");
        return;
      }

      const puntos = results.multiFaceLandmarks[0];
      const landmarks = calcularLandmarks(puntos);
      setMontura(landmarks);
      setMensaje("");

      if (datosRef.current && !apiLlamadaRef.current) {
        apiLlamadaRef.current = true;
        llamarAPI(landmarks);
      }
    },
    [llamarAPI],
  );

  const detectarRostro = useCallback(
    async (imagen: HTMLImageElement) => {
      const detector = faceMeshRef.current;
      if (!detector) return;
      try {
        await detector.send({ image: imagen });
      } catch {
        setMensaje("No se pudo procesar la detección facial. Verifica tu conexión.");
      }
    },
    [],
  );

  useEffect(() => {
    let cancelado = false;

    const iniciar = async () => {
      try {
        const mod: any = await import("@mediapipe/face_mesh");
        const FaceMeshCtor = mod.FaceMesh ?? mod.default?.FaceMesh ?? mod.default;

        if (!FaceMeshCtor || cancelado) {
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
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        faceMesh.onResults(onFaceMeshResults);

        if (cancelado) return;

        faceMeshRef.current = faceMesh;

        if (fotoRef.current?.complete && fotoRef.current.naturalWidth > 0 && !imagenDetectadaRef.current) {
          imagenDetectadaRef.current = true;
          detectarRostro(fotoRef.current);
        }
      } catch {
        if (!cancelado) setMensaje("No se pudo cargar la detección facial.");
      }
    };

    iniciar();

    return () => {
      cancelado = true;
      faceMeshRef.current?.close?.();
      faceMeshRef.current = null;
    };
  }, [onFaceMeshResults, detectarRostro]);

  const handleImagenCargada = useCallback(() => {
    if (imagenDetectadaRef.current) return;
    const img = fotoRef.current;
    if (img && faceMeshRef.current) {
      imagenDetectadaRef.current = true;
      detectarRostro(img);
    }
  }, [detectarRostro]);

  if (cargandoDatos) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-4 py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#008294] border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando simulación...</p>
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-600">
        No hay una simulación pendiente. Selecciona una montura para comenzar.
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-2xl border-4 border-[#005f6b] bg-slate-100 shadow-lg">
            <img
              ref={fotoRef}
              src={datos.fotoUrl}
              alt="Usuario con montura"
              onLoad={handleImagenCargada}
              onError={() => setMensaje("No fue posible cargar la imagen.")}
              className="block h-auto w-full"
            />

            {montura && !imagenCompuesta && (
              <img
                src={datos.producto.image}
                alt={`Montura ${datos.producto.name}`}
                className="pointer-events-none"
                style={{
                  position: "absolute",
                  left: `${montura.centerX * 100}%`,
                  top: `${montura.centerY * 100}%`,
                  width: `${montura.glassesWidth * 100}%`,
                  height: "auto",
                  transform: `translate(-50%, -50%) rotate(${montura.rotation}deg)`,
                  mixBlendMode: "multiply",
                }}
              />
            )}

            {imagenCompuesta && (
              <img
                src={imagenCompuesta}
                alt="Simulación IA de montura en tu rostro"
                className="absolute inset-0 h-full w-full object-contain"
                style={{ animation: "fadeIn 0.4s ease" }}
              />
            )}

            {procesandoAPI && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#008294] border-t-transparent" />
                  <span className="text-xs font-medium text-slate-700">Procesando con IA...</span>
                </div>
              </div>
            )}
          </div>

          {mensaje && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">🔍</span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{mensaje}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Usa una foto frontal con buena iluminación para mejores resultados.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorAPI && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-amber-700">{errorAPI}</p>
                  <p className="mt-1 text-xs text-amber-500">
                    Se muestra la vista previa básica. La posición puede no ser 100% exacta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {imagenCompuesta && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">✨</span>
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Simulación IA generada
                  </p>
                  <p className="mt-1 text-xs text-green-500">
                    Montura posicionada con detección de 468 puntos faciales.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <ProductInfo producto={datos.producto} />
      </div>

      <section className="mx-auto mt-12 max-w-7xl">
        <h2 className="px-4 text-center text-2xl font-bold text-slate-800">
          Explora más monturas
        </h2>
        <Carousel />
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
