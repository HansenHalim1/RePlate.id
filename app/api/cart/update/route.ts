import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cart_id, quantity } = await req.json()

    if (typeof cart_id !== 'string' || !cart_id.trim()) {
      return NextResponse.json({ error: 'Invalid cart_id' }, { status: 400 })
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be a positive integer' }, { status: 400 })
    }

    const supabase = supabaseServer(accessToken)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cart_id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Quantity updated successfully' })
  } catch (err: any) {
    console.error('Error in cart/update:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
