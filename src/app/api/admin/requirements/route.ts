
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPPORT')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country')
    const processType = searchParams.get('processType')
    const module = searchParams.get('module')

    const where: any = {}
    if (country) where.country = country
    if (processType) where.processType = processType

    // Module filter logic:
    // If 'module' is provided, we fetch requirements for that module AND global (null) ones?
    // Or just exact match? Admin UI might want exact match for editing.
    // Let's implement exact match for Admin Table, and the "Computed" logic will be in the user-facing API.
    if (module === 'null') {
        where.module = null
    } else if (module) {
        where.module = module
    }

    try {
        const requirements = await prisma.documentRequirement.findMany({
            where,
            orderBy: [
                { country: 'asc' },
                { processType: 'asc' },
                { module: 'asc' } // nulls first usually
            ]
        })
        return NextResponse.json({ success: true, data: requirements })
    } catch (error) {
        console.error('Error fetching requirements:', error)
        return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { country, processType, documentType, isRequired, description, module } = body

        const requirement = await prisma.documentRequirement.create({
            data: {
                country,
                processType,
                documentType,
                isRequired,
                description,
                module: module || null // Handle empty string as null
            }
        })

        return NextResponse.json({ success: true, data: requirement })
    } catch (error) {
        console.error('Error creating requirement:', error)
        return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, ...data } = body

        // Ensure module is handled correctly
        if (data.module === '') data.module = null

        const requirement = await prisma.documentRequirement.update({
            where: { id },
            data
        })

        return NextResponse.json({ success: true, data: requirement })
    } catch (error) {
        console.error('Error updating requirement:', error)
        return NextResponse.json({ error: 'Failed to update requirement' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    try {
        await prisma.documentRequirement.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting requirement:', error)
        return NextResponse.json({ error: 'Failed to delete requirement' }, { status: 500 })
    }
}
