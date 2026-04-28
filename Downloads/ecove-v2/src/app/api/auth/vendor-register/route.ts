import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, apiError, handleError } from '@/lib/api'
import { sendVerifyEmail, sendVendorApplicationReceived } from '@/lib/email'
import { generateToken, uniqueSlug } from '@/lib/utils'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  // Account
  firstName:    z.string().min(2).max(50),
  lastName:     z.string().min(2).max(50),
  email:        z.string().email(),
  password:     z.string().min(8).max(100),
  phone:        z.string().min(7).max(20),
  // Business
  businessName: z.string().min(2).max(120),
  description:  z.string().min(50).max(1000),
  category:     z.string().optional(),
  city:         z.string().min(2).max(100),
  state:        z.string().min(2).max(100),
  address:      z.string().min(5).max(255),
  whatsapp:     z.string().optional(),
  // Bank
  bankName:          z.string().min(2).max(100),
  bankAccountNumber: z.string().min(10).max(10),
  bankAccountName:   z.string().min(2).max(100),
  // Documents (Cloudinary URLs uploaded separately)
  idDocumentUrl:    z.string().url().optional(),
  cacDocumentUrl:   z.string().url().optional(),
  addressProofUrl:  z.string().url().optional(),
  // Terms
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms.' }) }),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!await rateLimit(`vendor-apply:${ip}`, 3, 60 * 60 * 1000)) {
      return apiError('Too many applications from this IP. Try again later.', 429)
    }

    const body = schema.parse(await req.json())

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } })
    if (existingUser) return apiError('An account with this email already exists.', 409)

    const passwordHash  = await bcrypt.hash(body.password, 12)
    const verifyToken   = generateToken()
    const verifyExpiry  = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const slug          = await uniqueSlug(body.businessName, 'vendor')

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName:         body.firstName,
          lastName:          body.lastName,
          email:             body.email,
          phone:             body.phone,
          passwordHash,
          role:              'customer', // upgraded to 'vendor' on approval
          emailVerifyToken:  verifyToken,
          emailVerifyExpiry: verifyExpiry,
        },
      })

      const vendor = await tx.vendor.create({
        data: {
          userId:            user.id,
          businessName:      body.businessName,
          slug,
          description:       body.description,
          phone:             body.phone,
          whatsapp:          body.whatsapp,
          city:              body.city,
          state:             body.state,
          address:           body.address,
          bankName:          body.bankName,
          bankAccountNumber: body.bankAccountNumber,
          bankAccountName:   body.bankAccountName,
          idDocumentUrl:     body.idDocumentUrl,
          cacDocumentUrl:    body.cacDocumentUrl,
          addressProofUrl:   body.addressProofUrl,
          status:            'pending',
        },
      })

      return { user, vendor }
    })

    await sendVerifyEmail(result.user.email, result.user.firstName, verifyToken).catch(() => {})

    // Email applicant confirming receipt of application
    await sendVendorApplicationReceived(result.user.email, body.businessName).catch(() => {})

    return ok({
      message: 'Application submitted! Please verify your email. Our team will review your application within 24-48 hours.',
      vendorId: result.vendor.id,
    }, 201)
  } catch (err) { return handleError(err) }
}
