import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentMethod } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { applicationId, amount, method } = await request.json()

    if (!applicationId || !amount || !method) {
      return NextResponse.json(
        { success: false, message: 'Application ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    // Verify application belongs to user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        applicationId,
        status: 'PAID',
      },
    })

    if (existingPayment) {
      return NextResponse.json(
        { success: false, message: 'Payment already completed for this application' },
        { status: 400 }
      )
    }

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        applicationId,
        userId: session.user.id,
        amount: parseFloat(amount),
        status: 'PENDING',
        method: method as PaymentMethod,
        transactionId,
      },
    })

    // Handle different payment methods
    let paymentUrl = null
    let responseData: any = {
      success: true,
      message: 'Payment created successfully',
      data: payment,
      paymentId: payment.id,
    }

    switch (method) {
      case PaymentMethod.ONLINE:
        // In a real application, integrate with payment gateway
        paymentUrl = `https://payment-gateway.com/pay?amount=${amount}&transaction_id=${transactionId}`
        responseData.paymentUrl = paymentUrl
        break

      case PaymentMethod.MFS:
        // For MFS, we would integrate with bKash/Rocket/Nagad APIs
        responseData.mfsInstructions = {
          number: '017XXXXXXXX',
          amount: amount,
          reference: transactionId,
        }
        break

      case PaymentMethod.CASH:
        // For cash payments, just provide payment ID
        responseData.cashInstructions = {
          paymentId: payment.id,
          amount: amount,
          officeAddress: '123 Business District, Dhaka 1000, Bangladesh',
        }
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid payment method' },
          { status: 400 }
        )
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Payment Created',
        message: `Payment of $${amount} has been created for your application. Please complete the payment to proceed.`,
        type: 'payment_created',
      },
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}














