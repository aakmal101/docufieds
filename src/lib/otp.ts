import { prisma } from './prisma'
import { generateOTP } from './utils'

export async function createOTP(phone?: string, email?: string) {
  if (!phone && !email) {
    throw new Error('Phone or email is required')
  }

  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Delete any existing OTPs for this phone/email
  await prisma.otp.deleteMany({
    where: {
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  })

  // Create new OTP
  const otp = await prisma.otp.create({
    data: {
      phone: phone || null,
      email: email || null,
      code,
      expiresAt,
    },
  })

  // In a real application, you would send the OTP via SMS/Email
  console.log(`OTP for ${phone || email}: ${code}`)

  return otp
}

export async function verifyOTP(identifier: string, code: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { email: identifier },
      ],
      code,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (!otp) {
    return false
  }

  // Mark OTP as used
  await prisma.otp.update({
    where: { id: otp.id },
    data: { isUsed: true },
  })

  return true
}

export async function sendOTP(phone?: string, email?: string) {
  try {
    const otp = await createOTP(phone, email)
    
    // In a real application, integrate with SMS/Email services
    if (phone) {
      // Send SMS via Twilio, AWS SNS, etc.
      console.log(`SMS sent to ${phone}: Your OTP is ${otp.code}`)
    }
    
    if (email) {
      // Send email via SendGrid, AWS SES, etc.
      console.log(`Email sent to ${email}: Your OTP is ${otp.code}`)
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 10 * 60, // 10 minutes in seconds
    }
  } catch (error) {
    console.error('Send OTP error:', error)
    return {
      success: false,
      message: 'Failed to send OTP',
    }
  }
}