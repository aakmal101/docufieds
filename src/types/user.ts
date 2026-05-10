import { User, IndividualProfile, AgencyProfile, SupportProfile } from '@prisma/client'

export interface AppUser extends User {
  individualProfile: IndividualProfile | null
  agencyProfile: AgencyProfile | null
  supportProfile: SupportProfile | null
}
