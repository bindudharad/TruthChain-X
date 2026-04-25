import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruthChain-X - Browser-Based Real-Time Phishing Detection",
  description: "TruthChain-X is a browser-based phishing detection system that analyzes URLs and content, assigns a risk score, and warns users in real time."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
      </head>
      <body suppressHydrationWarning={true}>
        <div suppressHydrationWarning>{children}</div>
      </body>
    </html>
  );
}
