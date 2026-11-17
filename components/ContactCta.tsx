import { site } from "@/lib/site";
import styles from "./ContactCta.module.css";

export function ContactCta() {
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent("New project — Flyndev")}`;

  return (
    <div className={styles.cta}>
      <a className={styles.button} href={mailto}>
        Start a project <span aria-hidden="true">→</span>
      </a>
      <p className={styles.note}>
        Follow the build{" "}
        <a
          className={styles.handle}
          href={`https://instagram.com/${site.instagram}`}
          target="_blank"
          rel="noopener"
        >
          @{site.instagram}
          <span className="visually-hidden"> (opens Instagram in a new tab)</span>
        </a>
      </p>
    </div>
  );
}
