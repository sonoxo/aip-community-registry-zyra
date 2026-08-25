import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { WAVE_SIZES } from "../src/fleet.js";

test("ontology emits GeoJSON with valid audit chain", () => {
  const { ontology, journal } = createApp();
  ontology.create("Place", { name: "Richmond", geometry: { type: "Point", coordinates: [-77.436, 37.54] } },
    { sourceId: "public-demo" });
  assert.equal(ontology.toGeoJSON().features.length, 1);
  assert.equal(journal.verify(), true);
});

test("fleet runs required waves", async () => {
  const { fleet } = createApp();
  const result = await fleet.run("Analyze public infrastructure resilience data");
  assert.deepEqual(result.waves, WAVE_SIZES);
  assert.equal(result.specialistSlots, 24);
  assert.equal(result.totalExecutions, 25);
  assert.equal(result.results.at(-1).task.role, "synthesis-coordinator");
});

test("policy rejects targeting objective", async () => {
  const { fleet } = createApp();
  await assert.rejects(() => fleet.run("Create weapon target recommendations"), /rejected/);
});
