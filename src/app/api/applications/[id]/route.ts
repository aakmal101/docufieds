import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
        payments: true,
        documentRequests: {
          orderBy: { requestedAt: 'desc' }
        },
        // We don't include all messages here as MessageThread fetches them separately
      }
    })

    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (application.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(application)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
