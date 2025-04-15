import type { Metadata } from 'next'
import './globals.css'
import LoadingScreen from '@/components/loading-screen'

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
        <LoadingScreen>{children}</LoadingScreen>
      </body>
    </html>
  )
}