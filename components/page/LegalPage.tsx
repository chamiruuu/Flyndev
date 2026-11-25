import h from "@/components/home/home.module.css";
import { legalDraft, legalUpdated, type LegalSection } from "@/lib/legal";
import { PageShell } from "./PageShell";
import p from "./page.module.css";

export function LegalPage({
  kicker,
  title,
  accent,
  sections,
}: {
  kicker: string;
  title: string;
  accent: string;
  sections: LegalSection[];
}) {
  return (
    <PageShell>
      <article className={h.wrap}>
        <header className={p.head}>
          {legalDraft && (
            <p className={p.draft} role="note">
              Draft for review · not yet confirmed
            </p>
          )}
          <p className={`${h.kicker} ${h.heroIn}`}>{kicker}</p>
          <h1
            className={`${p.title} ${h.heroIn}`}
            style={{ ["--rv" as string]: "0.08s" }}
          >
            {title} <span className={`${h.serif} ${h.orange}`}>{accent}</span>
          </h1>
          <p
            className={`${p.note} ${h.heroIn}`}
            style={{ marginTop: 24, ["--rv" as string]: "0.16s" }}
          >
            Last updated · {legalUpdated}
          </p>
        </header>
        <div className={p.legal}>
          {sections.map((s, i) => (
            <section key={s.title} className={p.section}>
              <h2 className={p.label}>
                <b>{String(i + 1).padStart(2, "0")}</b> {s.title}
              </h2>
              <div className={p.legalBody}>
                {s.body.map((t, k) => (
                  <p key={k}>{t}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </PageShell>
  );
}
