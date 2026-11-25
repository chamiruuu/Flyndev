import type { Metadata } from "next";
import { LegalPage } from "@/components/page/LegalPage";
import { legalDraft, terms } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using the Flyndev website.",
  alternates: { canonical: "/terms" },
  robots: legalDraft ? { index: false, follow: true } : undefined,
};

export default function Terms() {
  return (
    <LegalPage
      kicker="Terms of use"
      title="Rules of the"
      accent="runway."
      sections={terms}
    />
  );
}
