
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Léo TV Stream - O Sinal Master v370-S',
    short_name: 'Léo TV',
    description: 'O melhor aplicativo de streaming do Mestre Léo.',
    start_url: '/login',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen', 'window-controls-overlay'],
    orientation: 'any',
    background_color: '#0A051A',
    theme_color: '#6D2DCC',
    scope: '/',
    categories: ['entertainment', 'video'],
    icons: [
      {
        src: 'https://picsum.photos/seed/leotv/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://picsum.photos/seed/leotv/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  }
}
