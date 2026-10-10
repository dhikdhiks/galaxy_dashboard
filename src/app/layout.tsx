import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { ParticleField } from "@/components/ParticleField";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Skill Galaxy",
    template: "%s · Skill Galaxy",
  },
  description:
    "Private learning-resource dashboard: groups of skills with progress tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="galaxy-bg" aria-hidden="true" />
        <ParticleField />
        {children}
      </body>
    </html>
  );
}
