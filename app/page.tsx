import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Shield,
  FileText,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Download,
  CheckCircle,
  Upload,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { DISCLAIMER } from '@/lib/utils'

const valueCards = [
  { icon: FileText, title: 'Plain-English Summary', description: 'Get the key points of your policy without the legal jargon.' },
  { icon: MessageSquare, title: "Ask 'Am I Covered If…?'", description: 'Type real-life questions and get clear answers from your policy.' },
  { icon: BookOpen, title: 'Exact Citations', description: 'Every answer shows the page and clause it came from.' },
  { icon: CheckCircle, title: 'Coverage & Exclusions', description: "See what's covered, what's not, and what has limits." },
  { icon: AlertTriangle, title: 'Risk Flags', description: 'We highlight clauses that often catch people out.' },
  { icon: Download, title: 'Free Report Export', description: 'Download a plain-English summary you can keep or share.' },
]

const steps = [
  { step: '1', title: 'Upload your policy PDF', description: 'Drag and drop or browse. Supports any standard insurance PDF.' },
  { step: '2', title: 'We read it for you', description: 'Our AI reads every clause and explains it in plain English with citations.' },
  { step: '3', title: 'Ask your questions', description: 'Get cited answers to real questions like "Am I covered if my laptop is stolen?"' },
]

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-1">
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <Lock className="h-3.5 w-3.5" />
              Private &amp; secure — your policy stays yours
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Understand what your<br />
              <span className="text-blue-600">insurance really covers.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your policy, ask real-life questions, and get plain-English explanations
              with exact clause and page references.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={user ? '/upload' : '/signup'}>
                <Button size="xl" className="w-full sm:w-auto">
                  <Upload className="h-5 w-5" />
                  Upload Policy
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Try Demo Policy
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Everything you need to understand your cover
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {valueCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <card.icon className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-slate-900 text-lg mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-white border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            No guessing. Every answer is linked back to your policy wording.
          </h2>
          <p className="text-slate-500 leading-relaxed mb-8">
            Unlike generic insurance advice you find online, Understand Cover only tells you what{' '}
            <em>your specific policy</em> says. Every explanation includes the exact page number
            and a short quote from your document.
          </p>
          <Link href={user ? '/upload' : '/signup'}>
            <Button size="lg">Get started free</Button>
          </Link>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">{DISCLAIMER}</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
