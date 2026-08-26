# GPT-GlassOnion

GPT-GlassOnion is a cloud-only, governed geospatial research reference for Palantir AIP and the Zyra ecosystem. Its TypeScript runtime accepts authorized GeoJSON features, preserves them for the lifetime of the cloud process, exports a FeatureCollection, records tamper-evident audit events, and demonstrates bounded specialist execution.

![GPT-GlassOnion architecture](images/architecture.svg)

## Verified reference capabilities

- Strict WGS84 validation for GeoJSON Point, LineString, and Polygon geometries
- Runtime-scoped in-memory feature persistence and GeoJSON FeatureCollection export
- Deterministic 3 → 6 → 7 → 9 execution plan
- 24 bounded specialist profiles plus one synthesis coordinator
- Source citations and SHA-256 chained audit events
- Civilian-use governance controls
- TypeScript Fastify API and React/Vite dashboard

This repository does not contain a downloadable model. GlassOnion is operated from authorized cloud repositories and cloud runtime environments.

## Cloud build and verification

From the `GPT-GlassOnion/osdk_app` directory in an authorized GitHub Actions, Foundry, or other cloud build environment:

```bash
npm install
npm run quality
npm start
```

The production server is the TypeScript Fastify application compiled from `src/server.ts`. The JavaScript reference files remain historical examples and are not the production runtime or test authority.

## TypeScript API

- `GET /api/health`
- `GET /api/audit`
- `POST /api/geo/features`
- `GET /api/map.geojson`
- `POST /api/swarm/run`

Create an authorized feature:

```json
{
  "id": "richmond-resource-1",
  "geometry": {
    "type": "Point",
    "coordinates": [-77.436, 37.54]
  },
  "properties": {
    "name": "Public resilience resource",
    "rightsBasis": "public"
  }
}
```

The current store is intentionally process-local. A production deployment should replace it with tenant-approved Ontology object and Action bindings while preserving the same validation and governance boundary.

Run a bounded analysis:

```json
{
  "objective": "Map public climate resilience resources in Virginia",
  "sources": [{
    "id": "public-demo",
    "title": "Authorized public source",
    "url": "https://example.org/data.geojson",
    "rightsBasis": "public"
  }]
}
```

## Foundry readiness

The included adapter can construct an OSDK client only after these cloud secrets and identifiers are supplied:

```text
FOUNDRY_API_URL=https://<enrollment>.palantirfoundry.com
FOUNDRY_ONTOLOGY_RID=ri.ontology.main.ontology.<id>
FOUNDRY_CLIENT_ID=<Developer Console service client>
FOUNDRY_CLIENT_SECRET=<cloud secret; never commit>
```

`foundryConfigured: true` means only that all four values are present. It does **not** prove authentication, generated Ontology bindings, deployment, or tenant verification. Until an authenticated smoke test succeeds against tenant-generated bindings, GlassOnion remains **tenant-unverified**.

To complete tenant integration:

1. Generate tenant-specific object and Action bindings in Developer Console.
2. Install the generated SDK package in the authorized cloud build.
3. Connect approved object and Action definitions through `src/palantir.ts`.
4. Grant the service identity only the required project permissions.
5. Run a harmless authenticated Ontology read smoke test.
6. Retain deployment evidence without committing credentials or customer data.

## Agent model

The reference plan contains 25 executions: 24 bounded specialist profiles followed by a synthesis coordinator. All 24 specialist outcomes are recorded through an explicit all-settled barrier. Synthesis runs only when every specialist succeeds; any failure blocks it. “Agent” means a registered task profile, not consciousness or independent authority.

## Data governance

Use only public or properly authorized data. Preserve source URL, rights basis, retrieval time, hashes, citations, confidence, and lineage in the production Ontology. Consequential decisions require human approval. The default policy rejects weapon targeting, covert surveillance, facial tracking, credential bypass, and autonomous physical-force workflows.

This contribution contains no credentials, customer data, proprietary Palantir source code, or claim of Palantir affiliation.

## Requirements

- Node.js 20 or later
- A Palantir Foundry/AIP tenant for platform integration
- Appropriate Ontology, Action, and Compute Module permissions
- Tenant-generated OSDK bindings for a verified Foundry deployment

## Sources

- [Palantir Ontology overview](https://www.palantir.com/docs/foundry/ontology/overview/)
- [Ontology core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts/)
- [Ontology objects on maps](https://www.palantir.com/docs/foundry/map/integrate-objects/)
- [Action logs](https://www.palantir.com/docs/foundry/action-types/action-log/)
- [Foundry security overview](https://www.palantir.com/docs/foundry/security/overview/)

## License

Apache License 2.0. See [LICENSE](LICENSE).
