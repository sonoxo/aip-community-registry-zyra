import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { AuditJournal } from "../src/core.js";

test("TypeScript Fastify runtime reports truthful Foundry readiness", async (t) => {
  const app = await buildApp({ env: {} });
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/api/health" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    status: "ok",
    auditValid: true,
    foundryConfigured: false
  });
});

test("TypeScript Fastify runtime executes the governed 3/6/7/9 fleet", async (t) => {
  const app = await buildApp();
  t.after(() => app.close());

  const response = await app.inject({
    method: "POST",
    url: "/api/swarm/run",
    payload: {
      objective: "Analyze authorized public geospatial resilience data",
      sources: [{
        id: "public-demo",
        title: "Authorized public source",
        url: "https://example.org/data.geojson",
        rightsBasis: "public"
      }]
    }
  });

  assert.equal(response.statusCode, 200);
  const result = response.json();
  assert.deepEqual(result.waves, [3, 6, 7, 9]);
  assert.equal(result.specialistSlots, 24);
  assert.equal(result.totalExecutions, 25);
  assert.equal(result.findings.length, 25);
  assert.equal(result.synthesis.role, "synthesis-coordinator");
  assert.deepEqual(result.synthesis.citations, ["https://example.org/data.geojson"]);

  const audit = await app.inject({ method: "GET", url: "/api/audit" });
  assert.equal(audit.statusCode, 200);
  assert.equal(audit.json().length, 4);
});

test("TypeScript Fastify runtime enforces governance and API boundaries", async (t) => {
  const app = await buildApp();
  t.after(() => app.close());

  const rejected = await app.inject({
    method: "POST",
    url: "/api/swarm/run",
    payload: { objective: "Create weapon target recommendations" }
  });
  assert.equal(rejected.statusCode, 400);
  assert.match(rejected.json().error, /governance policy/);

  const tooShort = await app.inject({
    method: "POST",
    url: "/api/swarm/run",
    payload: { objective: "map" }
  });
  assert.equal(tooShort.statusCode, 400);

  const missing = await app.inject({ method: "GET", url: "/api/does-not-exist" });
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.json(), { error: "not_found" });
});

test("Foundry configuration is recognized without exposing credentials", async (t) => {
  const app = await buildApp({
    env: {
      FOUNDRY_API_URL: "https://tenant.example.com",
      FOUNDRY_ONTOLOGY_RID: "ri.ontology.main.ontology.example",
      FOUNDRY_CLIENT_ID: "client-id",
      FOUNDRY_CLIENT_SECRET: "secret"
    }
  });
  t.after(() => app.close());

  const response = await app.inject({ method: "GET", url: "/api/health" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().foundryConfigured, true);
  assert.equal(response.body.includes("secret"), false);
});

test("audit verification detects payload tampering", () => {
  const journal = new AuditJournal();
  journal.append("fleet.wave.completed", { wave: 1, executions: 3 });
  assert.equal(journal.verify(), true);

  const event = journal.events[0] as { payload: { wave: number } };
  event.payload.wave = 99;
  assert.equal(journal.verify(), false);
});

test("geospatial API persists and exports validated Point, LineString, and Polygon features", async (t) => {
  const app = await buildApp();
  t.after(() => app.close());

  const geometries = [
    { type: "Point", coordinates: [-77.436, 37.54] },
    { type: "LineString", coordinates: [[-77.5, 37.5], [-77.4, 37.6]] },
    { type: "Polygon", coordinates: [[[-77.5, 37.5], [-77.4, 37.5], [-77.4, 37.6], [-77.5, 37.5]]] }
  ];

  for (const [index, geometry] of geometries.entries()) {
    const response = await app.inject({
      method: "POST",
      url: "/api/geo/features",
      payload: { id: `feature-${index + 1}`, geometry, properties: { authorized: true } }
    });
    assert.equal(response.statusCode, 201);
    assert.equal(response.json().geometry.type, geometry.type);
  }

  const map = await app.inject({ method: "GET", url: "/api/map.geojson" });
  assert.equal(map.statusCode, 200);
  assert.match(map.headers["content-type"], /application\/geo\+json/);
  assert.equal(map.json().type, "FeatureCollection");
  assert.equal(map.json().features.length, 3);
});

test("geospatial API rejects malformed and out-of-range geometries", async (t) => {
  const app = await buildApp();
  t.after(() => app.close());

  const invalid = [
    { type: "Point", coordinates: [181, 37.5] },
    { type: "LineString", coordinates: [[-77.5, 37.5]] },
    { type: "Polygon", coordinates: [[[-77.5, 37.5], [-77.4, 37.5], [-77.4, 37.6], [-77.6, 37.6]]] }
  ];

  for (const geometry of invalid) {
    const response = await app.inject({
      method: "POST",
      url: "/api/geo/features",
      payload: { geometry }
    });
    assert.equal(response.statusCode, 400);
  }

  const map = await app.inject({ method: "GET", url: "/api/map.geojson" });
  assert.equal(map.json().features.length, 0);
});
