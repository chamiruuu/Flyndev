import TargetCursor from "@/components/TargetCursor";
import { About } from "@/components/home/About";
import { Flights } from "@/components/home/Flights";
import { FlightRoute } from "@/components/home/FlightRoute";
import { Footer } from "@/components/home/Footer";
import { Hangar } from "@/components/home/Hangar";
import { Hero } from "@/components/home/Hero";
import { Nav } from "@/components/home/Nav";
import { Radio } from "@/components/home/Radio";
import { RevealObserver } from "@/components/home/RevealObserver";
import { SmoothScroll } from "@/components/home/SmoothScroll";
import { Stories } from "@/components/home/Stories";
import { Why } from "@/components/home/Why";

export default function Home() {
  return (
    <>
      <TargetCursor spinDuration={2} hideDefaultCursor parallaxOn />
      <RevealObserver />
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <About />
        <FlightRoute />
        <Flights />
        <Hangar />
        <Why />
        <Stories />
        <Radio />
      </main>
      <Footer />
    </>
  );
}
