import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/services/auth-service'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
        payments: true,
        documentRequests: {
          orderBy: { requestedAt: 'desc' }
        },
        statusUpdates: {
          orderBy: { createdAt: 'desc' },
          include: { member: { include: { individualProfile: true } } }
        },
        modules: true
      } as any // Cast to any to allow modules property
    })

    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (application.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(application)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
