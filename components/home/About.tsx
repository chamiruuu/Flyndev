import { site } from "@/lib/site";
import { Arrow, Plane } from "./icons";
import s from "./home.module.css";

const BARCODE = [
  2, 1, 3, 1, 1, 4, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 1,
  4, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1,
];

/** "Who Flyndev is": Flyndev's own boarding pass. */
export function About() {
  const seats: ("front" | "mine" | "seat" | "aisle")[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++)
      seats.push(
        c === 2 ? "aisle" : r === 0 && c === 0 ? "mine" : r === 0 ? "front" : "seat",
      );

  return (
    <section id="about" className={s.about}>
      <div className={`${s.wrap} ${s.aboutInner}`}>
        <div className={s.headRow}>
          <div className={`${s.headCol} rv`}>
            <p className={s.kicker}>Who Flyndev is</p>
            <h2 className={s.h2}>
              Every great
              <br />
              business needs a <span className={`${s.serif} ${s.orange}`}>lift.</span>
            </h2>
          </div>
          <p className={`${s.lead} ${s.aboutStory} rv`}>{site.about.story}</p>
        </div>

        <div className={`${s.pass} rv`}>
          <span className={s.passStripe} aria-hidden="true" />
          <div className={s.passMain}>
            <div className={s.passTop}>
              <span className={s.passBrand}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo-on-light.svg"
                  alt="Flyndev"
                  width={115}
                  height={11}
                />
                <span>· Boarding pass</span>
              </span>
              <span>E-ticket · Issued {site.founded}</span>
              <span className={s.passCode}>FD-001</span>
            </div>

            <div className={s.route}>
              <div className={s.routeEnd}>
                <span className={s.fieldLabel}>From</span>
                <span className={s.routeWord}>Idea</span>
                <span className={s.fieldSub}>Your first brief</span>
              </div>
              <div className={s.routeMid}>
                <div className={s.routeLine} aria-hidden="true">
                  <span className={s.wpDotEnd} />
                  <span className={s.wpDot} />
                  <span className={s.wpDot} />
                  <span className={s.routePlane}>
                    <Plane size={18} color="var(--accent)" />
                  </span>
                  <span className={s.wpDot} />
                  <span className={s.wpDot} />
                  <span className={s.wpDotEndAccent} />
                </div>
                <span className={s.fieldLabel}>7 waypoints · One clear path</span>
              </div>
              <div className={s.routeEndRight}>
                <span className={s.fieldLabel}>To</span>
                <span className={s.routeWordSerif}>Launch</span>
                <span className={s.fieldSub}>Live &amp; growing</span>
              </div>
            </div>

            <dl className={s.facts} style={{ margin: 0 }}>
              {[
                ["Crew", "The Flyndev team"],
                ["Base", "Colombo, LK"],
                ["Routes", "Worldwide"],
                ["Flying since", String(site.founded)],
                ["Departs", "When you’re ready"],
                ["Carry-on", "Hangar portal, included"],
              ].map(([k, v]) => (
                <div key={k} className={s.fact}>
                  <dt className={s.fieldLabel}>{k}</dt>
                  <dd className={s.factValue} style={{ margin: 0 }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            <svg className={s.stamp} viewBox="0 0 104 104" aria-hidden="true">
              <circle
                cx="52"
                cy="52"
                r="48"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.6"
              />
              <circle
                cx="52"
                cy="52"
                r="38"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="0.8"
                strokeDasharray="2 2.5"
              />
              {["CLEARED", "FOR", "TAKEOFF"].map((w, i) => (
                <text
                  key={w}
                  x="52"
                  y={46 + i * 12}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="8.5"
                  letterSpacing="1.4"
                  fill="var(--accent)"
                >
                  {w}
                </text>
              ))}
            </svg>
          </div>

          <div className={s.stub}>
            <span className={s.notch} style={{ top: -15 }} aria-hidden="true" />
            <span className={s.notch} style={{ bottom: -15 }} aria-hidden="true" />
            <div className={s.stubRow}>
              <span className={s.stubFlight}>FD-001</span>
              <span className={s.boarding}>
                <span className={s.liveDot} aria-hidden="true" />
                BOARDING
              </span>
            </div>
            <div className={s.seatRow}>
              <div className={s.cabin} aria-hidden="true">
                {seats.map((k, i) => (
                  <span
                    key={i}
                    className={
                      k === "aisle"
                        ? s.aisle
                        : k === "mine"
                          ? s.seatMine
                          : k === "front"
                            ? s.seatFront
                            : s.seat
                    }
                  />
                ))}
              </div>
              <div className={s.seatText}>
                <span className={s.seatBig}>Seat 1A</span>
                <span style={{ color: "#d6d1c9" }}>FRONT ROW · PRIORITY</span>
                <span>GATE · RADIO</span>
              </div>
            </div>
            <div>
              <div className={s.barcode} aria-hidden="true">
                {BARCODE.map((w, i) => (
                  <span key={i} style={{ width: w }} />
                ))}
              </div>
              <div className={s.serial} aria-hidden="true">
                <span>0001</span>
                <span>FLYNDEV</span>
                <span>{site.founded}</span>
              </div>
            </div>
            <a href="#radio" className={`${s.btnAccent} cursor-target`}>
              <span>Board your flight</span>
              <span className={s.btnDot} style={{ width: 36, height: 36 }}>
                <Arrow size={16} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
