import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase.types'

export const dynamic = 'force-dynamic' // prevent caching

/**
 * GET /api/cart/get
 * Fetches the logged-in user's cart items (with product details).
 */
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = supabaseServer()

    const { data, error } = await supabase
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
      .eq('user_id', user_id)
      .returns<
        (Database['public']['Tables']['cart_items']['Row'] & {
          product: Database['public']['Tables']['products']['Row'] | null
        })[]
      >()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (err) {
    console.error('Unexpected error in /api/cart/get:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
