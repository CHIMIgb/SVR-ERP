'use client';

import { POSProvider } from '@/components/pos/POSProvider';

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  return <POSProvider>{children}</POSProvider>;
}