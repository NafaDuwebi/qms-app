import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { content } = await req.json()
  const comment = await prisma.workflowComment.create({
    data: { workflowId: params.id, userId: user.id, content },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
