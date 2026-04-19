
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.gstatic.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.google.com' },
      { protocol: 'https', hostname: '**.xvideos-cdn.com' },
      { protocol: 'https', hostname: '**.xvideos.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: '**.rdcanais.com' },
      { protocol: 'https', hostname: 'reidoscanais.ooo' },
      { protocol: 'https', hostname: '**.redecanaistv.be' },
      { protocol: 'https', hostname: '**.redecanaistv.net' },
      { protocol: 'https', hostname: '**.mercadolivre.com.br' },
      { protocol: 'https', hostname: '**.mercadopago.com' },
      { protocol: 'https', hostname: '**.mlstatic.com' },
      { protocol: 'https', hostname: 'archive.org' }
    ],
  },
};

export default nextConfig;
