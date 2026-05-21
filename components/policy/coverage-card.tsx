import Link from 'next/link'
import { FileText, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { CoverageItem } from '@/types'

interface CoverageCardProps {
  item: CoverageItem
  policyId: string
  onAsk?: (question: string) => void
}

const statusVariant: Record<string, 'covered' | 'limited' | 'excluded' | 'unclear'> = {
  Covered: 'covered',
  Limited: 'limited',
  Excluded: 'excluded',
  Unclear: 'unclear',
}

const confidenceVariant: Record<string, 'covered' | 'limited' | 'excluded'> = {
  High: 'covered',
  Medium: 'limited',
  Low: 'excluded',
}

export function CoverageCard({ item, policyId, onAsk }: CoverageCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant={statusVariant[item.status] ?? 'unclear'}>{item.status}</Badge>
          <Badge variant={confidenceVariant[item.confidence] ?? 'unclear'} className="text-xs">
            {item.confidence} confidence
          </Badge>
        </div>
        <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">{item.explanation}</p>
        {item.page > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-3">
            <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Page {item.page}, {item.section}
              {item.quote && <> &mdash; <em>&ldquo;{item.quote}&rdquo;</em></>}
            </span>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {onAsk && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAsk(`Tell me more about: ${item.title}`)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Ask about this
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
