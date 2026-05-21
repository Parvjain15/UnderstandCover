import Link from 'next/link'
import { Shield } from 'lucide-react'
import { DISCLAIMER } from '@/lib/utils'

export const metadata = { title: 'About — Understand Cover' }

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-700 font-bold text-lg">
            <Shield className="h-5 w-5" />
            Understand Cover
          </Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">About Understand Cover</h1>
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p>
            Insurance policies are written for lawyers, not for the people who actually need them.
            The average contents policy is 40 pages of dense legal language. Most people sign up,
            pay their premiums, and have no idea what they&apos;re actually covered for until they
            need to claim — and then they find out the hard way.
          </p>
          <p>
            Understand Cover was built to fix that. Upload your policy, and we&apos;ll explain it
            in plain English — with the exact page number and clause reference for every statement
            we make. No guessing, no generic advice: just your specific policy, explained clearly.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">What we are</h2>
          <p>
            An educational tool. We help you understand what your policy wording says. Every
            explanation is cited back to the exact page and clause in your document.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">What we are not</h2>
          <p>
            We are not an insurance broker, claims manager, financial adviser, or law firm. We do
            not give advice on whether to buy, cancel, or claim on a policy. We explain what the
            document says — nothing more, nothing less.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">Privacy</h2>
          <p>
            Your policy documents are used only to generate your explanation. We do not sell your
            data, share it with insurers, or use it to train AI models. You can delete everything
            at any time.{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">Read our privacy policy.</Link>
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-10">
          <p className="text-xs text-slate-400">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}
