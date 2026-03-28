
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Léo TV & Stream',
    short_name: 'Léo TV',
    description: 'Plataforma de streaming P2P Master de alta performance',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#1E161D',
    theme_color: '#DF4CD9',
    icons: [
      {
        src: 'https://picsum.photos/seed/leo/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/leo/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
