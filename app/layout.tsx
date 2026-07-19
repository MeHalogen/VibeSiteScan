import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthLanding } from '@/app/components/AuthLanding'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'VibeSiteScan - Final QA for AI-Built Websites',
  description: 'Paste your URL. VibeSiteScan catches broken routes, missing share previews, AI leftovers, exposed keys, dead forms, and gives you copy-paste fix prompts for Cursor, Lovable, Bolt, and Replit.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className}`}>
        <AuthLanding />
        {children}
      </body>
    </html>
  )
}
