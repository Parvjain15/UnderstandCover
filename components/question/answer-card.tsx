'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DISCLAIMER } from '@/lib/utils'
import type { QuestionAnswer } from '@/types'

interface AnswerCardProps {
  question: string
  answer: QuestionAnswer
  timestamp?: string
}

const shortAnswerVariant: Record<string, 'covered' | 'limited' | 'excluded' | 'unclear'> = {
  'May be covered': 'covered',
  'Conditions or exclusions may apply': 'limited',
  'May not be covered': 'excluded',
  'Unclear from policy': 'unclear',
  'Not found in policy': 'excluded',
}

export function AnswerCard({ question, answer, timestamp }: AnswerCardProps) {
  const [showClauses, setShowClauses] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const text = `Q: ${question}\n\nA: ${answer.shortAnswer}\n\n${answer.plainEnglishExplanation}\n\n${DISCLAIMER}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="border-l-4 border-slate-200 pl-4">
          <p className="text-slate-500 text-sm italic">&ldquo;{question}&rdquo;</p>
          {timestamp && <p className="text-xs text-slate-400 mt-1">{new Date(timestamp).toLocaleDateString('en-GB')}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={shortAnswerVariant[answer.shortAnswer] ?? 'unclear'} className="text-sm px-3 py-1">
            {answer.shortAnswer === 'May be covered' && '🟢 '}
            {answer.shortAnswer === 'Conditions or exclusions may apply' && '🟠 '}
            {answer.shortAnswer === 'May not be covered' && '🔴 '}
            {(answer.shortAnswer === 'Unclear from policy' || answer.shortAnswer === 'Not found in policy') && '⚪ '}
            {answer.shortAnswer}
          </Badge>
          <span className="text-xs text-slate-400">{answer.confidence} confidence</span>
        </div>

        <p className="text-slate-700 leading-relaxed">{answer.plainEnglishExplanation}</p>

        {/* Relevant clauses */}
        {answer.relevantClauses.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
              onClick={() => setShowClauses(!showClauses)}
            >
              {showClauses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {answer.relevantClauses.length} relevant clause{answer.relevantClauses.length !== 1 ? 's' : ''}
            </button>
            {showClauses && (
              <div className="mt-3 space-y-2">
                {answer.relevantClauses.map((clause, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-slate-700">
                      Page {clause.page}{clause.section ? `, ${clause.section}` : ''}
                      {clause.clause ? `, Clause ${clause.clause}` : ''}
                    </p>
                    {clause.quote && <p className="italic text-slate-500 mt-1">&ldquo;{clause.quote}&rdquo;</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exclusions */}
        {answer.possibleExclusions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-2">Possible exclusions or issues:</p>
            <ul className="space-y-1">
              {answer.possibleExclusions.map((exc, i) => (
                <li key={i} className="text-sm text-red-700">
                  Page {exc.page}: {exc.explanation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions to ask insurer */}
        {answer.questionsToAsk.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Questions to ask your insurer:</p>
            <ul className="space-y-1 list-disc list-inside">
              {answer.questionsToAsk.map((q, i) => (
                <li key={i} className="text-sm text-blue-700">{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Professional review */}
        {answer.professionalReviewRecommended && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Professional review may be needed</p>
              {answer.professionalReviewReason && (
                <p className="text-sm text-amber-700 mt-0.5">{answer.professionalReviewReason}</p>
              )}
              <p className="text-xs text-amber-600 mt-1">
                You may want to speak with your insurer, broker, or a qualified adviser.
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer + actions */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400 mb-3">{DISCLAIMER}</p>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
