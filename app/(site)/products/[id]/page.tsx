'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RatingStars from '@/components/RatingStars'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Database } from '@/lib/supabase.types'

/** Types aligned to Supabase schema */
type Product = Database['public']['Tables']['products']['Row']
type ProductDisplay = Product & { description?: string | null; hotel?: string | null }
type RatingRow = Database['public']['Tables']['product_ratings']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

type EligibleOrder = Pick<Order, 'id' | 'created_at'>

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const productId = params?.id

  const [product, setProduct] = useState<ProductDisplay | null>(null)
  const [reviews, setReviews] = useState<RatingRow[]>([])
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [ratingValue, setRatingValue] = useState<number>(5)
  const [reviewText, setReviewText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null)
  const [adding, setAdding] = useState(false)

  // Derived metrics for display
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
  }, [reviews])

  useEffect(() => {
    if (!productId) return

    const load = async () => {
      setLoading(true)
      setBanner(null)

      const [{ data: userData }, productRes, reviewsRes] = await Promise.all([
        supabaseBrowser.auth.getUser(),
        supabaseBrowser.from('products').select('*').eq('id', productId).maybeSingle(),
        supabaseBrowser
          .from('product_ratings')
          .select('id,product_id,user_id,order_id,rating,review,created_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
      ])

      const user = userData?.user ?? null
      setUserId(user?.id ?? null)
      setProduct((productRes.data as ProductDisplay | null) ?? null)
      setReviews((reviewsRes.data as RatingRow[] | null) ?? [])

      if (user?.id) {
        const { data: orders } = await supabaseBrowser
          .from('orders')
          .select('id,created_at,order_items!inner(product_id)')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .eq('order_items.product_id', productId)
          .order('created_at', { ascending: false })

        const options = ((orders as (Order & { order_items: OrderItem[] })[] | null) ?? []).map(
          (row) => ({ id: row.id, created_at: row.created_at })
        )
        setEligibleOrders(options)
        if (options.length > 0) {
          setSelectedOrderId(options[0].id)
        }

        const mine = (reviewsRes.data as RatingRow[] | null)?.find((r) => r.user_id === user.id)
        if (mine) {
          setRatingValue(mine.rating ?? 5)
          setReviewText(mine.review ?? '')
          if (mine.order_id) setSelectedOrderId(mine.order_id)
        }
      }

      setLoading(false)
    }

    load()
  }, [productId])

  const handleAddToCart = async () => {
    if (!productId) return
    setBanner(null)
    setAdding(true)

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()

    if (!session?.access_token) {
      setAdding(false)
      setBanner({ type: 'info', message: 'Please log in to add items to your cart.' })
      router.push('/login')
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

    const result = await res.json().catch(() => ({}))
    setAdding(false)

    if (res.ok) {
      setBanner({ type: 'success', message: result.message || 'Added to cart.' })
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart-updated'))
    } else {
      setBanner({ type: 'error', message: result.error || 'Failed to add item.' })
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) return
    if (!userId) {
      setBanner({ type: 'info', message: 'Please log in to write a review.' })
      router.push('/login')
      return
    }
    if (!selectedOrderId) {
      setBanner({ type: 'info', message: 'Select a paid order that includes this product.' })
      return
    }

    setSaving(true)
    setBanner(null)

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()

    const token = session?.access_token
    if (!token) {
      setSaving(false)
      setBanner({ type: 'info', message: 'Please log in again to review.' })
      router.push('/login')
      return
    }

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, orderId: selectedOrderId, rating: ratingValue, review: reviewText }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setSaving(false)
      setBanner({ type: 'error', message: json.error || 'Failed to save review.' })
      return
    }

    setBanner({ type: 'success', message: 'Thanks for your rating and review!' })
    setSaving(false)

    // Refresh local review list to include the new entry
    setReviews((prev) => {
      const withoutMine = prev.filter((r) => r.user_id !== userId)
      const next: RatingRow = {
        id: json.id ?? `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        order_id: selectedOrderId,
        product_id: productId,
        rating: ratingValue,
        review: reviewText,
        user_id: userId,
      }
      return [next, ...withoutMine]
    })
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="rp-shell py-16 text-slate-700 flex items-center gap-2">
          <span className="inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading product...
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="rp-shell py-16 text-slate-700">Product not found.</div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5] pb-16">
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
              {(saving || adding) && (
                <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {banner.message}
            </div>
          </div>
        )}

        <section className="rp-shell pt-10 space-y-8">
          <div className="bg-white border border-[#e1e3e6] rounded-2xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-[1fr_1.2fr]">
              <div className="relative bg-[#f8f8f8] flex items-center justify-center p-6">
                <img
                  src={product.image_url || '/lunch.webp'}
                  alt={product.name}
                  className="max-h-[360px] w-auto object-contain"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{product.name}</h1>
                    <p className="text-slate-600 text-sm sm:text-base">
                      {product.description || product.category || 'RePlate.id Partner Hotel'}
                    </p>
                  </div>
                  <div className="text-right">
                    <RatingStars value={averageRating} count={reviews.length} />
                    <p className="text-xs text-slate-500 mt-1">{reviews.length} review(s)</p>
                  </div>
                </div>

                <p className="text-[color:var(--rp-green)] text-2xl font-bold">
                  Rp{product.price?.toLocaleString('id-ID')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="rounded-full bg-[color:var(--rp-orange)] text-white font-semibold px-6 py-3 disabled:opacity-60"
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => router.push('/products')}
                    className="rounded-full border border-[#d4d4d4] text-slate-800 font-semibold px-6 py-3 bg-white"
                  >
                    Back to products
                  </button>
                </div>

                <div className="bg-[#f7f7f7] border border-[#e6e6e6] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">Write a review</h2>
                    <span className="text-xs text-slate-500">Paid order required</span>
                  </div>

                  {userId ? (
                    eligibleOrders.length > 0 ? (
                      <form className="space-y-3" onSubmit={handleSubmitReview}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <label className="text-sm text-slate-700">Select order</label>
                          <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="w-full sm:w-auto rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm"
                          >
                            {eligibleOrders.map((o) => (
                              <option key={o.id} value={o.id}>
                                Order {o.id.slice(0, 8)} • {formatDate(o.created_at)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <span className="text-sm text-slate-700">Your rating</span>
                          <RatingStars value={ratingValue} interactive onRate={(val) => setRatingValue(val)} />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm text-slate-700" htmlFor="review-text">
                            Your review (optional)
                          </label>
                          <textarea
                            id="review-text"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-2 text-sm"
                            placeholder="What did you like?"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-full bg-[color:var(--rp-green)] text-white font-semibold px-6 py-3 disabled:opacity-60"
                        >
                          {saving ? 'Saving...' : 'Submit review'}
                        </button>
                      </form>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Buy this product first to unlock ratings and reviews.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-slate-600">
                      Please log in to rate and review this product.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e1e3e6] rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Customer Reviews</h2>
              <RatingStars value={averageRating} count={reviews.length} />
            </div>

            {reviews.length === 0 ? (
              <p className="text-slate-600 text-sm">No reviews yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border border-[#eaeaea] rounded-xl p-4 bg-[#fafafa]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <RatingStars value={rev.rating ?? 0} />
                        <p className="text-xs text-slate-500 mt-1">
                          Order {rev.order_id?.slice(0, 8) || '-'} • {formatDate(rev.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {rev.user_id?.slice(0, 6) || 'User'}
                      </span>
                    </div>
                    {rev.review && <p className="text-sm text-slate-700 mt-2">{rev.review}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
