import type { GarmentTypeId } from './taxonomy';

export type EvidenceBasis = 'manufacturer' | 'label' | 'measurement' | 'estimate';
export type SourceKind = 'manufacturer' | 'retailer' | 'label' | 'laboratory';
export interface CatalogSource {
  id: string;
  kind: SourceKind;
  title: string;
  url: string;
  accessedAt: string;
}
export interface FieldEvidence {
  field: 'name' | 'technical' | 'composition' | 'gsm' | 'warmth' | 'waterResistance' | 'windResistance' | 'breathability';
  sourceId: string;
  basis: EvidenceBasis;
  note?: string;
}
export interface FabricComponent {
  part: 'shell' | 'lining' | 'fill';
  fibers: { name: string; percent: number }[];
}
export interface CatalogFacts {
  composition: FabricComponent[] | null;
  gsm: number | null;
  warmth: 1 | 2 | 3 | 4 | 5 | null;
  waterResistance: 'none' | 'repellent' | 'waterproof' | null;
  windResistance: 'low' | 'medium' | 'high' | null;
  breathability: 'low' | 'medium' | 'high' | null;
}
export interface CatalogVariant {
  id: string;
  gtin: string | null; // Canonical 14 digits, validated checksum; no manufactured GTINs.
  size: string | null;
  color: string | null;
  sku: string | null;
}
export interface CatalogOffer {
  id: string;
  variantId: string;
  sourceId: string;
  country: string;
  currency: string;
  price: number;
  checkedAt: string;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
}
export interface CatalogProduct {
  id: string;
  garmentTypeId: GarmentTypeId;
  brand: string;
  model: string;
  name: { tr: string; en: string };
  productUrl: string;
  technical: boolean | null; // Independent of price segment; null = not established.
  facts: CatalogFacts;
  evidence: FieldEvidence[];
  variants: CatalogVariant[];
  offers: CatalogOffer[];
}
export interface CatalogImport {
  version: 1;
  sources: CatalogSource[];
  products: CatalogProduct[];
}
