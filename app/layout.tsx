import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import ConditionalLayout from '@/components/conditional-layout'

export const metadata: Metadata = {
  title: 'VOID',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Suspense>
      </body>
    </html>
  )
}