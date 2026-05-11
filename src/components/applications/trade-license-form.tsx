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
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tradeLicenseSchema, TradeLicenseFormData } from '@/lib/schemas/trade-license'

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

    const form = useForm<TradeLicenseFormData>({
        resolver: zodResolver(tradeLicenseSchema) as any,
        defaultValues: {
            businessNameEn: initialData?.businessNameEn || '',
            businessNameBn: initialData?.businessNameBn || '',
            tradeCategory: initialData?.tradeCategory || '',
            tinNumber: initialData?.tinNumber || '',
            binNumber: initialData?.binNumber || '',
            establishmentDate: initialData?.establishmentDate || '',
            people: initialData?.people ? initialData.people.map((p: any) => ({
                ...p,
                sameAsPresent: Boolean(p.sameAsPresent)
            })) : [],
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
            capitalInvestment: initialData?.capitalInvestment || '',
            annualTurnover: initialData?.annualTurnover || '',
            totalEmployees: initialData?.totalEmployees || '',
            maleEmployees: initialData?.maleEmployees || '',
            femaleEmployees: initialData?.femaleEmployees || '',
            applicationType: initialData?.applicationType || 'NEW',
            previousLicenseNumber: initialData?.previousLicenseNumber || '',
            previousLicenseYear: initialData?.previousLicenseYear || '',
            processingSpeed: initialData?.processingSpeed || 'NORMAL',
            declared: initialData?.declared || false,
            termsAccepted: initialData?.termsAccepted || false
        }
    })

    const { register, control, handleSubmit, trigger, formState: { errors }, watch, setValue, getValues } = form;

    const watchApplicationType = watch('applicationType');
    const watchOwnershipType = watch('ownershipType');

    const { fields: peopleFields, append, remove } = useFieldArray({
        control,
        name: 'people'
    });

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

        let targetCount = 1;
        let currentPeople = getValues('people') || [];
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
            currentPeople = currentPeople.map((p: any) => ({ ...p, role: defaultRole }));
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
        if (currentPeople.length > targetCount && subtype !== 'LIMITED_COMPANY') {
            currentPeople = currentPeople.slice(0, targetCount);
        } else if (currentPeople.length < targetCount) {
            while (currentPeople.length < targetCount) {
                currentPeople.push(createEmptyPerson());
            }
        }

        // Only update if changes were made
        setValue('people', currentPeople, { shouldDirty: true });
    }, [subtype, partnerCount, setValue, getValues])

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
            
            const isStepValid = await trigger(["applicationType", "previousLicenseNumber", "previousLicenseYear", "processingSpeed"]);
            if (!isStepValid) return;

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

        if (currentStep === 1) {
            const isStepValid = await trigger(["businessNameEn", "businessNameBn", "tradeCategory", "tinNumber", "binNumber", "establishmentDate"]);
            if (!isStepValid) return;
        } else if (currentStep === 2) {
            const isStepValid = await trigger(["people"]);
            if (!isStepValid) {
                toast.error("Please fix the errors in the People info section.");
                return;
            }
        } else if (currentStep === 3) {
            const isStepValid = await trigger(["division", "district", "upazila", "wardNumber", "holdingNumber", "road", "area", "postalCode", "ownershipType", "landlordName", "landlordMobile", "monthlyRent"]);
            if (!isStepValid) return;
        } else if (currentStep === 4) {
            const isStepValid = await trigger(["capitalInvestment", "annualTurnover", "totalEmployees", "maleEmployees", "femaleEmployees"]);
            if (!isStepValid) return;
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
                    body: JSON.stringify({ answers: getValues() })
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

    const onSubmitForm = async (data: any) => {
        setLoading(true)
        try {
            // Ensure final form state is saved before submit
            if (applicationId) {
                await fetch(`/api/applications/${applicationId}/answers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: data })
                })
            }
            await onSubmit(data)
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
                                    <Controller
                                        control={control}
                                        name="applicationType"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NEW">New License</SelectItem>
                                                    <SelectItem value="RENEWAL">Renewal</SelectItem>
                                                    <SelectItem value="AMENDMENT">Amendment</SelectItem>
                                                    <SelectItem value="DUPLICATE">Duplicate Copy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.applicationType && <p className="text-red-500 text-xs mt-1">{errors.applicationType.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Processing Speed</Label>
                                    <Controller
                                        control={control}
                                        name="processingSpeed"
                                        render={({ field }) => (
                                            <RadioGroup value={field.value} onValueChange={field.onChange} className="flex space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="NORMAL" id="normal" />
                                                    <Label htmlFor="normal">Normal (7-14 days)</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="URGENT" id="urgent" />
                                                    <Label htmlFor="urgent">Urgent (3-5 days)</Label>
                                                </div>
                                            </RadioGroup>
                                        )}
                                    />
                                    {errors.processingSpeed && <p className="text-red-500 text-xs mt-1">{errors.processingSpeed.message}</p>}
                                </div>
                                {watchApplicationType !== 'NEW' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Previous License Number</Label>
                                            <Input {...register('previousLicenseNumber')} />
                                            {errors.previousLicenseNumber && <p className="text-red-500 text-xs mt-1">{errors.previousLicenseNumber.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>License Year</Label>
                                            <Input {...register('previousLicenseYear')} />
                                            {errors.previousLicenseYear && <p className="text-red-500 text-xs mt-1">{errors.previousLicenseYear.message}</p>}
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
                                <Input {...register('businessNameEn')} />
                                {errors.businessNameEn && <p className="text-red-500 text-xs mt-1">{errors.businessNameEn.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Business Name (Bengali) *</Label>
                                <Input {...register('businessNameBn')} />
                                {errors.businessNameBn && <p className="text-red-500 text-xs mt-1">{errors.businessNameBn.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Trade Category</Label>
                                <Controller
                                    control={control}
                                    name="tradeCategory"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
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
                                    )}
                                />
                                {errors.tradeCategory && <p className="text-red-500 text-xs mt-1">{errors.tradeCategory.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>TIN Number (12-digit) *</Label>
                                <Input {...register('tinNumber')} maxLength={12} />
                                {errors.tinNumber && <p className="text-red-500 text-xs mt-1">{errors.tinNumber.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>BIN Number (Optional)</Label>
                                <Input {...register('binNumber')} />
                                {errors.binNumber && <p className="text-red-500 text-xs mt-1">{errors.binNumber.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Establishment</Label>
                                <Input type="date" {...register('establishmentDate')} />
                                {errors.establishmentDate && <p className="text-red-500 text-xs mt-1">{errors.establishmentDate.message}</p>}
                            </div>
                        </div>
                    </div>
                )
            case 2: // People Info
                return (
                    <div className="space-y-8">
                        {peopleFields.map((person, index) => (
                            <div key={person.id} className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {getValues(`people.${index}.role`)} {subtype === 'PARTNERSHIP' ? index + 1 : ''} Details
                                    </h3>
                                    {subtype === 'LIMITED_COMPANY' && index > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => remove(index)}
                                        >
                                            Remove Person
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name (English) *</Label>
                                        <Input {...register(`people.${index}.fullNameEn` as const)} />
                                        {errors.people?.[index]?.fullNameEn && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.fullNameEn?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Full Name (Bengali) *</Label>
                                        <Input {...register(`people.${index}.fullNameBn` as const)} />
                                        {errors.people?.[index]?.fullNameBn && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.fullNameBn?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Father&apos;s / Husband&apos;s Name</Label>
                                        <Input {...register(`people.${index}.fatherName` as const)} />
                                        {errors.people?.[index]?.fatherName && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.fatherName?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mother&apos;s Name</Label>
                                        <Input {...register(`people.${index}.motherName` as const)} />
                                        {errors.people?.[index]?.motherName && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.motherName?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>NID Number *</Label>
                                        <Input {...register(`people.${index}.nidNumber` as const)} />
                                        {errors.people?.[index]?.nidNumber && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.nidNumber?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date of Birth</Label>
                                        <Input type="date" {...register(`people.${index}.dob` as const)} />
                                        {errors.people?.[index]?.dob && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.dob?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Controller
                                            control={control}
                                            name={`people.${index}.gender` as const}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.people?.[index]?.gender && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.gender?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mobile Number *</Label>
                                        <Input {...register(`people.${index}.mobile` as const)} />
                                        {errors.people?.[index]?.mobile && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.mobile?.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input type="email" {...register(`people.${index}.email` as const)} />
                                        {errors.people?.[index]?.email && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.email?.message}</p>}
                                    </div>
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Present Address</Label>
                                        <Textarea {...register(`people.${index}.presentAddress` as const)} />
                                        {errors.people?.[index]?.presentAddress && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.presentAddress?.message}</p>}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Controller
                                            control={control}
                                            name={`people.${index}.sameAsPresent` as const}
                                            render={({ field }) => (
                                                <Checkbox
                                                    id={`sameAsPresent-${person.id}`}
                                                    checked={field.value}
                                                    onCheckedChange={(c: boolean) => {
                                                        field.onChange(c)
                                                        if (c) setValue(`people.${index}.permanentAddress`, getValues(`people.${index}.presentAddress`))
                                                    }}
                                                />
                                            )}
                                        />
                                        <Label htmlFor={`sameAsPresent-${person.id}`}>Permanent Address is same as Present Address</Label>
                                    </div>
                                    {!watch(`people.${index}.sameAsPresent`) && (
                                        <div className="space-y-2">
                                            <Label>Permanent Address</Label>
                                            <Textarea {...register(`people.${index}.permanentAddress` as const)} />
                                            {errors.people?.[index]?.permanentAddress && <p className="text-red-500 text-xs mt-1">{errors.people[index]?.permanentAddress?.message}</p>}
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
                                    append(createEmptyPerson());
                                    // Assign default role to the appended item. It will be peopleFields.length index.
                                    // Let's do it slightly safely. Wait for next render or just let useEffect handle?
                                    // Actually the generic logic sets it, but better to set explicitly since subtype is limited
                                    setTimeout(() => {
                                        const currentPeople = getValues('people');
                                        const newIndex = currentPeople.length - 1;
                                        if (newIndex >= 0) {
                                            setValue(`people.${newIndex}.role`, 'Director');
                                        }
                                    }, 0);
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
                                <Input {...register('division')} />
                                {errors.division && <p className="text-red-500 text-xs mt-1">{errors.division.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>District</Label>
                                <Input {...register('district')} />
                                {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Upazila / City Corporation</Label>
                                <Input {...register('upazila')} />
                                {errors.upazila && <p className="text-red-500 text-xs mt-1">{errors.upazila.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Ward Number</Label>
                                <Input {...register('wardNumber')} />
                                {errors.wardNumber && <p className="text-red-500 text-xs mt-1">{errors.wardNumber.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Holding / Plot Number</Label>
                                <Input {...register('holdingNumber')} />
                                {errors.holdingNumber && <p className="text-red-500 text-xs mt-1">{errors.holdingNumber.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Road / Street</Label>
                                <Input {...register('road')} />
                                {errors.road && <p className="text-red-500 text-xs mt-1">{errors.road.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Area / Mohalla</Label>
                                <Input {...register('area')} />
                                {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Postal Code</Label>
                                <Input {...register('postalCode')} />
                                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Premises Ownership</Label>
                                <Controller
                                    control={control}
                                    name="ownershipType"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger><SelectValue placeholder="Select Ownership" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OWN">Own</SelectItem>
                                                <SelectItem value="RENTED">Rented</SelectItem>
                                                <SelectItem value="LEASED">Leased</SelectItem>
                                                <SelectItem value="GOVT_ALLOCATED">Government Allocated</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.ownershipType && <p className="text-red-500 text-xs mt-1">{errors.ownershipType.message}</p>}
                            </div>
                            {(watchOwnershipType === 'RENTED' || watchOwnershipType === 'LEASED') && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Landlord Name</Label>
                                        <Input {...register('landlordName')} />
                                        {errors.landlordName && <p className="text-red-500 text-xs mt-1">{errors.landlordName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Landlord Mobile</Label>
                                        <Input {...register('landlordMobile')} />
                                        {errors.landlordMobile && <p className="text-red-500 text-xs mt-1">{errors.landlordMobile.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Monthly Rent (৳)</Label>
                                        <Input type="number" {...register('monthlyRent')} />
                                        {errors.monthlyRent && <p className="text-red-500 text-xs mt-1">{errors.monthlyRent.message}</p>}
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
                                <Input type="number" {...register('capitalInvestment')} />
                                <p className="text-xs text-muted-foreground">Fee depends on this amount.</p>
                                {errors.capitalInvestment && <p className="text-red-500 text-xs mt-1">{errors.capitalInvestment.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Estimated Annual Turnover (৳)</Label>
                                <Input type="number" {...register('annualTurnover')} />
                                {errors.annualTurnover && <p className="text-red-500 text-xs mt-1">{errors.annualTurnover.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Total Employees</Label>
                                <Input type="number" {...register('totalEmployees')} />
                                {errors.totalEmployees && <p className="text-red-500 text-xs mt-1">{errors.totalEmployees.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Male Employees</Label>
                                <Input type="number" {...register('maleEmployees')} />
                                {errors.maleEmployees && <p className="text-red-500 text-xs mt-1">{errors.maleEmployees.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Female Employees</Label>
                                <Input type="number" {...register('femaleEmployees')} />
                                {errors.femaleEmployees && <p className="text-red-500 text-xs mt-1">{errors.femaleEmployees.message}</p>}
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
                const businessName = watch('businessNameEn');
                const tin = watch('tinNumber');
                const peopleCount = watch('people')?.length || 0;
                
                return (
                    <div className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-4">Application Summary</h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><strong>License Type:</strong> {subtype?.replace('_', ' ')}</p>
                                <p><strong>Business Name:</strong> {businessName}</p>
                                <p><strong>TIN:</strong> {tin}</p>
                                <p><strong>Total Owners/Directors:</strong> {peopleCount}</p>
                                <Separator className="my-2" />
                                <p className="text-xs text-muted-foreground mt-2">* Click Submit to complete the application process.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-2">
                                <Controller
                                    control={control}
                                    name="declared"
                                    render={({ field }) => (
                                        <Checkbox id="declared" checked={field.value} onCheckedChange={field.onChange} />
                                    )}
                                />
                                <Label htmlFor="declared" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I hereby declare that all information provided in this application is true and correct to the best of my knowledge.
                                </Label>
                            </div>
                            {errors.declared && <p className="text-red-500 text-xs mt-1">{errors.declared.message}</p>}
                            <div className="flex items-start space-x-2">
                                <Controller
                                    control={control}
                                    name="termsAccepted"
                                    render={({ field }) => (
                                        <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />
                                    )}
                                />
                                <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the Terms and Conditions and Privacy Policy.
                                </Label>
                            </div>
                            {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted.message}</p>}
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
                <form onSubmit={handleSubmit(onSubmitForm)}>
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
