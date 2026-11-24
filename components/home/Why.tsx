"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Check } from "./icons";
import s from "./home.module.css";

export function Why() {
  const [on, setOn] = useState(0);
  return (
    <section id="why" className={s.section}>
      <div className={`${s.wrap} ${s.whyInner}`}>
        <div className={s.whyHead}>
          <div className={`${s.headCol} rv`}>
            <p className={s.kicker}>Why Flyndev</p>
            <h2 className={s.h2}>
              A studio that&rsquo;s
              <br />
              <span className={s.serif}>easy to work with.</span>
            </h2>
            <p className={s.lead} style={{ maxWidth: 520 }}>
              Big-company quality without the big-company hassle. Every flight runs the
              same checklist before takeoff.
            </p>
          </div>
          <figure className={`${s.crewNote} rv`} style={{ margin: 0 }}>
            <span className={s.kicker} style={{ fontSize: 10.5 }}>
              A note from the crew
            </span>
            <blockquote style={{ margin: 0 }}>
              <p>&ldquo;{site.crewNote}&rdquo;</p>
            </blockquote>
            <figcaption className={s.crewSign}>
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: 16, fontWeight: 500 }}>
                  The Flyndev crew
                </strong>
                <span className={s.fieldLabel} style={{ fontSize: 10 }}>
                  You talk to the people building it
                </span>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-on-light.svg" alt="" width={115} height={11} />
            </figcaption>
          </figure>
        </div>

        <div className="rv">
          <div className={s.checkHead}>
            <span>WHAT EVERY PROJECT GETS</span>
            <span>06 STANDARDS</span>
          </div>
          {site.checks.map((c, i) => (
            <button
              key={c.t}
              type="button"
              className={`${s.checkRow} ${on === i ? s.checkOn : ""}`}
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              onClick={() => setOn(i)}
              aria-expanded={on === i}
            >
              <span className={s.checkNum}>0{i + 1}</span>
              <span className={s.checkBody}>
                <span className={s.checkLine}>
                  <span className={s.checkTitle}>{c.t}</span>
                  <span className={s.leader} aria-hidden="true" />
                  <span className={s.resp}>
                    {c.r}
                    <Check />
                  </span>
                </span>
                {on === i && <span className={s.checkDesc}>{c.d}</span>}
              </span>
            </button>
          ))}
          <div className={s.checkFoot}>
            <span>NO EXTRAS, NO SMALL PRINT</span>
            <span>ON EVERY PROJECT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
