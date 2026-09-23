import type { MetadataRoute } from "next";
import { productosLentes, productosGafasSol } from "./data/productos.js";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://opticamia.com.co";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/lentes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/gafas-de-sol`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/probador-landing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/probador`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/ubicacion`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];

  const productRoutes: MetadataRoute.Sitemap = [...productosLentes, ...productosGafasSol].map((p) => ({
    url: `${baseUrl}/producto/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
