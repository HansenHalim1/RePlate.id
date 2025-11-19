'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
      setOrders(data ?? [])
      setLoading(false)
    })()
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f5f5] pb-16">
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
                    <div
                      className="px-6 py-4 grid grid-cols-1 md:grid-cols-[150px_120px_140px_200px_180px_1fr] gap-6 text-sm text-slate-700 items-start"
                    >
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
                      <ul className="list-disc pl-5 text-slate-500 space-y-1 text-xs text-slate-600">
                        {order.items?.map((item) => (
                          <li key={item.id}>
                            {item.product_name ?? 'Item'} × {item.quantity} @ Rp
                            {item.product_price?.toLocaleString('id-ID') ?? '-'}
                          </li>
                        ))}
                      </ul>
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
