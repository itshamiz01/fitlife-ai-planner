import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Fit Life Bro — Your daily wellness",
    short_name: "Fit Life Bro",
    description: "Your personal space for nourishing food, feel-good movement, hydration, and healthier habits.",
    start_url: "/?source=homescreen",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#3d7046",
    lang: "en",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Log a water break", short_name: "Water", description: "A little sip, a little better.", url: "/?view=water" },
      { name: "My meal plan", short_name: "Meals", description: "Your feel-good food for the week.", url: "/?view=meals" },
    ],
  };
}
