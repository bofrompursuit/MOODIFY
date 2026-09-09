import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "MOODIFY — AI Mood Board Generator",
  description: "Describe a vibe, get a curated mood board sourced from stock photos, live web discovery, and custom AI imagery.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MOODIFY",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Footer />
      </body>
    </html>
  );
}
