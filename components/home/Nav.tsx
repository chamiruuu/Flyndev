"use client";

import { useEffect, useRef, useState } from "react";
import s from "./home.module.css";

const ROUTES = [
  { gate: "A1", href: "#about", name: "Who Flyndev is", status: "On time" },
  { gate: "A2", href: "#route", name: "Flight path", status: "On time" },
  { gate: "B1", href: "#flights", name: "Recent flights", status: "Landed" },
  { gate: "B2", href: "#hangar", name: "Hangar", status: "On time" },
  { gate: "C1", href: "#why", name: "Why Flyndev", status: "On time" },
  { gate: "C2", href: "#stories", name: "Passenger stories", status: "On time" },
  { gate: "R", href: "#radio", name: "Radio the tower", status: "Boarding" },
];

/**
 * The logo scrolls away with the page; a small "flight deck" (menu + Radio us) stays fixed top-right.
 * The menu opens as a departure-board card and closes on Esc, outside click or choosing a gate.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const deck = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

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
              width={156}
              height={15}
            />
          </a>
        </div>
      </header>

      <div ref={deck} className={s.deck}>
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

        <nav
          id="flight-menu"
          aria-label="Main"
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
