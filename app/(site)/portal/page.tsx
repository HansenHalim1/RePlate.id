'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function PortalContent() {
  const searchParams = useSearchParams()
  const role = (searchParams.get('role') as 'customer' | 'seller' | null) ?? 'customer'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#edeff2] pb-16">
        <div className="rp-shell pt-10 space-y-6">
          <div className="rp-card p-6 md:p-8">
            <p className="text-[13px] font-semibold text-[color:var(--rp-green)] uppercase tracking-[0.08em]">
              Portal
            </p>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {role === 'seller' ? 'Seller' : 'Customer'} Flow
            </h1>
            <p className="text-slate-600">
              This page is ready to branch into dedicated experiences for customers and sellers.
              Wire your dashboards and permissions here without changing the shared storefront UI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rp-card p-5 space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">Customer</h3>
              <p className="text-sm text-slate-600">
                Browse, add to cart, and checkout. Keep using the homepage, products, cart, and checkout screens.
              </p>
            </div>
            <div className="rp-card p-5 space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">Seller</h3>
              <p className="text-sm text-slate-600">
                Plug in seller workflow here (inventory upload, pricing, live status). Great place to surface KPIs and approvals.
              </p>
            </div>
          </div>

          <div className="rp-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xl font-semibold text-slate-800">Need a new flow?</h4>
              <p className="text-sm text-slate-600">
                Point your role-based redirects here and build dedicated dashboards without touching the storefront.
              </p>
            </div>
            <a href="mailto:replate.id@gmail.com" className="rp-pill rp-pill-primary text-center">
              Talk to us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div />}>
      <PortalContent />
    </Suspense>
  )
}
