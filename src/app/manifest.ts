import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planvita",
    short_name: "Planvita",
    description: "Sistema Planvita",
    start_url: "/cliente",
    display: "standalone",
    background_color: "#3a9b28",
    theme_color: "#3a9b28",
    icons: [
      {
        src: "/cliente-mobile/Camada 1-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/cliente-mobile/Camada 1-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
