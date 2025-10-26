import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { Database } from '@/lib/supabase.types'
import { supabaseServer } from '@/lib/supabase-server'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

type CartItemWithProductPrice = Database['public']['Tables']['cart_items']['Row'] & {
  product: Pick<Database['public']['Tables']['products']['Row'], 'price'> | null
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!MIDTRANS_SERVER_KEY) {
      console.error('Missing MIDTRANS_SERVER_KEY configuration')
      return NextResponse.json({ error: 'Payment processor not configured' }, { status: 500 })
    }

    const supabase = supabaseServer(accessToken)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(
        `
        quantity,
        product:products (
          price
        )
      `
      )
      .eq('user_id', user.id)
      .returns<CartItemWithProductPrice[]>()

    if (cartError) {
      console.error('Error fetching cart for checkout:', cartError)
      return NextResponse.json({ error: 'Unable to prepare checkout' }, { status: 500 })
    }

    const computedTotal = (cartItems ?? []).reduce((sum, item) => {
      const price = item.product?.price ?? 0
      return sum + price * item.quantity
    }, 0)

    const grossAmount = Math.round(computedTotal)
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      return NextResponse.json({ error: 'Cart is empty or invalid' }, { status: 400 })
    }

    const orderId = `ORDER-${crypto.randomUUID()}`

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        user_id: user.id,
        email: user.email,
      },
    }

    const midtransResponse = await fetch(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64'),
        },
        body: JSON.stringify(payload),
      }
    )

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text()
      console.error('Midtrans error:', errorText)
      return NextResponse.json({ error: 'Failed to create payment session' }, { status: 502 })
    }

    const data = await midtransResponse.json()

    const { error: insertError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: user.id,
        total: grossAmount,
        status: 'pending',
      } as Database['public']['Tables']['orders']['Insert'])

    if (insertError) {
      console.error('Failed to persist order:', insertError)
      return NextResponse.json({ error: 'Unable to record order' }, { status: 500 })
    }

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      client_key: MIDTRANS_CLIENT_KEY ?? null,
    })
  } catch (err: any) {
    console.error('Error in payments/create:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
