import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import ConditionalLayout from '@/components/conditional-layout'
import { ThemeProvider } from '@/components/theme-provider'
import ClientRoot from '@/components/ClientRoot'
import { Press_Start_2P } from 'next/font/google'
import { SupabaseProvider } from '@/contexts/SupabaseContext'
import { AuthProvider } from '@/contexts/AuthContext' 

// Configure Press Start 2P font
const pixelFont = Press_Start_2P({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-pixel',
})

export const metadata: Metadata = {
  title: 'VOID',
  description: 'Next-generation NFT platform with Solana integration',
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-pixel">LOADING...</p>
              </div>
            </div>
          }>
            {/* ClientRoot contains the WalletProvider */}
            <ClientRoot>
              {/* Wrap with Supabase providers */}
              <SupabaseProvider>
                <AuthProvider>
                  <ConditionalLayout>{children}</ConditionalLayout>
                </AuthProvider>
              </SupabaseProvider>
            </ClientRoot>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}