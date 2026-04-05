import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StreamSight - Plataforma de Streaming',
    short_name: 'StreamSight',
    description: 'Plataforma de streaming inteligente de alta performance',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F5F2FA',
    theme_color: '#6D2DCC',
    scope: '/',
    icons: [
      {
        src: 'https://picsum.photos/seed/streamsight/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/streamsight/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}