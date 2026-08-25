# Zyra Ecosystem Integration

This package defines a lightweight integration contract for Zyra and other Sonoxo services that want to consume useful community-registry patterns without copying proprietary platform code.

## Reusable pipeline

Use `.github/workflows/node-quality-gate.yml` from a caller workflow to centralize clean install, domain verification, tests, type checking, dependency audit, and production build. Callers keep only trigger policy and any final stable status contract they require.

## Registry patterns adopted

- **Feedback Loop with AIP Evals** → capture operator/user feedback as durable evaluation inputs and use it to detect regressions.
- **DevOps for AI Products** → treat promotion as an explicit dev-to-production release path with validation before promotion.
- **Platform Governance App** → pull governance metadata into an auditable control plane rather than scattering policy across services.
- **Push-Based Events** → prefer event-driven integration at boundaries instead of constant polling when an authorized event source exists.

These are architectural patterns. Zyra does not claim to be Palantir software and this repository does not provide official Palantir support.

## Four-direction ecosystem model

### Inside

Internal Zyra modules share one quality/security contract, one ontology/policy vocabulary, and one audit vocabulary. Specialized feature workflows supply only their additional verification command.

### Outside

External services integrate through explicit API, event, registry, and artifact contracts. Untrusted external inputs remain subject to Zyra Shield admission and authorization policy.

### Upside

Upstream inputs include community-registry patterns, dependencies, model/evaluation feedback, policy definitions, and source events. Inputs are versioned and validated before they are admitted downstream.

### Downside

Downstream outputs include build artifacts, deployment candidates, AIP/agent outputs, audit evidence, telemetry, and feedback-derived evaluation cases. Promotion stops when required checks fail.

## Security contract

A successful security gate means the configured test, typecheck, dependency-audit, and build commands returned zero. Security commands must not use `continue-on-error` when they are part of the required gate.
