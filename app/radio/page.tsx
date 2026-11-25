import type { Metadata } from "next";
import { ArrowUpRight } from "@/components/home/icons";
import h from "@/components/home/home.module.css";
import { PageShell } from "@/components/page/PageShell";
import p from "@/components/page/page.module.css";
import { FlightPlanForm } from "@/components/radio/FlightPlanForm";
import f from "@/components/radio/form.module.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Radio · Start a project",
  description:
    "Tell Flyndev where you want your business to go. File a short flight plan and we reply with a clear next step.",
  alternates: { canonical: "/radio" },
};

export default function RadioPage() {
  const channels: { k: string; v: string; href?: string; external?: boolean }[] = [
    { k: "Frequency", v: site.email, href: `mailto:${site.email}` },
    { k: "Reply", v: `Within ${site.replyTime}` },
    { k: "Tower", v: "Colombo, UTC+5:30 · working worldwide" },
  ];
  if (site.booking.url)
    channels.push({
      k: "Call",
      v: site.booking.label,
      href: site.booking.url,
      external: true,
    });

  return (
    <PageShell>
      <div className={`${h.wrap} ${f.layout}`}>
        <header className={`${p.head} ${f.intro}`}>
          <p className={`${h.kicker} ${h.heroIn}`}>Radio · Channel open</p>
          <h1
            className={`${p.title} ${h.heroIn}`}
            style={{ ["--rv" as string]: "0.08s" }}
          >
            File your flight <span className={`${h.serif} ${h.orange}`}>plan.</span>
          </h1>
          <p className={`${p.lede} ${h.heroIn}`} style={{ ["--rv" as string]: "0.16s" }}>
            A few lines is enough. Tell us what you have, where you want to go, and
            we&apos;ll come back with a clear next step, not a sales pitch.
          </p>
          <dl
            className={`${f.channels} ${h.heroIn}`}
            style={{ ["--rv" as string]: "0.24s" }}
          >
            {channels.map((c) => (
              <div key={c.k}>
                <dt>{c.k}</dt>
                <dd>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="cursor-target"
                      {...(c.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {c.v} {c.external && <ArrowUpRight size={14} />}
                    </a>
                  ) : (
                    c.v
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </header>
        <div
          className={`${f.formCol} ${h.heroIn}`}
          style={{ ["--rv" as string]: "0.2s" }}
        >
          <FlightPlanForm />
        </div>
      </div>
    </PageShell>
  );
}
