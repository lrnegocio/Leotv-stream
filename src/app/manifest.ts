import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Léo TV Stream - O Sinal Master v375',
    short_name: 'Léo TV',
    description: 'O melhor aplicativo de streaming do Mestre Léo - Versão TV & Mobile.',
    start_url: '/user/home',
    display: 'standalone',
    display_override: ['fullscreen', 'minimal-ui'],
    orientation: 'any',
    background_color: '#0A051A',
    theme_color: '#6D2DCC',
    scope: '/',
    categories: ['entertainment', 'video', 'tv'],
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
