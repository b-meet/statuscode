import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { BoringStatusReveal } from "@/components/landing/BoringStatusReveal";
import { LiveThemePlayground } from "@/components/landing/LiveThemePlayground";
import { Features } from "@/components/landing/Features";
import { IntegrationShowcase } from "@/components/landing/IntegrationShowcase";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/layout/Footer";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FAQ } from "@/components/landing/FAQ";

import { BackgroundPattern } from "@/components/layout/BackgroundPattern";

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-glaze-500/30 relative">
      <Navbar />
      <BackgroundPattern />
      <main className="relative z-10 w-full">
        <Hero />
        <BoringStatusReveal />
        <LiveThemePlayground />
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <IntegrationShowcase />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
