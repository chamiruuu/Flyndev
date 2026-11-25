import { site } from "@/lib/site";
import { Arrow, Plane } from "./icons";
import { HeroCanvas } from "./HeroCanvas";
import { HeroWord } from "./HeroWord";
import { VisitorLine } from "./VisitorLine";
import s from "./home.module.css";

export function Hero() {
  const ticker = [...site.ticker, ...site.ticker];
  return (
    <section id="top" className={s.hero}>
      <HeroCanvas />
      <div className={s.wrap}>
        <div className={s.heroGrid}>
          <div className={s.heroText}>
            <p className={`${s.kicker} ${s.heroIn}`}>{site.hero.kicker}</p>
            <h1 className={`${s.h1} ${s.heroIn}`} style={{ ["--rv" as string]: "0.08s" }}>
              The{" "}
              <span className={`${s.serif} ${s.orange}`}>
                <HeroWord text="runway" />
              </span>
              <br />
              for growing
              <br />
              businesses.
            </h1>
            <p
              className={`${s.heroSub} ${s.heroIn}`}
              style={{ ["--rv" as string]: "0.16s" }}
            >
              {site.hero.sub}
            </p>
            <div
              className={`${s.heroCtas} ${s.heroIn}`}
              style={{ ["--rv" as string]: "0.24s" }}
            >
              <a href="#radio" className={`${s.btnDark} cursor-target`}>
                <span>Start your flight</span>
                <span className={s.btnDot}>
                  <Arrow />
                </span>
              </a>
              <a href="#route" className={`${s.btnGhost} cursor-target`}>
                Our flight path
              </a>
            </div>
            <div className={s.heroIn} style={{ ["--rv" as string]: "0.32s" }}>
              <VisitorLine fallback={site.hero.fallbackStatus} />
            </div>
          </div>
          <div aria-hidden="true" />
        </div>
      </div>

      <div className={s.ticker} aria-label="Flyndev">
        <div className={s.tickerTrack}>
          {ticker.map((t, i) => (
            <span
              key={i}
              className={s.tickerItem}
              aria-hidden={i >= site.ticker.length || undefined}
            >
              {t}
              <Plane size={14} color="var(--accent)" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
