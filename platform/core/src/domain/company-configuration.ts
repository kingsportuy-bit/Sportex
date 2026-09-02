import type { Currency } from "./models.js";

export type CompanyResourceKind = "FABRIC_PHOTO" | "SIZE_GUIDE" | "PRODUCT_IMAGE" | "DOCUMENT";
export type SizeChartAudience = "CHILD" | "ADULT" | "UNISEX";

export interface CompanyBrandProfile {
  brandName: string;
  legalName: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  website: string | null;
  description: string | null;
}

export interface CompanyOperatingSettings {
  defaultCurrency: Currency;
  depositPercentage: number;
  defaultQuoteValidityDays: number;
  defaultLeadTimeDays: number;
  paymentMethods: string[];
  deliveryMethods: string[];
  salesTerms: string | null;
  productionNotes: string | null;
}

export interface ProductPriceTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  unitPriceCents: number;
  currency: Currency;
}

export interface CompanyProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  active: boolean;
  minimumQuantity: number;
  defaultLeadTimeDays: number;
  sizeChartId: string | null;
  priceTiers: ProductPriceTier[];
  createdAt: string;
  updatedAt: string;
}

export interface SizeChartRow {
  label: string;
  measurements: Record<string, string>;
}

export interface CompanySizeChart {
  id: string;
  name: string;
  audience: SizeChartAudience;
  notes: string | null;
  rows: SizeChartRow[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyResource {
  id: string;
  kind: CompanyResourceKind;
  name: string;
  description: string | null;
  reference: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyConfiguration {
  id: string;
  tenantId: string;
  brand: CompanyBrandProfile;
  operations: CompanyOperatingSettings;
  products: CompanyProduct[];
  sizeCharts: CompanySizeChart[];
  resources: CompanyResource[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CompanyProductInput = Omit<CompanyProduct, "createdAt" | "updatedAt">;
export type CompanySizeChartInput = Omit<CompanySizeChart, "createdAt" | "updatedAt">;
export type CompanyResourceInput = Omit<CompanyResource, "createdAt" | "updatedAt">;

export interface SaveCompanyConfigurationInput {
  brand: CompanyBrandProfile;
  operations: CompanyOperatingSettings;
  products: CompanyProductInput[];
  sizeCharts: CompanySizeChartInput[];
  resources: CompanyResourceInput[];
  expectedVersion: number;
}
