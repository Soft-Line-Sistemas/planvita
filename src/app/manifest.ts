import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campo do Bosque",
    short_name: "Campo do Bosque",
    description: "Campo do Bosque",
    start_url: "/cliente",
    display: "standalone",
    background_color: "#3a9b28",
    theme_color: "#3a9b28",
    icons: [
      {
        src: "/cliente-mobile/Icone app 192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/cliente-mobile/Icone app.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
