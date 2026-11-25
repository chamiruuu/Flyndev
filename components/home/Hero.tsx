import { site } from "@/lib/site";
import { Arrow, Plane } from "./icons";
import Galaxy from "@/components/vendor/Galaxy";
import { AfterLoad } from "./AfterLoad";
import { Globe } from "./Globe";
import { HeroWord } from "./HeroWord";
import { VisitorLine } from "./VisitorLine";
import s from "./home.module.css";

export function Hero() {
  const ticker = [...site.ticker, ...site.ticker];
  return (
    <section id="top" className={s.hero}>
      <div className={s.heroSky} aria-hidden="true">
        <AfterLoad>
          <Galaxy
            className={s.skyFade}
            lightMode
            transparent
            intro={false}
            starColors={["#a8a29e", "#c9c3ba", "#f4511e"]}
            density={0.8}
            layers={4}
            glowIntensity={0.18}
            starSize={0.8}
            flareIntensity={0.25}
            twinkleIntensity={0.25}
            starSpeed={0.2}
            rotationSpeed={0.02}
            repulsionStrength={2}
            mouseRepulsion
            clickWarp={false}
            opacity={0.6}
            focal={[0.72, 0.45]}
            dpr={1}
            maxFps={30}
          />
        </AfterLoad>
      </div>
      <Globe className={s.heroGlobe} />
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
