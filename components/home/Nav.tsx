"use client";

import { useEffect, useRef, useState } from "react";
import s from "./home.module.css";

const LINKS = [
  { href: "#about", name: "About" },
  { href: "#route", name: "Flight path" },
  { href: "#flights", name: "Flights" },
  { href: "#hangar", name: "Hangar" },
];

const ROUTES = [
  { gate: "A1", href: "#about", name: "Who Flyndev is", status: "On time" },
  { gate: "A2", href: "#route", name: "Flight path", status: "On time" },
  { gate: "B1", href: "#flights", name: "Recent flights", status: "Landed" },
  { gate: "B2", href: "#hangar", name: "Hangar", status: "On time" },
  { gate: "C1", href: "#why", name: "Why Flyndev", status: "On time" },
  { gate: "C2", href: "#stories", name: "Passenger stories", status: "On time" },
  { gate: "R", href: "#radio", name: "Radio the tower", status: "Boarding" },
];

/** The orange beacon in "Radio us": a small radar with a turning sweep and two pings. */
export function RadarIcon() {
  return (
    <span className={s.radarIcon} aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <circle
          cx="16"
          cy="16"
          r="9.5"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <circle
          className={s.radarRing}
          cx="16"
          cy="16"
          r="15"
          fill="none"
          stroke="#fff"
          strokeWidth="1.2"
        />
        <circle
          className={s.radarRing2}
          cx="16"
          cy="16"
          r="15"
          fill="none"
          stroke="#fff"
          strokeWidth="1.2"
        />
        <g className={s.radarSweep}>
          <path d="M16 16 L16 3 A13 13 0 0 1 25.2 6.8 Z" fill="#fff" fillOpacity="0.35" />
          <path
            d="M16 16 L25.2 6.8"
            stroke="#fff"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
        <circle cx="16" cy="16" r="2" fill="#fff" />
      </svg>
    </span>
  );
}

/**
 * The logo scrolls away with the page. A fixed "flight deck" stays top-right: at the top of the page it
 * shows the main links; once you scroll they fold into a menu button (always the menu on phones).
 * The menu opens as a departure-board card and closes on Esc, outside click or choosing a gate.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const deck = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 120;
      setScrolled(next);
      if (!next && window.innerWidth > 900) setOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (deck.current && !deck.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="#top" aria-label="Flyndev home" className="cursor-target">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-on-light.svg"
              alt="Flyndev"
              className={s.logo}
              width={230}
              height={22}
            />
          </a>
        </div>
      </header>

      <div ref={deck} className={`${s.deck} ${scrolled ? s.deckScrolled : ""}`}>
        <nav aria-label="Main" className={s.deckLinks}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="cursor-target">
              {l.name}
            </a>
          ))}
        </nav>
        <button
          ref={button}
          type="button"
          className={`${s.menuBtn} ${open ? s.menuOpen : ""} cursor-target`}
          aria-expanded={open}
          aria-controls="flight-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={s.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className={s.menuLabel}>{open ? "Close" : "Menu"}</span>
        </button>
        <a
          href="#radio"
          className={`${s.navCta} cursor-target`}
          data-cursor-label="Contact"
        >
          <span>Radio us</span>
          <RadarIcon />
        </a>

        <nav
          id="flight-menu"
          aria-label="All sections"
          className={`${s.board} ${open ? s.boardOpen : ""}`}
          hidden={!open}
        >
          <div className={s.boardHead}>
            <span>DEPARTURES · FD-001</span>
            <span>GATE</span>
          </div>
          <ul className={s.boardList}>
            {ROUTES.map((r, i) => (
              <li key={r.href} style={{ ["--i" as string]: i }}>
                <a href={r.href} className="cursor-target" onClick={() => setOpen(false)}>
                  <span className={s.boardGate}>{r.gate}</span>
                  <span className={s.boardName}>{r.name}</span>
                  <span
                    className={r.status === "Boarding" ? s.boardStatusOn : s.boardStatus}
                  >
                    {r.status}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
