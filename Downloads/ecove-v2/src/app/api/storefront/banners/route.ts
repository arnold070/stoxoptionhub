import prisma from '@/lib/prisma'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    const now = new Date()
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ position: 'asc' }, { displayOrder: 'asc' }],
    })
    return ok(banners)
  } catch (err) { return handleError(err) }
}
