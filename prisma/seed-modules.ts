import { PrismaClient, ModuleType } from '@prisma/client'

const prisma = new PrismaClient()

// Standardized Document Types
const DOC_TYPES = {
    // Global
    PASSPORT_BIO_PAGE: 'PASSPORT_BIO_PAGE',
    VISA_PHOTO: 'VISA_PHOTO',
    NATIONAL_ID: 'NATIONAL_ID',
    PROOF_OF_ADDRESS: 'PROOF_OF_ADDRESS',

    // Personal
    BANK_STATEMENT_6M: 'BANK_STATEMENT_6M',
    EMPLOYMENT_LETTER: 'EMPLOYMENT_LETTER',
    STUDENT_LETTER: 'STUDENT_LETTER',
    TRAVEL_ITINERARY: 'TRAVEL_ITINERARY',
    ACCOMMODATION_PROOF: 'ACCOMMODATION_PROOF',
    TRAVEL_INSURANCE: 'TRAVEL_INSURANCE',

    // Education
    ACCEPTANCE_LETTER: 'ACCEPTANCE_LETTER',
    TUITION_PAYMENT_PROOF: 'TUITION_PAYMENT_PROOF',
    ACADEMIC_TRANSCRIPTS: 'ACADEMIC_TRANSCRIPTS',
    DEGREE_CERTIFICATES: 'DEGREE_CERTIFICATES',
    LANGUAGE_TEST_RESULT: 'LANGUAGE_TEST_RESULT',
    SPONSOR_LETTER: 'SPONSOR_LETTER',
    FINANCIAL_SUPPORT_PROOF: 'FINANCIAL_SUPPORT_PROOF',

    // Business
    INVITATION_LETTER: 'INVITATION_LETTER',
    COMPANY_REGISTRATION_CERT: 'COMPANY_REGISTRATION_CERT',
    BUSINESS_BANK_STATEMENT: 'BUSINESS_BANK_STATEMENT',
    EMPLOYER_CONFIRMATION_LETTER: 'EMPLOYER_CONFIRMATION_LETTER',
    MEETING_AGENDA: 'MEETING_AGENDA',
    PREVIOUS_BUSINESS_VISAS: 'PREVIOUS_BUSINESS_VISAS',

    // Health
    MEDICAL_REFERRAL_LETTER: 'MEDICAL_REFERRAL_LETTER',
    HOSPITAL_APPOINTMENT_CONFIRMATION: 'HOSPITAL_APPOINTMENT_CONFIRMATION',
    MEDICAL_REPORT_SUMMARY: 'MEDICAL_REPORT_SUMMARY',
    TREATMENT_PAYMENT_PROOF: 'TREATMENT_PAYMENT_PROOF',
    MEDICAL_INSURANCE: 'MEDICAL_INSURANCE',

    // Travel
    FLIGHT_RESERVATION: 'FLIGHT_RESERVATION',
    HOTEL_BOOKING: 'HOTEL_BOOKING',
    TRAVEL_PLAN: 'TRAVEL_PLAN',
    GROUP_TRAVEL_LIST: 'GROUP_TRAVEL_LIST'
}

const REQUIREMENTS = [
    // Global (Module = NULL)
    { type: DOC_TYPES.PASSPORT_BIO_PAGE, module: null, required: true, desc: 'Passport Bio Page' },
    { type: DOC_TYPES.VISA_PHOTO, module: null, required: true, desc: 'Visa Photo (White Background)' },

    // Personal
    { type: DOC_TYPES.BANK_STATEMENT_6M, module: ModuleType.PERSONAL, required: true, desc: 'Personal Bank Statement (6 Months)' },
    { type: DOC_TYPES.EMPLOYMENT_LETTER, module: ModuleType.PERSONAL, required: true, desc: 'Letter from Employer / NOC' },
    { type: DOC_TYPES.TRAVEL_ITINERARY, module: ModuleType.PERSONAL, required: true, desc: 'Planned Travel Itinerary' },
    { type: DOC_TYPES.ACCOMMODATION_PROOF, module: ModuleType.PERSONAL, required: true, desc: 'Hotel Booking or Invitation' },
    { type: DOC_TYPES.TRAVEL_INSURANCE, module: ModuleType.PERSONAL, required: true, desc: 'Travel Insurance Policy' },

    // Education
    { type: DOC_TYPES.ACCEPTANCE_LETTER, module: ModuleType.EDUCATION, required: true, desc: 'University Acceptance Letter' },
    { type: DOC_TYPES.ACADEMIC_TRANSCRIPTS, module: ModuleType.EDUCATION, required: true, desc: 'All Academic Transcripts' },
    { type: DOC_TYPES.DEGREE_CERTIFICATES, module: ModuleType.EDUCATION, required: true, desc: 'Degree Certificates' },
    { type: DOC_TYPES.LANGUAGE_TEST_RESULT, module: ModuleType.EDUCATION, required: true, desc: 'IELTS / TOEFL Result' },
    { type: DOC_TYPES.FINANCIAL_SUPPORT_PROOF, module: ModuleType.EDUCATION, required: true, desc: 'Proof of Funds / Sponsorship' },

    // Business
    { type: DOC_TYPES.INVITATION_LETTER, module: ModuleType.BUSINESS, required: true, desc: 'Business Invitation Letter' },
    { type: DOC_TYPES.COMPANY_REGISTRATION_CERT, module: ModuleType.BUSINESS, required: true, desc: 'Company Trade License / Registration' },
    { type: DOC_TYPES.EMPLOYER_CONFIRMATION_LETTER, module: ModuleType.BUSINESS, required: true, desc: 'Letter from Sending Company' },
    { type: DOC_TYPES.BUSINESS_BANK_STATEMENT, module: ModuleType.BUSINESS, required: true, desc: 'Company Bank Statement' },

    // Health
    { type: DOC_TYPES.MEDICAL_REFERRAL_LETTER, module: ModuleType.HEALTH, required: true, desc: 'Referral from Local Doctor' },
    { type: DOC_TYPES.HOSPITAL_APPOINTMENT_CONFIRMATION, module: ModuleType.HEALTH, required: true, desc: 'Appointment Letter from Hospital' },
    { type: DOC_TYPES.MEDICAL_REPORT_SUMMARY, module: ModuleType.HEALTH, required: true, desc: 'Recent Medical Reports' },
    { type: DOC_TYPES.TREATMENT_PAYMENT_PROOF, module: ModuleType.HEALTH, required: true, desc: 'Proof of Advance Payment (if any)' },

    // Travel/Group
    { type: DOC_TYPES.FLIGHT_RESERVATION, module: ModuleType.TRAVEL, required: true, desc: 'Flight Reservation' },
    { type: DOC_TYPES.HOTEL_BOOKING, module: ModuleType.TRAVEL, required: true, desc: 'Hotel Booking' },
    { type: DOC_TYPES.TRAVEL_PLAN, module: ModuleType.TRAVEL, required: true, desc: 'Tour Plan' },
    { type: DOC_TYPES.TRAVEL_INSURANCE, module: ModuleType.TRAVEL, required: true, desc: 'Group Travel Insurance' },
]

async function main() {
    console.log('Seeding Module-Based Requirements...')

    // Clean up existing defaults to avoid duplicates if re-seeding logic changes
    // But for now, we UPSERT based on unique country+type+module combo?
    // Schema doesn't enforce uniqueness on that tuple typically, but we can query first.

    // Since we don't have a unique constraint on (country, documentType, module) in schema, 
    // we will simplisticly delete "default" placeholders for these modules if they exist, or just create.
    // Actually, safe way: Delete all requirement entries where country='default' (or distinct marker) and matching these modules?
    // User instruction: Seed baseline requirements.

    const PLACEHOLDER_COUNTRY = 'default'
    const DEFAULT_PROCESS_TYPE = 'standard'

    for (const req of REQUIREMENTS) {
        // Check if exists
        const existing = await prisma.documentRequirement.findFirst({
            where: {
                country: PLACEHOLDER_COUNTRY,
                documentType: req.type,
                module: req.module
            }
        })

        if (!existing) {
            await prisma.documentRequirement.create({
                data: {
                    country: PLACEHOLDER_COUNTRY,
                    processType: DEFAULT_PROCESS_TYPE,
                    documentType: req.type,
                    isRequired: req.required,
                    description: req.desc,
                    module: req.module
                }
            })
            console.log(`Created: [${req.module || 'GLOBAL'}] ${req.type}`)
        } else {
            console.log(`Skipped (Exists): [${req.module || 'GLOBAL'}] ${req.type}`)
        }
    }

    console.log('Seeding Complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
