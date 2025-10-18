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
  const router = useRouter()

  // 🔐 Fetch user and cart data
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
      setItems(data ?? [])
      setLoading(false)
    }

    fetchCart()
  }, [router])

  // 🗑 Remove item from cart
  async function removeItem(id: string) {
    const { error } = await supabaseBrowser.from('cart_items').delete().eq('id', id)
    if (error) {
      alert('Failed to remove item')
      console.error(error)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // 💰 Calculate total
  const total = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  )

  // 💳 Go to checkout
  const goToCheckout = () => {
    router.push('/checkout')
  }

  // 🧩 Render
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-5xl bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-slate-600">Your cart is empty.</p>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product?.image_url || '/placeholder.png'}
                      alt={item.product?.name || 'Product'}
                      className="h-20 w-20 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-medium text-lg">{item.product?.name}</h3>
                      <p className="text-sm text-slate-600">
                        Rp{item.product?.price?.toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-semibold text-slate-700">
                      Rp{((item.product?.price || 0) * item.quantity).toLocaleString('id-ID')}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-6 border-t">
                <span className="text-lg font-medium text-slate-800">Total:</span>
                <span className="text-xl font-bold text-green-700">
                  Rp{total.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={goToCheckout}
                  className="mt-4 bg-green-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-800 transition"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
