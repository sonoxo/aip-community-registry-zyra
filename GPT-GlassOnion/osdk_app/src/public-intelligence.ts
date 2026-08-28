export const PUBLIC_INTELLIGENCE_CLASSIFICATIONS = [
  "PUBLIC",
  "PUBLIC/DECLASSIFIED",
  "PUBLIC/UNCLASSIFIED",
] as const;

export type PublicIntelligenceClassification =
  (typeof PUBLIC_INTELLIGENCE_CLASSIFICATIONS)[number];

export interface PublicIntelligenceRecord {
  recordId: string;
  classification: PublicIntelligenceClassification;
  source: {
    publisher: string;
    url: string;
    documentId?: string | null;
    publishedAt?: string | null;
    sourceHash?: string | null;
  };
  retrievedAt: string;
  observedAt?: string | null;
  confidence: number;
  provenance: {
    sourceType: string;
    transformations: string[];
    derivedFrom?: string[];
    citations?: string[];
  };
  geometry?: unknown;
  coordinateReferenceSystem?: string | null;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const allowed = new Set<string>(PUBLIC_INTELLIGENCE_CLASSIFICATIONS);

export function validatePublicIntelligenceRecord(
  record: PublicIntelligenceRecord,
): ValidationResult {
  const errors: string[] = [];

  if (!record.recordId?.trim()) errors.push("recordId is required");
  if (!allowed.has(record.classification)) {
    errors.push("classification must be public, declassified, or unclassified");
  }
  if (!record.source?.publisher?.trim()) errors.push("source.publisher is required");

  try {
    const url = new URL(record.source?.url ?? "");
    if (url.protocol !== "https:") errors.push("source.url must use HTTPS");
  } catch {
    errors.push("source.url must be a valid URL");
  }

  if (!record.retrievedAt || Number.isNaN(Date.parse(record.retrievedAt))) {
    errors.push("retrievedAt must be an ISO-compatible timestamp");
  }

  if (!Number.isFinite(record.confidence) || record.confidence < 0 || record.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }

  if (!record.provenance?.sourceType?.trim()) {
    errors.push("provenance.sourceType is required");
  }
  if (!Array.isArray(record.provenance?.transformations)) {
    errors.push("provenance.transformations must be an array");
  }

  if (record.geometry && !record.coordinateReferenceSystem) {
    errors.push("coordinateReferenceSystem is required when geometry is present");
  }

  return { valid: errors.length === 0, errors };
}

export function canPromoteToCuratedOntology(
  record: PublicIntelligenceRecord,
): boolean {
  return validatePublicIntelligenceRecord(record).valid;
}
