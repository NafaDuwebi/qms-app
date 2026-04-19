import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const processId = searchParams.get('processId')

  const docs = await prisma.document.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
      ...(processId && { processId }),
    },
    include: { createdBy: { select: { name: true } }, process: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const doc = await prisma.document.create({
    data: { ...body, createdById: user.id, version: '1.0' },
  })

  await createAuditLog({
    action: 'DOCUMENT_CREATED',
    entityType: 'DOCUMENT',
    entityId: doc.id,
    documentId: doc.id,
    userId: user.id,
    details: `Created document: ${doc.title} (${doc.docNumber})`,
  })

  return NextResponse.json(doc, { status: 201 })
}
