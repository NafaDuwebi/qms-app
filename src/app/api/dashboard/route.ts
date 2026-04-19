import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalDocs,
    approvedDocs,
    draftDocs,
    reviewDocs,
    openWorkflows,
    inProgressWorkflows,
    closedWorkflows,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { status: 'APPROVED' } }),
    prisma.document.count({ where: { status: 'DRAFT' } }),
    prisma.document.count({ where: { status: 'REVIEW' } }),
    prisma.workflow.count({ where: { status: 'OPEN' } }),
    prisma.workflow.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.workflow.count({ where: { status: 'CLOSED' } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({
    documents: { total: totalDocs, approved: approvedDocs, draft: draftDocs, review: reviewDocs },
    workflows: { open: openWorkflows, inProgress: inProgressWorkflows, closed: closedWorkflows },
    recentActivity: recentAuditLogs,
  })
}
