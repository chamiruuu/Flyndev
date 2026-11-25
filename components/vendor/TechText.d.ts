import type { CSSProperties, FC } from "react";

export interface TechTextProps {
  text?: string;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: number;
  fontSize?: number;
  letterSpacing?: number;
  color?: string;
  accentColor?: string;
  align?: "left" | "center" | "right";
  /** Pin the wordmark at an exact pen position and baseline (px) at `fontSize`. */
  layout?: { x: number; baseline: number } | null;
  reach?: number;
  softness?: number;
  dashLength?: number;
  dashGap?: number;
  strokeWidth?: number;
  lineStyle?: "dashed" | "solid";
  reveal?: "area" | "letter" | "off";
  specks?: number;
  selection?: boolean;
  labels?: boolean;
  draggable?: boolean;
  bounce?: number;
  sweep?: boolean;
  speed?: number;
  clickKick?: boolean;
  intro?: "none" | "type" | "assemble" | "metrics";
  introDuration?: number;
  guides?: boolean;
  /** Listen on the window (layer ignores the pointer) so it can cover the whole screen. */
  windowEvents?: boolean;
  /** Colour of a plate drawn behind the size label. */
  labelBackground?: string;
  /** Called once after the first frame with the word drawn. */
  onReady?: () => void;
  className?: string;
  style?: CSSProperties;
}

declare const TechText: FC<TechTextProps>;
export default TechText;
