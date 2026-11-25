import type { CSSProperties, FC, HTMLAttributes } from "react";

export interface GalaxyProps extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  starColors?: string[];
  hueShift?: number;
  saturation?: number;
  density?: number;
  glowIntensity?: number;
  starSize?: number;
  flareIntensity?: number;
  twinkleIntensity?: number;
  starSpeed?: number;
  speed?: number;
  rotationSpeed?: number;
  layers?: number;
  direction?: "forward" | "backward";
  mouseInteraction?: boolean;
  mouseRepulsion?: boolean;
  repulsionStrength?: number;
  autoCenterRepulsion?: number;
  clickWarp?: boolean;
  intro?: boolean;
  focal?: [number, number];
  rotation?: [number, number];
  transparent?: boolean;
  backgroundColor?: string;
  lightMode?: boolean;
  opacity?: number;
  disableAnimation?: boolean;
  dpr?: number;
  /** Cap the frame rate (0 = display rate). */
  maxFps?: number;
  className?: string;
  style?: CSSProperties;
}

declare const Galaxy: FC<GalaxyProps>;
export default Galaxy;
