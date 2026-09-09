import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOODIFY — AI Mood Board Generator",
    short_name: "MOODIFY",
    description: "Describe a vibe, get a curated corkboard mood board.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#a855f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
