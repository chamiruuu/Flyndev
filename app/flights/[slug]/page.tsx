import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page/PageShell";
import { ArrowLeft, ArrowUpRight, Plane } from "@/components/home/icons";
import { Radio } from "@/components/home/Radio";
import h from "@/components/home/home.module.css";
import p from "@/components/page/page.module.css";
import { flightBySlug, flights } from "@/lib/flights";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return flights.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = flightBySlug((await params).slug);
  if (!f) return {};
  return {
    title: `${f.code} · ${f.client} · Flight log`,
    description: f.summary,
    alternates: { canonical: `/flights/${f.slug}` },
  };
}

export default async function FlightLog({ params }: Props) {
  const f = flightBySlug((await params).slug);
  if (!f) notFound();
  const i = flights.indexOf(f);
  const next = flights[(i + 1) % flights.length];
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <PageShell>
      <article className={h.wrap}>
        <header className={p.head}>
          <Link href="/flights" className={`${p.back} cursor-target`}>
            <ArrowLeft size={14} color="currentColor" /> All flights
          </Link>
          <p className={`${h.kicker} ${h.heroIn}`}>
            Flight log · {f.code} · {f.type}
          </p>
          <h1
            className={`${p.title} ${h.heroIn}`}
            style={{ ["--rv" as string]: "0.08s" }}
          >
            {f.client}
          </h1>
          <p className={`${p.lede} ${h.heroIn}`} style={{ ["--rv" as string]: "0.16s" }}>
            {f.summary}
          </p>

          <div
            className={`${p.strip} ${h.heroIn}`}
            style={{ ["--rv" as string]: "0.24s" }}
          >
            <div className={p.route}>
              <span className={p.port}>
                <span className={p.portCode}>CMB</span>
                <span className={p.portName}>Colombo</span>
              </span>
              <span className={p.dash} aria-hidden="true">
                <Plane size={18} color="var(--accent)" />
              </span>
              <span className={p.port} style={{ alignItems: "flex-end" }}>
                <span className={p.portCode}>{f.to}</span>
                <span className={p.portName}>{f.city}</span>
              </span>
            </div>
            <dl className={p.facts}>
              {[
                ["Service", f.type],
                ["Industry", f.industry],
                ["Status", f.status],
                [f.status === "Landed" ? "Landed" : "Lands", f.landed],
                ["Flight time", f.duration],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd
                    className={
                      k === "Status" && f.status === "In flight" ? p.flying : undefined
                    }
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <div
          className={`${p.shot} rv`}
          style={{ background: `linear-gradient(160deg, ${f.tint}, #fbfaf7)` }}
        >
          <span className={p.shotChip}>
            {f.code} · {f.type}
          </span>
          [PROJECT SCREENSHOT]
        </div>

        <section className={`${p.section} rv`}>
          <h2 className={p.label}>
            <b>{num()}</b> The brief
          </h2>
          <p className={p.body}>{f.brief}</p>
        </section>

        <section className={`${p.section} rv`}>
          <h2 className={p.label}>
            <b>{num()}</b> Headwinds
          </h2>
          <p className={p.body}>{f.challenge}</p>
        </section>

        <section className={`${p.section} rv`}>
          <h2 className={p.label}>
            <b>{num()}</b> Flight plan
          </h2>
          <ol className={p.steps}>
            {f.plan.map((s) => (
              <li key={s.label}>
                <span className={p.stepCode}>{s.label}</span>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {f.outcomes.length > 0 && (
          <section className={`${p.section} rv`}>
            <h2 className={p.label}>
              <b>{num()}</b> After landing
            </h2>
            <dl className={p.outcomes}>
              {f.outcomes.map((o, k) => (
                <div key={k}>
                  <dt>{o.label}</dt>
                  <dd>{o.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className={`${p.section} rv`}>
          <h2 className={p.label}>
            <b>{num()}</b> On board
          </h2>
          <ul className={p.chips}>
            {f.stack.map((t, k) => (
              <li key={k}>{t}</li>
            ))}
          </ul>
        </section>

        {f.quote && (
          <section className={`${p.section} rv`}>
            <h2 className={p.label}>
              <b>{num()}</b> From the cabin
            </h2>
            <blockquote className={p.quote}>
              <p>“{f.quote.text}”</p>
              <footer>
                {f.quote.name} · {f.quote.role}
              </footer>
            </blockquote>
          </section>
        )}

        <Link href={`/flights/${next.slug}`} className={`${p.next} cursor-target rv`}>
          <span>
            <span className={p.label}>Next flight · {next.code}</span>
            <span className={p.nextTitle}>{next.client}</span>
          </span>
          <ArrowUpRight size={28} />
        </Link>
      </article>
      <Radio />
    </PageShell>
  );
}
