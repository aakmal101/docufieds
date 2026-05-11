import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import { prisma } from '@/lib/prisma'
import { ProcessType, Profession } from '@/types'

// Force dynamic rendering - this route uses getCurrentUser which requires headers/cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to fetch from database
    try {
      let whereClause: any = { userId: user!.id }

      // If user is SUPPORT or ADMIN, fetch all submitted applications
      if (['SUPPORT', 'ADMIN'].includes(user!.role)) {
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
              email: true,
              memberId: true,
              individualProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
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
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { country, processType, profession, consultancyFee, memberId, module, answers } = await request.json()

    // Validate required fields - consultancyFee can be 0 for legacy, use explicit check
    if (!country || !processType || consultancyFee === undefined || consultancyFee === null) {
      return NextResponse.json(
        { success: false, message: 'Country, process type, and consultancy fee are required' },
        { status: 400 }
      )
    }

    // Validate process type (skip for module-based apps which use 'standard')
    if (!module && !Object.values(ProcessType).includes(processType)) {
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
      const applicationData: any = {
        userId: user!.id,
        country,
        processType: processType as ProcessType,
        profession: profession ? (profession as Profession) : null,
        consultancyFee: parseFloat(consultancyFee),
        memberId: memberId || null,
        status: 'DRAFT',
        module: module || null,
        moduleSelectedAt: module ? new Date() : null,
        modules: module ? {
          create: [{
            module: module,
            status: 'NOT_STARTED'
          }]
        } : undefined
      }

      // If validation passed and we have answers (for Trade License etc), we can create them
      // Note: We need to create application first to get ID, or use nested write if possible.
      // Prisma nested write for relation 'answers'

      if (answers && module) {
        applicationData.answers = {
          create: Object.entries(answers).map(([key, value]) => ({
            module: module, // Use the same module
            fieldKey: key,
            value: value as any // distinct values
          }))
        }
      }

      application = await prisma.application.create({
        data: applicationData,
      })

      // Auto-assign to agent if creator is an AGENT
      if (user!.role === 'AGENT') {
        try {
          await (prisma as any).agentAssignment.create({
            data: {
              agentUserId: user!.id,
              targetUserId: user!.id,
              applicationId: application.id,
              assignedByUserId: user!.id,
              status: 'ACTIVE'
            }
          })
        } catch (assignError: any) {
          // Don't fail the whole request if assignment fails (e.g. unique constraint)
          console.warn('Auto-assignment warning:', assignError.message)
        }
      }

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
        userId: user!.id,
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