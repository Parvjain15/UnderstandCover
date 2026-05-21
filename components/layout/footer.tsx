import Link from 'next/link'
import { Shield } from 'lucide-react'
import { DISCLAIMER } from '@/lib/utils'

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-lg mb-3">
              <Shield className="h-5 w-5" />
              Understand Cover
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/about" className="hover:text-blue-600">About</Link>
            <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600">Terms</Link>
            <Link href="/demo" className="hover:text-blue-600">Try Demo</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Understand Cover. Made in the UK.</span>
          <span>Educational tool only. Not insurance advice.</span>
        </div>
      </div>
    </footer>
  )
}
