'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

interface Profile {
  subscription_tier: string
  subscription_status: string | null
  current_period_end: string | null
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const upgradeSuccess = searchParams.get('upgrade') === 'success'

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, current_period_end')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUser(data.user as { id: string; email?: string } | null)
      setFullName(data.user?.user_metadata?.full_name ?? '')
      if (data.user) fetchProfile(data.user.id)
    })
  }, [fetchProfile])

  async function handleSaveName(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    await createClient().auth.updateUser({ data: { full_name: fullName } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/')
  }

  async function handleDeleteAccount() {
    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    if (res.ok) {
      await createClient().auth.signOut()
      router.push('/')
    }
  }

  async function handleUpgrade() {
    setBillingLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setBillingLoading(false)
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setBillingLoading(false)
    }
  }

  const isPro = profile?.subscription_tier === 'pro' &&
    (profile.subscription_status === 'active' || profile.subscription_status === 'trialing')

  const renewalDate = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {upgradeSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-900">Welcome to Pro!</p>
            <p className="text-sm text-green-700">Your account has been upgraded. Unlimited policies and 50 questions/month are now active.</p>
          </div>
        </div>
      )}

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Billing
            {profile && (
              <Badge variant={isPro ? 'covered' : 'outline'}>
                {isPro ? 'Pro' : 'Free'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Plan</p>
                  <p className="font-medium text-slate-900">Pro — £6.99/month</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Status</p>
                  <p className="font-medium text-slate-900 capitalize">{profile?.subscription_status}</p>
                </div>
                {renewalDate && (
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">Next renewal</p>
                    <p className="font-medium text-slate-900">{renewalDate}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>Unlimited policies</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>50 questions / month</span></div>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={billingLoading}>
                {billingLoading ? 'Opening…' : 'Manage subscription'}
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-lg p-3">
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Policies</p>
                  <p className="font-medium text-slate-900">Up to 3</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Questions</p>
                  <p className="font-medium text-slate-900">20 / policy / month</p>
                </div>
              </div>
              <div className="border border-blue-100 rounded-xl p-4 bg-blue-50 space-y-3">
                <div>
                  <p className="font-semibold text-slate-900">Upgrade to Pro — £6.99/month</p>
                  <p className="text-sm text-slate-500 mt-0.5">Unlimited policies, 50 questions per policy per month.</p>
                </div>
                <ul className="space-y-1 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" />Unlimited policy uploads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" />50 questions per policy per month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" />Cancel any time</li>
                </ul>
                <Button onClick={handleUpgrade} disabled={billingLoading} className="w-full sm:w-auto">
                  {billingLoading ? 'Redirecting…' : 'Upgrade to Pro'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
          </div>
          <form onSubmit={handleSaveName} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" disabled={saving} size="sm">
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save name'}
            </Button>
          </form>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy &amp; Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            You can delete individual policies from the{' '}
            <Link href="/policies" className="text-blue-600 hover:underline">My Policies</Link> page.
          </p>
          <div className="border-t pt-4">
            {!confirmDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                Delete my account
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  This will permanently delete your account, all policies, and all question history. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                    Yes, delete everything
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-500">
          <p>Understand Cover v0.1.0</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy</Link>
            <a href="mailto:hello@understandcover.co.uk" className="text-blue-600 hover:underline">Contact</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
