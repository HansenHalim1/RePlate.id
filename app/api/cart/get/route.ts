import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import type { Database } from '@/lib/supabase.types'

export const dynamic = 'force-dynamic' // prevent caching

type CartItemWithProduct = Database['public']['Tables']['cart_items']['Row'] & {
  product: Database['public']['Tables']['products']['Row'] | null
}

async function handleCartRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseServer(accessToken)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .eq('user_id', user.id)
      .returns<CartItemWithProduct[]>()

    if (error) {
      console.error('Error fetching cart:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data || [] })
  } catch (err: any) {
    console.error('Unexpected error in /api/cart/get:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleCartRequest(req)
}

export async function POST(req: NextRequest) {
  return handleCartRequest(req)
}
