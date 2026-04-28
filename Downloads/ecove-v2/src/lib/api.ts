import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError } from './auth'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  })
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  )
}

export function handleError(err: unknown) {
  console.error('[API Error]', err)

  if (err instanceof AuthError) {
    return apiError(err.message, err.status)
  }
  if (err instanceof ZodError) {
    return apiError('Validation failed', 422, err.flatten().fieldErrors)
  }
  if (err instanceof Error) {
    return apiError(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      500
    )
  }
  return apiError('Internal server error', 500)
}

export function getPagination(searchParams: URLSearchParams) {
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip  = (page - 1) * limit
  return { page, limit, skip }
}
