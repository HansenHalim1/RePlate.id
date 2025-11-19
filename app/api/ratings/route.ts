import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, rating, review } = await req.json().catch(() => ({}))

  if (!productId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = supabaseServer(token)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('product_ratings')
    .upsert(
      {
        product_id: productId,
        user_id: user.id,
        rating,
        review: review ?? null,
      },
      { onConflict: 'product_id,user_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Thanks for rating!' })
}
