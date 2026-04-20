import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Léo TV Stream - O Sinal Master',
    short_name: 'Léo TV',
    description: 'Acesse seus canais, filmes e séries com a melhor tecnologia de streaming.',
    start_url: '/user/home',
    display: 'standalone',
    display_override: ['standalone', 'window-controls-overlay'],
    orientation: 'any',
    background_color: '#0A051A',
    theme_color: '#6D2DCC',
    scope: '/',
    icons: [
      {
        src: 'https://picsum.photos/seed/leotv/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/leotv/512/512',
        sizes: '512x512',
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
