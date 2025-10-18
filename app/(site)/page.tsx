'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Database } from '@/lib/supabase.types'

/** ✅ Type definitions based on Supabase schema */
type Product = Database['public']['Tables']['products']['Row']

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔐 Fetch user and a few featured products
  useEffect(() => {
    ;(async () => {
      const { data: userData } = await supabaseBrowser.auth.getUser()
      setUserId(userData?.user?.id ?? null)

      const { data, error } = await supabaseBrowser
        .from('products')
        .select('*')
        .limit(3)
        .returns<Product[]>() // ✅ full typing

      if (error) console.error('Error fetching products:', error.message)
      setProducts(data ?? [])
    })()
  }, [])

  // 🛒 Add product to cart
  async function addToCart(productId: string) {
    if (!userId) {
      alert('Please log in to add items to your cart.')
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
    else alert(result.error || 'Failed to add item')
  }

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section
        className="relative h-[480px] bg-cover bg-center flex flex-col items-center justify-center text-center text-white"
        style={{ backgroundImage: "url('/hero-bg.webp')" }}
      >
        <div className="bg-black/40 absolute inset-0" />
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">Welcome to RePlate.id</h1>
          <p className="text-lg">where <strong>No Plates Left Behind</strong></p>
        </div>
      </section>

      {/* HOT DEALS */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative">
            <span className="absolute -top-6 left-0 bg-green-600 text-white px-4 py-1 text-sm font-semibold rotate-[-10deg] shadow-md rounded">
              Hot Deals!!
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {products.length === 0 ? (
              <p className="text-slate-600 col-span-full text-center">No products found.</p>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow p-4 text-center border hover:shadow-md transition"
                >
                  <img
                    src={'/lunch.webp'}
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
      </section>

      {/* ABOUT US */}
      <section className="py-20 bg-gradient-to-b from-[#d9e4c3] to-[#f5f5dc] text-center text-slate-800">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-bold mb-6">About Us</h2>
          <p className="text-lg leading-relaxed">
            RePlate.id menghubungkan hotel dan masyarakat untuk mengurangi food waste.
            Kami membantu hotel menjual makanan sisa operasional yang masih layak konsumsi
            dengan harga terjangkau bagi konsumen.
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            Simple, sustainable, and meaningful — kami percaya perubahan besar dimulai dari
            satu piring makanan yang diselamatkan.
          </p>
        </div>
      </section>

      <Footer />
    </>
  )
}
