'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, Upload, FileText, LogOut, Settings, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface NavbarProps {
  user?: { email?: string } | null
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl">
            <Shield className="h-6 w-6" />
            Understand Cover
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/policies">
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4" />
                  My Policies
                </Button>
              </Link>
              <Link href="/upload">
                <Button size="sm">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
                >
                  {user.email?.split('@')[0]}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/demo">
                <Button variant="ghost" size="sm">Try Demo</Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up free</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
