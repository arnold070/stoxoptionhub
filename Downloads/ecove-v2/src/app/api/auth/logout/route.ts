import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const res = NextResponse.json({ success: true, data: { message: 'Logged out.' } })
    res.cookies.set('ecove_token', '', { maxAge: 0, path: '/', httpOnly: true })
    return res
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
