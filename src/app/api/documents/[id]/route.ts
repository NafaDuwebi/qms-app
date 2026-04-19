import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      process: true,
      versions: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const existing = await prisma.document.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.version && body.version !== existing.version) {
    await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        version: existing.version,
        content: existing.content,
        changeNote: body.changeNote || 'Version updated',
      },
    })
  }

  const doc = await prisma.document.update({ where: { id: params.id }, data: body })

  await createAuditLog({
    action: 'DOCUMENT_UPDATED',
    entityType: 'DOCUMENT',
    entityId: doc.id,
    documentId: doc.id,
    userId: user.id,
    details: `Updated document: ${doc.title} to v${doc.version}`,
  })

  return NextResponse.json(doc)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await createAuditLog({
    action: 'DOCUMENT_DELETED',
    entityType: 'DOCUMENT',
    entityId: params.id,
    userId: user.id,
    details: `Deleted document: ${doc.title}`,
  })

  await prisma.document.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
