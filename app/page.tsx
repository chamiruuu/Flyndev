import Image from "next/image";
import { ContactCta } from "@/components/ContactCta";
import { Contrail } from "@/components/Contrail";
import { Intro } from "@/components/Intro";
import { LocalClock } from "@/components/LocalClock";
import { Runway } from "@/components/Runway";
import { StatusBoard } from "@/components/StatusBoard";
import { site } from "@/lib/site";
import styles from "./page.module.css";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <>
      <Intro steps={site.journey} />
      <Contrail />
      <div className={styles.page} data-app>
        <Runway />

        <main className={styles.main}>
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

            <div className={styles.meta}>
              <p className={`label ${styles.place}`}>
                <span className={styles.placeName}>{site.location.label}</span>
                <LocalClock timeZone={site.timezone} />
              </p>
              <p className={styles.fine}>
                <a className={`label ${styles.email}`} href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                <span className={`label ${styles.copy}`}>© {year} Flyndev</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
