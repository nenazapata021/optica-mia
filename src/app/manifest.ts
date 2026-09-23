import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Óptica Mía - Monturas y Lentes en Itagüí | 452 Cra 49",
    short_name: "Óptica Mía",
    description: "Probador virtual con IA, monturas y lentes formulados en Itagüí. Envío gratis Medellín.",
    start_url: "/",
    display: "standalone",
    background_color: "#008294",
    theme_color: "#008294",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
