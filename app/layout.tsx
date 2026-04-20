import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruthChain X - Global Trust Intelligence Platform",
  description: "AI-powered trust infrastructure for content authenticity, creator reputation, analytics, and blockchain proof."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
