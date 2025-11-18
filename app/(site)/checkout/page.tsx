'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Database } from '@/lib/supabase.types'

type Product = Database['public']['Tables']['products']['Row']
type CartItemRow = Database['public']['Tables']['cart_items']['Row'] & {
  product: Product | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<'bank' | 'card'>('bank')
  const [rememberCard, setRememberCard] = useState(true)

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
      setItems(data ?? [])
      setLoading(false)
    }

    fetchCart()
  }, [router])

  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Payment flow coming soon. We will plug Midtrans or another gateway here.')
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f2f2f2] pb-16">
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
                  <span className="font-semibold">SubTotal</span>
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

                  <div className="pt-2">
                    <button type="submit" className="rounded-full bg-[color:var(--rp-green)] text-white font-semibold px-6 py-2 w-full md:w-auto">
                      Rp{total.toLocaleString('id-ID')}
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
