'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Database } from '@/lib/supabase.types'
import HotDealsRibbon from '@/components/HotDealsRibbon'

/** ✅ Type definitions based on Supabase schema */
type Product = Database['public']['Tables']['products']['Row']
type ProductDisplay = Product & { description?: string | null; hotel?: string | null }

export default function HomePage() {
  const [products, setProducts] = useState<ProductDisplay[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch user and a few featured products
  useEffect(() => {
    ;(async () => {
      const { data: userData } = await supabaseBrowser.auth.getUser()
      setUserId(userData?.user?.id ?? null)

      const fallback: ProductDisplay[] = [
        { id: 'demo-1', name: 'Lunch Package', price: 35000, description: 'Hotel Horison, Jakarta', image_url: '/lunch.webp', category: 'Lunch' } as ProductDisplay,
        { id: 'demo-2', name: 'Lunch Package', price: 30000, description: 'Hotel Amaris, Jakarta', image_url: '/lunch.webp', category: 'Lunch' } as ProductDisplay,
        { id: 'demo-3', name: 'Lunch Package', price: 30000, description: 'Hotel Aryaduta, Jakarta', image_url: '/lunch.webp', category: 'Lunch' } as ProductDisplay,
      ]

      const { data, error } = await supabaseBrowser
        .from('products')
        .select('*')
        .limit(3)
        .returns<Product[]>() // ✅ full typing

      if (error) console.error('Error fetching products:', error.message)
      setProducts(((data && data.length > 0 ? data : fallback) ?? fallback) as ProductDisplay[])
    })()
  }, [])

  // Add product to cart
  async function addToCart(productId: string) {
    if (!userId) {
      alert('Please log in to add items to your cart.')
      return
    }

    setLoading(true)

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()

    if (!session?.access_token) {
      setLoading(false)
      alert('Session expired. Please log in again.')
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

    if (res.ok) alert(result.message || 'Added to cart!')
    else alert(result.error || 'Failed to add item')
  }

  return (
    <>
      <Navbar />

      <main className="pb-16 bg-[#f2f2f4]">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-bg.webp')" }}
          />
          <div className="rp-hero-overlay absolute inset-0" />
          <div className="rp-shell relative h-[260px] sm:h-[320px] flex flex-col justify-center items-center text-center px-4">
            <p className="rp-section-title mb-2 text-3xl sm:text-4xl">
              where “No Plates, Left Behind”
            </p>
          </div>
        </section>

        {/* HOT DEALS */}
        <section className="mt-0 pb-12">
          <div className="rp-shell relative pt-14 sm:pt-16">
            <HotDealsRibbon />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.length === 0 ? (
                <p className="text-slate-600 col-span-full text-center">
                  No products found.
                </p>
              ) : (
                products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-[18px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-[#e8e8e8] p-6 text-center transition"
                  >
                    <div className="w-full h-40 flex items-center justify-center">
                      <img src={'/lunch.webp'} alt={p.name} className="h-full object-contain" />
                    </div>
                    <h3 className="mt-4 font-bold text-xl text-slate-900">{p.name}</h3>
                    <p className="text-sm text-slate-600">
                      {(p as ProductDisplay).description || (p as ProductDisplay).hotel || 'Hotel Horison, Jakarta'}
                    </p>
                    <p className="text-[color:var(--rp-green)] font-bold mt-4 text-lg">
                      Rp{p.price.toLocaleString('id-ID')}
                    </p>
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={loading}
                      className="mt-5 w-full rounded-full bg-[#d09a27] text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <section className="mt-16" id="about">
          <div className="rp-wood text-slate-800 py-16 bg-[rgba(125,141,42,0.85)] bg-blend-multiply">
            <div className="rp-shell text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow">
                About Us
              </h2>
              <p className="text-lg leading-relaxed max-w-3xl mx-auto text-white">
                RePlate.id menghubungkan hotel dan masyarakat untuk mengurangi food waste.
                Kami membantu hotel menjual makanan sisa operasional yang masih layak konsumsi
                dengan harga terjangkau bagi konsumen.
              </p>
              <p className="text-lg leading-relaxed max-w-3xl mx-auto text-white">
                Simple, sustainable, and meaningful — kami percaya perubahan besar dimulai dari
                satu piring makanan yang diselamatkan.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
