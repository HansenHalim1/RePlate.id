'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'seller'>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-select role from query if present
  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'seller') {
      setRole(roleParam)
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    const roleFromProfile =
      (data.user?.user_metadata?.role as 'customer' | 'seller' | undefined) ?? role

    // Sellers also land on the storefront since the portal page was removed
    router.push(`/?role=${roleFromProfile}`)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            <div className="relative h-full min-h-[420px]">
              <img
                src="/hero-auth.png"
                alt="Food background"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="p-8 sm:p-10 bg-white">
              <div className="mb-4">
                <img src="/logo.png" alt="RePlate" className="h-10" />
              </div>
              <h1 className="text-2xl font-bold text-[color:var(--rp-green)] mb-1">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-600 mb-6">
                Please login to your account
              </p>

              <div className="flex gap-2 mb-4">
                {(['customer', 'seller'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rp-pill !py-2 uppercase text-xs tracking-wide ${
                      role === r
                        ? 'bg-[color:var(--rp-green)] text-white'
                        : 'border border-[color:var(--rp-green)] text-[color:var(--rp-green)] bg-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Email or Username</label>
                  <div className="flex items-center gap-2 border border-[#c0c7b5] rounded-md px-3 py-2.5 mt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="flex items-center gap-2 border border-[#c0c7b5] rounded-md px-3 py-2.5 mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="********"
                    />
                  </div>
                </div>

                <div className="text-right text-xs text-slate-600">
                  <a href="#" className="text-[color:var(--rp-green)] font-semibold">
                    Forgot Password?
                  </a>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-[color:var(--rp-green)] text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Logging in...' : 'LOGIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/signup')}
                    className="w-full rounded-full border border-[color:var(--rp-green)] text-[color:var(--rp-green)] font-semibold py-3"
                  >
                    SIGN UP
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  )
}
