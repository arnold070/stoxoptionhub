import { NextRequest, NextResponse } from 'next/server'

// Backwards-compatibility redirect → /api/storefront/products
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.clone()
    url.pathname = '/api/storefront/products'
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.json({ error: 'Redirect failed' }, { status: 500 })
  }
}
