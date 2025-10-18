import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { Database } from '@/lib/supabase.types'
import { supabaseServer } from '@/lib/supabase-server'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!

export async function POST(req: NextRequest) {
  try {
    const { user_id, total } = await req.json()
    if (!user_id || !total) {
      return NextResponse.json({ error: 'Missing user_id or total' }, { status: 400 })
    }

    const orderId = 'ORDER-' + crypto.randomUUID()

    // Create payload for Midtrans Snap
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
      customer_details: {
        user_id,
      },
    }

    const res = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64'),
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    // Optional: Save order in Supabase
    const supabase = supabaseServer()
    await supabase.from('orders').insert({
      id: orderId,
      user_id,
      total,
      status: 'pending',
    } as Database['public']['Tables']['orders']['Insert'])

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      client_key: MIDTRANS_CLIENT_KEY,
    })
  } catch (err: any) {
    console.error('Error in payments/create:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
