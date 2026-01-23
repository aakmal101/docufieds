export interface BulkUploadRow {
    // Required Fields
    full_name: string;
    email?: string;
    phone?: string;
    date_of_birth: string; // Format: YYYY-MM-DD

    // Application Details
    destination_country: string; // Country name or code
    visa_category: string; // TOURIST, STUDENT, BUSINESS, CONFERENCE, MEDICAL, SPORTS, VISIT
    profession?: string; // BUSINESS_OWNER, JOB_HOLDER, STUDENT, HOMEMAKER, RETIRED

    // Profile Information
    place_of_birth?: string;
    nationality?: string;
    passport_number?: string;
    passport_expiry?: string; // Format: YYYY-MM-DD
    gender?: string; // M, F, Other
    marital_status?: string; // SINGLE, MARRIED, DIVORCED, WIDOWED
    address?: string;

    // Document File Names (references to uploaded files in zip)
    passport?: string;
    national_id?: string;
    birth_certificate?: string;
    employment_letter?: string;
    travel_insurance?: string;
    educational_proof?: string;
    accommodation_proof?: string;
    bank_statement?: string;
    invitation_letter?: string;
    previous_visa?: string;
    marriage_certificate?: string;
    sponsor_letter?: string;

    // Notes
    special_instructions?: string;
}

export interface BulkUploadValidationError {
    row: number;
    field: string;
    value: any;
    message: string;
    severity: 'error' | 'warning';
}

export interface BulkUploadProgress {
    uploadId: string;
    status: 'PENDING' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    currentPhase: string;
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
    skippedRecords: number;
    errors: BulkUploadValidationError[];
    startedAt?: string;
    completedAt?: string;
}

export interface ProcessedRecord {
    rowNumber: number;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    applicationId?: string;
    userId?: string;
    errorMessage?: string;
    warningMessage?: string;
}
