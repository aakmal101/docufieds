import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLegal } from '@/lib/auth/admin-guard'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await requireLegal()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { fileName, fileUrl, fileType, fileSize, documentType } = await req.json()

        if (![fileName, fileUrl, documentType].every(Boolean)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // We need to fetch the app to get the correct userID if we want strict FK correctness?
        const app = await prisma.application.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 })

        const finalDoc = await prisma.document.create({
            data: {
                applicationId: params.id,
                userId: app.userId, // Link to Applicant so they can see/download it
                fileName,
                fileUrl,
                fileType,
                fileSize,
                documentType,
                status: 'APPROVED',
                isRequired: false
            }
        })

        return NextResponse.json(finalDoc)

    } catch (error) {
        console.error('[API] Legal Doc Upload Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
