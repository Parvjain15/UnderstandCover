import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Understand Cover — Understand what your insurance really covers',
  description:
    'Upload your insurance policy, ask real-life questions, and get plain-English explanations with exact clause and page references.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  )
}
