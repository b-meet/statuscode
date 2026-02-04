import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { IntegrationShowcase } from "@/components/landing/IntegrationShowcase";
import { Footer } from "@/components/layout/Footer";
import { ProblemSolution } from "@/components/landing/ProblemSolution";

import { BackgroundPattern } from "@/components/layout/BackgroundPattern";

export default function Home() {
  return (
    <div className="min-h-screen selection:bg-glaze-500/30 relative">
      <Navbar />
      <BackgroundPattern />
      <main className="relative z-10 w-full overflow-x-hidden">
        <Hero />
        <ProblemSolution />
        <Features />
        <IntegrationShowcase />
      </main>
      <Footer />
    </div>
  );
}
