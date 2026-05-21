import Link from 'next/link'
import { Shield } from 'lucide-react'
import { DISCLAIMER } from '@/lib/utils'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-700 font-bold text-2xl">
            <Shield className="h-7 w-7" />
            Understand Cover
          </Link>
        </div>
        {children}
        <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
