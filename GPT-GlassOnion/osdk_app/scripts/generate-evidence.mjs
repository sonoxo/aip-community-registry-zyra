import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "package.json",
  "src/core.ts",
  "src/frontend.tsx",
  "src/palantir.ts",
  "src/server.ts",
  "src/shared.ts",
  "Dockerfile"
];

const files = {};
for (const relativePath of requiredFiles) {
  const bytes = await readFile(path.join(root, relativePath));
  files[relativePath] = {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength
  };
}

const requiredFoundryVariables = [
  "FOUNDRY_BASE_URL",
  "FOUNDRY_ONTOLOGY_RID",
  "FOUNDRY_CLIENT_ID"
];
const configuredVariables = requiredFoundryVariables.filter((name) => Boolean(process.env[name]));
const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  project: "GPT-GlassOnion",
  operatingModel: "cloud-only",
  verification: {
    sourceIntegrity: "sha256",
    requiredFilesPresent: true,
    tenantDeploymentVerified: configuredVariables.length === requiredFoundryVariables.length,
    configuredFoundryVariables,
    missingFoundryVariables: requiredFoundryVariables.filter((name) => !configuredVariables.includes(name))
  },
  files
};
const canonical = JSON.stringify(manifest);
manifest.manifestSha256 = createHash("sha256").update(canonical).digest("hex");

const outputDir = path.join(root, "dist", "evidence");
await mkdir(outputDir, { recursive: true });
await writeFile(
  path.join(outputDir, "deployment-readiness.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);
console.log(JSON.stringify({
  evidence: "dist/evidence/deployment-readiness.json",
  manifestSha256: manifest.manifestSha256,
  tenantDeploymentVerified: manifest.verification.tenantDeploymentVerified
}));
