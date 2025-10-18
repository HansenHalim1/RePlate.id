'use client'

import { useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function CheckoutPage() {
  useEffect(() => {
    // TODO: Fetch total from Supabase cart_items
    // TODO: Call your API route to create Midtrans transaction
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold">Processing payment...</h1>
      <p className="text-slate-600 mt-2">Please wait while we prepare your checkout.</p>
    </div>
  )
}
