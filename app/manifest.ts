import type { MetadataRoute } from "next";

/** Web app manifest that makes the site installable as a PWA. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lămurit — înțelege orice hârtie oficială",
    short_name: "Lămurit",
    description: "Fă o poză la orice document oficial și află pe românește ce înseamnă și ce ai de făcut.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ea",
    theme_color: "#1d2a44",
    lang: "ro",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
