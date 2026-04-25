"use client";

import { ExampleSection } from "@/components/home/ExampleSection";
import { ExplanationSection } from "@/components/home/ExplanationSection";
import { Footer } from "@/components/home/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ScrollProgress } from "@/components/home/ScrollProgress";
import { SecurityTrustSection } from "@/components/home/SecurityTrustSection";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0B0F1A] text-white">
      <ScrollProgress />
      <HomeNavbar />
      <HeroSection />
      <HowItWorksSection />
      <ExampleSection />
      <ExplanationSection />
      <SecurityTrustSection />
      <Footer />
    </main>
  );
}
