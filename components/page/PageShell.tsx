import type { ReactNode } from "react";
import TargetCursor from "@/components/TargetCursor";
import { Footer } from "@/components/home/Footer";
import { Nav } from "@/components/home/Nav";
import { RevealObserver } from "@/components/home/RevealObserver";
import { SmoothScroll } from "@/components/home/SmoothScroll";

/** Frame for every page other than home: same cursor, nav, scrolling and footer. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn />
      <RevealObserver />
      <SmoothScroll />
      <Nav base="/" />
      <main id="top">{children}</main>
      <Footer base="/" />
    </>
  );
}
