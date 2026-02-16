
import { PrismaClient, ModuleType } from '@prisma/client'

const prisma = new PrismaClient()

async function getRequirementsForApp(app: any) {
    const appModule = app.module

    // Exact logic from route.ts, but specifying the seed data country/process
    const requirements = await prisma.documentRequirement.findMany({
        where: {
            country: 'default',
            processType: 'standard',
            OR: [
                { profession: null },
                { profession: app.profession || null },
            ],
            AND: [
                {
                    OR: [
                        { module: null },
                        { module: appModule || undefined }
                    ]
                }
            ]
        },
        orderBy: {
            isRequired: 'desc',
        }
    })
    return requirements
}

async function main() {
    console.log('--- Verifying Scenarios ---')

    // Scenario 1: Business Application
    console.log('\n1. Scenario: Business Application')
    const businessApp = {
        country: 'default',
        processType: 'standard',
        module: ModuleType.BUSINESS,
        profession: 'BUSINESS_OWNER'
    }
    const businessReqs = await getRequirementsForApp(businessApp)
    console.log(`   Found ${businessReqs.length} requirements.`)
    const businessTypes = businessReqs.map(r => r.documentType)
    console.log('   Docs:', businessTypes)

    // Business should have INVITATION_LETTER (Business) and PASSPORT_BIO_PAGE (Global)
    // Should NOT have BANK_STATEMENT_6M (Personal)
    const hasBusinessDoc = businessTypes.includes('INVITATION_LETTER')
    const hasGlobalDoc = businessTypes.includes('PASSPORT_BIO_PAGE')
    const hasPersonalDoc = businessTypes.includes('BANK_STATEMENT_6M')

    if (hasBusinessDoc && hasGlobalDoc && !hasPersonalDoc) {
        console.log('   ✅ PASS: Contains Business and Global, excludes Personal.')
    } else {
        console.error('   ❌ FAIL: Incorrect mix.', { hasBusinessDoc, hasGlobalDoc, hasPersonalDoc })
    }

    // Scenario 2: Legacy Application (Module = null)
    console.log('\n2. Scenario: Legacy Application (Module=NULL)')
    const legacyApp = {
        country: 'default',
        processType: 'standard',
        module: null,
        profession: 'JOB_HOLDER'
    }
    const legacyReqs = await getRequirementsForApp(legacyApp)
    console.log(`   Found ${legacyReqs.length} requirements.`)
    const legacyTypes = legacyReqs.map(r => r.documentType)
    console.log('   Docs:', legacyTypes)

    // Legacy should have Global items but NO module specific items
    const legacyHasGlobal = legacyTypes.includes('PASSPORT_BIO_PAGE')
    const legacyHasBusiness = legacyTypes.includes('INVITATION_LETTER')
    const legacyHasPersonal = legacyTypes.includes('BANK_STATEMENT_6M')

    if (legacyHasGlobal && !legacyHasBusiness && !legacyHasPersonal) {
        console.log('   ✅ PASS: Contains Global only, excludes Module specific.')
    } else {
        console.error('   ❌ FAIL: Incorrect mix.', { legacyHasGlobal, legacyHasBusiness, legacyHasPersonal })
    }

    // Scenario 3: Personal Application
    console.log('\n3. Scenario: Personal Application')
    const personalApp = {
        country: 'default',
        processType: 'standard',
        module: ModuleType.PERSONAL,
        profession: 'JOB_HOLDER'
    }
    const personalReqs = await getRequirementsForApp(personalApp)
    console.log(`   Found ${personalReqs.length} requirements.`)
    const personalTypes = personalReqs.map(r => r.documentType)
    console.log('   Docs:', personalTypes)

    if (personalTypes.includes('BANK_STATEMENT_6M') && personalTypes.includes('PASSPORT_BIO_PAGE') && !personalTypes.includes('INVITATION_LETTER')) {
        console.log('   ✅ PASS: Contains Personal and Global, excludes Business.')
    } else {
        console.error('   ❌ FAIL: Missing requirement or wrong mix.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
