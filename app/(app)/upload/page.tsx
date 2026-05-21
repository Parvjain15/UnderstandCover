'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadZone } from '@/components/upload/upload-zone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, CheckCircle2 } from 'lucide-react'

const PROCESSING_STEPS = [
  'Uploading your policy…',
  'Reading your policy…',
  'Finding clauses, limits, and exclusions…',
  'Creating your plain-English summary…',
  'Done! Taking you to your dashboard…',
]

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [policyType, setPolicyType] = useState('')
  const [ownerType, setOwnerType] = useState('')
  const [jurisdiction, setJurisdiction] = useState('UK')
  const [nickname, setNickname] = useState('')
  const [preExistingConditions, setPreExistingConditions] = useState(false)
  const [highValueItems, setHighValueItems] = useState(false)
  const [adventureActivities, setAdventureActivities] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file || !policyType || !ownerType) return

    setProcessing(true)
    setError(null)
    setStep(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('policyType', policyType)
      formData.append('ownerType', ownerType)
      formData.append('jurisdiction', jurisdiction)
      formData.append('nickname', nickname || file.name.replace('.pdf', ''))
      formData.append('preExistingConditions', String(preExistingConditions))
      formData.append('highValueItems', String(highValueItems))
      formData.append('adventureActivities', String(adventureActivities))

      setStep(1)
      const uploadRes = await fetch('/api/upload-policy', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
      const { policyId } = uploadData

      setStep(2)
      const processRes = await fetch('/api/process-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId }),
      })
      const processData = await processRes.json()
      if (!processRes.ok) throw new Error(processData.error || 'Processing failed')

      setStep(3)
      await new Promise((r) => setTimeout(r, 800))
      setStep(4)
      await new Promise((r) => setTimeout(r, 600))

      router.push(`/policies/${policyId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-6" />
          <p className="text-lg font-semibold text-slate-900">{PROCESSING_STEPS[step]}</p>
        </div>
        <div className="space-y-2">
          {PROCESSING_STEPS.slice(0, -1).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-left">
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${i < step ? 'text-green-500' : i === step ? 'text-blue-500' : 'text-slate-300'}`}
              />
              <span className={i < step ? 'text-slate-500' : i === step ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload your insurance policy</h1>
        <p className="text-slate-500">
          We&apos;ll read it and explain it in plain English. Your policy stays private.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <UploadZone file={file} onFile={setFile} onRemove={() => setFile(null)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Policy type *</Label>
            <Select value={policyType} onValueChange={setPolicyType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select policy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="renters">Renters / Contents</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="gadget">Gadget</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
                <SelectItem value="public_liability">Public Liability</SelectItem>
                <SelectItem value="professional_indemnity">Professional Indemnity</SelectItem>
                <SelectItem value="employers_liability">Employer&apos;s Liability</SelectItem>
                <SelectItem value="business_interruption">Business Interruption</SelectItem>
                <SelectItem value="cyber">Cyber</SelectItem>
                <SelectItem value="landlord">Landlord</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Who is this policy for? *</Label>
            <Select value={ownerType} onValueChange={setOwnerType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select owner type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Me (individual)</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="renter">Renter</SelectItem>
                <SelectItem value="business">My business</SelectItem>
                <SelectItem value="shop">My shop</SelectItem>
                <SelectItem value="landlord">As a landlord</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Country / jurisdiction</Label>
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="Ireland">Ireland</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Policy nickname (optional)</Label>
            <Input
              placeholder="e.g. My Renters Insurance 2026"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">Personalise your analysis <span className="font-normal text-slate-500">(optional)</span></p>
            <p className="text-xs text-slate-500">We&apos;ll highlight risk flags most relevant to you.</p>
            {[
              { id: 'preExisting', label: 'I have pre-existing medical conditions', value: preExistingConditions, onChange: setPreExistingConditions },
              { id: 'highValue', label: 'I carry electronics or valuables worth over £500', value: highValueItems, onChange: setHighValueItems },
              { id: 'adventure', label: 'I plan to do winter sports or adventure activities', value: adventureActivities, onChange: setAdventureActivities },
            ].map(({ id, label, value, onChange }) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => onChange(!value)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${value ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}
                >
                  {value && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <Lock className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
              <p>
                Your policy is used only to generate your explanation. You can delete it at any time.
                We do not train AI models on your documents. Do not upload documents you are not
                allowed to share.
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!file || !policyType || !ownerType || processing}
        >
          Process Policy
        </Button>
      </form>
    </div>
  )
}
