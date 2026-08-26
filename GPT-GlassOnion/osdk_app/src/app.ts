import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { AuditJournal, runFleet } from "./core.js";
import { readFoundryEnvironment } from "./palantir.js";
import type { SwarmRequest } from "./shared.js";

export interface BuildAppOptions {
  env?: NodeJS.ProcessEnv;
  journal?: AuditJournal;
  logger?: boolean;
  serveStatic?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  const journal = options.journal ?? new AuditJournal();
  const foundry = readFoundryEnvironment(options.env ?? process.env);

  if (options.serveStatic) {
    await app.register(fastifyStatic, {
      root: path.resolve(process.cwd(), "dist/web"),
      prefix: "/"
    });
  }

  app.get("/api/health", async () => ({
    status: "ok",
    auditValid: journal.verify(),
    foundryConfigured: Boolean(foundry)
  }));

  app.get("/api/audit", async () => journal.events);

  app.post<{ Body: SwarmRequest }>("/api/swarm/run", async (request, reply) => {
    try {
      return await runFleet(request.body.objective, request.body.sources ?? [], journal);
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Invalid request"
      });
    }
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/") || !options.serveStatic) {
      return reply.code(404).send({ error: "not_found" });
    }
    return reply.sendFile("index.html");
  });

  return app;
}
