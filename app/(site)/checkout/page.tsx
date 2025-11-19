'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Database } from '@/lib/supabase.types'

type Product = Database['public']['Tables']['products']['Row']
type CartItemRow = Database['public']['Tables']['cart_items']['Row'] & {
  product: Product | null
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, any>) => void
    }
  }
}

const SNAP_JS_URL = 'https://app.sandbox.midtrans.com/snap/snap.js'
const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_CLIENT

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="rp-shell py-10 text-slate-600">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<CartItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<'bank' | 'card'>('bank')
  const [rememberCard, setRememberCard] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [snapReady, setSnapReady] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Load cart for summary
  useEffect(() => {
    const fetchCart = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const selectedParam = searchParams.get('items')
      const requestedIds = selectedParam
        ? selectedParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : null

      const { data, error } = await supabaseBrowser
        .from('cart_items')
        .select(
          `
          id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url
          )
        `
        )
        .eq('user_id', user.id)
        .returns<CartItemRow[]>() // typed

      if (error) console.error('Error fetching cart:', error.message)

      const rows = data ?? []
      setItems(rows)

      if (requestedIds && requestedIds.length > 0) {
        const filtered = rows.filter((row) => requestedIds.includes(row.id))
        setSelectedIds(new Set((filtered.length > 0 ? filtered : rows).map((row) => row.id)))
      } else {
        setSelectedIds(new Set(rows.map((row) => row.id)))
      }
      setLoading(false)
    }

    fetchCart()
  }, [router, searchParams])

  // Load Midtrans Snap JS once
  useEffect(() => {
    if (!MIDTRANS_CLIENT_KEY) {
      console.error('Missing Midtrans client key')
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SNAP_JS_URL}"]`)
    if (existing) {
      setSnapReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = SNAP_JS_URL
    script.async = true
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY)
    script.onload = () => setSnapReady(true)
    script.onerror = () => setError('Failed to load payment gateway. Please refresh and try again.')
    document.body.appendChild(script)
  }, [MIDTRANS_CLIENT_KEY])

  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  const total = selectedItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus(null)

    if (selectedIds.size === 0) {
      setError('Please select at least one item to pay.')
      return
    }

    if (!MIDTRANS_CLIENT_KEY) {
      setError('Payment gateway is not configured.')
      return
    }

    if (!snapReady || !window.snap) {
      setError('Payment popup is not ready yet. Please wait a moment and try again.')
      return
    }

    setPaying(true)

    try {
      const { data: sessionData } = await supabaseBrowser.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        setPaying(false)
        router.push('/login')
        return
      }

      const selectedItemIds = selectedItems.map((item) => item.id)

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ itemIds: selectedItemIds, paymentMethod: selectedPayment }),
      })

      const json = await res.json()
      if (!res.ok || !json?.token) {
        throw new Error(json?.error || 'Unable to start payment.')
      }

      setStatus('Opening secure payment popup...')

      window.snap.pay(json.token, {
        onSuccess: () => {
          setPaying(false)
          setStatus('Payment successful. Redirecting...')
          router.push('/?payment=success')
        },
        onPending: () => {
          setPaying(false)
          setStatus('Payment pending. You can continue shopping.')
          router.push('/?payment=pending')
        },
        onError: () => {
          setPaying(false)
          setError('Payment failed. Please try again.')
        },
        onClose: () => {
          setPaying(false)
          setError('Payment popup was closed before finishing.')
          setStatus(null)
        },
      })
    } catch (err: any) {
      setPaying(false)
      setError(err?.message || 'Unable to start payment.')
      setStatus(null)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f2f2f2] pb-16">
        {(error || status) && (
          <div
            className={`border-b ${
              error
                ? 'bg-[#fdecea] border-[#f5c2c7] text-[#b02a37]'
                : 'bg-[#eef7ff] border-[#c7dfff] text-[#1d4b8f]'
            }`}
          >
            <div className="rp-shell py-3 text-sm flex items-center gap-2">
              {paying && (
                <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {error || status}
            </div>
          </div>
        )}
        <div className="rp-shell pt-8">
          <div className="rounded-2xl border border-[#d7dce4] shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-[360px_1fr]">
              {/* Order summary */}
              <div className="rp-wood p-6 md:p-8 text-white space-y-4">
                <h2 className="text-4xl font-bold">Checkout</h2>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-white/80">Loading cart...</p>
                  ) : items.length === 0 ? (
                    <p className="text-white/80">No items in cart.</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white text-slate-800 rounded-xl px-4 py-3 flex items-center gap-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="accent-[color:var(--rp-green)]"
                        />
                        <img
                          src={item.product?.image_url || '/lunch.webp'}
                          alt={item.product?.name || 'Product'}
                          className="h-12 w-12 object-contain"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.product?.name}</h4>
                          <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-sm text-slate-800">
                          Rp{((item.product?.price || 0) * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="bg-white text-slate-800 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="font-semibold">
                    Subtotal ({selectedItems.length}/{items.length} selected)
                  </span>
                  <span className="font-bold text-[color:var(--rp-green)]">
                    Rp{total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Payment form */}
              <div className="p-6 md:p-8 space-y-6 bg-[#f3f3f3]">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[color:var(--rp-green)]">Select your payment method</p>
                  <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={selectedPayment === 'bank'}
                      onChange={() => setSelectedPayment('bank')}
                      className="accent-[color:var(--rp-green)]"
                    />
                    Bank Transfer
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={selectedPayment === 'card'}
                      onChange={() => setSelectedPayment('card')}
                      className="accent-[color:var(--rp-green)]"
                    />
                    Card / Credit Card
                  </label>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">JOHN DOE WIJAYA</label>
                      <input
                        type="text"
                        className="w-full border-0 border-b border-[#c3c7be] bg-transparent px-2 py-2 focus:ring-0 focus:border-[color:var(--rp-green)]"
                        placeholder="NAME ON CARD"
                        required={selectedPayment === 'card'}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">1234 - 5678 - 9870 - 1011</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full border-0 border-b border-[#c3c7be] bg-transparent px-2 py-2 focus:ring-0 focus:border-[color:var(--rp-green)]"
                        placeholder="CARD NUMBER"
                        required={selectedPayment === 'card'}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">12 / 26</label>
                      <input
                        type="text"
                        className="w-full border-0 border-b border-[#c3c7be] bg-transparent px-2 py-2 focus:ring-0 focus:border-[color:var(--rp-green)]"
                        placeholder="EXPIRATION DATE"
                        required={selectedPayment === 'card'}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">***</label>
                      <input
                        type="password"
                        className="w-full border-0 border-b border-[#c3c7be] bg-transparent px-2 py-2 focus:ring-0 focus:border-[color:var(--rp-green)]"
                        placeholder="CVC"
                        required={selectedPayment === 'card'}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberCard}
                      onChange={(e) => setRememberCard(e.target.checked)}
                      className="accent-[color:var(--rp-green)]"
                    />
                    Remember my card info
                  </label>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {status && !error && <p className="text-sm text-slate-700">{status}</p>}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={paying || loading || items.length === 0 || selectedItems.length === 0}
                    className="rounded-full bg-[color:var(--rp-green)] text-white font-semibold px-6 py-2 w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {paying ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Pay Rp${total.toLocaleString('id-ID')}`
                    )}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
