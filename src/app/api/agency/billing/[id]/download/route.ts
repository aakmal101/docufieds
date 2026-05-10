import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/services/auth-service'
import prisma from '@/lib/prisma'
// import { generateInvoicePDF } from '@/lib/utils/invoice-generator' // implement this later

export const dynamic = 'force-dynamic'

// GET /api/agency/billing/[id]/download
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getCurrentUser()

        if (!user?.id || user.role !== 'AGENCY') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get payment with user details
        const payment = await prisma.payment.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        email: true,
                        agencyProfile: { select: { businessName: true } },
                    },
                },
                application: {
                    select: {
                        country: true,
                        processType: true,
                    },
                },
            },
        })

        if (!payment || payment.userId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Payment not found' },
                { status: 404 }
            )
        }

        // Placeholder for PDF generation until utils are implemented
        // const pdfBuffer = await generateInvoicePDF(payment)

        return NextResponse.json({
            success: false,
            error: "PDF generation not implemented yet"
        }, { status: 501 })
        /*
            return new NextResponse(pdfBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${payment.invoiceNumber || 'draft'}.pdf"`,
              },
            })
        */
    } catch (error) {
        console.error('Error downloading invoice:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to download invoice' },
            { status: 500 }
        )
    }
}
