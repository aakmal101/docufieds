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

        // Create the document linked to the application
        // We'll use a specific status or just rely on 'documentType'
        const doc = await prisma.document.create({
            data: {
                applicationId: params.id,
                userId: session.user.id, // Linked to legal user who uploaded? Or Application User?
                // Linked to application user usually, but maybe we need to track uploader.
                // Schema has 'userId'. This usually links to the Application Owner (applicant).
                // If we link it to the Legal User, it might break relation or permission logic if filtered by userId.
                // Safest to link to Application's User, and rely on metadata/logs to know Legal uploaded it.
                // Let's fetch app to get userId.
                fileName,
                fileUrl,
                fileType,
                fileSize,
                documentType, // e.g., 'LEGAL_OUTPUT_AFFIDAVIT'
                status: 'APPROVED', // Auto-approved since legal uploaded it
                is_required: false
            }
        })

        // We need to fetch the app to get the correct userID if we want strict FK correctness?
        // Wait, schema says: `user User @relation(...)`. 
        // If I put `session.user.id` (Legal Admin), they might not have a `User` record if they are purely Admin defined elsewhere?
        // Actually `requireLegal` returns a session from `getServerSession(authOptions)`.
        // Users are in `users` table. Both Admins and Applicants are Users.
        // BUT, `Document` model says `user User ...`.
        // If I assign `userId` to the Legal Admin, then `application.documents` might not show it if filtered by `application.userId`?
        // No, `application.documents` is a relation on `applicationId`.
        // So `userId` on Document is strictly "Who owns this document" or "Who is it for"?
        // Usually "Who uploaded it" or "Who it belongs to".
        // Let's look at schema: `application Application @relation...` separate from `user User @relation`.
        // If I set `userId` to the Applicant's ID, it appears in their portal? YES. We WANT that.
        // We want the user to download it.
        // So we must fetch the Application first to get the Applicant's ID.

        // Let's fix this logic:
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
                uploadedAt: new Date()
            }
        })

        return NextResponse.json(finalDoc)

    } catch (error) {
        console.error('[API] Legal Doc Upload Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
