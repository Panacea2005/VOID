import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import ConditionalLayout from '@/components/conditional-layout'
import { ThemeProvider } from '@/components/theme-provider'
import ClientRoot from '@/components/ClientRoot'
import { Press_Start_2P } from 'next/font/google'

// Cấu hình font Press Start 2P
const pixelFont = Press_Start_2P({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-pixel',
})

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
    <html lang="en" className={pixelFont.variable}>
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Suspense>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ClientRoot>
            {children}
          </ClientRoot>
        </ThemeProvider>
      </body>
    </html>
  )
}