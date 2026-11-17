import type { CSSProperties } from "react";
import Image from "next/image";
import { ContactCta } from "@/components/ContactCta";
import { Intro } from "@/components/Intro";
import { LocalClock } from "@/components/LocalClock";
import { Runway } from "@/components/Runway";
import { StatusBoard } from "@/components/StatusBoard";
import TargetCursor from "@/components/TargetCursor";
import { site } from "@/lib/site";
import styles from "./page.module.css";

/** The delay of an element in the page entrance (see .rv in globals.css) */
const rv = (seconds: number) => ({ "--rv": `${seconds}s` }) as CSSProperties;

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <Intro steps={site.journey} />
      <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn />
      <div className={styles.page} data-app>
        <Runway />

        <main className={styles.main}>
          <div className={styles.content}>
            <p className={`label ${styles.flight} rv`} style={rv(0.05)}>
              {site.flightLabel}
            </p>

            <Image
              src="/brand/wordmark.png"
              alt="Flyndev"
              width={1280}
              height={151}
              className={styles.wordmark}
              priority
            />

            <h1 className={`${styles.headline} rv`} style={rv(0.3)}>
              Websites, systems and automation for founders ready to take off.
            </h1>
            <p className={`${styles.sub} rv`} style={rv(0.42)}>
              Our full site is still in the hangar — but we&rsquo;re already taking on
              projects.
            </p>

            <div className={`${styles.statusWrap} rv`} style={rv(0.55)}>
              <StatusBoard statuses={site.statuses} />
            </div>

            <div className="rv" style={rv(0.7)}>
              <ContactCta />
            </div>

            <div className={`${styles.meta} rv`} style={rv(0.85)}>
              <p className={`label ${styles.place}`}>
                <span className={styles.placeName}>{site.location.label}</span>
                <LocalClock timeZone={site.timezone} />
              </p>
              <p className={`label ${styles.copy}`}>© {year} Flyndev</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
