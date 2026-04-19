import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { ...(entityType && { entityType: entityType as any }) },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where: { ...(entityType && { entityType: entityType as any }) } }),
  ])

  return NextResponse.json({ logs, total, pages: Math.ceil(total / limit) })
}
