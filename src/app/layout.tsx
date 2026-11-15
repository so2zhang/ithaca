import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bee Loop",
  description: "Concept prototype: Bee learns from a post-Plan debrief and next week's Plan reflects it.",
};

export const viewport: Viewport = { themeColor: "#ffc629", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
