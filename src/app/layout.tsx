import type { Metadata } from "next";
import "./globals.css";
import "@codenkay/video-nsgplayer-ui/styles.css";

export const metadata: Metadata = {
  title: "NSG Player — Next.js BFF sample",
  description: "Thin BFF + UI playground for NSG video player SDK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
