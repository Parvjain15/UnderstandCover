import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not found'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function policyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    renters: 'Renters',
    contents: 'Contents',
    travel: 'Travel',
    gadget: 'Gadget',
    car: 'Car',
    home: 'Home',
    shop: 'Shop',
    public_liability: 'Public Liability',
    professional_indemnity: 'Professional Indemnity',
    employers_liability: "Employer's Liability",
    business_interruption: 'Business Interruption',
    cyber: 'Cyber',
    landlord: 'Landlord',
    other: 'Other',
  }
  return labels[type] ?? type
}

export function ownerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    individual: 'Individual',
    student: 'Student',
    renter: 'Renter',
    business: 'Business',
    shop: 'Shop',
    landlord: 'Landlord',
    other: 'Other',
  }
  return labels[type] ?? type
}

export const DISCLAIMER =
  'This is a plain-English explanation only and does not replace the original policy wording or constitute legal, insurance, financial, or claims management advice. It does not guarantee claim outcomes. For uncertain claims, always contact your insurer directly or seek advice from a qualified insurance adviser or solicitor.'
