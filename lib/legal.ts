/**
 * Privacy note and terms of use. DRAFTS written for Flyndev's owner to review before launch; they
 * are not legal advice. While `legalDraft` is true each page shows a draft banner and asks search
 * engines not to index it. Set it to false once the text is confirmed.
 */
import { site } from "./site";

export const legalDraft = true;
export const legalUpdated = "[Date confirmed]";

export type LegalSection = { title: string; body: string[] };

export const privacy: LegalSection[] = [
  {
    title: "Who we are",
    body: [
      `Flyndev is a digital studio based in Colombo, Sri Lanka, working with clients worldwide. This note explains what happens to information when you visit ${site.domain} or contact us. Questions go to ${site.email}.`,
    ],
  },
  {
    title: "What we collect",
    body: [
      "When you send a flight plan or email us, we receive what you choose to share: usually your name, email address, business name and a description of your project. We use it only to reply to you and, if we work together, to run the project.",
      "Our hosting provider (Vercel) keeps standard server logs, such as IP address, browser type and the pages requested, to deliver the site and keep it secure.",
      "We measure how fast pages load using Vercel Speed Insights. It records anonymous performance numbers and does not use cookies or identify you.",
    ],
  },
  {
    title: "What we don't do",
    body: [
      "We don't use advertising or tracking cookies, we don't build profiles of visitors and we never sell or rent personal information.",
      "The flight code and local time shown on the home page are worked out in your browser from its time zone. Nothing about your location is sent to us.",
    ],
  },
  {
    title: "Who else handles it",
    body: [
      "We use a small number of trusted services to run the site and our work: Vercel for hosting, our email provider for messages and, once enabled, Resend for delivering form submissions. They process data on our behalf and may store it outside Sri Lanka.",
      "Links to other sites, such as Instagram, are covered by those sites' own policies.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Enquiries that don't lead to a project are deleted within [12 months]. Project records are kept for as long as the work and any legal or accounting obligations require.",
    ],
  },
  {
    title: "Your rights",
    body: [
      `You can ask to see, correct or delete the personal information we hold about you, or object to how we use it, by writing to ${site.email}. We reply within [30 days]. These rights come from Sri Lanka's Personal Data Protection Act No. 9 of 2022 and, where they apply to you, laws such as the EU and UK GDPR.`,
    ],
  },
  {
    title: "Changes",
    body: ["If this note changes, the new version will be posted here with its date."],
  },
];

export const terms: LegalSection[] = [
  {
    title: "About these terms",
    body: [
      `These terms cover your use of ${site.domain}, run by Flyndev from Colombo, Sri Lanka. By using the site you accept them. Project work is covered by a separate written agreement, which takes priority over these terms.`,
    ],
  },
  {
    title: "Using the site",
    body: [
      "You may browse the site and share links to it. Please don't try to disrupt it, access parts of it that aren't public, or copy it in bulk by automated means.",
    ],
  },
  {
    title: "Our content",
    body: [
      "The Flyndev name, logo, text, design and code of this site belong to Flyndev unless stated otherwise. Client names, logos and work shown in case studies belong to their owners and appear with permission.",
    ],
  },
  {
    title: "Information on the site",
    body: [
      "We keep the site accurate, but it is provided as is. Descriptions of services and past results are examples, not a promise of a particular outcome. Prices, timelines and scope are agreed in writing for each project.",
    ],
  },
  {
    title: "Liability",
    body: [
      "As far as the law allows, Flyndev is not liable for loss arising from use of this site or of sites it links to. Nothing in these terms limits liability that cannot be limited by law.",
    ],
  },
  {
    title: "Law",
    body: [
      "These terms are governed by the laws of Sri Lanka, and the courts of Colombo have jurisdiction over any dispute about them.",
    ],
  },
  {
    title: "Contact",
    body: [`Questions about these terms: ${site.email}.`],
  },
];
