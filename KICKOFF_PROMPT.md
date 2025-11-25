# CodeGen Project Kickoff Prompt

**Use this prompt to begin Phase 0 implementation with AI code generator agents**

---

## Master Kickoff Prompt

```
You are a specialized AI code generator agent tasked with implementing the
Custom Code Generator platform - a Fastify 5-based microservice that generates
production code from YAML specifications.

PROJECT OVERVIEW:
- Name: Custom Code Generator (CodeGen)
- Duration: 5-7 months (11 phases)
- Architecture: Fastify 5 microservice with pnpm monorepo
- Object Storage: MinIO (S3-compatible)
- Database: PostgreSQL
- Template Engine: Handlebars with deterministic helpers
- Agent Integration: MCP (Model Context Protocol)

YOUR IMMEDIATE TASK: Phase 0 - Foundation & Scaffolding

PHASE 0 OBJECTIVES:
1. Set up pnpm workspace with 17 packages
2. Create base Fastify 5 service
3. Configure CI/CD with GitHub Actions
4. Establish project structure and conventions

CRITICAL REQUIREMENTS:
- TypeScript strict mode (noUncheckedIndexedAccess, exactOptionalPropertyTypes)
- 90%+ code coverage for all packages
- All packages must extend ../../tsconfig.base.json
- Use pnpm workspaces (NOT npm)
- Multi-tenant architecture (tenant_id in all queries)
- No hardcoded data or mocking of internal services

DOCUMENTATION TO REFERENCE:
- Main Plan: CODEGEN_IMPLEMENTATION_PLAN.md (read Phase 0 sections)
- Quick Start: AGENT_QUICK_START.md (understand execution strategy)
- Project Structure: See "Project Structure" section below

PHASE 0 TASKS (in order):

Task 0.1: Workspace Setup
  - Initialize pnpm-workspace.yaml at project root
  - Create tsconfig.base.json extending AppGen standards
  - Set up root scripts: build, test, dev, lint
  - Configure ESLint, Prettier, TypeScript for monorepo
  - Add workspace dependencies: typescript, vitest, tsx
  ✓ Acceptance: Workspace builds, linting passes, 17 packages discoverable

Task 0.2: Codegen Service Scaffold
  - Create apps/codegen-service/ directory
  - Implement Fastify 5 bootstrap in src/main.ts
  - Add GET /health endpoint returning { status: 'ok' }
  - Configure Pino logger with structured JSON output
  - Setup environment variables via @appgen/config pattern
  - Create Dockerfile (multi-stage build)
  - Create docker-compose.yml with postgres + redis + minio
  ✓ Acceptance: docker-compose up works, curl localhost:3000/health returns 200

Task 0.3: Package Scaffolds (17 packages total)
  Create packages with standard structure:
  - packages/codegen-core/
  - packages/codegen-pipeline/
  - packages/codegen-template-engine/
  - packages/codegen-validator/
  - packages/codegen-sandbox/
  - packages/codegen-artifact-store/
  - packages/codegen-provenance/
  - packages/codegen-registry/
  - packages/codegen-mcp-protocol/
  - packages/codegen-composition/
  - packages/codegen-auth/
  - packages/codegen-git-integration/
  - packages/codegen-diff/
  - packages/codegen-metrics/
  - packages/codegen-graph/
  - packages/codegen-cli/
  - packages/codegen-sdk/

  Each package needs:
  - package.json (with proper naming @appgen/codegen-*)
  - tsconfig.json (extending ../../tsconfig.base.json)
  - tsup.config.ts (for builds)
  - vitest.config.ts (for tests)
  - src/index.ts (main entry point)
  - README.md (package purpose)
  ✓ Acceptance: All packages build, linting passes

Task 0.4: CI/CD Foundation
  - Create .github/workflows/ci.yml
  - Include: lint, build, test, coverage check (90%+ threshold)
  - Configure branch protection rules
  - Setup PR checks
  ✓ Acceptance: CI passes on empty packages

Task 0.5: Documentation Structure
  - Create docs/ directory
  - Add documentation stubs:
    - docs/architecture.md
    - docs/api-reference.md
    - docs/generator-development-guide.md
    - docs/mcp-protocol.md
  - Document workspace structure and conventions
  ✓ Acceptance: Documentation stubs in place

TECHNICAL SPECIFICATIONS:

TypeScript Configuration (tsconfig.base.json):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Fastify Service Structure (apps/codegen-service/):
```
src/
├── main.ts              # Bootstrap entry point
├── config/              # Configuration loading
├── routes/              # HTTP API routes
├── plugins/             # Fastify plugins
├── mcp/                 # MCP protocol handlers (Phase 5)
├── middleware/          # Custom middleware
└── types/               # TypeScript type definitions
```

Package Structure (packages/{name}/):
```
src/
├── index.ts             # Main export
├── types.ts             # Type definitions
├── *.ts                 # Implementation
└── __tests__/           # Unit tests
tests/                   # Integration tests
README.md                # Documentation
package.json
tsconfig.json
tsup.config.ts
vitest.config.ts
```

Docker Compose Services:
- codegen-service (Fastify app, port 3000)
- postgres (database, port 5432)
- redis (caching, port 6379)
- minio (object storage, ports 9000/9001)

Pnpm Workspace Configuration (pnpm-workspace.yaml):
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

CONVENTIONS:

File Naming:
- Files: kebab-case (user-service.ts)
- Classes: PascalCase (UserService)
- Functions: camelCase (validateEmail)
- Specs: {kind}.{domain}.{name}.v{version}.yaml

Code Patterns:
- Import Node.js modules with: import * as fs from 'fs/promises'
- Use AppgenError from @appgen/error-taxonomy for errors
- Use Pino for logging with structured JSON
- All I/O must be async (no fs.readFileSync)
- Tenant isolation required: all DB queries include tenant_id

Testing:
- Framework: Vitest
- Location: src/__tests__/*.test.ts (unit), tests/*.test.ts (integration)
- Coverage: 90%+ required
- Use real database/redis in integration tests (not mocks)
- Mock only external dependencies (APIs, providers)

BUILD & RUN COMMANDS:

Root level (pnpm in project root):
```bash
pnpm install              # Install all dependencies
pnpm run build           # Build all packages
pnpm run test            # Run all tests
pnpm run lint            # Run ESLint
pnpm run type-check      # Run TypeScript check

# Start services
docker-compose up -d     # Start postgres, redis, minio
pnpm -F codegen-service dev  # Start Fastify server
```

DECISION GATES:
None for Phase 0 - this is foundation only.

BLOCKING RELATIONSHIPS:
Phase 0 blocks all other phases. Must be 100% complete before Phase 1.

SUCCESS CRITERIA:
✅ Pnpm workspace builds successfully
✅ All 17 packages scaffold correctly
✅ Fastify service runs and responds to health check
✅ Docker-compose brings up all services
✅ ESLint passes on all code
✅ TypeScript compilation succeeds
✅ CI/CD pipeline runs successfully
✅ Documentation structure in place

DELIVERABLES:
- apps/codegen-service/ with working Fastify 5 bootstrap
- packages/ with 17 scaffolded packages
- pnpm-workspace.yaml configured
- docker-compose.yml with all required services
- .github/workflows/ci.yml for automated testing
- docs/ with documentation structure
- Root-level build, test, lint, dev scripts

START EXECUTION:
Begin with Task 0.1 (Workspace Setup)
Complete tasks in order: 0.1 → 0.2 → 0.3 → 0.4 → 0.5
Report progress after each task completion
Mark task complete only when acceptance criteria are met

REFERENCES:
- CODEGEN_IMPLEMENTATION_PLAN.md (full details, Phase 0 sections)
- AGENT_QUICK_START.md (execution strategies)
- MINIO_INTEGRATION_NOTES.md (storage configuration)
- CLAUDE.md (AppGen project conventions)

You have all the information needed to complete Phase 0.
Begin with Task 0.1 immediately and report completion of each subtask.
```

---

## Phase-Specific Kickoff Prompts

### Phase 1: Core Generation Engine

```
Phase 0 is complete. You are now starting Phase 1: Core Generation Engine.

PHASE 1 OBJECTIVES (2-3 weeks, 6 tasks):
✅ 1.1 - Implement GeneratorManager class (codegen-core)
✅ 1.2 - Define GeneratorManifest schema and validation (codegen-registry)
✅ 1.3 - Create GenerationResult types with pipeline tracing (codegen-core)
✅ 1.4 - Implement hardcoded "hello-world" generator example
✅ 1.5 - Expose HTTP API routes (Generator listing, generation)
✅ 1.6 - Build CLI tool for generator interaction (codegen-cli)

CRITICAL REQUIREMENTS:
- You have 6 tasks (1.1 through 1.6)
- Estimated duration: 2-3 weeks
- 90%+ code coverage required
- Follow Phase 0 conventions: TypeScript strict mode, tenant isolation, async I/O
- No hardcoded data; all configuration from environment

BLOCKING RELATIONSHIPS:
- Tasks 1.1 and 1.2 are prerequisites for 1.3-1.6
- Task 1.5 requires 1.3 complete
- Task 1.6 can run parallel with others

START WITH: Task 1.1 - Generator Manager (packages/codegen-core/)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 1 section

Success: Can POST to /api/generate and get generated hello.ts file
Next Phase: Phase 2 (Template System & Validation)
```

### Phase 2: Template System & Validation

```
Phase 1 is complete. You are now starting Phase 2: Template System & Validation.

PHASE 2 OBJECTIVES (2-3 weeks, 7 tasks):
✅ 2.0 - Implement Pipeline Execution Engine (codegen-pipeline)
✅ 2.1 - Create Handlebars Template Engine with deterministic rendering
✅ 2.2 - Implement standard helper library
✅ 2.3 - Add template validation
✅ 2.4 - Add input spec validation
✅ 2.5 - Add output validation + Auto-Fix Mode
✅ 2.6 - Integrate pipeline into generation workflow
✅ 2.7 - Create workflow-handler generator example

⚠️  CRITICAL DECISION GATE: Determinism Verification
After completing Task 2.1 (Template Engine):
  - Run same template 10 times, verify IDENTICAL output
  - Test with various helpers: case conversion, formatting, code generation
  - Check for non-deterministic patterns: Date, Math.random, object iteration
  - If ANY test fails → HALT and redesign TemplateEngine before proceeding

BLOCKING RELATIONSHIPS:
- Task 2.0 (Pipeline) can start immediately
- Tasks 2.1-2.5 depend on 2.0
- Task 2.6 requires 2.1-2.5 complete
- Task 2.7 (generator example) can run parallel

NEW FEATURES IN THIS PHASE:
- Pipeline Definition: Extensible generation steps (Phase 1-2 feature)
- Auto-Fix Mode: Automatic error correction (Phase 2 feature)
- Deterministic Rendering: No randomness/timestamps

START WITH: Task 2.0 - Pipeline Execution Engine (codegen-pipeline)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 2 section

DETERMINISM TEST (Critical):
template.render(context) === template.render(context) // MUST be true
Run 10 iterations, all must match exactly.

Success: Real Handlebars templates work, pipeline executes, auto-fix corrects errors
Next Phase: Phase 3 (Artifact Storage & Versioning)
```

### Phase 3: Artifact Storage & Versioning

```
Phase 2 is complete. You are now starting Phase 3: Artifact Storage & Versioning.

PHASE 3 OBJECTIVES (2-3 weeks, 7 tasks):
✅ 3.1 - Artifact Store Core (codegen-artifact-store) + Idempotency Keys
✅ 3.2 - Content-Addressable Storage
✅ 3.3 - MinIO Integration (S3-compatible object storage)
✅ 3.4 - PostgreSQL Metadata Store + Idempotency Logic
✅ 3.5 - Artifact Retrieval API (GET /api/artifacts/:id)
✅ 3.6 - Generator Provenance Tracking (codegen-provenance)
✅ 3.7 - Versioning & Upgrades

NEW FEATURES IN THIS PHASE:
- Idempotency Keys: Safe retries, request deduplication (Phase 3 feature)
- Generator Provenance: Complete reproducibility tracking (Phase 3 feature)
- Content-Addressed Storage: File deduplication by hash

MINIO CONFIGURATION:
- Endpoint: process.env.MINIO_ENDPOINT (default: minio)
- Port: process.env.MINIO_PORT (default: 9000)
- Access Key: process.env.MINIO_ACCESS_KEY
- Secret Key: process.env.MINIO_SECRET_KEY
- Bucket: codegen-artifacts
- See: MINIO_INTEGRATION_NOTES.md for full setup

BLOCKING RELATIONSHIPS:
- Task 3.1 can start immediately (MinIO already in docker-compose)
- Tasks 3.2-3.5 depend on 3.1
- Task 3.6 (Provenance) depends on 3.1
- Task 3.7 (Versioning) depends on 3.4

START WITH: Task 3.1 - Artifact Store Core (codegen-artifact-store)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 3 section

Idempotency Implementation:
- Compute key from (generatorId + spec + options)
- Check if key exists in database before generating
- Return cached result if complete (HTTP 200)
- Return 409 Conflict if in-progress

Provenance Tracking:
- Capture generator version, template hashes, helper versions
- Record pipeline execution steps
- Store environment info (node version, timestamp)
- Sign provenance with Ed25519 (Phase 7)

Success: Artifacts stored in MinIO, retrieved via API, idempotency working
Next Phase: Phase 4 (Sandbox Execution & Testing)
Can Parallelize: Phase 4 (both can run simultaneously after Phase 2)
```

### Phase 4: Sandbox Execution & Testing

```
Phase 2 is complete. You are now starting Phase 4: Sandbox Execution & Testing.

PHASE 4 OBJECTIVES (2-3 weeks, 7 tasks):
✅ 4.1 - Sandbox Executor Core (codegen-sandbox) with Docker
✅ 4.2 - Sandbox Images (multi-language: TypeScript, Python, Java)
✅ 4.3 - Test Execution (TestRunner for Vitest/Pytest/JUnit)
✅ 4.4 - Build/Compile Execution (BuildRunner)
✅ 4.5 - Golden Tests Framework
✅ 4.6 - Integration Tests for Generators
✅ 4.7 - API for Testing

SANDBOX ISOLATION REQUIREMENTS:
- Run containers as non-root user
- Resource limits: 1 CPU, 2GB RAM, 1GB disk, 5 min timeout
- Network: loopback only (no external network)
- File system: read-only artifact mount, /tmp writable

GOLDEN TEST FORMAT:
generators/<name>/tests/golden/
  ├── case-1/
  │   ├── input.json
  │   └── expected/
  │       ├── file1.ts
  │       └── file2.ts
  └── case-2/...

BLOCKING RELATIONSHIPS:
- Task 4.1 can start after Phase 2
- Tasks 4.2-4.7 depend on 4.1
- Task 4.5 (Golden tests) requires generator examples from Phase 1-2

START WITH: Task 4.1 - Sandbox Executor Core (codegen-sandbox)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 4 section

Sandbox Images:
- sandbox-typescript:latest (Node.js, TypeScript, pnpm)
- sandbox-python:latest (Python, pip)
- sandbox-java:latest (Java, Maven)

Success: Generated code runs in sandbox, tests pass, golden tests guard regressions
Next Phase: Phase 5 (MCP Interface & Agent Integration) ← CRITICAL FOR AGENTS
Can Parallelize: Phase 3 (both can run simultaneously after Phase 2)
```

### Phase 5: MCP Interface & Agent Integration ⭐ CRITICAL

```
Phases 0-4 complete. You are now starting Phase 5: MCP Interface & Agent Integration.

⭐ THIS IS THE CRITICAL PHASE FOR AI AGENT INTEGRATION ⭐

PHASE 5 OBJECTIVES (2 weeks, 6 tasks):
✅ 5.1 - MCP Protocol Package (codegen-mcp-protocol)
✅ 5.2 - MCP Tool Definitions (8 tools for agents)
✅ 5.3 - MCP Route Handler (POST /mcp endpoint)
✅ 5.4 - MCP Client SDK (TypeScript + Python)
✅ 5.5 - MCP Documentation + Examples
✅ 5.6 - CLI MCP Mode (codegen mcp <tool>)

MCP TOOLS AGENTS WILL USE:
1. listGenerators - List all available generators
2. getGeneratorManifest - Get generator details
3. validateSpec - Validate input before generation
4. previewGenerate - Show what will be generated (no save)
5. generateArtifact - Generate and save artifact (with idempotency)
6. testGenerator - Run tests on generator
7. registerGenerator - Register new generator
8. createPR - Create pull request with generated files

⭐ DECISION GATE: Agent Adoption
After Phase 5 complete, measure:
  - 50%+ of target agents successfully call MCP tools
  - Tool error rate < 5%
  - Response times < 1 second median
If gate fails: Reassess API design based on agent feedback

BLOCKING RELATIONSHIPS:
- All tasks depend on Phases 0-4 complete
- Tasks 5.1-5.3 must complete before 5.4
- Task 5.5 can parallelize with 5.1-5.3
- Task 5.6 can parallelize with others

MCP RESPONSE FORMAT:
```json
{
  "status": "success|error",
  "data": { ... tool response ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "suggestions": ["Try X", "Try Y"]
  },
  "cached": false
}
```

START WITH: Task 5.1 - MCP Protocol Package (codegen-mcp-protocol)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 5 section

Idempotency in MCP:
- generateArtifact tool accepts optional idempotencyKey
- Auto-compute if not provided: SHA-256(generatorId + spec + options)
- Return cached result (200) if key exists and complete
- Return 409 if key exists but still in-progress

Auto-Fix in MCP:
- generateArtifact tool accepts ?autofix=true parameter
- Returns appliedFixes array showing what was corrected
- Transparent about corrections made

Success: Agents can call all 8 MCP tools, integration proven with 3+ agents
Next Phase: Phase 6 (Generator Composition & Orchestration)
Critical Success: Phase 5 gates must pass before proceeding to production phases
```

### Phase 6: Generator Composition & Orchestration

```
Phase 5 complete (agent integration ready!). Now Phase 6: Generator Composition.

PHASE 6 OBJECTIVES (2 weeks, 6 tasks):
✅ 6.1 - Composition Core (codegen-composition) - DAG execution
✅ 6.2 - Composition Manifest Format
✅ 6.3 - Composition Registry
✅ 6.4 - Composition Execution with Dependency Tracking
✅ 6.5 - MCP Tool for Composition (generateComposition)
✅ 6.6 - Example Composition (fullstack-endpoint)

COMPOSITION EXAMPLE:
```yaml
id: fullstack-endpoint
displayName: Full-Stack Endpoint
description: Generate DTO, handler, validator, and tests in one operation

steps:
  - id: dto
    generatorId: dto-generator
    spec: { ... }

  - id: handler
    generatorId: workflow-handler
    dependsOn: [dto]
    inputMapping:
      dtoType: dto.outputs.typeName

  - id: validator
    generatorId: validator-generator
    dependsOn: [dto]

  - id: tests
    generatorId: test-generator
    dependsOn: [handler, validator]
```

DAG EXECUTION:
- Build dependency graph
- Topological sort for execution order
- Execute in dependency order
- Pass outputs between steps via inputMapping
- Skip dependent steps if predecessor fails

BLOCKING RELATIONSHIPS:
- All tasks depend on Phase 5 complete
- Task 6.1 can start immediately
- Tasks 6.2-6.4 depend on 6.1
- Task 6.5 depends on 6.1-6.4
- Task 6.6 (example) can parallelize

START WITH: Task 6.1 - Composition Core (codegen-composition)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 6 section

Success: Can compose 3+ generators in single operation, outputs linked
Next Phase: Phase 7 (Security & Production Hardening)
Can Parallelize: Phase 7 + 8 (both can run after Phase 6)
```

### Phase 7: Security & Production Hardening

```
Phase 6 complete. Now Phase 7: Security & Production Hardening.

PHASE 7 OBJECTIVES (2-3 weeks, 7 tasks):
✅ 7.1 - Authentication & Authorization (codegen-auth)
✅ 7.2 - Audit Logging
✅ 7.3 - Sandbox Hardening (seccomp, resource limits)
✅ 7.4 - Template Sandboxing (vm2/isolated-vm)
✅ 7.5 - Dependency Scanning (npm audit, Snyk)
✅ 7.6 - Rate Limiting (Redis-based)
✅ 7.7 - Artifact & Provenance Signing (Ed25519)

⚠️  DECISION GATE: Production Security
Before shipping to production:
  - Third-party security audit must complete
  - No critical vulnerabilities found
  - Auth and audit logging operational
  - Sandbox escapes tested (known exploits must fail)
If gate fails: Cannot deploy, security review required

ROLES:
- viewer: List generators, validate specs
- generator: All viewer + generate artifacts
- admin: All generator + register generators

AUDIT LOGGING:
Log all: MCP calls, generator registration, artifact generation, PR creation
Store: actor_id, actor_type, action, resource_type, resource_id, timestamp

PROVENANCE SIGNING:
- Generate Ed25519 key pair on startup
- Sign all artifacts: hash(files) → signature
- Sign provenance: hash(provenance object) → signature
- Add verification endpoint: POST /api/artifacts/:id/verify

BLOCKING RELATIONSHIPS:
- All tasks depend on Phase 6 complete
- Tasks can parallelize
- Task 7.7 (signing) critical before production deployment

START WITH: Task 7.1 - Authentication & Authorization (codegen-auth)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 7 section

Success: Auth required on all endpoints, audit trail complete, signing working
Next Phase: Phase 8 (Developer Experience & Tooling)
Can Parallelize: Phase 8 + 9 (after Phase 7)
```

### Phase 8: Developer Experience & Tooling

```
Phase 7 complete. Now Phase 8: Developer Experience & Tooling.

PHASE 8 OBJECTIVES (2 weeks, 7 tasks):
✅ 8.1 - Generator SDK (codegen-sdk)
✅ 8.2 - CLI Generator Wizard (codegen init-generator)
✅ 8.3 - Local Testing Workflow
✅ 8.4 - VS Code Extension
✅ 8.5 - Dependency Graph Visualization (codegen-graph)
✅ 8.6 - Documentation Site (VitePress/Docusaurus)
✅ 8.7 - Generator Examples Repository

DEPENDENCY GRAPH FORMATS:
- Graphviz DOT (for rendering)
- Mermaid (for documentation)
- JSON (for programmatic use)

GRAPH QUERIES:
- Single generator dependencies (helpers, templates)
- Composition DAG (step dependencies)
- System-wide graph (all generators)

GRAPH ENDPOINTS:
- GET /api/generators/:id/graph?format=dot|mermaid|json
- GET /api/compositions/:id/graph?format=dot|mermaid|json
- GET /api/graph/system?format=dot|mermaid|json

BLOCKING RELATIONSHIPS:
- All tasks depend on Phase 7 complete
- Task 8.1 (SDK) is foundation for others
- Task 8.5 (graphs) can parallelize
- Task 8.6 (docs) can parallelize
- Task 8.7 (examples) depends on 8.1, 8.2

START WITH: Task 8.1 - Generator SDK (packages/codegen-sdk/)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 8 section

CLI Wizard Example:
codegen init-generator
  ? Generator name: my-service-generator
  ? Description: Generate microservices
  ? Language: TypeScript
  ? Number of outputs: 3
  → Creates scaffolded generator with manifest, templates, schema, tests

Success: Developers can scaffold new generator in <5 minutes
Next Phase: Phase 9 (Observability & Operations)
Can Parallelize: Phase 9 + 10 (after Phase 8)
```

### Phase 9: Observability & Operations

```
Phase 8 complete. Now Phase 9: Observability & Operations.

PHASE 9 OBJECTIVES (1-2 weeks, 6 tasks):
✅ 9.1 - Metrics (Prometheus: counts, latencies, errors)
✅ 9.2 - Distributed Tracing (OpenTelemetry → Jaeger)
✅ 9.3 - Structured Logging (Pino with correlation IDs)
✅ 9.4 - Health Checks (/health, /health/ready, /health/live)
✅ 9.5 - Alerting Rules (high error rate, slow generation, timeouts)
✅ 9.6 - Grafana Dashboards

KEY METRICS:
- codegen_generations_total (counter: generator_id, status)
- codegen_generation_duration_seconds (histogram: generator_id)
- codegen_template_render_duration_seconds (histogram)
- codegen_sandbox_execution_duration_seconds (histogram)
- codegen_validation_errors_total (counter: error_code)

ALERTING RULES:
- Error rate > 5% of generations failing
- Generation latency p95 > 30 seconds
- Sandbox timeouts > 1% of executions
- Service down (health check failing)

HEALTH CHECKS:
- /health → server is up
- /health/ready → dependencies operational (db, redis, minio, registry)
- /health/live → no deadlocks or event loop blocking

BLOCKING RELATIONSHIPS:
- All tasks depend on Phase 8 complete
- Tasks can parallelize
- All measurement infrastructure needed for Phase 10

START WITH: Task 9.1 - Metrics (codegen-metrics)
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 9 section

Success: Prometheus metrics exposed, Jaeger traces visible, Grafana dashboards live
Next Phase: Phase 10 (Performance & Scale)
Can Parallelize: Phase 10 (after Phase 9)
```

### Phase 10: Performance & Scale

```
Phase 9 complete. Now Phase 10: Performance & Scale - the final phase!

PHASE 10 OBJECTIVES (2 weeks, 8 tasks):
✅ 10.1 - Multi-Layer Caching (in-memory + Redis)
✅ 10.2 - Async Generation (BullMQ job queue)
✅ 10.3 - Batch Generation (generate multiple in parallel)
✅ 10.4 - Generator Preloading (warm cache on startup)
✅ 10.5 - Template Compilation Optimization
✅ 10.6 - Database Optimization (pooling, indexes, queries)
✅ 10.7 - Load Testing (k6: 100 concurrent, 1000 req/min)
✅ 10.8 - Horizontal Scaling (stateless service)

CACHING STRATEGY:
- L1: In-memory LRU for compiled templates (infinite TTL)
- L2: Redis for generation results (keyed by spec hash, 1 hour TTL)
- Cache invalidation on generator version change

ASYNC GENERATION:
- POST /api/generate-async → returns job ID immediately
- GET /api/jobs/:id → returns status (pending, running, completed, failed)
- Webhooks on job completion

BATCH GENERATION:
- POST /api/generate-batch → array of requests
- Queue all jobs
- Return array of job IDs
- Process in parallel (configurable workers)

LOAD TEST TARGETS:
- 100 concurrent requests
- 1000 generations per minute
- p95 latency < 10 seconds
- >99.9% success rate

BLOCKING RELATIONSHIPS:
- All tasks depend on Phase 9 complete
- Tasks can parallelize
- Task 10.7 (load testing) validates all others

START WITH: Task 10.1 - Multi-Layer Caching
Reference: CODEGEN_IMPLEMENTATION_PLAN.md Phase 10 section

Performance Targets:
- Generation latency: p95 < 10 seconds
- API latency: p95 < 500ms
- Throughput: 1000 gen/min
- Cache hit rate: >80%
- Uptime: >99.9%

Success: Handles 1000 gen/min, all targets met, horizontal scaling verified
Project Complete: All 11 phases done, ready for enterprise deployment!
```

---

## Using These Prompts

### For AI Agents

Copy the **Master Kickoff Prompt** and paste it into your agent context:

```bash
# Read the prompt file
cat KICKOFF_PROMPT.md

# Copy the "Master Kickoff Prompt" section (everything between the ``` markers)
# Paste into your AI agent's system prompt or context window

# Begin execution
```

### For Development Teams

1. Read **Master Kickoff Prompt** to understand Phase 0 goals
2. Assign developers to the 5 Phase 0 tasks
3. Use the **Technical Specifications** section for guidance
4. Run commands from **BUILD & RUN COMMANDS** section
5. Check **SUCCESS CRITERIA** before marking phase complete

### For Project Managers

1. Share the **Master Kickoff Prompt** with development team
2. Track progress using **PHASE 0 TASKS** checklist
3. Verify **SUCCESS CRITERIA** are met before Phase 1 kickoff
4. Use **Phase-Specific Kickoff Prompts** for subsequent phases

---

## Customization

You can customize the kickoff prompt by:

1. **For MVP**: Remove tasks related to documentation, focus only on core functionality
2. **For specific team**: Add team-specific naming conventions or tools
3. **For different language**: Translate technical specifications but keep requirements identical
4. **For different database**: Adapt database-specific tasks (Phase 3)

---

## Success Indicators

✅ **Phase 0 Complete When**:
- All 5 tasks show "Acceptance: ✓ PASSED"
- `pnpm run build` succeeds
- `pnpm run test` passes (even if empty)
- `pnpm run lint` passes
- `docker-compose up` works
- `curl localhost:3000/health` returns 200

🚀 **Ready for Phase 1 When**:
- Phase 0 complete
- All deliverables in place
- CI/CD pipeline passing
- Team understands project structure

---

## Next Prompts in Queue

After completing Phase 0, use the **Phase-Specific Kickoff Prompts** above for:
- Phase 1: Core Generation Engine
- Phase 2: Template System & Validation (includes determinism gate)
- Phase 3: Artifact Storage & Versioning (MinIO integration)
- Phase 4: Sandbox Execution & Testing
- Phase 5: MCP Interface & Agent Integration (agents can use tools!)
- Phases 6-10: Additional features and scaling

---

**Version**: 2.1.0
**Created**: 2025-11-24
**Status**: Ready to Execute Phase 0
