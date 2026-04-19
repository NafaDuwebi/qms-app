import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const workflows = await prisma.workflow.findMany({
    where: { ...(status && { status: status as any }) },
    include: {
      process: { select: { name: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(workflows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const body = await req.json()
  const workflow = await prisma.workflow.create({ data: body })

  await createAuditLog({
    action: 'WORKFLOW_CREATED',
    entityType: 'WORKFLOW',
    entityId: workflow.id,
    workflowId: workflow.id,
    userId: user.id,
    details: `Created workflow: ${workflow.title}`,
  })

  return NextResponse.json(workflow, { status: 201 })
}
