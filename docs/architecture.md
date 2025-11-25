# Architecture

## Overview

CodeGen is a state-of-the-art AI-optimized code generator platform built on Fastify 5, designed to generate production-ready code from YAML specifications.

## Core Architecture

### Microservice Stack

- **Framework**: Fastify 5 (high-performance Node.js framework)
- **Object Storage**: MinIO (S3-compatible)
- **Database**: PostgreSQL
- **Caching**: Redis
- **Template Engine**: Handlebars with deterministic helpers

### Package Structure

The project is organized as a pnpm monorepo with the following packages:

#### Core Packages
- `@appgen/codegen-core` - Core generation logic
- `@appgen/codegen-pipeline` - Generation pipeline orchestration
- `@appgen/codegen-template-engine` - Template processing with Handlebars
- `@appgen/codegen-validator` - Specification validation

#### Infrastructure Packages
- `@appgen/codegen-artifact-store` - Artifact storage and retrieval
- `@appgen/codegen-sandbox` - Isolated execution environment
- `@appgen/codegen-provenance` - Audit and provenance tracking

#### Service Packages
- `@appgen/codegen-registry` - Specification registry
- `@appgen/codegen-auth` - Authentication and authorization
- `@appgen/codegen-metrics` - Metrics and monitoring

#### Integration Packages
- `@appgen/codegen-mcp-protocol` - Model Context Protocol integration
- `@appgen/codegen-git-integration` - Git operations
- `@appgen/codegen-diff` - Diff generation and analysis

#### Utility Packages
- `@appgen/codegen-composition` - Multi-spec composition
- `@appgen/codegen-graph` - Dependency graph management
- `@appgen/codegen-cli` - Command-line interface
- `@appgen/codegen-sdk` - JavaScript SDK

### Multi-Tenant Architecture

All data operations follow multi-tenant isolation:
- Every database query includes `tenant_id`
- Object storage uses tenant-prefixed paths
- Authentication and authorization scoped to tenant

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript with strict mode
- **Package Manager**: pnpm (monorepo)
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, TypeScript strict checking
- **Containerization**: Docker

## Directory Structure

```
codegen/
├── apps/
│   └── codegen-service/        # Main Fastify application
├── packages/                    # 17 core packages
├── docs/                        # Documentation
├── .github/workflows/           # CI/CD pipelines
├── docker-compose.yml           # Local development stack
├── Dockerfile                   # Production container image
├── tsconfig.base.json          # Base TypeScript configuration
└── pnpm-workspace.yaml         # Workspace configuration
```

## Development Workflow

1. **Local Development**: `pnpm run dev` starts all services via docker-compose
2. **Testing**: `pnpm test` runs all tests with coverage
3. **Building**: `pnpm run build` builds all packages
4. **CI/CD**: GitHub Actions runs lint, type-check, build, and tests

## Key Design Principles

1. **Type Safety**: Strict TypeScript with no unchecked indexed access
2. **Test Coverage**: 90%+ coverage required for all packages
3. **Async-First**: All I/O operations are async (no sync file operations)
4. **Tenant Isolation**: Multi-tenant by default
5. **Determinism**: Template processing with deterministic helpers
6. **Scalability**: Horizontally scalable microservice architecture
