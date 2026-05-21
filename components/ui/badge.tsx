import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-800',
        covered: 'bg-green-100 text-green-800',
        limited: 'bg-amber-100 text-amber-800',
        excluded: 'bg-red-100 text-red-800',
        unclear: 'bg-slate-100 text-slate-700',
        high: 'bg-red-100 text-red-800',
        medium: 'bg-amber-100 text-amber-800',
        low: 'bg-blue-100 text-blue-700',
        processing: 'bg-blue-100 text-blue-800',
        ready: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        uploading: 'bg-slate-100 text-slate-700',
        outline: 'border border-slate-300 text-slate-700 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
