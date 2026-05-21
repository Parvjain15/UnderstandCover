import { AlertCircle } from 'lucide-react'
import { DISCLAIMER } from '@/lib/utils'

export function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start text-sm">
      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-amber-800">{DISCLAIMER}</p>
    </div>
  )
}
