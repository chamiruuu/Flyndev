import { site } from "@/lib/site";
import { Arrow } from "./icons";
import s from "./home.module.css";

/** The contact band ("Radio"). */
export function Radio() {
  return (
    <section id="radio" className={s.radio}>
      <svg className={s.radar} viewBox="0 0 800 800" aria-hidden="true">
        <g fill="none" stroke="rgb(246 239 231 / 0.1)">
          <circle cx="400" cy="400" r="110" />
          <circle cx="400" cy="400" r="200" />
          <circle cx="400" cy="400" r="290" />
          <circle cx="400" cy="400" r="380" />
          <path d="M400 20 L400 780 M20 400 L780 400" />
        </g>
        <g className={s.sweep}>
          <path
            d="M400 400 L400 20 A380 380 0 0 1 668 131 Z"
            fill="#f4511e"
            fillOpacity="0.1"
          />
          <path
            d="M400 400 L668 131"
            stroke="#f4511e"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
        </g>
        <circle cx="560" cy="250" r="5" fill="#f4511e" className={s.pulse} />
        <circle cx="560" cy="250" r="3.5" fill="#f4511e" />
        <circle cx="250" cy="560" r="3" fill="#f6efe7" fillOpacity="0.5" />
      </svg>
      <p className={`${s.radioKicker} rv`}>
        <span className={s.liveDot} aria-hidden="true" />
        RADIO · CHANNEL OPEN
      </p>
      <h2 className={`${s.radioH} rv`}>
        Ready for <span className={`${s.serif} ${s.orange}`}>takeoff?</span>
      </h2>
      <p className="rv">
        Tell us where you want your business to go. We reply within [one working day] with
        a clear next step.
      </p>
      <div className={`${s.radioCtas} rv`}>
        <a
          href={`mailto:${site.email}`}
          className={`${s.btnAccent} cursor-target`}
          data-cursor-label="Email us"
        >
          <span>Radio the tower</span>
          <span className={s.btnDot}>
            <Arrow />
          </span>
        </a>
        <a href={`mailto:${site.email}`} className={`${s.radioMail} cursor-target`}>
          {site.email}
        </a>
      </div>
    </section>
  );
}
