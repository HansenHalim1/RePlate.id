'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Database } from '@/lib/supabase.types'

type Product = Database['public']['Tables']['products']['Row']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // 🧠 Load products & user
  useEffect(() => {
    ;(async () => {
      const { data: userData } = await supabaseBrowser.auth.getUser()
      setUserId(userData?.user?.id ?? null)

      const { data, error } = await supabaseBrowser
        .from('products')
        .select('*')
        .order('name', { ascending: true })
        .returns<Product[]>()

      if (error) console.error('Error fetching products:', error.message)
      setProducts(data ?? [])
    })()
  }, [])

  // 🛒 Add to cart
  async function addToCart(productId: string) {
    if (!userId) {
      alert('Please log in first!')
      return
    }

    setLoading(true)
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, user_id: userId, quantity: 1 }),
    })

    const result = await res.json()
    setLoading(false)

    if (res.ok) alert(result.message || 'Added to cart!')
    else alert(result.error || 'Failed to add')
  }

  // 🔍 Filter products by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-green-700">Our Products</h1>

          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.length === 0 ? (
              <p className="text-slate-600 col-span-full text-center">No products found.</p>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow p-4 text-center border hover:shadow-md transition"
                >
                  <img
                    src={p.image_url || '/placeholder.png'}
                    alt={p.name}
                    className="mx-auto h-40 object-contain"
                  />
                  <h3 className="mt-3 font-medium text-lg">{p.name}</h3>
                  <p className="text-green-700 font-semibold mt-1">
                    Rp{p.price.toLocaleString('id-ID')}
                  </p>
                  <button
                    onClick={() => addToCart(p.id)}
                    disabled={loading}
                    className="mt-4 w-full bg-green-700 text-white font-medium py-2 rounded hover:bg-green-800 transition disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
