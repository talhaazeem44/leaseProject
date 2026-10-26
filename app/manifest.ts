import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sami Electronics",
    short_name: "Sami Electronics",
    description: "Motorcycle lease management",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f0",
    theme_color: "#3a3a36",
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
