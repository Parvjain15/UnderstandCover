import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { RiskFlag } from '@/types'

interface RiskFlagCardProps {
  flag: RiskFlag
  highlight?: boolean
}

const levelVariant: Record<string, 'high' | 'medium' | 'low'> = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
}

const levelColor: Record<string, string> = {
  High: 'border-l-4 border-red-400',
  Medium: 'border-l-4 border-amber-400',
  Low: 'border-l-4 border-blue-400',
}

export function RiskFlagCard({ flag, highlight = false }: RiskFlagCardProps) {
  const cardClass = `${levelColor[flag.level] ?? ''}${highlight ? ' bg-blue-50' : ''}`
  return (
    <Card className={cardClass}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${flag.level === 'High' ? 'text-red-500' : flag.level === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={levelVariant[flag.level] ?? 'low'}>{flag.level} risk</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{flag.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">{flag.explanation}</p>
            {flag.page > 0 && (
              <p className="text-xs text-slate-400 mb-3">
                Page {flag.page}, {flag.section}
                {flag.quote && <> &mdash; <em>&ldquo;{flag.quote}&rdquo;</em></>}
              </p>
            )}
            {flag.questionToAsk && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                <span className="font-medium">Ask your insurer:</span> {flag.questionToAsk}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
