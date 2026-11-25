import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Size of every share (Open Graph) image. */
export const shareSize = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

/**
 * Build-time share image in the site's style: paper background, a boarding-pass header line,
 * a large title with an orange serif accent word and a dashed route at the bottom.
 */
export async function shareImage({
  code,
  title,
  accent,
  from = "CMB",
  to,
  meta,
}: {
  code: string;
  title: string;
  accent?: string;
  from?: string;
  to: string;
  meta: string;
}) {
  const [sans, mono, serif] = await Promise.all([
    font("Geist-Regular.ttf"),
    font("GeistMono-Regular.ttf"),
    font("InstrumentSerif-Italic.ttf"),
  ]);
  const logo = await readFile(join(process.cwd(), "public/brand/logo-on-light.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#fbfaf7",
        color: "#141414",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={230} height={22} alt="" />
        <span
          style={{
            fontFamily: "Geist Mono",
            fontSize: 20,
            letterSpacing: 3,
            color: "#78716c",
          }}
        >
          {code}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontSize: 84,
            lineHeight: 1.02,
            letterSpacing: -3,
            maxWidth: 1000,
          }}
        >
          <span>{title}</span>
          {accent && (
            <span
              style={{ fontFamily: "Instrument Serif", color: "#f4511e", marginLeft: 22 }}
            >
              {accent}
            </span>
          )}
        </div>
        <span
          style={{
            marginTop: 26,
            fontFamily: "Geist Mono",
            fontSize: 20,
            letterSpacing: 3,
            color: "#57534e",
            textTransform: "uppercase",
          }}
        >
          {meta}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span style={{ fontSize: 44, letterSpacing: -1 }}>{from}</span>
        <div style={{ flex: 1, display: "flex", borderTop: "3px dashed #dad5cd" }} />
        <div style={{ width: 14, height: 14, borderRadius: 7, background: "#f4511e" }} />
        <div style={{ flex: 1, display: "flex", borderTop: "3px dashed #dad5cd" }} />
        <span style={{ fontSize: 44, letterSpacing: -1 }}>{to}</span>
      </div>
    </div>,
    {
      ...shareSize,
      fonts: [
        { name: "Geist", data: sans, style: "normal", weight: 400 },
        { name: "Geist Mono", data: mono, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: serif, style: "italic", weight: 400 },
      ],
    },
  );
}
