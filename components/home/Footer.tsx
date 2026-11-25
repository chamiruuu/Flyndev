import { site } from "@/lib/site";
import { PLANE_PATH } from "./icons";
import s from "./home.module.css";

export function Footer({ base = "" }: { base?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <svg
        className={s.contrail}
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-20 76 C 360 66, 700 26, 1180 22"
          fill="none"
          stroke="#f4511e"
          strokeOpacity="0.45"
          strokeWidth="1.2"
          strokeDasharray="2 7"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "calc(82% - 9px)",
          top: 13,
          transform: "rotate(88deg)",
        }}
      >
        <path d={PLANE_PATH} fill="#f4511e" />
      </svg>
      <div className={`${s.wrap} ${s.footerInner}`}>
        <div className={s.footGrid}>
          <div className={s.footLead}>
            <span className={s.footTitle}>
              Clear skies <span className={`${s.serif} ${s.orange}`}>ahead.</span>
            </span>
            <p>
              A digital studio helping growing businesses take off, wherever they fly
              from.
            </p>
          </div>
          <nav aria-label="Footer" className={s.footCol}>
            <span className={s.fieldLabel}>Terminal</span>
            <a href={`${base}#about`}>About</a>
            <a href={`${base}#route`}>Flight path</a>
            <a href={`${base}#flights`}>Flights</a>
            <a href={`${base}#hangar`}>Hangar</a>
          </nav>
          <div className={s.footCol}>
            <span className={s.fieldLabel}>Frequency</span>
            <a href="/radio">File a flight plan</a>
            <a href={`mailto:${site.email}`}>Email us</a>
            <a
              href={`https://www.instagram.com/${site.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </div>
          <div className={s.footCol}>
            <span className={s.fieldLabel}>Coverage</span>
            <span>Worldwide, remote</span>
            <span
              className={s.fieldSub}
              style={{ fontSize: 12, letterSpacing: "0.06em" }}
            >
              HQ 6.93°N 79.86°E
            </span>
            <a href="#top">Return to gate ↑</a>
          </div>
        </div>
        <div className={s.footBar}>
          <span>© {year} FLYNDEV · ALL RIGHTS RESERVED</span>
          <span className={s.footLegal}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </span>
          <span>ALL SYSTEMS GO</span>
        </div>
      </div>
      <div className={s.wordmark} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-on-light.svg" alt="" width={1000} height={96} />
      </div>
    </footer>
  );
}
