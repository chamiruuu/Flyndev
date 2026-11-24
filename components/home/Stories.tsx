"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import s from "./home.module.css";

const BARS = 80;

/** Passenger stories: client voice notes with a live transcript. */
export function Stories() {
  const stories = site.stories;
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const st = stories[idx];

  // Without a recording yet, the transcript plays on a timer of the note's length.
  useEffect(() => {
    if (!playing || st.audio) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProg((p) => {
        const n = p + dt / st.seconds;
        if (n >= 1) {
          setPlaying(false);
          return 1;
        }
        return n;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, st]);

  const toggle = () => {
    const next = !playing;
    if (next && prog >= 1) setProg(0);
    setPlaying(next);
    const a = audio.current;
    if (a) {
      if (next) void a.play();
      else a.pause();
    }
  };

  const pick = (i: number) => {
    audio.current?.pause();
    setIdx(i);
    setProg(0);
    setPlaying(false);
  };

  const words = st.quote.split(" ");
  const k = Math.round(words.length * prog);
  const el = Math.round(st.seconds * prog);
  const fmt = (n: number) => `0:${n < 10 ? "0" : ""}${n}`;
  const bars = Array.from(
    { length: BARS },
    (_, i) =>
      18 + 70 * Math.abs(Math.sin(i * 0.73 + idx * 1.7) * Math.cos(i * 0.21 + idx)),
  );

  return (
    <section id="stories" className={s.section}>
      <div className={`${s.wrap} ${s.storiesInner}`}>
        <div className={`${s.storiesHead} rv`}>
          <div className={s.headCol}>
            <p className={s.kicker}>Passenger stories</p>
            <h2 className={s.h2}>
              Hear it from
              <br />
              our <span className={`${s.serif} ${s.orange}`}>passengers.</span>
            </h2>
          </div>
          <div className={s.storiesSide}>
            <p>
              Not written for us.
              <br />
              Recorded by our clients,
              <br />
              in their own voice.
            </p>
          </div>
        </div>

        <div className={`${s.player} rv`}>
          <div className={s.playerBar}>
            <span className={s.playerState}>
              <span className={playing ? s.recOn : s.rec} aria-hidden="true" />
              <span style={{ color: "var(--ink)" }}>
                {playing ? "PLAYING" : "VOICE NOTE"}
              </span>
              <span>
                · CH 0{idx + 1} · {st.freq} MHZ
              </span>
              <span className={s.info}>
                <button
                  type="button"
                  className={s.infoBtn}
                  aria-label="About these recordings"
                  aria-describedby={info ? "voice-info" : undefined}
                  onMouseEnter={() => setInfo(true)}
                  onMouseLeave={() => setInfo(false)}
                  onFocus={() => setInfo(true)}
                  onBlur={() => setInfo(false)}
                  onClick={() => setInfo((v) => !v)}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 11v6" />
                    <circle cx="12" cy="7" r="0.6" fill="currentColor" />
                  </svg>
                </button>
                {info && (
                  <span id="voice-info" role="tooltip" className={s.tooltip}>
                    The voice has a cockpit-radio effect added. The words are exactly what
                    our client said to us, unedited.
                  </span>
                )}
              </span>
            </span>
            <span>
              {st.code} · CMB → {st.city}
            </span>
          </div>

          <div className={s.playerBody}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={idx}
                className={s.transcript}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <span className={s.said}>&ldquo;{words.slice(0, k).join(" ")}</span>
                <span className={k === 0 ? s.said : s.unsaid}>{k === 0 ? "" : " "}</span>
                <span className={prog === 0 ? s.said : s.unsaid}>
                  {words.slice(k).join(" ")}&rdquo;
                </span>
              </motion.p>
            </AnimatePresence>

            <div className={s.controls}>
              <button
                type="button"
                className={`${s.play} cursor-target`}
                onClick={toggle}
                aria-label={playing ? "Pause voice note" : "Play voice note"}
              >
                {playing ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" rx="1" fill="#fff" />
                    <rect x="14" y="5" width="4" height="14" rx="1" fill="#fff" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" fill="#fff" />
                  </svg>
                )}
              </button>
              <div className={s.wave} aria-hidden="true">
                {bars.map((h, i) => (
                  <span
                    key={i}
                    className={i / BARS < prog ? s.waveOn : undefined}
                    style={{ height: `${h.toFixed(0)}%` }}
                  />
                ))}
              </div>
              <span className={s.time}>
                {fmt(el)} / {fmt(st.seconds)}
              </span>
            </div>
            {st.audio && (
              <audio
                ref={audio}
                src={st.audio}
                preload="none"
                onTimeUpdate={(e) =>
                  setProg(
                    e.currentTarget.currentTime /
                      (e.currentTarget.duration || st.seconds),
                  )
                }
                onEnded={() => setPlaying(false)}
              />
            )}
          </div>

          <div className={s.playerFoot}>
            <div className={s.person}>
              <span className={s.avatar} aria-hidden="true">
                [PHOTO]
              </span>
              <span className={s.personText}>
                <strong>{st.name}</strong>
                <span>{st.role}</span>
              </span>
            </div>
            <div className={s.freqs} role="group" aria-label="Choose a story">
              {stories.map((x, i) => (
                <button
                  key={x.freq}
                  type="button"
                  className={`${i === idx ? s.freqOn : s.freq} cursor-target`}
                  onClick={() => pick(i)}
                  aria-pressed={i === idx}
                >
                  {x.freq}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className={s.placeholderNote}>
          [Placeholder · replace with real client voice notes and transcripts]
        </p>
      </div>
    </section>
  );
}
