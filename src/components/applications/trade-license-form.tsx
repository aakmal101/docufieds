'use client'

import React, { useState, useEffect } from 'react'
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
import { Loader2, ArrowRight, CheckCircle, Upload, FileText, Users, Building, MapPin } from 'lucide-react'
import { calculateTotalFee } from '@/lib/fee-calculator'
import toast from 'react-hot-toast'
import RequiredDocuments from '@/components/required-documents'

interface TradeLicenseFormProps {
    applicationId: string | null
    onSaveDraft: (data: any) => Promise<string | undefined>
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

type TradeLicenseSubtype = 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LIMITED_COMPANY'

export default function TradeLicenseForm({ applicationId, initialData, onSaveDraft, onSubmit, onCancel }: TradeLicenseFormProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [documentsReady, setDocumentsReady] = useState(false)

    // Subtype configuration
    const [subtype, setSubtype] = useState<TradeLicenseSubtype | null>(initialData?.subtype || null)
    const [partnerCount, setPartnerCount] = useState<number>(initialData?.partnerCount || 2)

    const [formData, setFormData] = useState({
        // Step 1: Business Information
        businessNameEn: initialData?.businessNameEn || '',
        businessNameBn: initialData?.businessNameBn || '',
        tradeCategory: initialData?.tradeCategory || '',
        tinNumber: initialData?.tinNumber || '',
        binNumber: initialData?.binNumber || '',
        establishmentDate: initialData?.establishmentDate || '',

        // Step 2: People Information (Array of owners/partners/directors)
        people: initialData?.people || [],

        // Step 3: Business Premises
        division: initialData?.division || '',
        district: initialData?.district || '',
        upazila: initialData?.upazila || '',
        wardNumber: initialData?.wardNumber || '',
        holdingNumber: initialData?.holdingNumber || '',
        road: initialData?.road || '',
        area: initialData?.area || '',
        postalCode: initialData?.postalCode || '',
        ownershipType: initialData?.ownershipType || '',
        landlordName: initialData?.landlordName || '',
        landlordMobile: initialData?.landlordMobile || '',
        monthlyRent: initialData?.monthlyRent || '',

        // Step 4: Financial & Employment
        capitalInvestment: initialData?.capitalInvestment || '',
        annualTurnover: initialData?.annualTurnover || '',
        totalEmployees: initialData?.totalEmployees || '',
        maleEmployees: initialData?.maleEmployees || '',
        femaleEmployees: initialData?.femaleEmployees || '',

        // Application Type
        applicationType: initialData?.applicationType || 'NEW', // NEW, RENEWAL, AMENDMENT, DUPLICATE
        previousLicenseNumber: initialData?.previousLicenseNumber || '',
        previousLicenseYear: initialData?.previousLicenseYear || '',
        processingSpeed: initialData?.processingSpeed || 'NORMAL', // NORMAL, URGENT

        // Agreements
        declared: initialData?.declared || false,
        termsAccepted: initialData?.termsAccepted || false
    })

    const createEmptyPerson = () => ({
        id: crypto.randomUUID(),
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
        role: '' // This will be set by the subtype logic
    });

    // Initialize currentPeople array based on subtype and partnerCount
    useEffect(() => {
        if (!subtype) return;

        setFormData(prev => {
            let targetCount = 1;
            let currentPeople = [...prev.people];
            let defaultRole = '';

            if (subtype === 'SOLE_PROPRIETORSHIP') {
                targetCount = 1;
                defaultRole = 'Owner';
                if (currentPeople.length > 0) {
                    currentPeople[0] = { ...currentPeople[0], role: defaultRole };
                }
            } else if (subtype === 'PARTNERSHIP') {
                targetCount = partnerCount;
                defaultRole = 'Partner';
                currentPeople = currentPeople.map(p => ({ ...p, role: defaultRole }));
            } else if (subtype === 'LIMITED_COMPANY') {
                targetCount = Math.max(1, currentPeople.length);
                if (currentPeople.length > 0) {
                    currentPeople[0] = { ...currentPeople[0], role: 'Managing Director' };
                    for (let i = 1; i < currentPeople.length; i++) {
                        currentPeople[i] = { ...currentPeople[i], role: 'Director' };
                    }
                }
            }

            // Pad or truncate the array
            if (currentPeople.length > targetCount && subtype !== 'LIMITED_COMPANY') { // Only truncate for non-limited company
                currentPeople = currentPeople.slice(0, targetCount);
            } else if (currentPeople.length < targetCount) {
                while (currentPeople.length < targetCount) {
                    currentPeople.push(createEmptyPerson());
                }
            }

            // Only update if length or roles changed to prevent infinite loops
            if (JSON.stringify(currentPeople) !== JSON.stringify(prev.people)) {
                return { ...prev, people: currentPeople };
            }
            return prev;
        });
    }, [subtype, partnerCount])

    // Create Draft Application immediately if we don't have an ID
    useEffect(() => {
        let mounted = true;
        const initDraft = async () => {
            if (!applicationId && mounted) {
                await onSaveDraft({});
            }
        };
        initDraft();
        return () => { mounted = false; }
    }, [applicationId, onSaveDraft])

    const steps = [
        { id: 'type', label: 'License Type' },
        { id: 'business', label: 'Business Info' },
        { id: 'people', label: 'People Info' },
        { id: 'premises', label: 'Premises' },
        { id: 'financial', label: 'Financial' },
        { id: 'documents', label: 'Documents' },
        { id: 'review', label: 'Review & Submit' }
    ]

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handlePersonChange = (personId: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            people: prev.people.map((p: any) => p.id === personId ? { ...p, [field]: value } : p)
        }))
    }

    const handleNext = async () => {
        if (currentStep === 0) {
            if (!subtype) {
                toast.error("Please select a Trade License Subtype")
                return
            }
            if (subtype === 'PARTNERSHIP' && (partnerCount < 2 || partnerCount > 10)) {
                toast.error("Partnership requires between 2 and 10 partners.")
                return
            }

            setLoading(true)
            try {
                // If this is the first step, trigger draft creation AND save the subtype details
                if (!applicationId) {
                    await onSaveDraft({ tradeLicenseSubtype: subtype, partnerCount })
                } else {
                    // Update existing draft with subtype via Answers API
                    await fetch(`/api/applications/${applicationId}/answers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            answers: {
                                tradeLicenseSubtype: subtype,
                                partnerCount: partnerCount,
                                businessCategory: 'TRADE_LICENSE'
                            }
                        })
                    })
                }
                setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
            } catch (err) {
                console.error("Error saving subtype:", err)
                toast.error("Failed to save selection")
            } finally {
                setLoading(false)
            }
            return
        }

        if (currentStep === 5) { // Documents step
            if (!documentsReady) {
                toast.error("Please upload all required documents to continue.");
                return;
            }
        }

        // Basic validation before changing steps to ensure Answer upsert happens
        setLoading(true)
        try {
            if (applicationId) {
                await fetch(`/api/applications/${applicationId}/answers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: formData })
                })
            }
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
        } catch (err) {
            console.error("Error saving answers:", err)
            toast.error("Failed to save progress")
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0))
    }

    const handleSubmit = async () => {
        // Validation: Required fields check based on step 1 & 2 basic needs
        if (!formData.businessNameEn || !formData.businessNameBn || !formData.tinNumber) {
            toast.error('Please complete all required business information fields (Name, TIN).')
            return
        }

        // Validate all people
        const invalidPerson = formData.people.find((p: any) => !p.fullNameEn || !p.fullNameBn || !p.nidNumber || !p.mobile)
        if (invalidPerson) {
            toast.error('Please complete all required info (Name, NID, Mobile) for all people listed.')
            return
        }

        if (!formData.declared || !formData.termsAccepted) {
            toast.error('Please accept the declaration and terms.')
            return
        }
        setLoading(true)
        try {
            // Ensure final form state is saved before submit
            if (applicationId) {
                await fetch(`/api/applications/${applicationId}/answers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: formData })
                })
            }
            await onSubmit(formData)
        } catch (error) {
            console.error('Submission error:', error)
            toast.error('Failed to submit application')
        } finally {
            setLoading(false)
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // License Type and General Setup
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">Select Trade License Subtype</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'SOLE_PROPRIETORSHIP', title: 'Sole Proprietorship', icon: Users, desc: 'Single owner business' },
                                    { id: 'PARTNERSHIP', title: 'Partnership Company', icon: Users, desc: '2 to 10 partners' },
                                    { id: 'LIMITED_COMPANY', title: 'Limited Company', icon: Building, desc: 'Private or Public Limited' }
                                ].map((type) => {
                                    const Icon = type.icon
                                    return (
                                        <Card
                                            key={type.id}
                                            className={`cursor-pointer transition-all ${subtype === type.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2' : 'hover:border-gray-400'}`}
                                            onClick={() => setSubtype(type.id as TradeLicenseSubtype)}
                                        >
                                            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                                                <div className={`p-3 rounded-full ${subtype === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{type.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{type.desc}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>

                        {subtype === 'PARTNERSHIP' && (
                            <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-4">
                                <Label className="text-lg font-semibold">Number of Partners</Label>
                                <div className="flex items-center space-x-4">
                                    <Input
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={partnerCount}
                                        onChange={(e) => setPartnerCount(parseInt(e.target.value) || 2)}
                                        className="w-32"
                                    />
                                    <span className="text-sm text-gray-500">Pick between 2 and 10 partners</span>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t mt-6">
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
                        </div>
                    </div>
                )
            case 1: // Business Info
                return (
                    <div className="space-y-4">
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
            case 2: // People Info
                return (
                    <div className="space-y-8">
                        {formData.people.map((person: any, index: number) => (
                            <div key={person.id} className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {person.role} {subtype === 'PARTNERSHIP' ? index + 1 : ''} Details
                                    </h3>
                                    {subtype === 'LIMITED_COMPANY' && index > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                people: prev.people.filter((p: any) => p.id !== person.id)
                                            }))}
                                        >
                                            Remove Person
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name (English) *</Label>
                                        <Input value={person.fullNameEn || ''} onChange={(e) => handlePersonChange(person.id, 'fullNameEn', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Full Name (Bengali) *</Label>
                                        <Input value={person.fullNameBn || ''} onChange={(e) => handlePersonChange(person.id, 'fullNameBn', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Father&apos;s / Husband&apos;s Name</Label>
                                        <Input value={person.fatherName || ''} onChange={(e) => handlePersonChange(person.id, 'fatherName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mother&apos;s Name</Label>
                                        <Input value={person.motherName || ''} onChange={(e) => handlePersonChange(person.id, 'motherName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>NID Number *</Label>
                                        <Input value={person.nidNumber || ''} onChange={(e) => handlePersonChange(person.id, 'nidNumber', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date of Birth</Label>
                                        <Input type="date" value={person.dob || ''} onChange={(e) => handlePersonChange(person.id, 'dob', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select value={person.gender || ''} onValueChange={(v) => handlePersonChange(person.id, 'gender', v)}>
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
                                        <Input value={person.mobile || ''} onChange={(e) => handlePersonChange(person.id, 'mobile', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input type="email" value={person.email || ''} onChange={(e) => handlePersonChange(person.id, 'email', e.target.value)} />
                                    </div>
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Present Address</Label>
                                        <Textarea value={person.presentAddress || ''} onChange={(e) => handlePersonChange(person.id, 'presentAddress', e.target.value)} />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`sameAsPresent-${person.id}`}
                                            checked={person.sameAsPresent}
                                            onCheckedChange={(c) => {
                                                handlePersonChange(person.id, 'sameAsPresent', c)
                                                if (c) handlePersonChange(person.id, 'permanentAddress', person.presentAddress)
                                            }}
                                        />
                                        <Label htmlFor={`sameAsPresent-${person.id}`}>Permanent Address is same as Present Address</Label>
                                    </div>
                                    {!person.sameAsPresent && (
                                        <div className="space-y-2">
                                            <Label>Permanent Address</Label>
                                            <Textarea value={person.permanentAddress || ''} onChange={(e) => handlePersonChange(person.id, 'permanentAddress', e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {subtype === 'LIMITED_COMPANY' && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-dashed py-8 mt-4"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        people: [...prev.people, {
                                            id: crypto.randomUUID(),
                                            fullNameEn: '',
                                            fullNameBn: '',
                                            role: 'Director'
                                        }]
                                    }))
                                }}
                            >
                                + Add Another Director
                            </Button>
                        )}
                    </div>
                )
            case 3: // Premises
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
            case 4: // Financial
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
            case 5: // Documents
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-4">
                            <FileText className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-medium text-blue-900">Required Documents</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Please upload the following required documents based on your selected trade license type and people count.
                                </p>
                            </div>
                        </div>

                        {applicationId ? (
                            <RequiredDocuments
                                applicationId={applicationId}
                                onComplete={() => setDocumentsReady(true)}
                                onBack={handleBack}
                            />
                        ) : (
                            <div className="text-center p-8 bg-gray-50 border border-dashed rounded-lg">
                                <p className="text-gray-500">Please save draft first to enable document upload.</p>
                            </div>
                        )}
                    </div>
                )
            case 6: // Review
                return (
                    <div className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-4">Application Summary</h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><strong>License Type:</strong> {subtype?.replace('_', ' ')}</p>
                                <p><strong>Business Name:</strong> {formData.businessNameEn}</p>
                                <p><strong>TIN:</strong> {formData.tinNumber}</p>
                                <p><strong>Total Owners/Directors:</strong> {formData.people.length}</p>
                                <Separator className="my-2" />
                                <p className="text-xs text-muted-foreground mt-2">* Click Submit to complete the application process.</p>
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
                                <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(c) => handleInputChange('termsAccepted', c)} />
                                <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the Terms and Conditions and Privacy Policy.
                                </Label>
                            </div>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl text-gray-900">Trade License Application</CardTitle>
                        <CardDescription>Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}</CardDescription>
                    </div>
                    {/* Stepper Dots */}
                    <div className="hidden md:flex items-center space-x-2">
                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`h-2.5 w-2.5 rounded-full ${idx === currentStep ? 'bg-blue-600 ring-4 ring-blue-100' : idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                                {idx < steps.length - 1 && (
                                    <div className={`h-0.5 w-8 ${idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {renderStepContent()}

                    <div className="flex justify-between items-center mt-8 pt-6 border-t">
                        <div>
                            {onCancel && (
                                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                        <div className="flex space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 0 || loading}
                            >
                                Back
                            </Button>

                            {currentStep < steps.length - 1 ? (
                                <Button type="button" onClick={handleNext} disabled={loading || (currentStep === 5 && !documentsReady)} className="bg-blue-600 hover:bg-blue-700">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Next Step
                                </Button>
                            ) : (
                                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Application
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
