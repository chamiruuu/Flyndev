import { site } from "@/lib/site";

export const seo = {
  title: "Flyndev — The runway for growing businesses",
  description:
    "Flyndev is a digital studio building websites, systems and automation for growing businesses. Based in Colombo, working worldwide.",
} as const;

/** schema.org Organization, rendered as JSON-LD in the root layout. */
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/icon.png`,
  description: seo.description,
  email: site.email,
  foundingDate: String(site.founded),
  sameAs: [`https://www.instagram.com/${site.instagram}`],
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location.locality,
    addressCountry: site.location.country,
  },
};
