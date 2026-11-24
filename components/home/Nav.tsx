import s from "./home.module.css";

export function Nav() {
  return (
    <header className={s.nav}>
      <div className={`${s.wrap} ${s.navInner}`}>
        <a href="#top" aria-label="Flyndev home" className="cursor-target">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-on-light.svg"
            alt="Flyndev"
            className={s.logo}
            width={156}
            height={15}
          />
        </a>
        <nav aria-label="Main" className={s.navRight}>
          <div className={s.navLinks}>
            <a href="#about" className="cursor-target">
              About
            </a>
            <a href="#route" className="cursor-target">
              Flight path
            </a>
            <a href="#flights" className="cursor-target">
              Flights
            </a>
            <a href="#hangar" className="cursor-target">
              Hangar
            </a>
          </div>
          <a
            href="#radio"
            className={`${s.navCta} cursor-target`}
            data-cursor-label="Contact"
          >
            <span>Radio us</span>
            <span className={s.btnDot}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 12a8 8 0 0 1 8-8" />
                <path d="M8 12a4 4 0 0 1 4-4" />
                <circle cx="12" cy="12" r="1.6" fill="#fff" />
              </svg>
            </span>
          </a>
        </nav>
      </div>
    </header>
  );
}
