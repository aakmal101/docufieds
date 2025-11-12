import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProcessType, Profession } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: {
        documents: {
          select: {
            id: true,
            fileName: true,
            documentType: true,
            uploadedAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            paidAt: true,
          },
        },
        statusUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: applications,
    })
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { country, processType, profession, consultancyFee } = await request.json()

    // Validate required fields
    if (!country || !processType || !consultancyFee) {
      return NextResponse.json(
        { success: false, message: 'Country, process type, and consultancy fee are required' },
        { status: 400 }
      )
    }

    // Validate process type
    if (!Object.values(ProcessType).includes(processType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid process type' },
        { status: 400 }
      )
    }

    // Validate profession if provided
    if (profession && !Object.values(Profession).includes(profession)) {
      return NextResponse.json(
        { success: false, message: 'Invalid profession' },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        country,
        processType: processType as ProcessType,
        profession: profession ? (profession as Profession) : null,
        consultancyFee: parseFloat(consultancyFee),
        status: 'DRAFT',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Application created successfully',
      data: application,
    })
  } catch (error) {
    console.error('Application creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}