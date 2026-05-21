import Link from 'next/link'
import { Shield } from 'lucide-react'
import { DISCLAIMER } from '@/lib/utils'

export const metadata = { title: 'Privacy Policy — Understand Cover' }

export default function PrivacyPage() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate max-w-none">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-8">Last updated: May 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">What we collect</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
            <li>Your email address and name (when you create an account)</li>
            <li>Insurance policy documents you upload (PDF files)</li>
            <li>Questions you ask about your policies</li>
            <li>Basic usage data (via Vercel Analytics — anonymised)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">What we do with it</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
            <li>We use your policy documents only to generate your plain-English explanation</li>
            <li>We use your questions only to generate cited answers from your policy</li>
            <li>We do not sell your data to anyone</li>
            <li>We do not share your documents with insurers, brokers, or third parties</li>
            <li>We do not train AI models on your documents</li>
            <li>Policy text is sent to Google Gemini API to generate explanations — Google&apos;s privacy policy applies to this processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">How long we keep it</h2>
          <p className="text-slate-600 text-sm">
            We keep your data until you delete it. You can delete individual policies or your entire account at any time from the Settings page. When you delete data, it is permanently removed from our systems within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Your rights (UK GDPR)</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
            <li><strong>Access:</strong> You can request a copy of all data we hold about you</li>
            <li><strong>Deletion:</strong> You can delete your account and all associated data at any time</li>
            <li><strong>Portability:</strong> You can request your data in a machine-readable format</li>
            <li><strong>Correction:</strong> You can update your name and account details in Settings</li>
            <li><strong>Objection:</strong> You can object to us processing your data</li>
          </ul>
          <p className="text-slate-600 text-sm mt-3">
            To exercise any right, email us at <a href="mailto:privacy@understandcover.co.uk" className="text-blue-600 hover:underline">privacy@understandcover.co.uk</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Legal basis</h2>
          <p className="text-slate-600 text-sm">
            We process your data under legitimate interest (providing the service you requested) and consent (which you give when creating an account). We are not a data controller for insurance purposes and do not process special category data intentionally.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Cookies</h2>
          <p className="text-slate-600 text-sm">
            We use only essential cookies required for authentication (provided by Supabase). We do not use advertising or tracking cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact</h2>
          <p className="text-slate-600 text-sm">
            Questions about this policy? Email <a href="mailto:privacy@understandcover.co.uk" className="text-blue-600 hover:underline">privacy@understandcover.co.uk</a>.
          </p>
        </section>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-8">
          <p className="text-xs text-slate-400">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}
