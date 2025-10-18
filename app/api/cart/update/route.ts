import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { cart_id, quantity } = await req.json()
    if (!cart_id || quantity == null) {
      return NextResponse.json({ error: 'Missing cart_id or quantity' }, { status: 400 })
    }

    const supabase = supabaseServer()
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cart_id)

    if (error) throw error
    return NextResponse.json({ message: 'Quantity updated successfully' })
  } catch (err: any) {
    console.error('Error in cart/update:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
