import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://opticamia.com.co";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/carrito", "/favoritas", "/dashboard", "/perfil/", "/api/", "/demo/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
