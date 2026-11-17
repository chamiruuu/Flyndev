# Intro voiceover: script, timestamps and prompt

The welcome animation runs on a fixed timeline: the scenes finish at about 17.7 s and the curtain
opens the site by about **18.65 s**. The voiceover file is still **19.6 seconds**; anything after
the curtain has finished is faded out. The voiceover file
has to match it, so every line below has an exact start time.

- File to replace: `public/audio/intro-voiceover.mp3`. The name and the path must stay the same.
- It is currently a **demo file with no voice**: a quiet bed, a soft chime at each scene start,
  a whoosh during the take-off. Use it to hear the timing, then replace it.
- Export: **MP3, mono, 44.1 kHz, 96 to 128 kbps, 19.6 s** (a little over is fine; the
  sound is faded out right after the curtain finishes, at about 18.65 s). Leave silence, not trimmed audio, between lines.
- How it plays: visitors click **Enter with sound** on the first screen. That click starts the
  animation and the audio together, so sound works in every browser. They can also choose
  **Enter without sound**, and turn sound on or off any time with the **Sound** button.

## Voice

Calm, confident **female** voice. Mid-low register, warm and assured, with a slight smile.
Premium brand-film feel: understated, never salesy. Measured pace (about 140 to 150 words per
minute), clear diction, no vocal fry, no breaths or mouth noise.
"Flyndev" is pronounced **FLY-n-dev** ("fly" + "n" + "dev"). Change this if you say it differently.

## Script with exact timestamps

Times are in seconds from the moment the visitor clicks Enter. **Start** is when the line must
begin. **Must end by** is the latest it may finish (the next scene starts there). Aim to end a
little earlier than that, so it never feels rushed.

| #   | Start | Must end by | Line                                 | What is on screen                                           |
| --- | ----- | ----------- | ------------------------------------ | ----------------------------------------------------------- |
| 1   | 0.40  | 2.70        | "It all starts with your idea."      | IDEA: a spark, rays, the caption "You bring the idea"       |
| 2   | 3.10  | 5.60        | "Together, we chart the route."      | PLAN: a route draws across a map                            |
| 3   | 6.10  | 8.80        | "We shape it, down to every detail." | DESIGN: a wireframe becomes a finished design               |
| 4   | 9.30  | 11.80       | "We build it. Fast, and solid."      | BUILD: code types out, the bar fills from 0 to 100%         |
| 5   | 14.10 | 15.40       | "Then you take off..."               | LAUNCH: the plane lifts off the runway (lift-off at 14.1 s) |
| 6   | 15.50 | 17.50       | "...with a great product."           | The Flyndev logo appears, then the caption                  |
| 7   | 17.70 | 18.50       | "Flyndev."                           | Sign-off while the curtain opens (curtain 17.7 to 18.65 s)  |

Silence everywhere else, so the sound effects and music can breathe. Line 5 and 6 are one
sentence with a short pause (the logo reveal) between them: "Then you take off... with a great
product."

### Optional sound design (if you add music or effects)

| Time                              | Cue                                                         |
| --------------------------------- | ----------------------------------------------------------- |
| 0.00                              | Soft rising pad begins, very quiet under the voice          |
| 0.00 / 2.80 / 5.80 / 9.00 / 12.00 | A soft chime or tick at each scene start                    |
| 9.40 to 11.50                     | Faint digital ticks while the 0 to 100% counter runs        |
| 12.40 to 15.60                    | Engine and whoosh swell as the plane accelerates and climbs |
| 15.00                             | Logo reveal: a clean chime or low impact                    |
| 17.70 to 18.65                    | Short resolving swell as the curtain opens                  |

Keep the music about 12 to 15 dB below the voice, and fade it out by 19.6 s.

## Prompt for an AI voice tool (ElevenLabs, Google, OpenAI and similar)

Generate **each line as its own clip**, then place each clip at its **Start** time on a timeline
(Audacity, CapCut, DaVinci, any editor) and export the whole timeline as one 19.6 s MP3. This is
the only way to hit the exact times, because AI voices cannot be told to start at a precise second.

> **Voice brief.** A calm, confident female voice for a premium brand film. Mid-low register,
> warm and assured, with a subtle smile in the tone. Measured, unhurried pace. Clear diction.
> Understated and elegant, not salesy or announcer-like. No music, no background noise, no
> breaths. "Flyndev" is pronounced "FLY-n-dev".
>
> Read each line below as a separate take. Keep each take shorter than its **Must end by** limit,
> with no silence at the start or end of the clip.
>
> 1. It all starts with your idea.
> 2. Together, we chart the route.
> 3. We shape it, down to every detail.
> 4. We build it. Fast, and solid.
> 5. Then you take off...
> 6. ...with a great product.
> 7. Flyndev.

Line 5 should end on a lifted, open tone (it leads into line 6). Line 7 is a short, confident
sign-off with a slight downward inflection.

### If you must generate one single take instead

Use SSML with pauses. The pauses below are estimates (they assume each line takes about 2.0, 1.7,
2.3, 2.0, 1.4, 1.6 and 0.7 seconds), so check the result against the table and trim in an editor.

```xml
<speak>
  <break time="400ms"/>It all starts with your idea.
  <break time="700ms"/>Together, we chart the route.
  <break time="1300ms"/>We shape it, down to every detail.
  <break time="900ms"/>We build it. Fast, and solid.
  <break time="2800ms"/>Then you take off...
  <break time="100ms"/>with a great product.
  <break time="500ms"/>Flyndev.
</speak>
```

## Changing the timing or the wording

The scene timings live in `components/Intro.tsx` (`START`, `LEN`) and `components/Intro.module.css`.
If you change the animation, update the table above to match. The visible captions come from
`journey` in `lib/site.ts`.
