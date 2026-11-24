"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Check, Plane } from "./icons";
import s from "./home.module.css";

export function Hangar() {
  const [hf, setHf] = useState(-1);
  const [approved, setApproved] = useState(false);
  const badge = (i: number, side: "left" | "right") => (
    <span
      className={`${s.badge} ${hf !== -1 && hf !== i ? s.badgeOff : ""} ${hf === i ? s.badgeOn : ""}`}
      style={{ [side]: -12 }}
      aria-hidden="true"
    >
      0{i + 1}
    </span>
  );

  return (
    <section id="hangar" className={s.section}>
      <div className={`${s.wrap} ${s.hangarGrid}`}>
        <div className={`${s.hangarArt} rv`}>
          <div className={s.arch} aria-hidden="true">
            <span className={s.archLabel}>HANGAR 01 · CMB</span>
          </div>

          <div
            className={s.hcard}
            style={{
              right: "9%",
              top: "19%",
              flexDirection: "row",
              alignItems: "center",
              padding: "10px 14px 10px 10px",
              transform: "rotate(3deg)",
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--panel)",
              }}
              aria-hidden="true"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </svg>
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className={s.hTitle} style={{ fontSize: 13 }}>
                brand-photos.zip
              </span>
              <span className={s.hSmall} style={{ color: "#15803d" }}>
                Uploaded ✓
              </span>
            </span>
            {badge(2, "right")}
          </div>

          <div
            className={s.hcard}
            style={{
              left: "9%",
              right: "9%",
              top: "31%",
              gap: 18,
              padding: "22px 24px",
              transform: "rotate(-1.5deg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span className={s.hSmall}>FD-118 · [Client name]</span>
                <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em" }}>
                  Online store
                </span>
              </span>
              <span
                className={s.hSmall}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 11px",
                  borderRadius: 999,
                  background: "#fff1eb",
                  color: "var(--accent-text)",
                }}
              >
                <span className={s.liveDot} style={{ background: "var(--accent)" }} />
                Build
              </span>
            </div>
            <div className={s.progress} aria-hidden="true">
              <span className={s.progressFill} />
              <span className={s.pDone} />
              <span className={s.pDone} />
              <span className={s.pDone} />
              <span className={s.pNow}>
                <Plane size={15} color="#fff" />
              </span>
              <span className={s.pTodo} />
              <span className={s.pTodo} />
              <span className={s.pTodo} />
            </div>
            <div className={s.pCodes} aria-hidden="true">
              {site.steps.map((st) => (
                <span
                  key={st.code}
                  style={st.code === "BLD" ? { color: "var(--accent-text)" } : undefined}
                >
                  {st.code}
                </span>
              ))}
            </div>
            {badge(0, "left")}
          </div>

          <div
            className={s.hcard}
            style={{ left: "5%", width: "50%", top: "60%", transform: "rotate(2.5deg)" }}
          >
            <span className={s.hSmall}>Needs your OK</span>
            <span className={s.hTitle}>Product page · v3</span>
            {approved ? (
              <span className={s.approved} role="status">
                <Check size={13} /> APPROVED · JUST NOW
              </span>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className={`${s.smallBtn} cursor-target`}
                  onClick={() => setApproved(true)}
                >
                  Approve
                </button>
                <button type="button" className={s.smallGhost} tabIndex={-1}>
                  Comment
                </button>
              </div>
            )}
            {badge(1, "left")}
          </div>

          <div
            className={s.hcardDark}
            style={{ right: "5%", width: "40%", top: "63%", transform: "rotate(-4deg)" }}
          >
            <span className={s.hSmall} style={{ color: "#a8a29e" }}>
              INV-0042
            </span>
            <span className={s.hTitle}>Milestone 2 of 3</span>
            <span className={s.paid}>PAID</span>
            {badge(4, "right")}
          </div>

          <div
            className={s.hcard}
            style={{
              left: "14%",
              right: "22%",
              top: "88%",
              flexDirection: "row",
              alignItems: "center",
              padding: "10px 14px 10px 10px",
              borderRadius: 999,
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 999,
                background: "var(--dark)",
                color: "var(--bg)",
                fontSize: 11,
                fontWeight: 500,
              }}
              aria-hidden="true"
            >
              F
            </span>
            <span
              style={{
                fontSize: 12.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Week 6: checkout connected to payments.
            </span>
            {badge(3, "right")}
          </div>
        </div>

        <div className={`${s.headCol} rv`}>
          <p className={s.kicker}>Hangar · Your flight portal</p>
          <h2 className={s.h2}>
            Your whole <span className={`${s.serif} ${s.orange}`}>flight,</span>
            <br />
            in one place.
          </h2>
          <p className={s.lead}>{site.hangar.intro}</p>
          <div className={s.hFeatures} onMouseLeave={() => setHf(-1)}>
            {site.hangar.features.map((f, i) => (
              <button
                key={f.t}
                type="button"
                className={`${s.hFeature} ${hf === i ? s.hFeatureOn : ""}`}
                onMouseEnter={() => setHf(i)}
                onFocus={() => setHf(i)}
                onBlur={() => setHf(-1)}
                aria-pressed={hf === i}
              >
                <span className={s.hNum}>0{i + 1}</span>
                <span className={s.hFeatureText}>
                  <strong>{f.t}</strong>
                  <span>{f.d}</span>
                </span>
              </button>
            ))}
          </div>
          <span className={s.included}>INCLUDED WITH EVERY FLYNDEV PROJECT</span>
        </div>
      </div>
    </section>
  );
}
