import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import '../styles/design-system.css'
import '../styles/markdown-images.css'
import { GlobalNav } from '@/components/layout/GlobalNav'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import NicknamePrompt from '@/components/common/NicknamePrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gryffin - Digital Stage',
  description: 'Personal stories from a DevOps engineer who codes, plays music, and games. My digital journal.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0B0F19]`}>
        <AuthProvider>
          <NicknamePrompt />
          <GlobalNav />
          <main className="relative">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
