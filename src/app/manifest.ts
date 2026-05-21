import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeverMiss",
    short_name: "NeverMiss",
    description: "An emotionally intelligent relationship memory app for birthdays, anniversaries, milestones, and emotional reconnects.",
    start_url: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#f4f0ff",
    theme_color: "#f4f0ff",
    orientation: "portrait-primary",
    categories: ["lifestyle", "productivity", "social"],
    lang: "en",
    icons: [
      { src: "/icons/nevermiss-192", sizes: "192x192", type: "image/png" },
      { src: "/icons/nevermiss-512", sizes: "512x512", type: "image/png" },
      { src: "/icons/nevermiss-maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Memory Dashboard", short_name: "Dashboard", url: "/dashboard" },
      { name: "Write a Wish", short_name: "Wish", url: "/wishes" },
      { name: "Alerts", short_name: "Alerts", url: "/notifications" },
    ],
  };
}
