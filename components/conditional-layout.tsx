'use client';

import { usePathname } from 'next/navigation';
import LoadingScreen from '@/components/loading-screen';
import React from 'react';

export default function ConditionalLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();
  const isGamePage = pathname === '/game' || pathname?.startsWith('/game/');
  
  if (isGamePage) {
    return <>{children}</>;
  }
  
  return <LoadingScreen>{children}</LoadingScreen>;
}