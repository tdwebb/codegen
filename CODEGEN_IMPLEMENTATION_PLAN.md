# Custom Code Generator — Implementation Plan (AI Agent Optimized)

**Version**: 2.1.0 (Agent-Optimized)
**Date**: 2025-11-24
**Status**: Design (Enhanced with 5 Core Features)
**Owner**: AppGen Platform Team
**Target Audience**: AI Code Generator Agents

---

## Quick Reference for Agents

### System Properties
```json
{
  "architecture": "Fastify 5 microservice with pnpm monorepo",
  "templateEngine": "Handlebars with deterministic helpers",
  "authentication": "API keys with RBAC",
  "totalPhases": 11,
  "estimatedDuration": "21-29 weeks (5-7 months)",
  "packages": 17,
  "languages": ["TypeScript", "JavaScript", "Python"],
  "testingFramework": "Vitest",
  "codeCoverageTarget": 0.90
}
```

### Key Features Roadmap
- Phase 1-2: **Pipeline Definition** - Extensible, introspectable generation pipeline
- Phase 3, 5: **Idempotency Keys** - Safe retries and request deduplication
- Phase 3, 7: **Generator Provenance** - Complete reproducibility and audit trail
- Phase 2: **Auto-Fix Mode** - Automatic correction of trivial validation errors
- Phase 8: **Dependency Graphs** - Visual generator/composition relationships

---

## Executive Summary

This document provides a granular, phase-by-phase implementation plan for the Custom Code Generator platform. The system is designed for deterministic, agent-first code generation with MCP (Model Context Protocol) interfaces for AI agent orchestration.

**Architecture Characteristics**:
- Fastify 5 microservice in Docker with pnpm workspace
- Handlebars templates with custom deterministic helpers
- API keys with role-based access control
- Single and multi-artifact generation with composition support
- Auto-approve generators when tests pass
- Each phase delivers a demonstrable, working system

---

## New Features Summary

This enhanced implementation plan includes 5 critical production-grade features:

### 1. **Unified Pipeline Definition** (Phase 1-2)
- **What**: Extensible, introspectable generation pipeline represented as JSON/TypeScript
- **Why**: Makes generation process debuggable, extensible, and transparent to agents
- **Implementation**:
  - Pipeline defined in manifest with customizable steps
  - Default pipeline: `validateInput → resolveTemplates → render → validateOutput → autofix → store`
  - Step-by-step execution tracing
  - Custom step support via plugin system
- **Agent Benefit**: Agents can query pipeline structure before generation, understand what will happen

### 2. **Idempotency Keys** (Phase 3, 5)
- **What**: Request deduplication using content-addressable keys
- **Why**: Safe retries, prevents duplicate work, cost optimization
- **Implementation**:
  - Auto-computed from (generatorId + spec + options) using SHA-256
  - Unique constraint in database
  - Return cached results for duplicate requests (200)
  - Return 409 Conflict if request is in-flight
- **Agent Benefit**: Agents can safely retry without creating duplicates or wasting resources

### 3. **Generator Provenance** (Phase 3, 7)
- **What**: Complete reproducibility tracking for every artifact
- **Why**: Audit trail, compliance, deterministic reproduction years later
- **Implementation**:
  - Capture: generator version, manifest hash, template hashes, helper versions, validators, pipeline execution, environment
  - Store in dedicated `artifact_provenance` table
  - Cryptographic signing (Ed25519) of provenance hash
  - Verification and reproduction endpoints
- **Agent Benefit**: Full transparency into how artifacts were generated; can reproduce exact outputs

### 4. **Auto-Fix Mode** (Phase 2)
- **What**: Automatic correction of trivial validation errors (formatting, semicolons, imports)
- **Why**: Reduces agent round-trips, improves success rate from ~95% to ~99%+
- **Implementation**:
  - `OutputFixer` class with pluggable fixers (Prettier, ESLint, import organizer)
  - Configurable allowed fixes in manifest
  - Returns `appliedFixes` array showing what was corrected
  - `?autofix=true` query parameter on API
- **Agent Benefit**: Fewer failures on trivial issues; transparent about what was fixed

### 5. **Dependency Graph Viewer** (Phase 8)
- **What**: Visual representation of generator dependencies and composition flows
- **Why**: Onboarding, debugging, documentation, understanding system architecture
- **Implementation**:
  - Graphviz DOT, Mermaid, and JSON export formats
  - CLI: `codegen graph <generator-id> --format mermaid`
  - API: `GET /api/generators/:id/graph?format=dot`
  - Shows helpers, templates, and composition dependencies
- **Agent Benefit**: Agents can understand generator dependencies before invoking; helps with error diagnosis

---

## Agent-Parseable Phase Overview

```json
{
  "phases": [
    {
      "id": 0,
      "name": "Foundation & Scaffolding",
      "duration": "1-2 weeks",
      "tasks": 5,
      "deliverable": "Empty Fastify service, workspace structure",
      "blockingPhase": false,
      "keyOutputs": ["pnpm workspace", "17 package scaffolds", "docker-compose"]
    },
    {
      "id": 1,
      "name": "Core Generation Engine",
      "duration": "2-3 weeks",
      "tasks": 6,
      "deliverable": "Single hardcoded generator produces file from JSON",
      "blockingPhase": false,
      "keyOutputs": ["GeneratorManager", "manifest schema", "HTTP API basics"]
    },
    {
      "id": 2,
      "name": "Template System & Validation",
      "duration": "2-3 weeks",
      "tasks": 7,
      "deliverable": "Real Handlebars templates, input/output validation, pipeline execution",
      "blockingPhase": false,
      "keyOutputs": ["TemplateEngine", "OutputValidator", "OutputFixer", "PipelineExecutor"]
    },
    {
      "id": 3,
      "name": "Artifact Storage & Versioning",
      "duration": "2-3 weeks",
      "tasks": 7,
      "deliverable": "Artifacts stored with metadata, idempotency, provenance tracking",
      "blockingPhase": false,
      "keyOutputs": ["ArtifactStore", "ProvenanceTracker", "idempotency_key support"]
    },
    {
      "id": 4,
      "name": "Sandbox Execution & Testing",
      "duration": "2-3 weeks",
      "tasks": 7,
      "deliverable": "Generated code tested in isolated Docker container",
      "blockingPhase": false,
      "keyOutputs": ["SandboxExecutor", "GoldenTestRunner", "TestRunner"]
    },
    {
      "id": 5,
      "name": "MCP Interface & Agent Integration",
      "duration": "2 weeks",
      "tasks": 6,
      "deliverable": "MCP protocol implemented, agents can call tools",
      "blockingPhase": true,
      "keyOutputs": ["MCPHandler", "MCP client SDK", "tool definitions"]
    },
    {
      "id": 6,
      "name": "Generator Composition & Orchestration",
      "duration": "2 weeks",
      "tasks": 6,
      "deliverable": "Multiple artifacts in one operation with dependency resolution",
      "blockingPhase": false,
      "keyOutputs": ["CompositionEngine", "composition manifests"]
    },
    {
      "id": 7,
      "name": "Security & Production Hardening",
      "duration": "2-3 weeks",
      "tasks": 7,
      "deliverable": "Auth, audit logs, signing, secure sandboxing",
      "blockingPhase": false,
      "keyOutputs": ["AuthMiddleware", "AuditLogger", "artifact signing"]
    },
    {
      "id": 8,
      "name": "Developer Experience & Tooling",
      "duration": "2 weeks",
      "tasks": 7,
      "deliverable": "SDK, CLI wizard, dependency graph visualization",
      "blockingPhase": false,
      "keyOutputs": ["GeneratorSDK", "GraphGenerator", "documentation site"]
    },
    {
      "id": 9,
      "name": "Observability & Operations",
      "duration": "1-2 weeks",
      "tasks": 6,
      "deliverable": "Metrics, traces, dashboards, health checks",
      "blockingPhase": false,
      "keyOutputs": ["Prometheus metrics", "Jaeger tracing", "Grafana dashboards"]
    },
    {
      "id": 10,
      "name": "Performance & Scale",
      "duration": "2 weeks",
      "tasks": 8,
      "deliverable": "System optimized for high throughput, handles 1000 gen/min",
      "blockingPhase": false,
      "keyOutputs": ["caching strategy", "async queues", "load testing"]
    }
  ]
}
```

## Dependency Chains for Agent Execution Planning

```
Phase 0 (Foundation)
├── Required by: All phases
├── Blocking: Yes (everything depends on this)
└── Can parallelize with: Nothing

Phase 1 (Core Engine)
├── Requires: Phase 0
├── Blocking: Yes for Phases 2, 5
└── Can parallelize with: Nothing

Phase 2 (Templates & Validation)
├── Requires: Phase 0, Phase 1
├── Enables: Phase 4 (testing), Phase 5 (MCP)
├── Blocking: Yes for Phases 3, 4
└── Features: Pipeline definition, Auto-fix mode

Phase 3 (Storage & Versioning)
├── Requires: Phase 0, Phase 1, Phase 2
├── Features: Idempotency keys, Provenance tracking
├── Blocking: No
└── Can parallelize with: Phase 4

Phase 4 (Sandbox Testing)
├── Requires: Phase 0, Phase 1, Phase 2
├── Enables: Phase 6, Phase 7
├── Blocking: No
└── Can parallelize with: Phase 3

Phase 5 (MCP Interface) [CRITICAL for Agent Integration]
├── Requires: Phase 0, Phase 1, Phase 2, Phase 4
├── Enables: All agent-facing work
├── Blocking: Yes for agent adoption
├── Features: MCP tools, auto-fix support, idempotency

Phase 6 (Composition)
├── Requires: Phase 0-5
├── Enables: Phase 9
├── Blocking: No
└── Can parallelize with: Phase 7, 8

Phase 7 (Security)
├── Requires: Phase 0-6
├── Blocking: Yes for production
└── Features: Provenance signing

Phase 8 (DX & Tooling)
├── Requires: Phase 0-7
├── Features: Dependency graphs
└── Blocking: No for functionality, yes for adoption

Phase 9 (Observability)
├── Requires: Phase 0-8
├── Blocking: No for functionality
└── Required for: Production stability

Phase 10 (Performance & Scale)
├── Requires: Phase 0-9
├── Blocking: No for MVP
└── Gate: Load testing requirements
```

## Table of Contents

1. [Agent-Parseable Phase Overview](#agent-parseable-phase-overview) (JSON format for agents)
2. [Dependency Chains](#dependency-chains-for-agent-execution-planning) (Phase dependencies)
3. [New Features Summary](#new-features-summary)
4. [Project Structure](#project-structure)
5. [Phase Details (0-10)](#phase-0-foundation--scaffolding)
6. [Testing Strategy](#testing-strategy)
7. [Deployment & CI/CD](#deployment--cicd)
8. [Success Metrics](#success-metrics)

---

## Project Structure

```
appgen/
├── apps/
│   └── codegen-service/              # Main Fastify 5 application
│       ├── src/
│       │   ├── main.ts                # Fastify app bootstrap
│       │   ├── routes/                # HTTP API routes
│       │   ├── mcp/                   # MCP protocol handlers
│       │   ├── plugins/               # Fastify plugins
│       │   └── config/                # Configuration
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── codegen-core/                  # Core generation engine (package 1)
│   ├── codegen-pipeline/              # Pipeline execution engine (package 2)
│   ├── codegen-template-engine/       # Handlebars + helpers (package 3)
│   ├── codegen-validator/             # Spec & output validation (package 4)
│   ├── codegen-sandbox/               # Sandbox executor (package 5)
│   ├── codegen-artifact-store/        # Artifact storage (package 6)
│   ├── codegen-provenance/            # Provenance tracking (package 7)
│   ├── codegen-registry/              # Generator registry (package 8)
│   ├── codegen-mcp-protocol/          # MCP types & protocol (package 9)
│   ├── codegen-composition/           # Multi-artifact orchestration (package 10)
│   ├── codegen-auth/                  # Auth & authorization (package 11)
│   ├── codegen-git-integration/       # Git/PR operations (package 12)
│   ├── codegen-diff/                  # AST-aware diffing (package 13)
│   ├── codegen-metrics/               # Metrics & observability (package 14)
│   ├── codegen-graph/                 # Dependency graph generation (package 15)
│   ├── codegen-cli/                   # CLI tool (package 16)
│   └── codegen-sdk/                   # Generator development SDK (package 17)
├── generators/                        # Generator plugins
│   ├── workflow-handler/
│   │   ├── manifest.yaml
│   │   ├── schema.json
│   │   ├── templates/
│   │   ├── helpers/
│   │   ├── tests/
│   │   └── README.md
│   ├── dto-generator/
│   ├── validator-generator/
│   └── quasar-component-generator/
├── infra/
│   └── codegen/
│       ├── docker-compose.yml
│       └── up.sh
└── specs/
    └── codegen/                       # Generator specs (meta)
```

---

## Agent Task Format Standard

For agents, individual tasks follow this parseable structure:

```json
{
  "taskId": "0.1",
  "name": "Workspace Setup",
  "phase": 0,
  "status": "pending",
  "type": "scaffolding",
  "estimatedHours": 4,
  "subtasks": [
    {
      "id": "0.1.1",
      "description": "Initialize pnpm workspace root with pnpm-workspace.yaml",
      "type": "config",
      "dependencies": [],
      "files": ["pnpm-workspace.yaml"],
      "outputs": ["working pnpm workspace"]
    }
  ],
  "acceptance": [
    "Workspace builds successfully",
    "Linting passes",
    "All 17 packages discoverable"
  ],
  "blockingFor": ["1.0", "2.0"],
  "notes": "Foundation for entire project"
}
```

---

## Phase 0: Foundation & Scaffolding

**Duration**: 1-2 weeks
**Milestone**: Empty Fastify service responding to health checks, workspace structure established
**Critical Path**: Yes (blocks all other phases)

### Phase 0 Task List (Structured for Agents)

```json
{
  "phase": 0,
  "totalTasks": 5,
  "totalEstimatedHours": 40,
  "tasks": [
    {"id": "0.1", "name": "Workspace Setup", "hours": 4, "subtasks": 5},
    {"id": "0.2", "name": "Codegen Service Scaffold", "hours": 8, "subtasks": 6},
    {"id": "0.3", "name": "Package Scaffolds", "hours": 12, "subtasks": 3},
    {"id": "0.4", "name": "CI/CD Foundation", "hours": 8, "subtasks": 3},
    {"id": "0.5", "name": "Documentation Structure", "hours": 8, "subtasks": 2}
  ]
}
```

### Tasks (Human-Readable + Agent-Parseable)

#### 0.1: Workspace Setup
- **0.1.1**: Initialize pnpm workspace root with `pnpm-workspace.yaml`
- **0.1.2**: Create base `tsconfig.base.json` extending AppGen standards
- **0.1.3**: Set up root-level scripts: `build`, `test`, `dev`, `lint`
- **0.1.4**: Configure ESLint, Prettier, TypeScript for monorepo
- **0.1.5**: Add workspace-level dependencies: `typescript`, `vitest`, `tsx`

**Deliverable**: Workspace builds successfully, linting passes

#### 0.2: Codegen Service Scaffold
- **0.2.1**: Create `apps/codegen-service/` with Fastify 5 bootstrap
- **0.2.2**: Add health check route `GET /health` returning `{ status: 'ok' }`
- **0.2.3**: Add Pino logger with structured logging
- **0.2.4**: Configure environment variables via `@appgen/config` pattern
- **0.2.5**: Create Dockerfile (multi-stage: build → production)
- **0.2.6**: Add docker-compose.yml for local dev (service + postgres + redis)

**Deliverable**: `docker-compose up` starts service, `curl localhost:3000/health` returns 200

#### 0.3: Package Scaffolds
- **0.3.1**: Create 17 package directories with boilerplate:
  - `package.json` (name, version, main, types, scripts)
  - `tsconfig.json` extending base
  - `tsup.config.ts` for builds
  - `vitest.config.ts` for tests
  - `src/index.ts` exporting empty object
  - `README.md` with package purpose
- **0.3.2**: Add workspace references in root `pnpm-workspace.yaml`
- **0.3.3**: Test workspace build: `pnpm build` builds all packages

**Deliverable**: All packages build with TypeScript, empty exports work

#### 0.4: CI/CD Foundation
- **0.4.1**: Create `.github/workflows/ci.yml`:
  - Install dependencies
  - Run linting
  - Build all packages
  - Run tests (placeholder)
- **0.4.2**: Add PR checks for test coverage threshold (90%+)
- **0.4.3**: Configure branch protection rules

**Deliverable**: CI passes on empty packages

#### 0.5: Documentation Structure
- **0.5.1**: Create `docs/` directory with:
  - `architecture.md`
  - `api-reference.md`
  - `generator-development-guide.md`
  - `mcp-protocol.md`
- **0.5.2**: Document workspace structure and conventions

**Deliverable**: Documentation stubs in place

---

## Phase 1: Core Generation Engine

**Duration**: 2-3 weeks
**Milestone**: Single hardcoded generator produces a file from JSON input

### Tasks

#### 1.1: Generator Manager (Package: `codegen-core`)
- **1.1.1**: Define `Generator` interface:
  ```typescript
  interface Generator {
    id: string;
    version: string;
    manifest: GeneratorManifest;
    generate(spec: unknown, options: GenerateOptions): Promise<GenerationResult>;
  }
  ```
- **1.1.2**: Implement `GeneratorManager` class:
  - `registerGenerator(generator: Generator): void`
  - `getGenerator(id: string, version?: string): Generator | undefined`
  - `listGenerators(): GeneratorSummary[]`
- **1.1.3**: Add in-memory registry (Map-based)
- **1.1.4**: Add generator lifecycle events (register, unregister)
- **1.1.5**: Write unit tests (90%+ coverage)

**Deliverable**: Can register and retrieve generators programmatically

#### 1.2: Manifest Schema (Package: `codegen-registry`)
- **1.2.1**: Define `GeneratorManifest` TypeScript types:
  ```typescript
  interface GeneratorManifest {
    id: string;
    version: string;
    manifestHash?: string; // SHA-256, computed on registration
    displayName: string;
    description: string;
    inputSchema: JSONSchema;
    outputs: OutputDefinition[];
    entryTemplate: string;
    capabilities: Capability[];
    helpers?: HelperDefinition[];
    tests?: TestDefinition;
    security?: SecurityDefinition;
    pipeline?: PipelineDefinition; // NEW: Custom pipeline
  }
  interface HelperDefinition {
    name: string;
    version: string;
    path?: string;
  }
  ```
- **1.2.2**: Create JSON Schema for manifest validation
- **1.2.3**: Implement `ManifestValidator` using Ajv
- **1.2.4**: Add manifest loading from YAML files
- **1.2.5**: Write tests for valid/invalid manifests
- **1.2.6**: Define `PipelineDefinition` interface:
  ```typescript
  interface PipelineDefinition {
    id: string;
    steps: PipelineStep[];
    onError?: 'abort' | 'continue' | 'retry';
  }
  interface PipelineStep {
    id: string;
    type: 'validate-input' | 'resolve-templates' | 'render' |
          'validate-output' | 'autofix' | 'sandbox-test' | 'store' | 'custom';
    config?: unknown;
    required: boolean;
    timeout?: number;
    retryPolicy?: RetryPolicy;
  }
  ```
- **1.2.7**: Add JSON Schema for pipeline definition validation

**Deliverable**: Manifest YAML files (with optional pipeline) can be loaded and validated

#### 1.3: Generation Result Model (Package: `codegen-core`)
- **1.3.1**: Define `GenerationResult` interface:
  ```typescript
  interface GenerationResult {
    artifactId: string;
    files: GeneratedFile[];
    diagnostics: Diagnostic[];
    metadata: ArtifactMetadata;
    pipelineExecution?: PipelineExecutionTrace; // NEW: Pipeline trace
  }
  interface GeneratedFile {
    path: string;
    content: string;
    hash: string;
  }
  interface PipelineExecutionTrace {
    pipelineId: string;
    steps: ExecutedStep[];
    totalDuration: number;
  }
  interface ExecutedStep {
    stepId: string;
    status: 'success' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }
  ```
- **1.3.2**: Implement result serialization/deserialization
- **1.3.3**: Add file hashing (SHA-256)
- **1.3.4**: Add `provenance` field to `ArtifactMetadata` interface (placeholder for Phase 3)

**Deliverable**: Generation results can be created and serialized

#### 1.4: Hardcoded Generator Example
- **1.4.1**: Create `generators/hello-world/`:
  - `manifest.yaml` (minimal)
  - `templates/hello.ts.hbs` (hardcoded template)
  - `schema.json` (simple input: `{ "name": "string" }`)
- **1.4.2**: Implement `HelloWorldGenerator` class:
  - Load manifest from file
  - Render template with hardcoded data (no engine yet)
  - Return `GenerationResult`
- **1.4.3**: Register in `GeneratorManager`
- **1.4.4**: Write integration test: generate → verify output

**Deliverable**: Can call `generate({ name: "World" })` and get `hello.ts` file

#### 1.5: HTTP API Routes (Service)
- **1.5.1**: Add `GET /api/generators` route:
  - Returns list of registered generators
  - Response: `{ generators: GeneratorSummary[] }`
- **1.5.2**: Add `GET /api/generators/:id` route:
  - Returns full manifest for generator
  - 404 if not found
- **1.5.3**: Add `POST /api/generate` route (basic):
  - Body: `{ generatorId, spec }`
  - Calls `GeneratorManager.generate()`
  - Returns `GenerationResult` as JSON
- **1.5.4**: Add request validation middleware
- **1.5.5**: Add error handling middleware
- **1.5.6**: Write API integration tests

**Deliverable**: Can POST to `/api/generate` and receive generated files

#### 1.6: CLI Scaffold (Package: `codegen-cli`)
- **1.6.1**: Set up CLI framework (Commander.js)
- **1.6.2**: Add commands:
  - `codegen list` → calls `GET /api/generators`
  - `codegen generate <id> --spec <file>` → calls `POST /api/generate`
- **1.6.3**: Add JSON output flag `--json` for machine-readable output
- **1.6.4**: Add configuration file support (`~/.codegenrc`)

**Deliverable**: CLI can list generators and trigger generation

---

## Phase 2: Template System & Validation

**Duration**: 2-3 weeks
**Milestone**: Real Handlebars templates with custom helpers; input/output validation works; pipeline execution engine operational

### Tasks

#### 2.0: Pipeline Execution Engine (Package: `codegen-pipeline`)
- **2.0.1**: Implement `PipelineExecutor` class:
  - `execute(pipeline: PipelineDefinition, context: GenerationContext): Promise<GenerationResult>`
  - Execute steps sequentially
  - Track execution time per step
  - Handle step failures based on `onError` strategy
  - Capture execution trace
- **2.0.2**: Implement default pipeline:
  ```typescript
  const DEFAULT_PIPELINE: PipelineDefinition = {
    id: 'default-generation',
    steps: [
      { id: 'validate-input', type: 'validate-input', required: true },
      { id: 'resolve-templates', type: 'resolve-templates', required: true },
      { id: 'render', type: 'render', required: true },
      { id: 'validate-output', type: 'validate-output', required: true },
      { id: 'autofix', type: 'autofix', required: false },
      { id: 'store', type: 'store', required: true }
    ],
    onError: 'abort'
  };
  ```
- **2.0.3**: Implement step executors (one per step type):
  - `ValidateInputStep`, `ResolveTemplatesStep`, `RenderStep`, etc.
  - Each implements `PipelineStepExecutor` interface
- **2.0.4**: Add step registry for custom steps
- **2.0.5**: Write unit tests for pipeline execution (90%+ coverage)
- **2.0.6**: Add API endpoint: `GET /api/generators/:id/pipeline` (introspection)

**Deliverable**: Pipeline engine can execute multi-step generation workflows

#### 2.1: Template Engine Core (Package: `codegen-template-engine`)
- **2.1.1**: Set up Handlebars as dependency
- **2.1.2**: Create `TemplateEngine` class:
  - `registerHelper(name: string, fn: Function): void`
  - `registerPartial(name: string, template: string): void`
  - `compile(template: string): CompiledTemplate`
  - `render(compiled: CompiledTemplate, context: object): string`
- **2.1.3**: Implement deterministic rendering:
  - Freeze context object (deep immutability)
  - Disable non-deterministic helpers (Date, Math.random)
  - Sort object keys in iteration
- **2.1.4**: Add template compilation caching (Map<hash, CompiledTemplate>)
- **2.1.5**: Write unit tests for rendering

**Deliverable**: Can compile and render Handlebars templates deterministically

#### 2.2: Standard Helper Library
- **2.2.1**: Implement case conversion helpers:
  - `toCamel`, `toPascal`, `toSnake`, `toKebab`
- **2.2.2**: Implement formatting helpers:
  - `indent(n)`, `wrapIfNotEmpty(prefix, suffix)`
- **2.2.3**: Implement code generation helpers:
  - `escapeString(lang)`, `commentBlock(lang)`
- **2.2.4**: Implement import resolution helper:
  - `resolveImport(type, lang)` (TypeScript, Java, Python)
- **2.2.5**: Add telemetry annotation helper:
  - `telemetryAnnotation(service, feature)`
- **2.2.6**: Register all helpers in `TemplateEngine`
- **2.2.7**: Write comprehensive tests for each helper

**Deliverable**: Helpers are available in all templates

#### 2.3: Template Validation (Package: `codegen-template-engine`)
- **2.3.1**: Implement `TemplateValidator` class:
  - Parse template AST (Handlebars parse)
  - Check for non-deterministic constructs (Date, random)
  - Verify all helpers are registered
  - Check for undefined variables (optional strict mode)
- **2.3.2**: Add validation on generator registration
- **2.3.3**: Write tests with valid/invalid templates

**Deliverable**: Invalid templates are rejected during registration

#### 2.4: Input Spec Validation (Package: `codegen-validator`)
- **2.4.1**: Set up Ajv for JSON Schema validation
- **2.4.2**: Implement `SpecValidator` class:
  - `validate(schema: JSONSchema, data: unknown): ValidationResult`
- **2.4.3**: Add detailed error messages (path, expected, actual)
- **2.4.4**: Add suggestions for common errors
- **2.4.5**: Write tests with various schemas

**Deliverable**: Input specs are validated before generation

#### 2.5: Output Validation (Package: `codegen-validator`)
- **2.5.1**: Implement `OutputValidator` class:
  - Language detection from file extension
  - Syntax validation (parse but don't execute)
  - TypeScript: use TypeScript compiler API
  - JavaScript/JSON: parse with AST parser
  - Python: use Python AST parser (via child process)
- **2.5.2**: Integrate Prettier for formatting validation
- **2.5.3**: Add ESLint for TypeScript/JavaScript outputs
- **2.5.4**: Return structured diagnostics (file, line, column, message)
- **2.5.5**: Write tests for valid/invalid outputs
- **2.5.6**: Implement `OutputFixer` class (Auto-Fix Mode):
  ```typescript
  interface OutputFixer {
    canFix(diagnostic: Diagnostic): boolean;
    fix(file: GeneratedFile, diagnostics: Diagnostic[]): FixResult;
  }
  interface FixResult {
    fixed: boolean;
    file: GeneratedFile;
    appliedFixes: AppliedFix[];
  }
  interface AppliedFix {
    file: string;
    line: number;
    type: string; // 'formatting', 'import-order', 'semicolons', etc.
    before: string;
    after: string;
  }
  ```
- **2.5.7**: Implement fixers:
  - `PrettierFixer` (formatting)
  - `ESLintFixer` (auto-fixable ESLint rules)
  - `ImportFixer` (organize imports)
- **2.5.8**: Add configuration for allowed auto-fixes in manifest:
  ```yaml
  validation:
    output:
      autofix:
        enabled: true
        allowed: [formatting, imports, semicolons, trailing-comma]
        formatters:
          - prettier
          - eslint --fix
  ```
- **2.5.9**: Write tests for auto-fix scenarios

**Deliverable**: Generated code is validated for syntax/formatting; trivial issues auto-fixed

#### 2.6: Integrate Pipeline Engine into Generation
- **2.6.1**: Update `Generator` interface to use `PipelineExecutor`
- **2.6.2**: Modify `HelloWorldGenerator` to use pipeline execution
- **2.6.3**: Integrate all components into pipeline:
  - ValidateInputStep → calls `SpecValidator`
  - RenderStep → calls `TemplateEngine`
  - ValidateOutputStep → calls `OutputValidator`
  - AutofixStep → calls `OutputFixer` (if enabled)
  - StoreStep → calls `ArtifactStore`
- **2.6.4**: Update HTTP API:
  - Add `?autofix=true` query parameter to `POST /api/generate`
  - Return validation diagnostics and applied fixes
  - Return pipeline execution trace
- **2.6.5**: Add `validateOnly` flag to API for dry-run validation
- **2.6.6**: Update CLI to support `--autofix` flag

**Deliverable**: Full pipeline-based generation works end-to-end with auto-fix support

#### 2.7: Real Generator Example (workflow-handler)
- **2.7.1**: Create `generators/workflow-handler/`:
  - Complete manifest with multiple outputs
  - Handlebars templates for handler and test files
  - JSON Schema for workflow spec input
  - Custom helpers (if needed)
- **2.7.2**: Implement handler template:
  - Fastify route definition
  - Input validation
  - Workflow invocation
  - Telemetry annotations
- **2.7.3**: Implement test template:
  - Vitest test boilerplate
  - Mock workflow engine
  - Test cases for success/failure
- **2.7.4**: Write golden test (input spec → expected output)

**Deliverable**: Can generate complete workflow handler from spec

---

## Phase 3: Artifact Storage & Versioning

**Duration**: 2-3 weeks (extended for idempotency + provenance)
**Milestone**: Generated artifacts are stored with metadata, idempotency, and provenance tracking

### Tasks

#### 3.1: Artifact Store Core (Package: `codegen-artifact-store`)
- **3.1.1**: Define `ArtifactMetadata` interface:
  ```typescript
  interface ArtifactMetadata {
    artifactId: string;
    idempotencyKey?: string; // NEW: For request deduplication
    generatorId: string;
    generatorVersion: string;
    specHash: string;
    createdBy: { agentId: string; userId?: string };
    createdAt: string;
    files: FileMetadata[];
    status: 'pending' | 'validated' | 'applied';
    provenance: GeneratorProvenance; // NEW: Complete provenance
  }
  ```
- **3.1.2**: Implement `ArtifactStore` interface:
  - `save(result: GenerationResult, metadata: ArtifactMetadata): Promise<string>`
  - `get(artifactId: string): Promise<Artifact | null>`
  - `getByIdempotencyKey(key: string): Promise<Artifact | null>` // NEW
  - `list(filters?: ArtifactFilters): Promise<ArtifactMetadata[]>`
  - `delete(artifactId: string): Promise<void>`
- **3.1.3**: Implement file system-based store (for local dev):
  - Store in `<workspace>/artifacts/<artifactId>/`
  - `metadata.json` + actual files
- **3.1.4**: Implement idempotency key generation:
  ```typescript
  function computeIdempotencyKey(req: GenerateRequest): string {
    const payload = {
      generatorId: req.generatorId,
      generatorVersion: req.options?.version || 'latest',
      spec: req.spec,
      options: req.options
    };
    return sha256(canonicalize(payload)); // RFC 8785 canonical JSON
  }
  ```
- **3.1.5**: Write tests for CRUD operations including idempotency lookups

**Deliverable**: Can save and retrieve artifacts from local storage with idempotency support

#### 3.2: Content-Addressable Storage
- **3.2.1**: Add file deduplication:
  - Store files by SHA-256 hash in `.artifacts/objects/`
  - Metadata references hashes, not duplicate content
- **3.2.2**: Implement garbage collection for unreferenced objects
- **3.2.3**: Add compression for stored artifacts (gzip)

**Deliverable**: Duplicate files are stored only once

#### 3.3: MinIO Integration
- **3.3.1**: Implement `MinIOArtifactStore` using MinIO SDK:
  - Store artifacts in bucket: `codegen-artifacts/<artifactId>/`
  - Metadata in `metadata.json`
  - Files as separate objects
- **3.3.2**: Add presigned URL generation for downloads
- **3.3.3**: Configure MinIO in docker-compose
- **3.3.4**: Add integration tests with MinIO

**Deliverable**: Artifacts can be stored in MinIO

#### 3.4: PostgreSQL Metadata Store
- **3.4.1**: Create migration for `artifacts` table:
  ```sql
  CREATE TABLE artifacts (
    artifact_id TEXT PRIMARY KEY,
    idempotency_key TEXT UNIQUE, -- NEW: For deduplication
    generator_id TEXT NOT NULL,
    generator_version TEXT NOT NULL,
    spec_hash TEXT NOT NULL,
    created_by JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    metadata JSONB NOT NULL,
    storage_backend TEXT NOT NULL,
    storage_path TEXT NOT NULL
  );
  CREATE INDEX idx_artifacts_generator ON artifacts(generator_id, generator_version);
  CREATE INDEX idx_artifacts_created_by ON artifacts((created_by->>'agentId'));
  CREATE INDEX idx_artifacts_idempotency ON artifacts(idempotency_key); -- NEW
  ```
- **3.4.2**: Implement `PostgresArtifactMetadataStore`:
  - Store metadata in Postgres
  - Files in MinIO
- **3.4.3**: Add query methods: `findByGenerator`, `findByAgent`, `findByDateRange`, `findByIdempotencyKey`
- **3.4.4**: Implement idempotency logic in `POST /api/generate`:
  - Check if idempotency_key exists
  - If exists and status=completed, return cached result (200)
  - If exists and status=pending/running, return 409 Conflict with job URL
  - If not exists, proceed with generation
- **3.4.5**: Write database tests including idempotency scenarios

**Deliverable**: Artifact metadata queryable via SQL with idempotency support

#### 3.5: Artifact Retrieval API
- **3.5.1**: Add `GET /api/artifacts/:id` route:
  - Returns metadata + download URLs
- **3.5.2**: Add `GET /api/artifacts/:id/download` route:
  - Returns ZIP of all files
  - Support streaming for large artifacts
- **3.5.3**: Add `GET /api/artifacts` route (list with filters)
- **3.5.4**: Update `POST /api/generate` to save artifacts automatically

**Deliverable**: Generated artifacts are saved and downloadable

#### 3.6: Generator Provenance (Package: `codegen-provenance`)
- **3.6.1**: Define `GeneratorProvenance` interface:
  ```typescript
  interface GeneratorProvenance {
    generatorId: string;
    generatorVersion: string;
    manifestHash: string; // SHA-256 of manifest

    templates: {
      path: string;
      hash: string;
      version?: string;
    }[];

    helpers: {
      name: string;
      version: string;
      hash: string;
    }[];

    validators: {
      name: string;
      version: string;
      config: unknown;
    }[];

    pipeline: {
      definition: PipelineDefinition;
      executedSteps: ExecutedStep[];
    };

    environment: {
      codegenVersion: string;
      templateEngineVersion: string;
      sandboxImageVersion?: string;
      nodeVersion?: string;
      timestamp: string;
    };

    checksums: {
      inputSpecHash: string;
      outputHash: string; // Hash of all output files
      provenanceHash: string; // Hash of this provenance object
    };

    signature?: string; // Ed25519 signature (added in Phase 7)
  }
  ```
- **3.6.2**: Implement `ProvenanceTracker` class:
  - Capture provenance data during generation
  - Compute hashes for templates, helpers, and outputs
  - Generate provenance object
- **3.6.3**: Integrate provenance tracking into pipeline:
  - Capture at start of generation
  - Update during execution
  - Finalize before storing artifact
- **3.6.4**: Create `artifact_provenance` table:
  ```sql
  CREATE TABLE artifact_provenance (
    artifact_id TEXT PRIMARY KEY REFERENCES artifacts(artifact_id),
    generator_id TEXT NOT NULL,
    generator_version TEXT NOT NULL,
    manifest_hash TEXT NOT NULL,
    templates JSONB NOT NULL,
    helpers JSONB NOT NULL,
    validators JSONB NOT NULL,
    pipeline JSONB NOT NULL,
    environment JSONB NOT NULL,
    checksums JSONB NOT NULL,
    signature TEXT,
    provenance_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX idx_provenance_generator ON artifact_provenance(generator_id, generator_version);
  CREATE INDEX idx_provenance_manifest_hash ON artifact_provenance(manifest_hash);
  CREATE INDEX idx_provenance_hash ON artifact_provenance(provenance_hash);
  ```
- **3.6.5**: Add provenance verification endpoint:
  ```typescript
  POST /api/artifacts/:id/verify-provenance
  // Returns: { valid: boolean, issues: string[] }
  ```
- **3.6.6**: Add reproduction endpoint:
  ```typescript
  POST /api/reproduce
  {
    artifactId: "gen-20251124-abc123"
  }
  // Returns: new artifact with same provenance hash
  ```
- **3.6.7**: Write tests for provenance capture and verification

**Deliverable**: Complete provenance tracking for reproducibility

#### 3.7: Versioning & Upgrades
- **3.7.1**: Add `generator_versions` table:
  ```sql
  CREATE TABLE generator_versions (
    generator_id TEXT NOT NULL,
    version TEXT NOT NULL,
    manifest JSONB NOT NULL,
    manifest_hash TEXT NOT NULL, -- NEW: For provenance
    registered_at TIMESTAMPTZ NOT NULL,
    deprecated_at TIMESTAMPTZ,
    PRIMARY KEY (generator_id, version)
  );
  CREATE INDEX idx_generator_versions_hash ON generator_versions(manifest_hash);
  ```
- **3.7.2**: Implement version resolution:
  - `getLatestVersion(generatorId): string`
  - `getCompatibleVersions(generatorId, targetRuntime): string[]`
- **3.7.3**: Add compatibility matrix in manifest:
  ```yaml
  compatibility:
    fastify: ">=5.0.0 <6.0.0"
    typescript: ">=5.0.0"
  ```
- **3.7.4**: Implement upgrade detection:
  - Compare artifact's generator version to latest
  - Return upgrade availability flag
- **3.7.5**: Compute and store `manifestHash` on registration

**Deliverable**: System tracks generator versions, compatibility, and manifest hashes

---

## Phase 4: Sandbox Execution & Testing

**Duration**: 2-3 weeks
**Milestone**: Generated code is tested in isolated Docker container

### Tasks

#### 4.1: Sandbox Executor Core (Package: `codegen-sandbox`)
- **4.1.1**: Define `SandboxExecutor` interface:
  ```typescript
  interface SandboxExecutor {
    execute(artifact: Artifact, command: string): Promise<ExecutionResult>;
  }
  interface ExecutionResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    resourceUsage: ResourceStats;
  }
  ```
- **4.1.2**: Implement Docker-based executor:
  - Use `dockerode` library
  - Create ephemeral container per execution
  - Mount artifact files as read-only volume
  - Set resource limits (CPU, memory, time)
- **4.1.3**: Add timeout enforcement (default 5 minutes)
- **4.1.4**: Capture stdout/stderr streams
- **4.1.5**: Clean up containers after execution

**Deliverable**: Can run arbitrary commands in Docker container

#### 4.2: Sandbox Images
- **4.2.1**: Create base sandbox image `Dockerfile.sandbox-base`:
  - Node.js, TypeScript, pnpm
  - Python, pip
  - Java, Maven
  - Common build tools
- **4.2.2**: Create language-specific images:
  - `sandbox-typescript:latest`
  - `sandbox-python:latest`
  - `sandbox-java:latest`
- **4.2.3**: Add images to docker-compose for local testing
- **4.2.4**: Set up image registry (DockerHub or private registry)

**Deliverable**: Sandbox images available locally and in registry

#### 4.3: Test Execution
- **4.3.1**: Implement `TestRunner` class:
  - `runTests(artifact: Artifact, testCommand: string): Promise<TestResult>`
- **4.3.2**: Parse test framework outputs:
  - Vitest (JSON reporter)
  - Pytest (JSON reporter)
  - JUnit (XML)
- **4.3.3**: Return structured test results:
  ```typescript
  interface TestResult {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    tests: TestCase[];
    coverage?: CoverageReport;
  }
  ```
- **4.3.4**: Add coverage collection (if supported)

**Deliverable**: Can run tests in sandbox and get structured results

#### 4.4: Build/Compile Execution
- **4.4.1**: Implement `BuildRunner` class:
  - Detect build system (package.json, pom.xml, setup.py)
  - Run appropriate build command
  - Capture build logs and errors
- **4.4.2**: Parse compiler errors:
  - TypeScript: structured diagnostics
  - Python: syntax errors
  - Java: javac errors
- **4.4.3**: Return build result with diagnostics

**Deliverable**: Can compile generated code and report errors

#### 4.5: Golden Tests Framework
- **4.5.1**: Define golden test format in generator:
  ```
  generators/<name>/tests/golden/
    ├── case-1/
    │   ├── input.json
    │   └── expected/
    │       ├── file1.ts
    │       └── file2.ts
    ├── case-2/
    └── ...
  ```
- **4.5.2**: Implement `GoldenTestRunner`:
  - Load all golden tests for generator
  - Generate artifacts from inputs
  - Compare outputs to expected (normalized diff)
  - Report diffs
- **4.5.3**: Add `--bless` mode to update golden files
- **4.5.4**: Add golden test CI check (fails if diffs found)

**Deliverable**: Golden tests guard against regressions

#### 4.6: Integration Tests for Generators
- **4.6.1**: Implement full integration test flow:
  ```
  generate → save artifact → run in sandbox → validate output → run tests → assert success
  ```
- **4.6.2**: Add `generators/<name>/tests/integration/` directory
- **4.6.3**: Write integration test for `workflow-handler`:
  - Generate handler from spec
  - Run in sandbox with mock dependencies
  - Execute generated tests
  - Assert 100% pass rate
- **4.6.4**: Add integration test CI step

**Deliverable**: End-to-end generator tests work

#### 4.7: API for Testing
- **4.7.1**: Add `POST /api/generators/:id/test` route:
  - Runs all golden + integration tests
  - Returns aggregate results
- **4.7.2**: Add `POST /api/artifacts/:id/test` route:
  - Runs tests for specific artifact
- **4.7.3**: Update CLI: `codegen test <generator-id>`

**Deliverable**: Can trigger tests via API and CLI

---

## Phase 5: MCP Interface & Agent Integration

**Duration**: 2 weeks
**Milestone**: MCP protocol implemented; agents can call tools successfully

### Tasks

#### 5.1: MCP Protocol Package (Package: `codegen-mcp-protocol`)
- **5.1.1**: Define MCP request/response types:
  ```typescript
  interface MCPRequest {
    tool: string;
    parameters: Record<string, unknown>;
    context?: MCPContext;
  }
  interface MCPResponse {
    status: 'success' | 'error';
    data?: unknown;
    error?: MCPError;
  }
  interface MCPError {
    code: string;
    message: string;
    details?: unknown;
    suggestions?: string[];
  }
  ```
- **5.1.2**: Define error codes:
  - `INVALID_SPEC`, `VALIDATION_FAILED`, `TEMPLATE_ERROR`,
    `SANDBOX_TIMEOUT`, `GENERATOR_NOT_FOUND`, `UNAUTHORIZED`
- **5.1.3**: Generate JSON Schema for all MCP types
- **5.1.4**: Write type guards and validators

**Deliverable**: MCP protocol types and schemas defined

#### 5.2: MCP Tool Definitions
- **5.2.1**: Define tool: `listGenerators`:
  ```typescript
  parameters: { tags?: string[]; search?: string }
  returns: { generators: GeneratorSummary[] }
  ```
- **5.2.2**: Define tool: `getGeneratorManifest`:
  ```typescript
  parameters: { generatorId: string; version?: string }
  returns: { manifest: GeneratorManifest }
  ```
- **5.2.3**: Define tool: `validateSpec`:
  ```typescript
  parameters: { generatorId: string; spec: unknown }
  returns: { valid: boolean; errors?: ValidationError[] }
  ```
- **5.2.4**: Define tool: `previewGenerate`:
  ```typescript
  parameters: { generatorId: string; spec: unknown; options?: GenerateOptions }
  returns: { files: PreviewFile[]; previewUrl: string }
  ```
- **5.2.5**: Define tool: `generateArtifact`:
  ```typescript
  parameters: {
    generatorId: string;
    spec: unknown;
    options: GenerateOptions;
    idempotencyKey?: string; // NEW: Optional, auto-computed if not provided
  }
  returns: {
    artifactId: string;
    files: FileInfo[];
    diagnostics: Diagnostic[];
    provenance: GeneratorProvenance; // NEW: Full provenance
    cached?: boolean; // NEW: True if returned from cache
  }
  ```
- **5.2.6**: Define tool: `testGenerator`:
  ```typescript
  parameters: { generatorId: string; version?: string }
  returns: { passed: boolean; results: TestResult[] }
  ```
- **5.2.7**: Define tool: `registerGenerator`:
  ```typescript
  parameters: { manifest: GeneratorManifest; bundle: string /* base64 */ }
  returns: { generatorId: string; version: string; status: 'registered' | 'pending-review' }
  ```
- **5.2.8**: Define tool: `createPR`:
  ```typescript
  parameters: { artifactId: string; targetRepo: string; branch: string; commitMessage: string }
  returns: { prUrl: string; prNumber: number }
  ```

**Deliverable**: All MCP tools have typed definitions

#### 5.3: MCP Route Handler (Service)
- **5.3.1**: Add `POST /mcp` route:
  - Accepts `MCPRequest` in body
  - Routes to appropriate handler based on `tool` field
  - Returns `MCPResponse`
- **5.3.2**: Implement handler for each tool (delegates to existing services)
- **5.3.3**: Add request validation (schema-based)
- **5.3.4**: Add authentication check (API key validation)
- **5.3.5**: Add rate limiting per agent
- **5.3.6**: Add telemetry/logging for MCP calls
- **5.3.7**: Write integration tests for all MCP tools
- **5.3.8**: Add idempotency key handling to `generateArtifact` tool:
  - Auto-compute if not provided
  - Check for existing artifacts with same key
  - Return cached result if available
  - Include `cached: true` flag in response
- **5.3.9**: Add `autofix` parameter support in `generateArtifact` tool

**Deliverable**: MCP endpoint works for all tools with idempotency and auto-fix support

#### 5.4: MCP Client SDK
- **5.4.1**: Create `@appgen/codegen-mcp-client` package:
  - TypeScript client library
  - Typed methods for each tool
  - Automatic retries for transient errors
  - Error parsing with suggestions
- **5.4.2**: Example usage:
  ```typescript
  const client = new CodegenMCPClient({ apiKey: '...' });
  const result = await client.generateArtifact({
    generatorId: 'workflow-handler',
    spec: { ... }
  });
  ```
- **5.4.3**: Add Python client library (optional, for Python agents)
- **5.4.4**: Write client tests (against mock server)

**Deliverable**: Agents can easily call MCP tools programmatically

#### 5.5: MCP Documentation
- **5.5.1**: Generate API reference from types (TypeDoc)
- **5.5.2**: Write agent integration guide:
  - How to authenticate
  - Tool call examples
  - Error handling patterns
  - Best practices
- **5.5.3**: Create runnable examples for each tool
- **5.5.4**: Add OpenAPI spec for MCP endpoint

**Deliverable**: Complete MCP documentation published

#### 5.6: CLI MCP Mode
- **5.6.1**: Add `codegen mcp <tool> <params>` subcommand:
  - Calls MCP endpoint with typed parameters
  - Pretty-prints results
- **5.6.2**: Add JSON input/output mode for scripting
- **5.6.3**: Examples:
  ```bash
  codegen mcp listGenerators
  codegen mcp validateSpec --generator workflow-handler --spec spec.json
  codegen mcp generateArtifact --generator workflow-handler --spec spec.json --json
  ```

**Deliverable**: CLI supports MCP tool invocation

---

## Phase 6: Generator Composition & Orchestration

**Duration**: 2 weeks
**Milestone**: Can generate multiple related artifacts in one operation with dependency resolution

### Tasks

#### 6.1: Composition Core (Package: `codegen-composition`)
- **6.1.1**: Define composition graph:
  ```typescript
  interface CompositionSpec {
    name: string;
    generators: GeneratorStep[];
  }
  interface GeneratorStep {
    id: string;
    generatorId: string;
    spec: unknown;
    dependsOn?: string[]; // step IDs
    inputMapping?: Record<string, string>; // map outputs from dependencies
  }
  ```
- **6.1.2**: Implement `CompositionEngine` class:
  - Parse composition spec
  - Build dependency DAG
  - Topological sort for execution order
  - Execute generators in order
  - Pass outputs between steps via `inputMapping`
- **6.1.3**: Add cycle detection
- **6.1.4**: Write unit tests for DAG and execution order

**Deliverable**: Can execute multi-step compositions

#### 6.2: Composition Manifest
- **6.2.1**: Create composition manifest format:
  ```yaml
  id: fullstack-endpoint
  displayName: Full-Stack Endpoint
  description: Generate DTO, handler, validator, and tests
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
- **6.2.2**: Define JSON Schema for composition manifests
- **6.2.3**: Implement composition loader
- **6.2.4**: Validate composition manifests

**Deliverable**: Composition manifests are validated and loadable

#### 6.3: Composition Registry
- **6.3.1**: Extend `GeneratorRegistry` to support compositions
- **6.3.2**: Add `registerComposition(manifest: CompositionManifest): void`
- **6.3.3**: Add `getComposition(id: string): CompositionManifest`
- **6.3.4**: Add compositions to `listGenerators` response (with type flag)

**Deliverable**: Compositions are first-class citizens in registry

#### 6.4: Composition Execution
- **6.4.1**: Integrate `CompositionEngine` into `GeneratorManager`
- **6.4.2**: Add `generateComposition(compositionId, spec)` method:
  - Resolve all generator steps
  - Execute in dependency order
  - Aggregate outputs into single `GenerationResult`
- **6.4.3**: Handle partial failures:
  - If step fails, mark dependent steps as skipped
  - Return results for successful steps
- **6.4.4**: Add progress events for multi-step generation
- **6.4.5**: Write integration tests for composition execution

**Deliverable**: Can generate multi-artifact compositions

#### 6.5: MCP Tool for Composition
- **6.5.1**: Add `generateComposition` MCP tool:
  ```typescript
  parameters: { compositionId: string; spec: unknown; options?: GenerateOptions }
  returns: { artifactIds: string[]; files: FileInfo[]; diagnostics: Diagnostic[] }
  ```
- **6.5.2**: Update MCP route handler
- **6.5.3**: Add to CLI: `codegen compose <composition-id> --spec <file>`

**Deliverable**: Agents can invoke compositions via MCP

#### 6.6: Example Composition
- **6.6.1**: Create `compositions/fullstack-endpoint/`:
  - Manifest composing DTO + handler + validator + tests
  - Example input spec
  - Golden test
- **6.6.2**: Test end-to-end composition execution
- **6.6.3**: Document composition development guide

**Deliverable**: Working composition example

---

## Phase 7: Security & Production Hardening

**Duration**: 2-3 weeks
**Milestone**: Production-ready security, audit logs, and safe execution

### Tasks

#### 7.1: Authentication & Authorization (Package: `codegen-auth`)
- **7.1.1**: Define roles:
  - `viewer`: list generators, validate specs
  - `generator`: all viewer + generate artifacts
  - `admin`: all generator + register generators
- **7.1.2**: Implement API key management:
  - Store in `api_keys` table (hashed)
  - Include roles, expiration, rate limits
- **7.1.3**: Create `AuthMiddleware` Fastify plugin:
  - Extract API key from `Authorization: Bearer <key>` header
  - Validate key and load roles
  - Attach to request context
- **7.1.4**: Implement authorization checks:
  - `@requireRole(role)` decorator for routes
  - Return 403 for insufficient permissions
- **7.1.5**: Add CLI key management: `codegen keys create/list/revoke`
- **7.1.6**: Write auth tests

**Deliverable**: All endpoints protected with role-based auth

#### 7.2: Audit Logging
- **7.2.1**: Create `audit_logs` table:
  ```sql
  CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    actor_id TEXT NOT NULL,
    actor_type TEXT NOT NULL, -- 'agent' | 'user'
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT
  );
  CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
  CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
  ```
- **7.2.2**: Implement `AuditLogger` class:
  - Log all MCP calls
  - Log generator registration
  - Log artifact generation/download
  - Log PR creation
- **7.2.3**: Add audit log middleware to Fastify
- **7.2.4**: Add audit log query API: `GET /api/audit-logs`
- **7.2.5**: Add audit log viewer in CLI

**Deliverable**: All actions are audited and queryable

#### 7.3: Sandbox Hardening
- **7.3.1**: Add seccomp profile to Docker containers:
  - Block network syscalls (except loopback)
  - Block file system writes outside /tmp
- **7.3.2**: Run containers as non-root user
- **7.3.3**: Set resource limits:
  - CPU: 1 core
  - Memory: 2GB
  - Disk: 1GB
  - Time: 5 minutes
- **7.3.4**: Add network isolation (no external network)
- **7.3.5**: Add security scanning for sandbox images

**Deliverable**: Sandboxes are secure and isolated

#### 7.4: Template Sandboxing
- **7.4.1**: Run Handlebars rendering in isolated VM context:
  - Use `vm2` or `isolated-vm` library
  - No access to `require`, `process`, `fs`
  - Timeout enforcement (30 seconds)
- **7.4.2**: Validate all helpers before registration:
  - Static analysis for forbidden patterns
  - No dynamic code execution (eval, Function)
- **7.4.3**: Freeze template context (deep immutability)
- **7.4.4**: Write security tests (try to escape sandbox)

**Deliverable**: Template rendering is sandboxed

#### 7.5: Dependency Scanning
- **7.5.1**: Integrate `npm audit` or Snyk for generator dependencies
- **7.5.2**: Run security scan on generator registration:
  - Scan package.json dependencies
  - Fail if high/critical vulnerabilities found
- **7.5.3**: Add periodic re-scanning of registered generators
- **7.5.4**: Report vulnerabilities in generator manifest

**Deliverable**: Generators with vulnerabilities are blocked

#### 7.6: Rate Limiting
- **7.6.1**: Implement rate limiter using Redis:
  - Per API key limits (e.g., 100 req/min)
  - Per endpoint limits
  - Burst allowances
- **7.6.2**: Add rate limit middleware to Fastify
- **7.6.3**: Return 429 with `Retry-After` header
- **7.6.4**: Add rate limit metrics

**Deliverable**: API is protected from abuse

#### 7.7: Artifact & Provenance Signing
- **7.7.1**: Generate signing key pair (Ed25519)
- **7.7.2**: Sign all generated artifacts:
  - Hash all files (SHA-256)
  - Sign artifact manifest with private key
  - Include signature in metadata
- **7.7.3**: Sign provenance data:
  - Compute provenance hash (SHA-256 of entire provenance object)
  - Sign provenance hash with private key
  - Store signature in `artifact_provenance` table
- **7.7.4**: Add verification endpoint: `POST /api/artifacts/:id/verify`
  - Verify artifact signature
  - Verify provenance signature
  - Check provenance hash matches recomputed hash
  - Return structured verification result
- **7.7.5**: Add signature to artifact metadata and provenance objects
- **7.7.6**: Integrate provenance signing into generation pipeline:
  - Sign provenance after finalization
  - Store signed provenance before artifact storage
- **7.7.7**: Write tests for signing and verification

**Deliverable**: Artifacts and provenance are cryptographically signed and verifiable

---

## Phase 8: Developer Experience & Tooling

**Duration**: 2 weeks
**Milestone**: Easy generator development with SDK, CLI wizard, and VS Code extension

### Tasks

#### 8.1: Generator SDK (Package: `codegen-sdk`)
- **8.1.1**: Create generator development utilities:
  - `createGenerator(manifest)` - scaffold generator
  - `testGenerator(path)` - run golden + integration tests locally
  - `validateManifest(manifest)` - validate before registration
  - `buildHelpers(helpersDir)` - compile helper modules
- **8.1.2**: Add testing utilities:
  - `createTestContext(spec)` - generate frozen context
  - `assertGeneratedFiles(result, expected)` - compare outputs
- **8.1.3**: Add type definitions for manifest and schema
- **8.1.4**: Write SDK documentation with examples

**Deliverable**: Generator development SDK published

#### 8.2: CLI Generator Wizard
- **8.2.1**: Add `codegen init-generator` command:
  - Interactive prompts: name, description, language, outputs
  - Generate manifest scaffold
  - Generate template files with placeholders
  - Generate schema with example properties
  - Generate golden test scaffold
  - Initialize package.json with SDK dependency
- **8.2.2**: Add `codegen add-helper <name>` subcommand:
  - Scaffold helper function
  - Add to manifest
- **8.2.3**: Add `codegen add-template <name>` subcommand:
  - Create new template file
  - Add to outputs in manifest

**Deliverable**: Can scaffold new generator in minutes

#### 8.3: Local Testing Workflow
- **8.3.1**: Add `codegen test-local <generator-path>` command:
  - Load generator from local directory (not registry)
  - Run golden tests
  - Run integration tests
  - Report results
- **8.3.2**: Add `--bless` flag to update golden files
- **8.3.3**: Add `--watch` mode for development
- **8.3.4**: Add `--debug` mode with verbose logging

**Deliverable**: Can develop generators locally with fast feedback

#### 8.4: VS Code Extension
- **8.4.1**: Create extension: `codegen-vscode`
- **8.4.2**: Add features:
  - Syntax highlighting for `.hbs` templates
  - Manifest YAML schema validation
  - Snippet completion for helpers
  - Preview command: generate from spec in editor
  - Test runner integration (run golden tests)
- **8.4.3**: Publish to VS Code marketplace

**Deliverable**: VS Code extension available (optional but valuable)

#### 8.5: Dependency Graph Visualization (Package: `codegen-graph`)
- **8.5.1**: Implement `GraphGenerator` class:
  ```typescript
  interface GraphGenerator {
    generateGeneratorGraph(generatorId: string): DependencyGraph;
    generateCompositionGraph(compositionId: string): DependencyGraph;
    generateSystemGraph(): DependencyGraph; // All generators
    export(graph: DependencyGraph, format: 'dot' | 'mermaid' | 'json'): string;
  }
  ```
- **8.5.2**: Implement graph builders:
  - `GeneratorGraphBuilder`: Analyze generator dependencies (helpers, templates)
  - `CompositionGraphBuilder`: Build DAG for composition steps
  - `SystemGraphBuilder`: Full system dependency view
- **8.5.3**: Add Graphviz DOT format exporter:
  ```dot
  digraph {
    "workflow-handler" [shape=box]
    "workflow-handler" -> "string-helpers" [label="helper"]
    "workflow-handler" -> "ts-helpers" [label="helper"]
    "workflow-handler" -> "handler.ts.hbs" [label="template"]
  }
  ```
- **8.5.4**: Add Mermaid format exporter:
  ```mermaid
  graph TD
    A[workflow-handler] --> B[string-helpers]
    A --> C[ts-helpers]
    A --> D[handler.ts.hbs]
  ```
- **8.5.5**: Add JSON format exporter (for programmatic use)
- **8.5.6**: Add CLI commands:
  - `codegen graph` → all generators
  - `codegen graph <generator-id>` → single generator
  - `codegen graph --composition <id>` → composition flow
  - `codegen graph --format dot|mermaid|json` → output format
  - `codegen graph --output graph.dot` → save to file
- **8.5.7**: Add API endpoints:
  - `GET /api/generators/:id/graph?format=dot|mermaid|json`
  - `GET /api/compositions/:id/graph?format=dot|mermaid|json`
  - `GET /api/graph/system?format=dot|mermaid|json`
- **8.5.8**: Write tests for graph generation and export
- **8.5.9**: Add graph visualization to documentation site (using Mermaid)

**Deliverable**: Visual dependency graphs for generators and compositions

#### 8.6: Documentation Site
- **8.6.1**: Create `docs/` site with VitePress or Docusaurus:
  - Getting Started
  - Generator Development Guide
  - MCP Tool Reference (auto-generated)
  - Helper API Reference
  - Composition Guide
  - Security Best Practices
  - Provenance & Reproducibility Guide (NEW)
  - Pipeline Customization Guide (NEW)
- **8.6.2**: Add interactive examples (embedded CodeSandbox)
- **8.6.3**: Add changelog and migration guides
- **8.6.4**: Add graph visualizations using Mermaid (NEW)
- **8.6.5**: Deploy to GitHub Pages or Vercel

**Deliverable**: Comprehensive documentation site published with graph visualizations

#### 8.7: Generator Examples Repository
- **8.7.1**: Create `generators-examples/` repository:
  - Minimal example (hello-world)
  - Complete example (workflow-handler)
  - Multi-file example (fullstack-endpoint composition)
  - Advanced example with custom helpers
- **8.7.2**: Add README for each example
- **8.7.3**: Include golden tests for all examples
- **8.7.4**: Include dependency graphs for each example (NEW)

**Deliverable**: Developers can clone and learn from examples with visual documentation

---

## Phase 9: Observability & Operations

**Duration**: 1-2 weeks
**Milestone**: Production observability with metrics, traces, and health checks

### Tasks

#### 9.1: Metrics Package (Package: `codegen-metrics`)
- **9.1.1**: Set up Prometheus client
- **9.1.2**: Define metrics:
  - `codegen_generations_total` (counter, labels: generator_id, status)
  - `codegen_generation_duration_seconds` (histogram, labels: generator_id)
  - `codegen_template_render_duration_seconds` (histogram)
  - `codegen_sandbox_execution_duration_seconds` (histogram)
  - `codegen_validation_errors_total` (counter, labels: error_code)
  - `codegen_api_requests_total` (counter, labels: endpoint, status)
- **9.1.3**: Add metrics collection throughout codebase
- **9.1.4**: Add metrics endpoint: `GET /metrics` (Prometheus format)

**Deliverable**: Prometheus metrics exposed

#### 9.2: Distributed Tracing
- **9.2.1**: Integrate OpenTelemetry:
  - Trace generation pipeline: validate → render → validate output → save
  - Trace MCP calls
  - Trace sandbox execution
- **9.2.2**: Configure Jaeger exporter
- **9.2.3**: Add trace context propagation (for multi-service setups)
- **9.2.4**: Add Jaeger to docker-compose

**Deliverable**: Distributed traces viewable in Jaeger

#### 9.3: Structured Logging
- **9.3.1**: Configure Pino with JSON output
- **9.3.2**: Add log correlation IDs (trace ID)
- **9.3.3**: Add contextual logging:
  - `logger.child({ generatorId, artifactId })`
- **9.3.4**: Log key events:
  - Generation started/completed
  - Validation errors
  - Sandbox execution
  - Template rendering
- **9.3.5**: Add log aggregation setup (Loki or ELK stack)

**Deliverable**: Structured logs aggregated and searchable

#### 9.4: Health Checks
- **9.4.1**: Add `/health` endpoint (basic liveness):
  - Returns 200 if server is up
- **9.4.2**: Add `/health/ready` endpoint (readiness):
  - Check database connection
  - Check Redis connection
  - Check artifact store availability
  - Check generator registry loaded
  - Return 200 if all healthy, 503 otherwise
- **9.4.3**: Add `/health/live` endpoint (liveness):
  - Check for deadlocks or blocked event loop
- **9.4.4**: Configure Kubernetes health probes (if applicable)

**Deliverable**: Health checks for orchestration

#### 9.5: Alerting Rules
- **9.5.1**: Define Prometheus alerting rules:
  - High error rate (>5% of generations failing)
  - Slow generation (p95 > 30 seconds)
  - Sandbox timeouts (>1% timeout rate)
  - Service down (health check failing)
- **9.5.2**: Configure Alertmanager
- **9.5.3**: Integrate with PagerDuty or Slack

**Deliverable**: Alerts configured for critical issues

#### 9.6: Dashboards
- **9.6.1**: Create Grafana dashboards:
  - Service overview (requests, errors, latency)
  - Generation metrics (count, duration by generator)
  - Sandbox metrics (execution time, resource usage)
  - API metrics (endpoints, rate limits)
- **9.6.2**: Add Grafana to docker-compose
- **9.6.3**: Export dashboards as JSON

**Deliverable**: Grafana dashboards for monitoring

---

## Phase 10: Performance & Scale

**Duration**: 2 weeks
**Milestone**: System optimized for high throughput and low latency

### Tasks

#### 10.1: Caching Strategy
- **10.1.1**: Implement multi-layer caching:
  - L1: In-memory LRU cache for compiled templates
  - L2: Redis cache for generation results (keyed by spec hash)
- **10.1.2**: Add cache invalidation on generator version change
- **10.1.3**: Add cache hit/miss metrics
- **10.1.4**: Configure cache TTLs (e.g., 1 hour for results, indefinite for templates)

**Deliverable**: Repeated generations use cache

#### 10.2: Async Generation
- **10.2.1**: Add job queue (BullMQ with Redis):
  - Queue generation requests
  - Process asynchronously in background workers
- **10.2.2**: Add job status tracking:
  - `pending`, `running`, `completed`, `failed`
- **10.2.3**: Add API endpoints:
  - `POST /api/generate-async` → returns job ID
  - `GET /api/jobs/:id` → returns job status and result
- **10.2.4**: Add webhooks for job completion
- **10.2.5**: Add job retention policy (auto-delete after 7 days)

**Deliverable**: Long-running generations don't block API

#### 10.3: Batch Generation
- **10.3.1**: Add `POST /api/generate-batch` endpoint:
  - Accept array of generation requests
  - Queue all as jobs
  - Return array of job IDs
- **10.3.2**: Implement parallel execution (configurable workers)
- **10.3.3**: Add batch status endpoint: `GET /api/batches/:id`

**Deliverable**: Can generate multiple artifacts in parallel

#### 10.4: Generator Preloading
- **10.4.1**: Preload all registered generators on service startup:
  - Compile templates
  - Load manifests
  - Warm cache
- **10.4.2**: Add generator reload endpoint: `POST /api/generators/reload`
- **10.4.3**: Add hot-reload for development mode

**Deliverable**: First generation is fast (no cold start)

#### 10.5: Template Compilation Optimization
- **10.5.1**: Pre-compile all templates on generator registration
- **10.5.2**: Store compiled templates in artifact store
- **10.5.3**: Lazy-load templates only when needed
- **10.5.4**: Add template compilation benchmarks

**Deliverable**: Template rendering is fast

#### 10.6: Database Optimization
- **10.6.1**: Add connection pooling (pg-pool)
- **10.6.2**: Add prepared statements for common queries
- **10.6.3**: Add database indexes (see Phase 3.4)
- **10.6.4**: Add query performance monitoring
- **10.6.5**: Optimize N+1 queries (batch loading)

**Deliverable**: Database queries are efficient

#### 10.7: Load Testing
- **10.7.1**: Create load testing suite (k6 or Artillery):
  - Test: 100 concurrent generation requests
  - Test: 1000 generations per minute
  - Test: Large artifacts (100+ files)
- **10.7.2**: Run load tests and identify bottlenecks
- **10.7.3**: Optimize based on results
- **10.7.4**: Add load testing to CI (periodic runs)

**Deliverable**: System handles production load

#### 10.8: Horizontal Scaling
- **10.8.1**: Ensure service is stateless (all state in DB/Redis)
- **10.8.2**: Add load balancer configuration (nginx)
- **10.8.3**: Test multi-instance deployment
- **10.8.4**: Document scaling guidelines

**Deliverable**: Can scale horizontally by adding instances

---

## Testing Strategy

### Unit Tests
- **Coverage requirement**: 90%+ for all packages
- **Location**: `packages/<name>/src/__tests__/*.test.ts`
- **Framework**: Vitest
- **Run**: `pnpm test`
- **Scope**: Pure functions, classes, helpers

### Integration Tests
- **Location**: `packages/<name>/tests/*.test.ts`
- **Scope**: End-to-end flows within package (e.g., generate → validate → store)
- **Dependencies**: Real database, Redis, MinIO (in docker-compose)
- **Run**: `pnpm test:integration`

### Golden Tests
- **Location**: `generators/<name>/tests/golden/`
- **Scope**: Generator output regression testing
- **Run**: `pnpm -F @appgen/codegen-cli test-golden`
- **CI**: Fail on diffs, require explicit --bless to update

### API Tests
- **Location**: `apps/codegen-service/tests/api/*.test.ts`
- **Scope**: HTTP API endpoints, MCP protocol
- **Framework**: Vitest + Supertest
- **Run**: `pnpm -F codegen-service test:api`

### Load Tests
- **Location**: `tests/load/`
- **Framework**: k6
- **Run**: `k6 run tests/load/generation-load.js`
- **CI**: Run weekly, report results

### Security Tests
- **Location**: `tests/security/`
- **Scope**: Sandbox escape attempts, template injection, auth bypass
- **Run**: `pnpm test:security`
- **CI**: Must pass before deploy

---

## Deployment & CI/CD

### CI Pipeline (GitHub Actions)
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    - Install deps
    - Run ESLint, Prettier
  build:
    - Install deps
    - Build all packages
    - Upload artifacts
  test:
    - Install deps
    - Start docker-compose (Postgres, Redis, MinIO)
    - Run unit tests
    - Run integration tests
    - Upload coverage to Codecov
  golden-tests:
    - Install deps
    - Run golden tests for all generators
    - Fail if diffs found (unless [bless] in commit message)
  api-tests:
    - Install deps
    - Start service
    - Run API tests
  security-tests:
    - Install deps
    - Run security tests
  load-tests:
    - Install deps
    - Run basic load test (100 req/min)
    - Fail if p95 latency > 5s
```

### CD Pipeline (GitHub Actions)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-image:
    - Build Docker image
    - Tag with git SHA and 'latest'
    - Push to registry (DockerHub or private registry)
  deploy-staging:
    - Deploy to staging environment
    - Run smoke tests
    - Wait for approval
  deploy-production:
    - Deploy to production
    - Run smoke tests
    - Monitor metrics
```

### Docker Compose (Local Development)
```yaml
services:
  codegen-service:
    build: ./apps/codegen-service
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://...
      REDIS_URL: redis://...
      MINIO_ENDPOINT: minio:9000
    depends_on: [postgres, redis, minio]
  postgres:
    image: postgres:15
  redis:
    image: redis:7
  minio:
    image: minio/minio
  jaeger:
    image: jaegertracing/all-in-one
  grafana:
    image: grafana/grafana
```

---

## Success Metrics

### Functional Metrics
- **Generator Coverage**: 10+ production generators by end of Phase 8
- **Agent Adoption**: 5+ AI agents using MCP interface by end of Phase 5
- **Generation Success Rate**: >95% of generations succeed without errors
- **Test Pass Rate**: 100% of golden tests pass in CI
- **Provenance Coverage**: 100% of artifacts have complete provenance (NEW)
- **Idempotency Success Rate**: >99% cache hits for duplicate requests (NEW)

### Performance Metrics
- **Generation Latency**: p95 < 10 seconds for single generators
- **API Latency**: p95 < 500ms for list/validate endpoints
- **Throughput**: Handle 1000 generations per minute
- **Cache Hit Rate**: >80% for repeated specs
- **Auto-Fix Success Rate**: >90% of fixable issues auto-corrected (NEW)
- **Pipeline Execution Overhead**: <5% overhead vs direct execution (NEW)

### Quality Metrics
- **Code Coverage**: >90% for all packages
- **Zero Critical Vulnerabilities**: In dependencies and generated code
- **Uptime**: >99.9% availability in production
- **Documentation Coverage**: 100% of public APIs documented
- **Provenance Verification Rate**: 100% of artifacts verifiable (NEW)

### Developer Experience Metrics
- **Time to First Generator**: <1 hour from SDK install to working generator
- **Generator Registration Time**: <5 minutes (validation + tests)
- **Developer Satisfaction**: Survey after Phase 8 (target: 8/10)
- **Graph Generation Time**: <1 second for system-wide graph (NEW)

---

## Milestones Summary

| Phase | Duration | Milestone | Demo | Enhanced Features |
|-------|----------|-----------|------|-------------------|
| 0 | 1-2 weeks | Foundation | Service health check works | 17 packages scaffolded |
| 1 | 2-3 weeks | Core Engine | Generate hello-world via API | Pipeline definition interfaces |
| 2 | 2-3 weeks | Templates & Pipeline | Generate workflow-handler from spec | Auto-fix mode, pipeline execution |
| 3 | 2-3 weeks | Storage & Provenance | Download artifacts with provenance | Idempotency keys, full provenance |
| 4 | 2-3 weeks | Testing | Golden tests guard regressions | - |
| 5 | 2 weeks | MCP | Agents call tools successfully | Idempotency in MCP, auto-fix support |
| 6 | 2 weeks | Composition | Generate fullstack endpoint (DTO+handler+tests) | - |
| 7 | 2-3 weeks | Security | Auth, audit logs, sandboxing work | Provenance signing |
| 8 | 2 weeks | DX | Init generator in <5 minutes | Dependency graphs, visual docs |
| 9 | 1-2 weeks | Observability | Metrics, traces, dashboards live | Pipeline execution metrics |
| 10 | 2 weeks | Performance | Handle 1000 gen/min | Provenance caching |

**Total Duration**: ~21-29 weeks (5-7 months)

**Key Enhancements Delivered**:
- ✅ Extensible Pipeline Architecture
- ✅ Idempotency for Safe Retries
- ✅ Complete Provenance Tracking
- ✅ Auto-Fix for Trivial Errors
- ✅ Visual Dependency Graphs

---

## Agent Decision Points & Critical Paths

### Critical Path (Must Complete in Order)
```
Phase 0 → Phase 1 → Phase 2 → Phase 5 (MCP) → Agent Integration Ready
```

### Parallel Execution Opportunities
```
Phase 3 (Storage) ⟶ Can run parallel with Phase 4 (Sandbox)
Phase 6 (Composition) ⟶ Can run parallel with Phase 7 (Security) + Phase 8 (DX)
Phase 9 (Observability) ⟶ Can run parallel with Phase 10 (Performance)
```

### Key Decision Gates
1. **After Phase 2**: If template engine fails determinism tests, halt and redesign
2. **After Phase 4**: If sandbox escapes found, security review required before Phase 7
3. **After Phase 5**: If MCP agent adoption <50%, reassess API design
4. **After Phase 7**: Security audit must pass before production deployment

### Agent Responsibilities Per Phase

| Phase | Primary Agent Role | Dependencies | Blockers |
|-------|-------------------|--------------|----------|
| 0 | Scaffolding automation | None | none |
| 1 | Core engine development | Phase 0 complete | TS strict mode adherence |
| 2 | Template/validation logic | Phase 1 complete | Determinism guarantees |
| 3 | Data storage patterns | Phase 2 complete | DB schema stability |
| 4 | Test infrastructure | Phase 2-3 complete | Sandbox image availability |
| 5 | MCP protocol impl | Phase 4 complete | **Critical** - agents blocked until done |
| 6 | Composition logic | Phase 5 complete | none |
| 7 | Security hardening | Phase 6 complete | **Production gate** |
| 8 | Developer tooling | Phase 7 complete | Documentation completeness |
| 9 | Metrics/observability | Phases 0-8 | Monitoring infrastructure |
| 10 | Performance testing | Phase 9 complete | Load test environment |

### Agent Execution Strategy

**For MVP (Minimal Viable Product):**
1. Execute Phases 0-5 sequentially (14-16 weeks)
2. Goal: Enable agent integration via MCP
3. Skip: Phases 6-10 (composition, security hardening, observability, performance)
4. Ship when: Phase 5 MCP tests pass + 3 agents successfully call tools

**For Production Ready:**
1. Execute all phases 0-7 sequentially (21-24 weeks)
2. Goal: Secure, auditable, production-grade system
3. Then parallelize: Phases 8-10 (3-4 weeks)
4. Ship when: Security audit passes + Performance tests show 1000 gen/min

**For Enterprise Scale:**
1. Execute all phases 0-10 (25-29 weeks)
2. All features, observability, and performance
3. Minimum viable agent integration in Phase 5

---

## Next Steps

1. **Review & Approve**: Get stakeholder sign-off on this plan
2. **Staff Team**: Assign 2-3 engineers to the project
3. **Set Up Project**: Create repo, workspace, CI/CD
4. **Kick Off Phase 0**: Start with foundation scaffolding
5. **Weekly Demos**: Show progress at each milestone
6. **Iterate**: Adjust plan based on learnings and feedback

---

## Agent Import Format (YAML/JSON)

For use by agents, this plan is available in structured format:

```yaml
# Save as: implementation-plan.agent.yaml
project:
  name: CustomCodeGenerator
  version: "2.1.0"
  target_audience: ai_agents

critical_path:
  - phase: 0
    name: "Foundation & Scaffolding"
    duration_weeks: [1, 2]
    blocking: true
  - phase: 1
    name: "Core Generation Engine"
    duration_weeks: [2, 3]
    blocking: true
  - phase: 2
    name: "Template System & Validation"
    duration_weeks: [2, 3]
    blocking: true
  - phase: 5
    name: "MCP Interface & Agent Integration"
    duration_weeks: [2]
    blocking: true

parallel_phases:
  - [3, 4]  # Storage can run with Sandbox
  - [6, 7, 8]  # Composition, Security, DX can run together
  - [9, 10]  # Observability and Performance

agent_gates:
  - phase_2: "Determinism tests must pass"
  - phase_4: "No sandbox escapes found"
  - phase_5: "Agent adoption >50%"
  - phase_7: "Security audit pass required"
```

Save this file and version it alongside the full plan for automated agent planning.

---

## Appendix: Risk Mitigation

### Risks & Mitigations
1. **Risk**: Template engine not deterministic enough
   - **Mitigation**: Extensive testing in Phase 2; add custom determinism checks
2. **Risk**: Sandbox escapes
   - **Mitigation**: Security hardening in Phase 7; regular audits; bug bounty
3. **Risk**: Poor agent adoption
   - **Mitigation**: Early agent feedback in Phase 5; dogfood with internal agents
4. **Risk**: Performance doesn't scale
   - **Mitigation**: Load testing in Phase 10; optimize incrementally; horizontal scaling
5. **Risk**: Generator quality issues
   - **Mitigation**: Mandatory golden tests; peer review; auto-validation on registration

---

**End of Implementation Plan**
