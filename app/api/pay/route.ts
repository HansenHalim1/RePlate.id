import { NextResponse } from 'next/server'

/**
 * Legacy placeholder endpoint - intentionally disabled to avoid exposing an unauthenticated
 * payment surface. Use /api/payments/create instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Use /api/payments/create.' },
    { status: 410 }
  )
}
