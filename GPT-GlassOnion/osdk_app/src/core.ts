import { createHash, randomUUID } from "node:crypto";
import { WAVE_SIZES, type Finding, type SourceRef, type SwarmResult } from "./shared.js";

const blocked = [/weapon target/i,/covert surveillance/i,/facial tracking/i,/credential bypass/i,/autonomous force/i];
const roles = ["quantum-concepts","quantum-algorithms","physics-skeptic","geospatial-modeler","geojson-validator","spatial-statistician","ontology-architect","knowledge-engineer","data-engineer","provenance-auditor","source-critic","uncertainty-analyst","privacy-reviewer","security-reviewer","accessibility-reviewer","climate-analyst","infrastructure-planner","emergency-support","logistics-analyst","public-policy-analyst","visualization-designer","test-engineer","zyra-integrator","red-team-reviewer"] as const;

export class AuditJournal {
  readonly events: ReadonlyArray<Record<string, unknown>> = [];
  append(type: string, payload: Record<string, unknown>) {
    const previousHash = (this.events.at(-1)?.hash as string | undefined) ?? "GENESIS";
    const unsigned = { id: randomUUID(), at: new Date().toISOString(), type, payload, previousHash };
    const event = Object.freeze({ ...unsigned, hash: createHash("sha256").update(JSON.stringify(unsigned)).digest("hex") });
    (this.events as Array<typeof event>).push(event); return event;
  }
  verify() { return this.events.every((event, i) => event.previousHash === (i ? this.events[i - 1].hash : "GENESIS")); }
}

export async function runFleet(objective: string, sources: SourceRef[] = [], journal = new AuditJournal()): Promise<SwarmResult> {
  objective = objective.trim();
  if (objective.length < 8 || blocked.some(rule => rule.test(objective))) throw new Error("Objective rejected by governance policy");
  const findings: Finding[] = []; let slot = 0;
  for (const [waveIndex, size] of WAVE_SIZES.entries()) {
    for (let i = 0; i < size; i++) {
      slot += 1; const role = slot === 25 ? "synthesis-coordinator" : roles[slot - 1];
      findings.push({ role, summary: `${role} assessed: ${objective}`, confidence: 0.65, citations: sources.slice(0, 3).map(s => s.url) });
    }
    journal.append("fleet.wave.completed", { wave: waveIndex + 1, executions: size });
  }
  return { objective, waves: WAVE_SIZES, specialistSlots: 24, totalExecutions: 25, findings, synthesis: findings.at(-1)! };
}
