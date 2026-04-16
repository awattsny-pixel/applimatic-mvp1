'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const supabase = createClient()

  // Load current profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (data) setFullName(data.full_name ?? '')
    }
    loadProfile()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  async function handleChangePassword() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return

    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    alert('Password reset email sent! Check your inbox.')
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account information.</p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-5">Personal Information</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            ✓ Changes saved!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
            <input
              type="email"
              className="input bg-gray-50 cursor-not-allowed"
              value={email}
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">Password</h2>
        <p className="text-gray-500 text-sm mb-4">We'll email you a secure link to reset your password.</p>
        <button onClick={handleChangePassword} className="btn-secondary">
          Send password reset email
        </button>
      </div>

      <div className="card p-6 border-red-100 border">
        <h2 className="font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-gray-500 text-sm mb-4">Deleting your account is permanent and cannot be undone.</p>
        <button className="btn-danger" onClick={() => alert('Please contact support@applimatic.ai to delete your account.')}>
          Delete account
        </button>
      </div>
    </div>
  )
}
