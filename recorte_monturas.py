#!/usr/bin/env python3
"""
recorte_monturas.py — Normaliza recorte y centrado de las imágenes de monturas
del probador virtual (Óptica Mía).

Uso:
    python recorte_monturas.py [carpeta_entrada] [carpeta_salida]

Valores por defecto:
    carpeta_entrada = public/monturas
    carpeta_salida  = monturas-procesadas

Qué hace:
  1. Lee cada PNG con canal alfa (RGBA) de la carpeta de entrada.
  2. Recorta al bounding box del contenido visible (píxeles con alpha > umbral).
  3. Centra el contenido en un lienzo con un margen proporcional (por defecto 5%).
  4. Guarda el resultado como PNG transparente en la carpeta de salida,
     SIN sobrescribir los originales.

Requisitos: Pillow  (pip install Pillow)
"""

import os
import sys
from PIL import Image

ALPHA_THRESHOLD = 8
MARGIN_RATIO = 0.05


def procesar(ruta_entrada: str, ruta_salida: str) -> None:
    img = Image.open(ruta_entrada).convert("RGBA")
    alpha = img.getchannel("A")

    bbox = alpha.getbbox() if True else None
    if bbox is None:
        # Sin píxeles visibles: copia tal cual para no perder el archivo.
        img.save(ruta_salida)
        return

    # Bounding box de píxeles realmente visibles (alpha > umbral).
    # getbbox() ya devuelve la caja de píxeles no transparentes.
    recortada = img.crop(bbox)

    w, h = recortada.size
    pad = max(1, int(round(max(w, h) * MARGIN_RATIO)))
    lienzo = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    lienzo.paste(recortada, (pad, pad), recortada)
    lienzo.save(ruta_salida)


def main() -> None:
    entrada = sys.argv[1] if len(sys.argv) > 1 else "public/monturas"
    salida = sys.argv[2] if len(sys.argv) > 2 else "monturas-procesadas"

    os.makedirs(salida, exist_ok=True)

    procesados = 0
    for nombre in sorted(os.listdir(entrada)):
        if not nombre.lower().endswith((".png", ".webp")):
            continue
        origen = os.path.join(entrada, nombre)
        destino = os.path.join(salida, os.path.splitext(nombre)[0] + ".png")
        procesar(origen, destino)
        procesados += 1
        print(f"  ✓ {nombre} -> {destino}")

    print(f"\nListo: {procesados} imagen(es) procesadas en '{salida}'.")


if __name__ == "__main__":
    main()