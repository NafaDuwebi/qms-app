import { PrismaClient, Category, DocType, DocStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@plprojects.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@plprojects.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const deliverProcesses = [
    { name: 'Understand markets and customers', description: 'Market research and customer analysis' },
    { name: 'Plan business', description: 'Strategic business planning' },
    { name: 'Develop and maintain products and services', description: 'Product/service development' },
    { name: 'Market', description: 'Marketing services' },
    { name: 'Sell', description: 'Sales operations' },
    { name: 'Design', description: 'Design and specification' },
    { name: 'Deliver', description: 'Delivery operations' },
  ]

  const supportProcesses = [
    { name: 'Manage finances', description: 'Financial management and accounting' },
    { name: 'Manage legal requirements', description: 'Legal compliance' },
    { name: 'Manage accreditations', description: 'Achieve and maintain accreditations, operate QMS' },
    { name: 'Control external products and services', description: 'Procurement and supplier management' },
    { name: 'Manage resources', description: 'Recruit, develop, and manage people and infrastructure' },
    { name: 'Evaluate performance and manage improvement', description: 'Business performance, audits, improvement' },
  ]

  for (const p of deliverProcesses) {
    await prisma.process.upsert({
      where: { id: p.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: p.name.toLowerCase().replace(/\s+/g, '-'),
        name: p.name,
        description: p.description,
        category: Category.DELIVER_BUSINESS,
      },
    })
  }

  for (const p of supportProcesses) {
    await prisma.process.upsert({
      where: { id: p.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: p.name.toLowerCase().replace(/\s+/g, '-'),
        name: p.name,
        description: p.description,
        category: Category.SUPPORT_BUSINESS,
      },
    })
  }

  const sampleDocs = [
    { title: 'QMS Manual', docNumber: 'QMS-001', type: DocType.POLICY, status: DocStatus.APPROVED, version: '2.1' },
    { title: 'Customer Enquiry Process', docNumber: 'PRO-001', type: DocType.PROCEDURE, status: DocStatus.APPROVED, version: '1.3' },
    { title: 'Training Course Design Procedure', docNumber: 'PRO-002', type: DocType.PROCEDURE, status: DocStatus.APPROVED, version: '1.0' },
    { title: 'Internal Audit Procedure', docNumber: 'PRO-003', type: DocType.PROCEDURE, status: DocStatus.REVIEW, version: '1.1' },
    { title: 'Supplier Assessment Form', docNumber: 'FORM-001', type: DocType.FORM, status: DocStatus.APPROVED, version: '1.0' },
    { title: 'Customer Feedback Record', docNumber: 'REC-001', type: DocType.RECORD, status: DocStatus.APPROVED, version: '1.0' },
  ]

  for (const doc of sampleDocs) {
    await prisma.document.upsert({
      where: { docNumber: doc.docNumber },
      update: {},
      create: {
        ...doc,
        description: `${doc.title} - PL Projects QMS`,
        createdById: admin.id,
      },
    })
  }

  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZED',
      entityType: 'USER',
      details: 'QMS system initialized with seed data',
      userId: admin.id,
    },
  })

  console.log('Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
