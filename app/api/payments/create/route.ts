import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { Database } from '@/lib/supabase.types'
import { supabaseServer } from '@/lib/supabase-server'

const MIDTRANS_SERVER_KEY =
  process.env.MIDTRANS_SERVER_KEY || process.env.SECRET || process.env.MIDTRANS_WEBHOOK_SECRET
const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_CLIENT
const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions'

type CartItemWithProductPrice = Database['public']['Tables']['cart_items']['Row'] & {
  product: Pick<Database['public']['Tables']['products']['Row'], 'price' | 'name'> | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const itemIds: string[] | undefined = Array.isArray(body?.itemIds)
      ? body.itemIds.filter((v) => typeof v === 'string')
      : undefined

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

    const query = supabase
      .from('cart_items')
      .select(
        `
        id,
        quantity,
        product:products (
          price,
          name
        )
      `
      )
      .eq('user_id', user.id)
      .returns<CartItemWithProductPrice[]>()

    if (itemIds && itemIds.length > 0) {
      query.in('id', itemIds)
    }

    const { data: cartItems, error: cartError } = await query

    if (cartError) {
      console.error('Error fetching cart for checkout:', cartError)
      return NextResponse.json({ error: 'Unable to prepare checkout' }, { status: 500 })
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart selection is empty' }, { status: 400 })
    }

    const computedTotal = cartItems.reduce((sum, item) => {
      const price = item.product?.price ?? 0
      return sum + price * item.quantity
    }, 0)

    const grossAmount = Math.round(computedTotal)
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      return NextResponse.json({ error: 'Cart is empty or invalid' }, { status: 400 })
    }

    const orderId = `ORDER-${crypto.randomUUID()}`

    const itemDetails =
      cartItems?.map((item, idx) => ({
        id: item.product?.name ? item.product.name.slice(0, 20) : `item-${idx + 1}`,
        price: item.product?.price ?? 0,
        quantity: item.quantity,
        name: item.product?.name ?? 'Product',
      })) ?? []

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        email: user.email,
      },
    }

    const midtransResponse = await fetch(
      MIDTRANS_SNAP_URL,
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
