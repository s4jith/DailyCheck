import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FinanceFlow',
    short_name: 'FinanceFlow',
    description: 'A comprehensive personal finance app for budgeting and expense tracking.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5f5',
    theme_color: '#51c878',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
