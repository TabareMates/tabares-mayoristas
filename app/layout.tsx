import type { Metadata } from 'next'
import { Work_Sans } from 'next/font/google'
import './globals.css'

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
})

export const metadata: Metadata = {
  title: 'Tabaré Mates — Portal Mayoristas',
  description: 'Portal privado de pedidos mayoristas Tabaré Mates',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${workSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F0E8D8] text-[#2D4535] font-[family-name:var(--font-work-sans)]">
        {children}
      </body>
    </html>
  )
}
