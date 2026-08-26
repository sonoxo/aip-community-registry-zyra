import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuditJournal, runFleet } from "./core.js";
import { readFoundryEnvironment } from "./palantir.js";
import type { SwarmRequest } from "./shared.js";

const app = Fastify({ logger: true });
const journal = new AuditJournal();
const foundry = readFoundryEnvironment();
const root = path.dirname(fileURLToPath(import.meta.url));

await app.register(fastifyStatic, { root: path.resolve(root, "../web"), prefix: "/" });
app.get("/api/health", async () => ({ status:"ok", auditValid:journal.verify(), foundryConfigured:Boolean(foundry) }));
app.get("/api/audit", async () => journal.events);
app.post<{Body:SwarmRequest}>("/api/swarm/run", async (request, reply) => {
  try { return await runFleet(request.body.objective, request.body.sources ?? [], journal); }
  catch (error) { return reply.code(400).send({ error: error instanceof Error ? error.message : "Invalid request" }); }
});
app.setNotFoundHandler((request, reply) => request.url.startsWith("/api/") ? reply.code(404).send({error:"not_found"}) : reply.sendFile("index.html"));
await app.listen({ port:Number(process.env.PORT ?? 8787), host:"0.0.0.0" });
