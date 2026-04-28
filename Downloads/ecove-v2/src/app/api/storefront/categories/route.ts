import prisma from '@/lib/prisma'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where:   { isActive: true, parentId: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          where:   { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select:  { id: true, name: true, slug: true, imageUrl: true },
        },
        _count: { select: { products: { where: { status: 'approved', isActive: true } } } },
      },
    })
    return ok(categories)
  } catch (err) { return handleError(err) }
}
