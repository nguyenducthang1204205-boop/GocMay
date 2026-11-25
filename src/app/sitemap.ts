import type { MetadataRoute } from "next";
import { SITE_URL, routes } from "@/config/site";
import { getPhotographers } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const photographers = await getPhotographers();
  const pages = [routes.home, routes.photographers, routes.schools, routes.pricing, routes.contact];
  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.8 })),
    ...photographers.map((p) => ({
      url: `${SITE_URL}${routes.photographer(p.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
