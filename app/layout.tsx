import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'SiteProof - Final QA for AI-Built Websites',
  description: 'Proof your AI-built site before your audience sees it. Check share previews, metadata, broken routes, and get a copy-paste AI fix prompt for Cursor, Lovable, Bolt, and Replit.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}
