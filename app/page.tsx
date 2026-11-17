import Image from "next/image";
import { ContactCta } from "@/components/ContactCta";
import { FlightProgress } from "@/components/FlightProgress";
import { Horizon } from "@/components/Horizon";
import { LocalClock } from "@/components/LocalClock";
import { StatusBoard } from "@/components/StatusBoard";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Image
          src="/brand/f-mark.png"
          alt=""
          width={160}
          height={86}
          className={styles.fmark}
          priority
        />
        <p className={`label ${styles.place}`}>
          <span className={styles.placeName}>{site.location.label}</span>
          <LocalClock timeZone={site.timezone} />
        </p>
      </header>

      <main className={styles.main}>
        <Horizon />
        <div className={styles.content}>
          <p className={`label ${styles.flight}`}>{site.flightLabel}</p>

          <Image
            src="/brand/wordmark.png"
            alt="Flyndev"
            width={1280}
            height={151}
            className={styles.wordmark}
            priority
          />

          <h1 className={styles.headline}>
            Websites, systems and automation for founders ready to take off.
          </h1>
          <p className={styles.sub}>
            Our full site is still in the hangar — but we&rsquo;re already taking on
            projects.
          </p>

          <div className={styles.statusWrap}>
            <StatusBoard statuses={site.statuses} />
          </div>

          <ContactCta />
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={`label ${styles.copy}`}>© {year} Flyndev</p>
        <div className={styles.progress}>
          <FlightProgress progress={site.progress} />
        </div>
        <a className={`label ${styles.email}`} href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </footer>
    </div>
  );
}
