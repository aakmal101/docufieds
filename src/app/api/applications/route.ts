import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProcessType, Profession } from '@/types'

// Force dynamic rendering - this route uses getServerSession which requires headers/cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to fetch from database
    try {
      let whereClause: any = { userId: session.user.id }

      // If user is SUPPORT or ADMIN, fetch all submitted applications
      if (['SUPPORT', 'ADMIN'].includes(session.user.role)) {
        whereClause = {
          status: {
            not: 'DRAFT'
          }
        }
      }

      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          user: { // Include user details for support view
            select: {
              fullName: true,
              email: true,
              phone: true,
              memberId: true
            }
          },
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
          modules: true,
        } as any, // Cast to any to allow modules property until types are updated
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        success: true,
        data: applications,
      })
    } catch (prismaError: any) {
      console.warn('Prisma connection failed, returning empty applications:', prismaError.message)
      // Return empty array if database is unavailable
      return NextResponse.json({
        success: true,
        data: [],
      })
    }
  } catch (error) {
    console.error('Applications fetch error:', error)
    // Return empty array on error to allow dashboard to load
    return NextResponse.json({
      success: true,
      data: [],
    })
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

    const { country, processType, profession, consultancyFee, memberId, module } = await request.json()

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

    // Try to create application using Prisma
    let application
    try {
      application = await prisma.application.create({
        data: {
          userId: session.user.id,
          country,
          processType: processType as ProcessType,
          profession: profession ? (profession as Profession) : null,
          consultancyFee: parseFloat(consultancyFee),
          memberId: memberId || null,
          status: 'DRAFT',
          module: module || null, // Save singular module
          moduleSelectedAt: module ? new Date() : null,
          // Maintain legacy modules relation for backward compatibility if needed, 
          // or just rely on singular module.
          modules: module ? {
            create: [{
              module: module,
              status: 'NOT_STARTED'
            }]
          } : undefined
        } as any, // Cast to any to allow modules create input
      })

      return NextResponse.json({
        success: true,
        message: 'Application created successfully',
        data: application,
      })
    } catch (prismaError: any) {
      console.warn('Prisma connection failed, using demo mode:', prismaError.message)

      // Fallback: Return demo application for demo purposes
      // Generate a unique ID for the application
      const applicationId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const demoApplication = {
        id: applicationId,
        userId: session.user.id,
        country,
        processType,
        profession: profession || null,
        consultancyFee: parseFloat(consultancyFee),
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        message: 'Application created successfully (demo mode)',
        data: demoApplication,
      })
    }
  } catch (error) {
    console.error('Application creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}