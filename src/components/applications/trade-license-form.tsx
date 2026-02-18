
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Upload, FileText, Building, Users } from 'lucide-react'
import { calculateTotalFee } from '@/lib/fee-calculator'
import toast from 'react-hot-toast'

interface TradeLicenseFormProps {
    userId?: string
    initialData?: any
    onSubmit: (data: any) => Promise<void>
    onCancel: () => void
}

const steps = [
    { id: 'business', label: 'Business Info' },
    { id: 'applicant', label: 'Applicant Info' },
    { id: 'premises', label: 'Premises' },
    { id: 'financial', label: 'Financial' },
    { id: 'documents', label: 'Documents' },
    { id: 'review', label: 'Review' },
]

export default function TradeLicenseForm({ userId, initialData, onSubmit, onCancel }: TradeLicenseFormProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        // Step 1: Business Information
        businessNameEn: '',
        businessNameBn: '',
        businessType: '',
        tradeCategory: '',
        tinNumber: '',
        binNumber: '',
        establishmentDate: '',

        // Step 2: Applicant Information
        fullNameEn: '',
        fullNameBn: '',
        fatherName: '',
        motherName: '',
        nidNumber: '',
        dob: '',
        gender: '',
        mobile: '',
        email: '',
        presentAddress: '',
        permanentAddress: '',
        sameAsPresent: false,

        // Step 3: Business Premises
        division: '',
        district: '',
        upazila: '',
        wardNumber: '',
        holdingNumber: '',
        road: '',
        area: '',
        postalCode: '',
        ownershipType: '',
        landlordName: '',
        landlordMobile: '',
        monthlyRent: '',

        // Step 4: Financial & Employment
        capitalInvestment: '',
        annualTurnover: '',
        totalEmployees: '',
        maleEmployees: '',
        femaleEmployees: '',

        // Application Type
        applicationType: 'NEW', // NEW, RENEWAL, AMENDMENT, DUPLICATE
        previousLicenseNumber: '',
        previousLicenseYear: '',
        processingSpeed: 'NORMAL', // NORMAL, URGENT

        // Documents (URLs or File Objects - simplify to URLs/Flags for now or placeholder)
        documents: {
            nid: null,
            photo: null,
            tin: null,
            ownership: null,
            signature: null,
            partnershipDeed: null, // Conditional
            incorporationCert: null, // Conditional
            previousLicense: null, // Conditional
        },

        // Agreements
        declared: false,
        termsAccepted: false
    })

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleNext = () => {
        // Basic validation can go here
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const handleSubmit = async () => {
        if (!formData.declared || !formData.termsAccepted) {
            toast.error('Please accept the declaration and terms.')
            return
        }
        setLoading(true)
        try {
            await onSubmit(formData)
        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Failed to submit application')
        } finally {
            setLoading(false)
        }
    }

    // Effect to sync address if checked
    React.useEffect(() => {
        if (formData.sameAsPresent) {
            setFormData(prev => ({ ...prev, permanentAddress: prev.presentAddress }))
        }
    }, [formData.sameAsPresent, formData.presentAddress])

    // Fee Calculation
    const capital = parseFloat(formData.capitalInvestment) || 0
    const isUrgent = formData.processingSpeed === 'URGENT'
    const fees = calculateTotalFee(capital, isUrgent)

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Business Info
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Application Type</Label>
                                <Select value={formData.applicationType} onValueChange={(v) => handleInputChange('applicationType', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New License</SelectItem>
                                        <SelectItem value="RENEWAL">Renewal</SelectItem>
                                        <SelectItem value="AMENDMENT">Amendment</SelectItem>
                                        <SelectItem value="DUPLICATE">Duplicate Copy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Processing Speed</Label>
                                <RadioGroup value={formData.processingSpeed} onValueChange={(v) => handleInputChange('processingSpeed', v)} className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="NORMAL" id="normal" />
                                        <Label htmlFor="normal">Normal (7-14 days)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="URGENT" id="urgent" />
                                        <Label htmlFor="urgent">Urgent (3-5 days)</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {formData.applicationType !== 'NEW' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Previous License Number</Label>
                                        <Input value={formData.previousLicenseNumber} onChange={(e) => handleInputChange('previousLicenseNumber', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>License Year</Label>
                                        <Input value={formData.previousLicenseYear} onChange={(e) => handleInputChange('previousLicenseYear', e.target.value)} />
                                    </div>
                                </>
                            )}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Business Name (English) *</Label>
                                <Input value={formData.businessNameEn} onChange={(e) => handleInputChange('businessNameEn', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Business Name (Bengali) *</Label>
                                <Input value={formData.businessNameBn} onChange={(e) => handleInputChange('businessNameBn', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Business Type</Label>
                                <Select value={formData.businessType} onValueChange={(v) => handleInputChange('businessType', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                                        <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                                        <SelectItem value="PRIVATE_LIMITED">Private Limited Company</SelectItem>
                                        <SelectItem value="PUBLIC_LIMITED">Public Limited Company</SelectItem>
                                        <SelectItem value="SOCIETY_NGO">Society/NGO</SelectItem>
                                        <SelectItem value="JOINT_VENTURE">Joint Venture</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Trade Category</Label>
                                <Select value={formData.tradeCategory} onValueChange={(v) => handleInputChange('tradeCategory', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GENERAL_TRADING">General Trading/Retail</SelectItem>
                                        <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                                        <SelectItem value="MANUFACTURING">Manufacturing/Factory</SelectItem>
                                        <SelectItem value="IT">IT/Software/Technology</SelectItem>
                                        <SelectItem value="CONSTRUCTION">Construction/Real Estate</SelectItem>
                                        <SelectItem value="HEALTHCARE">Healthcare/Pharmacy</SelectItem>
                                        <SelectItem value="EDUCATION">Education/Coaching</SelectItem>
                                        <SelectItem value="FOOD">Food & Restaurant</SelectItem>
                                        <SelectItem value="TRANSPORT">Transport/Logistics</SelectItem>
                                        <SelectItem value="AGRICULTURE">Agriculture/Agro-based</SelectItem>
                                        <SelectItem value="GARMENTS">Garments/Textile</SelectItem>
                                        <SelectItem value="IMPORT_EXPORT">Import/Export</SelectItem>
                                        <SelectItem value="FINANCIAL">Financial Services</SelectItem>
                                        <SelectItem value="CONSULTING">Consulting/Professional Services</SelectItem>
                                        <SelectItem value="TOURISM">Hotel/Tourism</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>TIN Number (12-digit) *</Label>
                                <Input value={formData.tinNumber} onChange={(e) => handleInputChange('tinNumber', e.target.value)} maxLength={12} required />
                            </div>
                            <div className="space-y-2">
                                <Label>BIN Number (Optional)</Label>
                                <Input value={formData.binNumber} onChange={(e) => handleInputChange('binNumber', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Establishment</Label>
                                <Input type="date" value={formData.establishmentDate} onChange={(e) => handleInputChange('establishmentDate', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )
            case 1: // Applicant Info
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name (English) *</Label>
                                <Input value={formData.fullNameEn} onChange={(e) => handleInputChange('fullNameEn', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name (Bengali) *</Label>
                                <Input value={formData.fullNameBn} onChange={(e) => handleInputChange('fullNameBn', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Father's / Husband's Name</Label>
                                <Input value={formData.fatherName} onChange={(e) => handleInputChange('fatherName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mother's Name</Label>
                                <Input value={formData.motherName} onChange={(e) => handleInputChange('motherName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>NID Number *</Label>
                                <Input value={formData.nidNumber} onChange={(e) => handleInputChange('nidNumber', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={formData.dob} onChange={(e) => handleInputChange('dob', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile Number *</Label>
                                <Input value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Present Address</Label>
                                <Textarea value={formData.presentAddress} onChange={(e) => handleInputChange('presentAddress', e.target.value)} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="sameAsPresent" checked={formData.sameAsPresent} onCheckedChange={(c) => handleInputChange('sameAsPresent', c)} />
                                <Label htmlFor="sameAsPresent">Permanent Address is same as Present Address</Label>
                            </div>
                            {!formData.sameAsPresent && (
                                <div className="space-y-2">
                                    <Label>Permanent Address</Label>
                                    <Textarea value={formData.permanentAddress} onChange={(e) => handleInputChange('permanentAddress', e.target.value)} />
                                </div>
                            )}
                        </div>
                    </div>
                )
            case 2: // Premises
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Division</Label>
                                <Input value={formData.division} onChange={(e) => handleInputChange('division', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>District</Label>
                                <Input value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Upazila / City Corporation</Label>
                                <Input value={formData.upazila} onChange={(e) => handleInputChange('upazila', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Ward Number</Label>
                                <Input value={formData.wardNumber} onChange={(e) => handleInputChange('wardNumber', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Holding / Plot Number</Label>
                                <Input value={formData.holdingNumber} onChange={(e) => handleInputChange('holdingNumber', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Road / Street</Label>
                                <Input value={formData.road} onChange={(e) => handleInputChange('road', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Area / Mohalla</Label>
                                <Input value={formData.area} onChange={(e) => handleInputChange('area', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Postal Code</Label>
                                <Input value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value)} />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Premises Ownership</Label>
                                <Select value={formData.ownershipType} onValueChange={(v) => handleInputChange('ownershipType', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Ownership" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OWN">Own</SelectItem>
                                        <SelectItem value="RENTED">Rented</SelectItem>
                                        <SelectItem value="LEASED">Leased</SelectItem>
                                        <SelectItem value="GOVT_ALLOCATED">Government Allocated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {(formData.ownershipType === 'RENTED' || formData.ownershipType === 'LEASED') && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Landlord Name</Label>
                                        <Input value={formData.landlordName} onChange={(e) => handleInputChange('landlordName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Landlord Mobile</Label>
                                        <Input value={formData.landlordMobile} onChange={(e) => handleInputChange('landlordMobile', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Monthly Rent (৳)</Label>
                                        <Input type="number" value={formData.monthlyRent} onChange={(e) => handleInputChange('monthlyRent', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            case 3: // Financial
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Capital Investment (৳)</Label>
                                <Input type="number" value={formData.capitalInvestment} onChange={(e) => handleInputChange('capitalInvestment', e.target.value)} required />
                                <p className="text-xs text-muted-foreground">Fee depends on this amount.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Estimated Annual Turnover (৳)</Label>
                                <Input type="number" value={formData.annualTurnover} onChange={(e) => handleInputChange('annualTurnover', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Total Employees</Label>
                                <Input type="number" value={formData.totalEmployees} onChange={(e) => handleInputChange('totalEmployees', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Male Employees</Label>
                                <Input type="number" value={formData.maleEmployees} onChange={(e) => handleInputChange('maleEmployees', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Female Employees</Label>
                                <Input type="number" value={formData.femaleEmployees} onChange={(e) => handleInputChange('femaleEmployees', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )
            case 4: // Documents
                return (
                    <div className="space-y-6">
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                                Please upload clear scans or photos of the required documents. Supported formats: JPG, PNG, PDF.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { key: 'nid', label: 'NID Copy (Front & Back)', required: true },
                                { key: 'photo', label: 'Passport Size Photo', required: true },
                                { key: 'tin', label: 'TIN Certificate', required: true },
                                { key: 'ownership', label: 'Ownership/Rent Document', required: true },
                                { key: 'signature', label: 'Applicant Signature Scan', required: true },
                                { key: 'partnershipDeed', label: 'Partnership Deed', required: formData.businessType === 'PARTNERSHIP' },
                                { key: 'incorporationCert', label: 'MOA/AOA/Incorporation Certificate', required: ['PRIVATE_LIMITED', 'PUBLIC_LIMITED'].includes(formData.businessType) },
                                { key: 'previousLicense', label: 'Previous License Copy', required: formData.applicationType !== 'NEW' },
                            ].map((doc) => (
                                <div key={doc.key} className="border p-4 rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="font-medium">{doc.label} {doc.required && <span className="text-red-500">*</span>}</Label>
                                        {formData.documents[doc.key as keyof typeof formData.documents] && (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div className="text-center">
                                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="mt-1 text-sm text-gray-500">Click to upload</p>
                                        </div>
                                        {/* File Input Placeholder - In real implementation, this would handle file selection */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case 5: // Review
                return (
                    <div className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-4">Estimated Government Fee</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>License Fee (based on Capital: ৳{capital.toLocaleString()})</span>
                                    <span>৳{fees.licenseFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Signboard Fee</span>
                                    <span>৳{fees.signboardFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>VAT (15%)</span>
                                    <span>৳{fees.vat.toLocaleString()}</span>
                                </div>
                                {isUrgent && (
                                    <div className="flex justify-between text-orange-600 font-medium">
                                        <span>Urgent Processing Surcharge</span>
                                        <span>৳{fees.urgentFee.toLocaleString()}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Estimated Fee</span>
                                    <span>৳{fees.total.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">* Payable later upon verification</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-2">
                                <Checkbox id="declared" checked={formData.declared} onCheckedChange={(c) => handleInputChange('declared', c)} />
                                <Label htmlFor="declared" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I hereby declare that all information provided in this application is true and correct to the best of my knowledge.
                                </Label>
                            </div>
                            <div className="flex items-start space-x-2">
                                <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(c) => handleInputChange('terms', c)} />
                                <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the Terms and Conditions and Privacy Policy.
                                </Label>
                            </div>
                        </div>

                        {/* Summary of Data can be added here in readonly fields or a summary list */}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Stepper */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex items-center min-w-max">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${currentStep >= index
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${currentStep >= index ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 w-12 mx-2 -mt-6 ${currentStep > index ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{steps[currentStep].label}</CardTitle>
                    <CardDescription>Please fill in the details below.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderStepContent()}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={currentStep === 0 ? onCancel : handleBack} disabled={loading}>
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </Button>

                    {currentStep === steps.length - 1 ? (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                        </Button>
                    ) : (
                        <Button onClick={handleNext} disabled={loading}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
