# GPT-GlassOnion Public Intelligence Layer

This layer extends GlassOnion with a provenance-first pipeline for public, declassified, and unclassified source material.

## Core invariant

> **NO INTELLIGENCE ASSERTION WITHOUT SOURCE + TIME + PROVENANCE + CONFIDENCE.**

A record is eligible for the curated ontology only when it has:

1. An allowed classification: `PUBLIC`, `PUBLIC/DECLASSIFIED`, or `PUBLIC/UNCLASSIFIED`.
2. A source publisher and HTTPS source URL.
3. A retrieval timestamp.
4. A confidence value from `0` through `1`.
5. A provenance record describing source type and transformations.
6. A coordinate reference system whenever geometry is present.

## Initial public source families

The repository includes a source registry for:

- CIA FOIA Electronic Reading Room — public/declassified archive material.
- CIA Center for the Study of Intelligence — public/unclassified scholarship.
- NGA public resources.
- NGA Geospatial Intelligence Standards Working Group public standards resources.

These sources are used as public reference corpora only. Their inclusion does not imply sponsorship, endorsement, access to non-public systems, or affiliation with any government organization.

## Semantic pipeline

```text
PUBLIC / DECLASSIFIED / UNCLASSIFIED SOURCE
                  ↓
          Source registry
                  ↓
     Raw source + retrieval metadata
                  ↓
        Provenance normalization
                  ↓
    PublicIntelligenceRecord validator
                  ↓
     Entity / relationship extraction
                  ↓
        GEOINT semantic ontology
                  ↓
          Curated dataset
                  ↓
      Foundry mapping contract
                  ↓
      Ontology objects + links
                  ↓
        Human-reviewed output
```

## Foundry mapping

`intel/foundry-ontology-map.json` defines a tenant-neutral mapping contract for these object types:

- `Source`
- `Document`
- `Observation`
- `GEOINTEntity`
- `Place`
- `Dataset`
- `AnalyticAssessment`
- `GEOINTStandard`
- `ProvenanceRecord`
- `ConfidenceAssessment`

The contract is **integration-ready, not tenant-verified**. Actual deployment still requires authorized tenant-generated OSDK bindings, credentials held in cloud secrets, and a harmless authenticated verification read.

## Files

- `intel/sources.json` — source registry and public-source policy.
- `intel/public-intelligence.schema.json` — portable JSON Schema.
- `intel/geoint-public.ttl` — RDF/OWL semantic vocabulary.
- `intel/foundry-ontology-map.json` — Foundry object/link mapping contract.
- `osdk_app/src/public-intelligence.ts` — runtime validation gate.
- `osdk_app/test/public-intelligence.test.ts` — governance tests.
- `va3lm-geovision.json` — VA3LM/GeoVision integration profile.

## Boundary conditions

Do not:

- infer classified capabilities from redactions, omissions, or unavailable material;
- scrape credentials or bypass access controls;
- commit Foundry credentials or customer data;
- describe GPT-GlassOnion, VA3LM, Zyra, Sonoxo, or related namespaces as an official U.S. government organization;
- use this layer for biometric identification, persistent individual tracking, weapon targeting, or autonomous physical-force workflows.

The design objective is auditable public-source research and geospatial knowledge engineering with explicit uncertainty and human review.
