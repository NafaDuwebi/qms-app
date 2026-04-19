import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      process: true,
      assignedTo: { select: { name: true, email: true } },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(workflow)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const body = await req.json()
  const workflow = await prisma.workflow.update({ where: { id: params.id }, data: body })

  await createAuditLog({
    action: 'WORKFLOW_UPDATED',
    entityType: 'WORKFLOW',
    entityId: workflow.id,
    workflowId: workflow.id,
    userId: user.id,
    details: `Updated workflow: ${workflow.title} — status: ${workflow.status}`,
  })

  return NextResponse.json(workflow)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await createAuditLog({
    action: 'WORKFLOW_DELETED',
    entityType: 'WORKFLOW',
    entityId: params.id,
    userId: user.id,
    details: `Deleted workflow ${params.id}`,
  })

  await prisma.workflow.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
