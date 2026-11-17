import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Image
          src="/brand/wordmark.png"
          alt="Flyndev"
          width={1280}
          height={151}
          className={styles.wordmark}
        />
        <p className={`label ${styles.code}`}>Error 404 — off course</p>
        <h1 className={styles.headline}>This page isn&rsquo;t on the flight plan.</h1>
        <Link className={styles.link} href="/">
          Back to flyndev.com
        </Link>
      </div>
    </main>
  );
}
