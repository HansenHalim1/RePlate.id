'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RatingStars from '@/components/RatingStars'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { Database } from '@/lib/supabase.types'

type OrderItem = Database['public']['Tables']['order_items']['Row']
type Order = Database['public']['Tables']['orders']['Row'] & {
  payment_method?: string | null
  items: OrderItem[]
}

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [ratingBusy, setRatingBusy] = useState<string | null>(null)
  const [myRatings, setMyRatings] = useState<Record<string, number>>({})
  const [myReviews, setMyReviews] = useState<Record<string, string>>({})
  const [draftReviews, setDraftReviews] = useState<Record<string, string>>({})
  const [savingReviewKey, setSavingReviewKey] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  )

  useEffect(() => {
    ;(async () => {
      const { data: userData } = await supabaseBrowser.auth.getUser()
      const uid = userData?.user?.id ?? null
      setUserId(uid)

      if (!uid) {
        setLoading(false)
        return
      }

      const { data, error } = await supabaseBrowser
        .from('orders')
        .select(
          `
          id,
          user_id,
          total,
          status,
          payment_method,
          created_at,
          items:order_items (
            id,
            order_id,
            product_id,
            product_name,
            product_price,
            quantity,
            created_at
          )
        `
        )
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) console.error('Failed to load transactions', error.message)
      setOrders((data ?? []) as Order[])
      setLoading(false)
    })()
  }, [])

  // Load existing ratings for the user to show filled stars
  useEffect(() => {
    const loadMyRatings = async () => {
      if (!userId) return
      const { data, error } = await supabaseBrowser
        .from('product_ratings')
        .select('product_id, order_id, rating, review, created_at')
        .eq('user_id', userId)
      if (error) {
        console.error('Failed to load user ratings', error)
        return
      }
      const nextRatings: Record<string, number> = {}
      const nextReviews: Record<string, string> = {}
      data?.forEach((row) => {
        if (row.product_id && row.order_id) {
          const key = `${row.order_id}:${row.product_id}`
          nextRatings[key] = row.rating
          if (row.review) nextReviews[key] = row.review
        }
      })
      setMyRatings(nextRatings)
      setMyReviews(nextReviews)
      setDraftReviews(nextReviews)
    }
    loadMyRatings()
  }, [userId])

  const handleRate = async (
    orderId: string,
    productId: string,
    ratingValue: number,
    reviewText?: string
  ) => {
    if (!userId || !productId || !orderId) {
      setBanner({ type: 'info', message: 'You must be logged in to rate purchases.' })
      return
    }

    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession()

    if (!session?.access_token) {
      setBanner({ type: 'error', message: 'Session expired. Please log in again.' })
      return
    }

    const ratingKey = `${orderId}:${productId}`
    setRatingBusy(ratingKey)
    if (reviewText !== undefined) setSavingReviewKey(ratingKey)

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        orderId,
        productId,
        rating: ratingValue,
        review: reviewText ?? myReviews[ratingKey] ?? null,
      }),
    })

    setRatingBusy(null)
    setSavingReviewKey(null)

    if (res.ok) {
      setMyRatings((prev) => ({ ...prev, [ratingKey]: ratingValue }))
      if (reviewText !== undefined) {
        setMyReviews((prev) => ({ ...prev, [ratingKey]: reviewText }))
      }
      setBanner({ type: 'success', message: 'Rating saved for this item.' })
    } else {
      const error = await res.json().catch(() => ({}))
      setBanner({ type: 'error', message: error.error || 'Failed to submit rating.' })
    }
  }

  const handleReviewSubmit = async (orderId: string, productId: string) => {
    const key = `${orderId}:${productId}`
    const ratingValue = myRatings[key] ?? 5
    const reviewText = draftReviews[key] ?? ''
    await handleRate(orderId, productId, ratingValue, reviewText)
  }

  const renderItems = (order: Order) =>
    order.items?.map((item) => {
      const productKey = `${order.id}:${item.product_id ?? ''}`
      const reviewDraft = draftReviews[productKey] ?? ''
      return (
        <li key={item.id} className="space-y-2">
          <div>
            {item.product_name ?? 'Item'} - {item.quantity} @ Rp
            {item.product_price?.toLocaleString('id-ID') ?? '-'}
          </div>
          {order.status === 'paid' ? (
            <div className="space-y-2 rounded-lg border border-[#ebebeb] bg-[#fafafa] p-3">
              <RatingStars
                value={myRatings[productKey] ?? 0}
                interactive
                busy={ratingBusy === productKey}
                onRate={(value) =>
                  item.product_id && handleRate(order.id, item.product_id, value)
                }
              />
              <textarea
                value={reviewDraft}
                onChange={(e) =>
                  setDraftReviews((prev) => ({ ...prev, [productKey]: e.target.value }))
                }
                rows={2}
                className="w-full rounded-md border border-[#dcdcdc] bg-white px-2 py-1 text-xs"
                placeholder="Share a short review (optional)"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Saved review will show on the product page.
                </span>
                <button
                  type="button"
                  onClick={() => item.product_id && handleReviewSubmit(order.id, item.product_id)}
                  disabled={savingReviewKey === productKey || ratingBusy === productKey}
                  className="rounded-full bg-[color:var(--rp-green)] text-white text-xs font-semibold px-3 py-1 disabled:opacity-60"
                >
                  {savingReviewKey === productKey ? 'Saving...' : 'Save review'}
                </button>
              </div>
              {myReviews[productKey] && (
                <p className="text-[11px] text-slate-500">
                  Last saved: “{myReviews[productKey]}”
                </p>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-slate-500">
              Rating available after payment is completed.
            </span>
          )}
        </li>
      )
    })

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
            <div className="rp-shell py-3 text-sm">{banner.message}</div>
          </div>
        )}
        <div className="rp-shell pt-10 space-y-6">
          <div className="bg-white border border-[#d7dce4] rounded-2xl shadow-lg px-5 py-6">
            <h1 className="text-3xl font-bold text-slate-800 text-center">Transaction History</h1>
            <p className="text-center text-slate-600 mt-2">
              Keep track of every order you have placed with RePlate.id
            </p>
          </div>

          {!userId ? (
            <div className="bg-white border border-[#e1e3e6] rounded-xl shadow p-6 text-center text-slate-700">
              Please log in to see your transactions.
            </div>
          ) : loading ? (
            <div className="text-slate-600 text-center flex items-center justify-center gap-2">
              <span className="inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-[#e1e3e6] rounded-xl shadow p-6 text-center text-slate-700">
              No transactions yet.
            </div>
          ) : (
            <div className="bg-white border border-[#e1e3e6] rounded-2xl shadow overflow-hidden">
              <div
                className="hidden md:grid bg-[#f3f3f3] px-6 py-3 text-sm font-semibold text-slate-600"
                style={{ gridTemplateColumns: '150px 120px 140px 200px 180px 1fr', columnGap: '24px' }}
              >
                <span className="tracking-[0.08em] uppercase">ID</span>
                <span className="tracking-[0.08em] uppercase text-left">Total</span>
                <span className="tracking-[0.08em] uppercase text-left">Status</span>
                <span className="tracking-[0.08em] uppercase">Date</span>
                <span className="tracking-[0.08em] uppercase">Payment</span>
                <span className="tracking-[0.08em] uppercase">Items</span>
              </div>
              <div className="divide-y divide-[#f0f0f0]">
                {orders.map((order) => (
                  <div key={order.id} className="border-b last:border-b-0">
                    <div className="hidden md:grid px-6 py-4 grid-cols-[150px_120px_140px_200px_180px_1fr] gap-6 text-sm text-slate-700 items-start">
                      <span className="font-semibold break-words max-w-[140px]">{order.id}</span>
                      <span className="text-[color:var(--rp-green)] font-semibold md:justify-self-start">
                        Rp{order.total?.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold w-fit md:justify-self-start ${
                          order.status === 'paid'
                            ? 'bg-[#e8f5e9] text-[#2e7d32]'
                            : order.status === 'pending'
                              ? 'bg-[#fff7e6] text-[#ad6800]'
                              : 'bg-[#fdecea] text-[#b02a37]'
                        }`}
                      >
                        {order.status ?? 'pending'}
                      </span>
                      <span>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </span>
                      <div className="text-slate-600 text-xs md:text-sm">
                        {order.payment_method ? `Paid via ${order.payment_method}` : 'Method not recorded'}
                      </div>
                      <ul className="list-none pl-0 text-slate-500 space-y-2 text-xs text-slate-600">
                        {renderItems(order)}
                      </ul>
                    </div>

                    <div className="md:hidden px-4 py-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Order ID</span>
                        <span className="font-semibold text-right break-words max-w-[60%]">{order.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Total</span>
                        <span className="text-[color:var(--rp-green)] font-semibold">
                          Rp{order.total?.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Status</span>
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold w-fit ${
                            order.status === 'paid'
                              ? 'bg-[#e8f5e9] text-[#2e7d32]'
                              : order.status === 'pending'
                                ? 'bg-[#fff7e6] text-[#ad6800]'
                                : 'bg-[#fdecea] text-[#b02a37]'
                          }`}
                        >
                          {order.status ?? 'pending'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Date</span>
                        <span className="text-right text-slate-700">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Payment</span>
                        <span className="text-right text-slate-700">
                          {order.payment_method ? `Paid via ${order.payment_method}` : 'Method not recorded'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Items</span>
                        <ul className="list-none pl-0 text-slate-600 space-y-2 text-xs">
                          {renderItems(order)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

