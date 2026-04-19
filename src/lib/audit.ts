import { prisma } from './prisma'
import { EntityType } from '@prisma/client'

export async function createAuditLog({
  action,
  entityType,
  entityId,
  details,
  userId,
  documentId,
  workflowId,
}: {
  action: string
  entityType: EntityType
  entityId?: string
  details?: string
  userId?: string
  documentId?: string
  workflowId?: string
}) {
  return prisma.auditLog.create({
    data: { action, entityType, entityId, details, userId, documentId, workflowId },
  })
}
