import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DailyCheck',
    short_name: 'DailyCheck',
    description: 'Track your bank balances, expenses, budgets and savings in one place.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0C',
    theme_color: '#0A0A0C',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
