import type { Metadata } from "next";
import { LegalPage } from "@/components/page/LegalPage";
import { legalDraft, privacy } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Flyndev collects when you visit or contact us, and what we do with it.",
  alternates: { canonical: "/privacy" },
  robots: legalDraft ? { index: false, follow: true } : undefined,
};

export default function Privacy() {
  return (
    <LegalPage
      kicker="Privacy note"
      title="Your data, flown"
      accent="carefully."
      sections={privacy}
    />
  );
}
