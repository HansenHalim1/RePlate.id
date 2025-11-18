// app/api/payments/webhook/[secret]/route.ts
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const MIDTRANS_SERVER_KEY =
  process.env.MIDTRANS_SERVER_KEY || process.env.SECRET || process.env.MIDTRANS_WEBHOOK_SECRET || ''

const statusMap: Record<string, string> = {
  capture: 'paid',
  settlement: 'paid',
  pending: 'pending',
  deny: 'failed',
  cancel: 'failed',
  expire: 'expired',
  refund: 'refunded',
}

export async function POST(req: NextRequest) {
  if (!MIDTRANS_SERVER_KEY) {
    console.error('MIDTRANS_SERVER_KEY is not configured')
    return NextResponse.json({ error: 'Server key missing' }, { status: 500 })
  }

  let body: any
  try {
    body = await req.json()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status } = body ?? {}

  if (!order_id || !signature_key || !status_code || !gross_amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex')

  if (expectedSignature !== signature_key) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const newStatus = statusMap[transaction_status] ?? 'pending'

  const supabase = supabaseServiceRole()
  const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order_id)

  if (error) {
    console.error('Failed to update order status from webhook', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
