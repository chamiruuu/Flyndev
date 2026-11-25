import type { MetadataRoute } from "next";
import { flights } from "@/lib/flights";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/flights`, changeFrequency: "monthly", priority: 0.8 },
    ...flights.map((f) => ({
      url: `${site.url}/flights/${f.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: `${site.url}/radio`, changeFrequency: "yearly", priority: 0.7 },
  ];
}
