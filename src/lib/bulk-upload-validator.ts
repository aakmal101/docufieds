import { z } from 'zod';
import { BulkUploadRow, BulkUploadValidationError } from '@/types/bulk-upload';

const VALID_VISA_CATEGORIES = ['TOURIST', 'STUDENT', 'BUSINESS', 'CONFERENCE', 'MEDICAL', 'SPORTS', 'VISIT'];
const VALID_PROFESSIONS = ['BUSINESS_OWNER', 'JOB_HOLDER', 'STUDENT', 'HOMEMAKER', 'RETIRED'];
const VALID_GENDERS = ['M', 'F', 'MALE', 'FEMALE', 'OTHER'];
const VALID_MARITAL_STATUS = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];

// Zod schema for row validation
const bulkUploadRowSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

    destination_country: z.string().min(2, 'Country is required'),
    visa_category: z.enum(VALID_VISA_CATEGORIES as [string, ...string[]], {
        errorMap: () => ({ message: `Must be one of: ${VALID_VISA_CATEGORIES.join(', ')}` })
    }),
    profession: z.enum([...VALID_PROFESSIONS, ''] as [string, ...string[]]).optional(),

    place_of_birth: z.string().optional(),
    nationality: z.string().optional(),
    passport_number: z.string().optional(),
    passport_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().or(z.literal('')),
    gender: z.string().optional(),
    marital_status: z.string().optional(),
    address: z.string().optional(),

    // Document references
    passport: z.string().optional(),
    national_id: z.string().optional(),
    birth_certificate: z.string().optional(),
    employment_letter: z.string().optional(),
    travel_insurance: z.string().optional(),
    educational_proof: z.string().optional(),
    accommodation_proof: z.string().optional(),
    bank_statement: z.string().optional(),
    invitation_letter: z.string().optional(),
    previous_visa: z.string().optional(),
    marriage_certificate: z.string().optional(),
    sponsor_letter: z.string().optional(),

    special_instructions: z.string().optional(),
});

export function validateBulkUploadRow(
    row: any,
    rowNumber: number,
    availableCountries: string[]
): { valid: boolean; errors: BulkUploadValidationError[]; warnings: BulkUploadValidationError[]; data?: BulkUploadRow } {
    const errors: BulkUploadValidationError[] = [];
    const warnings: BulkUploadValidationError[] = [];

    // Clean and normalize row data
    const cleanedRow = Object.keys(row).reduce((acc, key) => {
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        const value = row[key];
        acc[cleanKey] = typeof value === 'string' ? value.trim() : value;
        return acc;
    }, {} as any);

    // Validate with Zod
    const result = bulkUploadRowSchema.safeParse(cleanedRow);

    if (!result.success) {
        result.error.errors.forEach(err => {
            errors.push({
                row: rowNumber,
                field: err.path.join('.'),
                value: cleanedRow[err.path[0]],
                message: err.message,
                severity: 'error'
            });
        });
    }

    // Custom validations
    const data = result.success ? result.data : cleanedRow;

    // Check if either email or phone is provided
    if (!data.email && !data.phone) {
        errors.push({
            row: rowNumber,
            field: 'email/phone',
            value: null,
            message: 'Either email or phone must be provided',
            severity: 'error'
        });
    }

    // Validate destination country
    if (data.destination_country) {
        const normalizedCountry = data.destination_country.toUpperCase();
        const countryExists = availableCountries.some(c =>
            c.toUpperCase() === normalizedCountry ||
            c.toUpperCase().includes(normalizedCountry)
        );

        if (!countryExists) {
            errors.push({
                row: rowNumber,
                field: 'destination_country',
                value: data.destination_country,
                message: `Country "${data.destination_country}" not found in system`,
                severity: 'error'
            });
        }
    }

    // Validate date of birth (must be in past and person must be at least 1 year old)
    if (data.date_of_birth) {
        const dob = new Date(data.date_of_birth);
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

        if (dob > oneYearAgo) {
            errors.push({
                row: rowNumber,
                field: 'date_of_birth',
                value: data.date_of_birth,
                message: 'Person must be at least 1 year old',
                severity: 'error'
            });
        }

        if (dob > today) {
            errors.push({
                row: rowNumber,
                field: 'date_of_birth',
                value: data.date_of_birth,
                message: 'Date of birth cannot be in the future',
                severity: 'error'
            });
        }
    }

    // Validate passport expiry (must be in future)
    if (data.passport_expiry) {
        const expiry = new Date(data.passport_expiry);
        const today = new Date();

        if (expiry < today) {
            warnings.push({
                row: rowNumber,
                field: 'passport_expiry',
                value: data.passport_expiry,
                message: 'Passport appears to be expired',
                severity: 'warning'
            });
        }
    }

    // Normalize gender
    if (data.gender) {
        const normalizedGender = data.gender.toUpperCase();
        if (normalizedGender === 'M' || normalizedGender === 'MALE') {
            data.gender = 'M';
        } else if (normalizedGender === 'F' || normalizedGender === 'FEMALE') {
            data.gender = 'F';
        } else {
            data.gender = 'OTHER';
        }
    }

    // Normalize marital status
    if (data.marital_status) {
        data.marital_status = data.marital_status.toUpperCase();
        if (!VALID_MARITAL_STATUS.includes(data.marital_status)) {
            warnings.push({
                row: rowNumber,
                field: 'marital_status',
                value: data.marital_status,
                message: `Invalid marital status. Valid values: ${VALID_MARITAL_STATUS.join(', ')}`,
                severity: 'warning'
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        data: errors.length === 0 ? (data as BulkUploadRow) : undefined
    };
}

export function validateBulkUploadFile(file: File): { valid: boolean; error?: string } {
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
    ];

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.'
        };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size exceeds 10MB limit.'
        };
    }

    return { valid: true };
}
