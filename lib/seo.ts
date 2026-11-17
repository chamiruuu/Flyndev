import { site } from "@/lib/site";

export const seo = {
  title: "Flyndev — Web, Systems & Automation | Coming Soon",
  description:
    "Flyndev builds websites, systems and automation for small businesses, startups and founders. Based in Colombo, working worldwide. Full site coming soon.",
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
  sameAs: [`https://www.instagram.com/${site.instagram}`],
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location.locality,
    addressCountry: site.location.country,
  },
};
