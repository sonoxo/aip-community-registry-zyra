# GPT-GlassOnion Public Intelligence Layer

GPT-GlassOnion v0.3 extends the governed GEOINT stack with a provenance-first pipeline for **public, declassified, and unclassified** sources.

## Invariant

> **NO INTELLIGENCE ASSERTION WITHOUT SOURCE + TIME + PROVENANCE + CONFIDENCE.**

A record can enter the curated ontology only when it passes the runtime gate in `osdk_app/src/public-intelligence.ts`.

Required evidence:

- allowed public classification;
- publisher and HTTPS source URL;
- retrieval timestamp;
- confidence from `0` to `1`;
- provenance source type and transformation history;
- coordinate reference system whenever geometry is present.

## Source families

`intel/sources.json` currently registers public reference corpora from the CIA FOIA Electronic Reading Room, CIA Center for the Study of Intelligence, NGA public resources, and NGA GWG public standards.

Their inclusion is for public-source research only and does not imply sponsorship, endorsement, privileged access, or government affiliation.

## Pipeline

```text
PUBLIC / DECLASSIFIED / UNCLASSIFIED SOURCE
                  ↓
          source registry
                  ↓
      raw record + retrieval metadata
                  ↓
        provenance normalization
                  ↓
       runtime validation gate
                  ↓
      entity / relation extraction
                  ↓
         GEOINT semantic layer
                  ↓
           curated dataset
                  ↓
       Foundry mapping contract
                  ↓
       ontology objects + links
                  ↓
          human-reviewed output
```

## Foundry status

`intel/foundry-ontology-map.json` defines a tenant-neutral mapping for `Source`, `Document`, `Observation`, `GEOINTEntity`, `Place`, `Dataset`, `AnalyticAssessment`, `GEOINTStandard`, `ProvenanceRecord`, and `ConfidenceAssessment`.

This is **integration-ready, not tenant-verified**. Deployment still requires authorized tenant-generated OSDK bindings, least-privilege service credentials stored as secrets, and a harmless authenticated verification read.

## Boundary

The layer must not infer classified capabilities from redactions or omissions, bypass access controls, commit credentials/customer data, perform biometric identification or persistent individual tracking, support weapon targeting/autonomous physical force, or represent GPT-GlassOnion/VA3LM/Zyra/Sonoxo as an official government organization.
