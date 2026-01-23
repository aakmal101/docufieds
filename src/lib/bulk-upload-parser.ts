import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export async function parseUploadedFile(file: File): Promise<any[]> {
    const fileType = file.type;

    if (fileType === 'text/csv') {
        return parseCSV(file);
    } else {
        return parseExcel(file);
    }
}

async function parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false, // Keep everything as string for validation
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                }
                resolve(results.data);
            },
            error: (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            }
        });
    });
}

async function parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false, // Format dates as strings
                    defval: '', // Default value for empty cells
                });

                resolve(jsonData);
            } catch (error) {
                reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsBinaryString(file);
    });
}

export function generateTemplateWorkbook(): XLSX.WorkBook {
    const headers = [
        'full_name',
        'email',
        'phone',
        'date_of_birth',
        'destination_country',
        'visa_category',
        'profession',
        'place_of_birth',
        'nationality',
        'passport_number',
        'passport_expiry',
        'gender',
        'marital_status',
        'address',
        'passport',
        'national_id',
        'birth_certificate',
        'employment_letter',
        'travel_insurance',
        'educational_proof',
        'accommodation_proof',
        'bank_statement',
        'invitation_letter',
        'previous_visa',
        'marriage_certificate',
        'sponsor_letter',
        'special_instructions'
    ];

    const sampleData = [
        {
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+8801712345678',
            date_of_birth: '1990-01-15',
            destination_country: 'United States',
            visa_category: 'TOURIST',
            profession: 'JOB_HOLDER',
            place_of_birth: 'Dhaka',
            nationality: 'Bangladeshi',
            passport_number: 'AB1234567',
            passport_expiry: '2028-12-31',
            gender: 'M',
            marital_status: 'SINGLE',
            address: '123 Main St, Dhaka',
            passport: 'passport_john.pdf',
            national_id: 'nid_john.pdf',
            birth_certificate: '',
            employment_letter: 'employment_john.pdf',
            travel_insurance: 'insurance_john.pdf',
            educational_proof: '',
            accommodation_proof: '',
            bank_statement: 'bank_john.pdf',
            invitation_letter: '',
            previous_visa: '',
            marriage_certificate: '',
            sponsor_letter: '',
            special_instructions: 'Prefers morning appointments'
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, sampleData, { origin: 'A2', skipHeader: true });

    // Set column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants');

    // Add instructions sheet
    const instructionsData = [
        ['Docufieds Bulk Upload Template - Instructions'],
        [''],
        ['REQUIRED FIELDS (marked with *)'],
        ['* full_name - Full name of the applicant'],
        ['* email OR phone - At least one contact method required'],
        ['* date_of_birth - Format: YYYY-MM-DD (e.g., 1990-01-15)'],
        ['* destination_country - Country name (e.g., United States, Canada)'],
        ['* visa_category - One of: TOURIST, STUDENT, BUSINESS, CONFERENCE, MEDICAL, SPORTS, VISIT'],
        [''],
        ['OPTIONAL FIELDS'],
        ['profession - One of: BUSINESS_OWNER, JOB_HOLDER, STUDENT, HOMEMAKER, RETIRED'],
        ['place_of_birth - City or country of birth'],
        ['nationality - Nationality (e.g., Bangladeshi)'],
        ['passport_number - Passport number'],
        ['passport_expiry - Format: YYYY-MM-DD'],
        ['gender - M, F, or Other'],
        ['marital_status - SINGLE, MARRIED, DIVORCED, WIDOWED'],
        ['address - Full address'],
        [''],
        ['DOCUMENT REFERENCES'],
        ['For each document type, provide the filename if you have uploaded it separately'],
        ['Example: passport_john.pdf'],
        [''],
        ['NOTES'],
        ['- Dates must be in YYYY-MM-DD format'],
        ['- Email must be valid format'],
        ['- Phone must include country code (e.g., +8801712345678)'],
        ['- Special instructions can be any additional notes'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    return workbook;
}
