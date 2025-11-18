'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Trash2 } from 'lucide-react'
import type { Database } from '@/lib/supabase.types'

// ✅ Define typed rows using Supabase types
type Product = Database['public']['Tables']['products']['Row']
type CartItemRow = Database['public']['Tables']['cart_items']['Row'] & {
  product: Product | null
}

export default function CartPage() {
  const [items, setItems] = useState<CartItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [banner, setBanner] = useState<{ type: 'error' | 'info'; message: string } | null>(
    null
  )
  const router = useRouter()

  // Fetch user and cart data
  useEffect(() => {
    const fetchCart = async () => {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

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
        .returns<CartItemRow[]>() // ✅ strong typing

      if (error) console.error('Error fetching cart:', error.message)
      const rows = data ?? []
      setItems(rows)
      setSelectedIds(new Set(rows.map((row) => row.id)))
      setLoading(false)
    }

    fetchCart()
  }, [router])

  // Remove item from cart
  async function removeItem(id: string) {
    setBanner(null)
    const { error } = await supabaseBrowser.from('cart_items').delete().eq('id', id)
    if (error) {
      setBanner({ type: 'error', message: 'Unable to remove item. Please try again.' })
      console.error(error)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // Update quantity
  async function updateQuantity(id: string, delta: number) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const nextQty = Math.max(1, item.quantity + delta)
    setUpdatingId(id)
    const { error } = await supabaseBrowser
      .from('cart_items')
      .update({ quantity: nextQty })
      .eq('id', id)
    setUpdatingId(null)

    if (error) {
      setBanner({ type: 'error', message: 'Unable to update quantity. Please try again.' })
      console.error(error)
      return
    }

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i))
    )
  }

  // Toggle selection for checkout
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

  const selectedItems = items.filter((item) => selectedIds.has(item.id))

  // Calculate total
  const total = selectedItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  )

  // Go to checkout
  const goToCheckout = () => {
    if (selectedItems.length === 0) {
      setBanner({ type: 'info', message: 'Select at least one item to proceed to checkout.' })
      return
    }
    const ids = selectedItems.map((item) => item.id).join(',')
    router.push(ids ? `/checkout?items=${encodeURIComponent(ids)}` : '/checkout')
  }

  // Render
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pb-0">
        {banner && (
          <div
            className={`border-b ${
              banner.type === 'error'
                ? 'bg-[#fdecea] border-[#f5c2c7] text-[#b02a37]'
                : 'bg-[#f4f8ec] border-[#d7e7c7] text-[#516029]'
            }`}
          >
            <div className="rp-shell py-3 text-sm">{banner.message}</div>
          </div>
        )}
        <div className="bg-[url('/wood-texture.png')] bg-cover bg-center py-8">
          <div className="rp-shell space-y-4">
            {loading ? (
              <div className="text-white flex items-center gap-2">
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading your cart...
              </div>
            ) : items.length === 0 ? (
              <p className="text-white">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="mx-auto max-w-5xl bg-white border border-[#d7dce4] rounded-2xl shadow-lg p-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <input
                      type="checkbox"
                      className="accent-[color:var(--rp-green)] w-4 h-4"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      aria-label="Select item"
                    />
                    <img
                      src={item.product?.image_url || '/lunch.webp'}
                      alt={item.product?.name || 'Product'}
                      className="h-16 w-16 object-contain rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">
                        {item.product?.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Rp{item.product?.price?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="flex items-center gap-3 bg-[#f4f6f8] rounded-full px-3 py-2 border border-[#dfe3e8]">
                      <button
                        className="text-lg text-slate-700 disabled:text-slate-400"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={updatingId === item.id}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold text-slate-800 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="text-lg text-slate-700 disabled:text-slate-400"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={updatingId === item.id}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#e6e6e6] py-6">
          <div className="rp-shell">
            <div className="mx-auto max-w-5xl bg-[#e6e6e6] rounded-2xl border border-[#d7dce4] shadow-lg px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-slate-800 text-sm space-y-1">
                <div className="font-semibold">
                  Selected Products: {selectedItems.length}/{items.length}
                </div>
                <div className="font-semibold">
                  Total Price: Rp{total.toLocaleString('id-ID')}
                </div>
              </div>
              <button
                onClick={goToCheckout}
                disabled={items.length === 0 || selectedItems.length === 0}
                className="rounded-full bg-[color:var(--rp-green)] text-white font-semibold px-8 py-2 disabled:opacity-50"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#8b953d] h-10" />
      </main>
      <Footer />
    </>
  )
}
