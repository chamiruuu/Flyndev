import { flightBySlug, flights } from "@/lib/flights";
import { shareImage, shareSize } from "@/lib/shareImage";

export const dynamic = "force-static";
export const size = shareSize;
export const contentType = "image/png";
export const alt = "Flyndev flight log";

export function generateStaticParams() {
  return flights.map((f) => ({ slug: f.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const f = flightBySlug((await params).slug)!;
  return shareImage({
    code: `FLIGHT LOG · ${f.code}`,
    title: f.client,
    accent: f.type.toLowerCase() + ".",
    to: f.to,
    meta: `${f.status} · ${f.industry}`,
  });
}
