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
import Script from "next/script";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Statuscode",
    "applicationCategory": "DevOpsTool",
    "operatingSystem": "Web",
    "description": "Statuscode is the designer layer that sits on top of your existing uptime monitors, turning clinical data into a premium brand experience.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier available"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  return (
    <div className="min-h-screen selection:bg-glaze-500/30 relative">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
