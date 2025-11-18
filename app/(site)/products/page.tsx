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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [showEmpty, setShowEmpty] = useState(false)

  // Load products & user
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
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!loading && products.length === 0) {
      const timer = setTimeout(() => setShowEmpty(true), 600)
      return () => clearTimeout(timer)
    }
    setShowEmpty(false)
  }, [loading, products])

  // Add to cart
  async function addToCart(productId: string) {
    setBanner(null)
    if (!userId) {
      setBanner({ type: 'info', message: 'Please log in first to add items.' })
      return
    }

    setLoading(true)

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()

    if (!session?.access_token) {
      setLoading(false)
      setBanner({ type: 'error', message: 'Session expired. Please log in again.' })
      return
    }

    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    })

    const result = await res.json()
    setLoading(false)

    if (res.ok) setBanner({ type: 'success', message: result.message || 'Added to cart!' })
    else setBanner({ type: 'error', message: result.error || 'Failed to add' })
  }

  // Filter products by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const groupedByCategory = filteredProducts.reduce<Record<string, Product[]>>((acc, item) => {
    const key = item.category?.trim() || 'Products'
    acc[key] = acc[key] ? [...acc[key], item] : [item]
    return acc
  }, {})

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f3f3f3] pb-16">
        {banner && (
          <div
            className={`border-b ${
              banner.type === 'error'
                ? 'bg-[#fdecea] border-[#f5c2c7] text-[#b02a37]'
                : banner.type === 'success'
                  ? 'bg-[#e8f5e9] border-[#c8e6c9] text-[#2e7d32]'
                  : 'bg-[#eef3ff] border-[#d3ddff] text-[#1e3a8a]'
            }`}
          >
            <div className="rp-shell py-3 text-sm flex items-center gap-2">
              {loading && (
                <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {banner.message}
            </div>
          </div>
        )}
        <div className="rp-shell pt-10 space-y-8">
          <div className="bg-[#ededed] border border-[#d5d9dd] rounded-2xl shadow-lg px-5 py-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Products</h1>
            <p className="text-slate-600 mt-2 text-sm md:text-base">Search flavors, menus, or categories</p>
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-3xl">
                <input
                  type="text"
                  placeholder="Search a flavors, menu, or categories"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-[#d2d6db] bg-white px-6 py-3 text-[15px] shadow-lg focus:ring-2 focus:ring-[color:var(--rp-green)]"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-slate-600 text-center flex items-center justify-center gap-2">
              <span className="inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            showEmpty ? (
              <p className="text-slate-600 text-center">No products found.</p>
            ) : (
              <div className="text-slate-600 text-center flex items-center justify-center gap-2">
                <span className="inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading products...
              </div>
            )
          ) : filteredProducts.length === 0 ? (
            <p className="text-slate-600 text-center">No products match your search.</p>
          ) : (
            Object.keys(groupedByCategory).map((category) => (
              <section key={category} className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-800">{category}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedByCategory[category].map((p) => (
                    <div key={p.id} className="rounded-[18px] bg-white border border-[#e1e3e6] shadow-lg p-4 text-center hover:shadow-2xl transition">
                      <div className="w-full h-40 flex items-center justify-center">
                        <img
                          src={p.image_url || '/lunch.webp'}
                          alt={p.name}
                          className="h-full object-contain"
                        />
                      </div>
                      <h3 className="mt-3 font-semibold text-slate-800">{p.name}</h3>
                      <p className="text-[color:var(--rp-green)] font-semibold mt-1">
                        Rp{p.price.toLocaleString('id-ID')}
                      </p>
                      <button
                        onClick={() => addToCart(p.id)}
                        disabled={loading}
                        className="mt-4 w-full rounded-xl bg-[color:var(--rp-orange)] text-white font-semibold py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading && (
                          <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {loading ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
