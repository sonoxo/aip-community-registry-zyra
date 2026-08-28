import assert from "node:assert/strict";
import test from "node:test";
import { canPromoteToCuratedOntology, validatePublicIntelligenceRecord, type PublicIntelligenceRecord } from "../src/public-intelligence.js";

const validRecord: PublicIntelligenceRecord = {
  recordId: "public-source-001",
  classification: "PUBLIC/DECLASSIFIED",
  source: { publisher: "Public archive", url: "https://example.gov/public/document-001" },
  retrievedAt: "2026-08-27T20:00:00Z",
  confidence: 0.85,
  provenance: { sourceType: "public-declassified-archive", transformations: ["fetch", "normalize"] },
};

test("accepts a source-linked public intelligence record", () => {
  const result = validatePublicIntelligenceRecord(validRecord);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(canPromoteToCuratedOntology(validRecord), true);
});

test("blocks records with missing provenance and invalid confidence", () => {
  const invalid = { ...validRecord, confidence: 2, provenance: { sourceType: "", transformations: [] } } as PublicIntelligenceRecord;
  const result = validatePublicIntelligenceRecord(invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /confidence/);
  assert.match(result.errors.join(" "), /sourceType/);
});

test("requires CRS when geometry is present", () => {
  const invalid = { ...validRecord, geometry: { type: "Point", coordinates: [-77.436, 37.54] } } as PublicIntelligenceRecord;
  const result = validatePublicIntelligenceRecord(invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /coordinateReferenceSystem/);
});
