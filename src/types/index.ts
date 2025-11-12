export interface User {
  id: string
  email?: string
  phone?: string
  userId?: string
  role: UserRole
  status: UserStatus
  memberId?: string
  fullName?: string
  dateOfBirth?: Date
  placeOfBirth?: string
  photoUrl?: string
  birthCertificateNumber?: string
  nidNumber?: string
  passportNumber?: string
  presentAddress?: Address
  permanentAddress?: Address
  agencyName?: string
  agencyLicense?: string
  creditLimit?: number
  outstandingAmount?: number
  documentLimit?: number
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  division: string
  district: string
  upazilla: string
  thana: string
  cityCorporation: string
  houseNumber: string
  roadNumber: string
  villageName: string
}

export interface Application {
  id: string
  userId: string
  country: string
  processType: ProcessType
  profession?: Profession
  consultancyFee: number
  status: ApplicationStatus
  memberId?: string
  createdAt: Date
  updatedAt: Date
  user?: User
  documents?: Document[]
  payments?: Payment[]
  statusUpdates?: StatusUpdate[]
}

export interface Document {
  id: string
  applicationId: string
  userId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  documentType: string
  isRequired: boolean
  uploadedAt: Date
  application?: Application
  user?: User
}

export interface Payment {
  id: string
  applicationId?: string
  userId: string
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  transactionId?: string
  gatewayResponse?: any
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  application?: Application
  user?: User
}

export interface StatusUpdate {
  id: string
  applicationId: string
  status: ApplicationStatus
  message?: string
  updatedBy?: string
  createdAt: Date
  application?: Application
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  user?: User
}

export interface Country {
  id: string
  name: string
  code: string
  continent: string
  isActive: boolean
  createdAt: Date
}

export interface DocumentRequirement {
  id: string
  country: string
  processType: ProcessType
  profession?: Profession
  documentType: string
  isRequired: boolean
  description?: string
  createdAt: Date
}

export enum UserRole {
  INDIVIDUAL = 'INDIVIDUAL',
  AGENCY = 'AGENCY',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  LEGAL = 'LEGAL',
  ACCOUNTS = 'ACCOUNTS',
  CASH_OFFICER = 'CASH_OFFICER'
}

export enum UserStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  SUSPENDED = 'SUSPENDED'
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENT_UNDER_REVIEW = 'DOCUMENT_UNDER_REVIEW',
  DOCUMENT_UNDER_PROCESSING = 'DOCUMENT_UNDER_PROCESSING',
  PROCESSED = 'PROCESSED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL = 'PARTIAL'
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  MFS = 'MFS',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum ProcessType {
  TOURIST = 'TOURIST',
  CONFERENCE = 'CONFERENCE',
  MEDICAL = 'MEDICAL',
  BUSINESS = 'BUSINESS',
  SPORTS = 'SPORTS',
  VISIT = 'VISIT'
}

export enum Profession {
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  JOB_HOLDER = 'JOB_HOLDER',
  STUDENT = 'STUDENT',
  HOMEMAKER = 'HOMEMAKER',
  RETIRED = 'RETIRED'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  identifier: string
  otp: string
}

export interface RegisterForm {
  fullName: string
  phone: string
  email?: string
  dateOfBirth: string
  placeOfBirth: string
  role: UserRole
  agencyName?: string
  agencyLicense?: string
}

export interface ProfileForm {
  fullName: string
  dateOfBirth: string
  placeOfBirth: string
  photoUrl?: string
  birthCertificateNumber?: string
  nidNumber?: string
  passportNumber?: string
  presentAddress: Address
  permanentAddress: Address
}

export interface ApplicationForm {
  country: string
  processType: ProcessType
  profession?: Profession
}

// Dashboard types
export interface DashboardStats {
  totalApplications: number
  pendingApplications: number
  completedApplications: number
  totalRevenue: number
  pendingPayments: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  status: string
}

