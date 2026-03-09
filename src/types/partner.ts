import type { TablesInsert } from "@/integrations/supabase/types";

/** Fields shared by both individual and company partner profiles (excluding user_id, added at insert time) */
type BasePartnerFields = Pick<
  TablesInsert<"partner_profiles">,
  "email" | "phone" | "address" | "city" | "country" | "iban"
>;

export type IndividualPartnerData = BasePartnerFields & {
  partner_type: "individual";
  first_name: string;
  last_name: string;
  personal_id?: string | null;
  bank_name: string;
  bank_address?: string | null;
  certifies_rental_rights: true;
  certifies_local_taxes: true;
};

export type CompanyPartnerData = BasePartnerFields & {
  partner_type: "company";
  company_name: string;
  organization_number: string;
  contact_person: string;
  swift: string;
  currency: string;
  certifies_company_authority: true;
};

export type PartnerProfileData = IndividualPartnerData | CompanyPartnerData;
