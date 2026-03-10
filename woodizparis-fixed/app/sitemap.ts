// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://woodiz.fr";
  const now = new Date();

  // Seules les vraies pages sont dans le sitemap — les ancres (#) ne sont pas indexées par Google
  return [
    { url: baseUrl,                            lastModified: now, changeFrequency: "daily",   priority: 1   },
    { url: `${baseUrl}/about`,                 lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/mentions-legales`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/cgu`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/privacy`,               lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
