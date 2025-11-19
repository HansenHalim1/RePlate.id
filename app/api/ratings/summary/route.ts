import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

type RatingRow = {
  product_id: string
  rating: number
}

export async function POST(req: NextRequest) {
  const { productIds } = await req.json().catch(() => ({}))

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({})
  }

  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('product_ratings')
    .select('product_id, rating')
    .in('product_id', productIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const stats: Record<string, { total: number; count: number }> = {}

  ;(data as RatingRow[] | null)?.forEach((row) => {
    if (!stats[row.product_id]) {
      stats[row.product_id] = { total: 0, count: 0 }
    }
    stats[row.product_id].total += row.rating
    stats[row.product_id].count += 1
  })

  const summary: Record<string, { average: number; count: number }> = {}

  productIds.forEach((id: string) => {
    const stat = stats[id]
    summary[id] = stat
      ? {
          average: Number((stat.total / stat.count).toFixed(2)),
          count: stat.count,
        }
      : { average: 0, count: 0 }
  })

  return NextResponse.json(summary)
}
