import { z } from "zod";

const bdMobileRegex = /^01[3-9]\d{8}$/;
const tinRegex = /^\d{12}$/;
const binRegex = /^(\d{9}|\d{13})$/;
const nidRegex = /^(\d{10}|\d{13}|\d{17})$/;

const personSchema = z.object({
  id: z.string(),
  fullNameEn: z.string().min(2, "Name must be at least 2 characters"),
  fullNameBn: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  nidNumber: z.string().regex(nidRegex, "NID must be 10, 13, or 17 digits"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  mobile: z.string().regex(bdMobileRegex, "Must be a valid 11-digit BD mobile number"),
  email: z.union([z.string().email("Invalid email"), z.literal('')]).optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  sameAsPresent: z.boolean().optional(),
  role: z.string().optional(),
});

export const tradeLicenseSchema = z.object({
  // Step 1: Business Information
  businessNameEn: z.string().min(2, "Business Name (En) must be at least 2 characters"),
  businessNameBn: z.string().min(2, "Business Name (Bn) must be at least 2 characters"),
  tradeCategory: z.string().optional(),
  tinNumber: z.string().regex(tinRegex, "TIN must be exactly 12 digits"),
  binNumber: z.union([z.string().regex(binRegex, "BIN must be 9 or 13 digits"), z.literal('')]).optional(),
  establishmentDate: z.string().optional(),

  // Step 2: People Information
  people: z.array(personSchema),

  // Step 3: Business Premises
  division: z.string().optional(),
  district: z.string().optional(),
  upazila: z.string().optional(),
  wardNumber: z.string().optional(),
  holdingNumber: z.string().optional(),
  road: z.string().optional(),
  area: z.string().optional(),
  postalCode: z.string().optional(),
  ownershipType: z.string().optional(),
  landlordName: z.string().optional(),
  landlordMobile: z.union([z.string().regex(bdMobileRegex, "Must be a valid 11-digit BD mobile number"), z.literal('')]).optional(),
  monthlyRent: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),

  // Step 4: Financial & Employment
  capitalInvestment: z.coerce.number({ invalid_type_error: "Must be a number" }).nonnegative("Must be a positive number"),
  annualTurnover: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  totalEmployees: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  maleEmployees: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  femaleEmployees: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),

  // Application Type
  applicationType: z.string().default('NEW'),
  previousLicenseNumber: z.string().optional(),
  previousLicenseYear: z.string().optional(),
  processingSpeed: z.string().default('NORMAL'),

  // Step 5: Documents (Soft Exit - everything here is optional)
  documentsOptional: z.boolean().optional(),

  // Agreements
  declared: z.boolean().refine(val => val === true, "You must accept the declaration"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

export type TradeLicenseFormData = z.infer<typeof tradeLicenseSchema>;
