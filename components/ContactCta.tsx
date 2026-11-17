import { site } from "@/lib/site";
import styles from "./ContactCta.module.css";

export function ContactCta() {
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent("New project — Flyndev")}`;

  return (
    <div className={styles.cta}>
      <a className={styles.button} href={mailto}>
        Start a project <span aria-hidden="true">→</span>
      </a>
      {/* Plain text on purpose: not a link yet */}
      <p className={styles.note}>
        Follow the build <span className={styles.handle}>@{site.instagram}</span>
      </p>
    </div>
  );
}
