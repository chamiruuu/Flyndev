"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Arrow, Check } from "@/components/home/icons";
import h from "@/components/home/home.module.css";
import {
  BUDGETS,
  SERVICES,
  TIMELINES,
  sendFlightPlan,
  validate,
  type Errors,
  type FlightPlan,
} from "@/lib/contact";
import { site } from "@/lib/site";
import f from "./form.module.css";

const EMPTY: FlightPlan = {
  name: "",
  email: "",
  company: "",
  services: [],
  budget: "",
  timeline: "",
  message: "",
  website: "",
};

type Done = { via: "api" | "email"; code: string };

/** The contact form, laid out as a flight plan: who, what, budget, when, where to. */
export function FlightPlanForm() {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [plan, setPlan] = useState<FlightPlan>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Bring the confirmation into view (it is shorter than the form) and move focus to it.
  useEffect(() => {
    if (!done || !doneRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    doneRef.current.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    doneRef.current.focus({ preventScroll: true });
  }, [done]);

  const set = <K extends keyof FlightPlan>(k: K, v: FlightPlan[K]) => {
    setPlan((p) => ({ ...p, [k]: v }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggle = (s: string) =>
    set(
      "services",
      plan.services.includes(s)
        ? plan.services.filter((x) => x !== s)
        : [...plan.services, s],
    );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validate(plan);
    setErrors(found);
    const first = (["name", "email", "message"] as const).find((k) => found[k]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSending(true);
    setFailure("");
    const res = await sendFlightPlan(plan);
    setSending(false);
    if (res.ok) setDone({ via: res.via, code: res.code });
    else setFailure(res.error);
  }

  if (done) {
    return (
      <div ref={doneRef} className={f.done} role="status" tabIndex={-1}>
        <span className={f.doneIcon} aria-hidden="true">
          <Check size={22} color="#fff" />
        </span>
        <p className={f.doneCode}>Flight plan {done.code}</p>
        <h2 className={f.doneTitle}>
          {done.via === "email" ? (
            <>
              Ready for <span className={`${h.serif} ${h.orange}`}>takeoff.</span>
            </>
          ) : (
            <>
              Plan <span className={`${h.serif} ${h.orange}`}>received.</span>
            </>
          )}
        </h2>
        <p className={f.doneText}>
          {done.via === "email"
            ? `Your email app should now be open with the plan filled in. Press send and we'll reply within ${site.replyTime}.`
            : `Thanks, ${plan.name.trim().split(" ")[0]}. We'll reply to ${plan.email.trim()} within ${site.replyTime}.`}
        </p>
        {done.via === "email" && (
          <p className={f.doneText}>
            Nothing opened? Write to{" "}
            <a href={`mailto:${site.email}`} className="cursor-target">
              {site.email}
            </a>
            .
          </p>
        )}
        <button
          type="button"
          className={`${f.linkBtn} cursor-target`}
          onClick={() => setDone(null)}
        >
          Edit the plan
        </button>
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <span id={`${id}-${k}-err`} className={f.error}>
        {errors[k]}
      </span>
    ) : null;
  const aria = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });

  return (
    <form ref={form} className={f.form} onSubmit={submit} noValidate>
      <div className={f.formHead} aria-hidden="true">
        <span>FLIGHT PLAN</span>
        <span>CMB → ANYWHERE</span>
      </div>

      <fieldset className={f.group}>
        <legend className={f.legend}>
          <b>01</b> Pilot
        </legend>
        <div className={f.row}>
          <label className={f.field}>
            <span className={f.label}>Your name</span>
            <input
              name="name"
              autoComplete="name"
              value={plan.name}
              onChange={(e) => set("name", e.target.value)}
              {...aria("name")}
            />
            {err("name")}
          </label>
          <label className={f.field}>
            <span className={f.label}>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={plan.email}
              onChange={(e) => set("email", e.target.value)}
              {...aria("email")}
            />
            {err("email")}
          </label>
        </div>
        <label className={f.field}>
          <span className={f.label}>
            Business <i>optional</i>
          </span>
          <input
            name="company"
            autoComplete="organization"
            value={plan.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset className={f.group}>
        <legend className={f.legend}>
          <b>02</b> What are we building?
        </legend>
        <div className={f.chips}>
          {SERVICES.map((s) => (
            <label key={s} className={`${f.chip} cursor-target`}>
              <input
                type="checkbox"
                checked={plan.services.includes(s)}
                onChange={() => toggle(s)}
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={f.row}>
        <fieldset className={f.group}>
          <legend className={f.legend}>
            <b>03</b> Budget <i>optional</i>
          </legend>
          <div className={f.chips}>
            {BUDGETS.map((b) => (
              <label key={b} className={`${f.chip} cursor-target`}>
                <input
                  type="radio"
                  name="budget"
                  checked={plan.budget === b}
                  onChange={() => set("budget", b)}
                />
                <span>{b}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className={f.group}>
          <legend className={f.legend}>
            <b>04</b> Departure <i>optional</i>
          </legend>
          <div className={f.chips}>
            {TIMELINES.map((t) => (
              <label key={t} className={`${f.chip} cursor-target`}>
                <input
                  type="radio"
                  name="timeline"
                  checked={plan.timeline === t}
                  onChange={() => set("timeline", t)}
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className={f.group}>
        <legend className={f.legend}>
          <b>05</b> Destination
        </legend>
        <label className={f.field}>
          <span className={f.label}>Where do you want the business to go?</span>
          <textarea
            name="message"
            rows={5}
            value={plan.message}
            onChange={(e) => set("message", e.target.value)}
            {...aria("message")}
          />
          {err("message")}
        </label>
      </fieldset>

      <label className={f.trap} aria-hidden="true">
        Website
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={plan.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </label>

      <div className={f.submitRow}>
        <button
          type="submit"
          className={`${h.btnDark} ${f.submit} cursor-target`}
          disabled={sending}
        >
          <span>{sending ? "Sending…" : "Send flight plan"}</span>
          <span className={h.btnDot}>
            <Arrow />
          </span>
        </button>
        <p className={f.fine}>
          We only use these details to reply. See our{" "}
          <Link href="/privacy">privacy note</Link>.
        </p>
      </div>
      {failure && (
        <p className={f.error} role="alert">
          {failure}
        </p>
      )}
    </form>
  );
}
