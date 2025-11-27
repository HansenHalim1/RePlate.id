import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, orderId, rating, review } = await req.json().catch(() => ({}))

  if (!productId || !orderId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = supabaseServer(token)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate the user bought the item in this paid order
  const query = supabase
    .from('orders')
    .select('id,status,order_items!inner(product_id)')
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .eq('order_items.product_id', productId)
    .eq('id', orderId)

  const { data: purchases, error: purchaseError } = await query.limit(1)

  if (purchaseError) {
    console.error('Failed to validate purchase', purchaseError)
    return NextResponse.json({ error: 'Unable to validate purchase' }, { status: 500 })
  }

  if (!purchases || purchases.length === 0) {
    return NextResponse.json(
      { error: 'You can only rate products from paid orders that include this item.' },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('product_ratings')
    .upsert(
      {
        order_id: orderId,
        product_id: productId,
        user_id: user.id,
        rating,
        review: review ?? null,
      },
      { onConflict: 'order_id,product_id,user_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Thanks for rating!' })
}
