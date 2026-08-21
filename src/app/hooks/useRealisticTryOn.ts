"use client";

import { useCallback, useRef, useState } from "react";
import { SUPPORTED_ASPECT_RATIOS, type AspectRatio } from "../config/tryOnPrompts";

export type EstadoGeneracion = "idle" | "generando" | "listo" | "error";

interface TryOnResponse {
  image?: string;
  error?: string;
}

/** Dimensión máxima del lado mayor de la foto enviada al modelo. */
const MAX_FOTO_DIM = 1536;

interface ImagenPreparada {
  dataUrl: string;
  aspectRatio: AspectRatio;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

function ratioMasCercano(width: number, height: number): AspectRatio {
  const objetivo = Math.log(width / height);
  let mejor: AspectRatio = "1:1";
  let mejorDelta = Number.POSITIVE_INFINITY;
  for (const ratio of SUPPORTED_ASPECT_RATIOS) {
    const [w, h] = ratio.split(":").map(Number);
    const delta = Math.abs(Math.log(w / h) - objetivo);
    if (delta < mejorDelta) {
      mejorDelta = delta;
      mejor = ratio;
    }
  }
  return mejor;
}

/** Reduce la foto a un tamaño razonable y devuelve su data URL + ratio de aspecto. */
async function prepararFoto(src: string): Promise<ImagenPreparada> {
  const img = await cargarImagen(src);
  const escala = Math.min(1, MAX_FOTO_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * escala));
  const height = Math.max(1, Math.round(img.naturalHeight * escala));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0, width, height);

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), aspectRatio: ratioMasCercano(width, height) };
}

async function cargarMontura(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo cargar la imagen de la montura");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen de la montura"));
    reader.readAsDataURL(blob);
  });
}

function extensionDeMime(dataUrl: string): string {
  if (dataUrl.includes("image/jpeg")) return "jpg";
  if (dataUrl.includes("image/webp")) return "webp";
  return "png";
}

interface UseRealisticTryOnReturn {
  estado: EstadoGeneracion;
  imagenResultado: string | null;
  error: string | null;
  generar: (faceSrc: string, glassesSrc: string) => Promise<boolean>;
  reiniciar: () => void;
  descargar: () => void;
}

export function useRealisticTryOn(): UseRealisticTryOnReturn {
  const [estado, setEstado] = useState<EstadoGeneracion>("idle");
  const [imagenResultado, setImagenResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generar = useCallback(async (faceSrc: string, glassesSrc: string): Promise<boolean> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setEstado("generando");
    setError(null);

    try {
      const [foto, montura] = await Promise.all([
        prepararFoto(faceSrc),
        cargarMontura(glassesSrc),
      ]);

      const response = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          faceImage: foto.dataUrl,
          glassesImage: montura,
          aspectRatio: foto.aspectRatio,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as TryOnResponse;

      if (!response.ok || !payload.image) {
        setImagenResultado(null);
        setError(payload.error ?? "No se pudo generar la foto realista. Inténtalo de nuevo.");
        setEstado("error");
        return false;
      }

      setImagenResultado(payload.image);
      setEstado("listo");
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
      console.error("Error generando foto realista:", err);
      setImagenResultado(null);
      setError(err instanceof Error ? err.message : "Error inesperado al generar la foto.");
      setEstado("error");
      return false;
    }
  }, []);

  const reiniciar = useCallback(() => {
    abortRef.current?.abort();
    setEstado("idle");
    setImagenResultado(null);
    setError(null);
  }, []);

  const descargar = useCallback(() => {
    if (!imagenResultado) return;
    const link = document.createElement("a");
    link.download = `optica-mia-fotorrealista.${extensionDeMime(imagenResultado)}`;
    link.href = imagenResultado;
    link.click();
  }, [imagenResultado]);

  return { estado, imagenResultado, error, generar, reiniciar, descargar };
}
