import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Léo TV Stream",
    short_name: "Léo TV",
    description: "Painel Master de Transmissões Léo TV",
    start_url: "/login",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#09090b",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      }
    ],
  }
}
