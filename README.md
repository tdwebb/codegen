# Custom Code Generator Project

**Status**: Planning & Documentation Phase (Version 2.1.0)
**Objective**: Build an agent-first code generation platform with Fastify 5, Handlebars templates, and MinIO object storage

---

## Documentation Files

### Core Implementation Plan
📄 **CODEGEN_IMPLEMENTATION_PLAN.md** (76 KB)
- Complete 11-phase implementation roadmap
- Detailed task breakdowns for each phase
- Acceptance criteria and deliverables
- Architecture diagrams and patterns
- MinIO integration (S3-compatible)
- **Start here**: Read this for complete project scope

### Quick Start Guides

📄 **AGENT_QUICK_START.md** (9.7 KB)
- 30-second project overview
- Phase summary table
- Execution strategies (MVP/Production/Enterprise)
- Common questions & answers
- **For agents**: Parse JSON from main plan and check decision gates

📄 **OPTIMIZATION_SUMMARY.md** (9.0 KB)
- What optimizations were made for agents
- Before/after structure comparison
- How agents should use the plan
- Benefits of structured format
- **For teams**: Understand agent-optimization approach

### Implementation Guidance

📄 **MINIO_INTEGRATION_NOTES.md** (7.9 KB)
- MinIO configuration and setup
- SDK patterns (S3-compatible)
- Code examples for Phase 3
- Environment variables
- Docker-compose integration
- **For Phase 3 team**: Complete MinIO implementation guide

### Machine-Readable Metadata

📄 **tasks.agent.json** (2.4 KB)
- JSON metadata for all phases
- Decision gates and acceptance criteria
- Parallelization opportunities
- Effort estimation
- **For agents**: Load directly into planning systems

---

## Key Project Information

### Architecture
- **Framework**: Fastify 5 microservice
- **Monorepo**: pnpm workspace with 17 packages
- **Template Engine**: Handlebars with deterministic helpers
- **Object Storage**: MinIO (S3-compatible)
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis v4.x
- **Agent Integration**: MCP (Model Context Protocol)

### Critical Path (Sequential)
```
Phase 0 (Foundation) → Phase 1 (Core) → Phase 2 (Templates) → Phase 5 (MCP)
```
**Duration**: 10-14 weeks for critical path

### Execution Strategies
| Strategy | Duration | Phases | Goal |
|----------|----------|--------|------|
| **MVP** | 14-16 weeks | 0-5 | Agent integration ready |
| **Production** | 21-24 weeks | 0-7 | Secure, auditable system |
| **Enterprise** | 25-29 weeks | 0-10 | Full-featured, scalable |

### Key Features
- ✅ **Pipeline Definition**: Extensible generation pipeline (Phase 1-2)
- ✅ **Idempotency Keys**: Safe retries and request deduplication (Phase 3)
- ✅ **Generator Provenance**: Complete reproducibility tracking (Phase 3, 7)
- ✅ **Auto-Fix Mode**: Automatic error correction (Phase 2)
- ✅ **Dependency Graphs**: Visual generator relationships (Phase 8)

---

## Quick Navigation

### For Project Managers
1. Read **AGENT_QUICK_START.md** (Phase summary)
2. Review **CODEGEN_IMPLEMENTATION_PLAN.md** (Milestones section)
3. Choose execution strategy (MVP/Production/Enterprise)

### For Development Teams
1. Read **CODEGEN_IMPLEMENTATION_PLAN.md** (Full details)
2. Check **MINIO_INTEGRATION_NOTES.md** (Storage setup)
3. Start with Phase 0 tasks

### For AI Code Generators
1. Parse JSON from **CODEGEN_IMPLEMENTATION_PLAN.md** lines 11-213
2. Load **tasks.agent.json** (structured metadata)
3. Check decision gates in **AGENT_QUICK_START.md**
4. Begin Phase 0 execution

### For DevOps/Infrastructure
1. Review **MINIO_INTEGRATION_NOTES.md** (MinIO setup)
2. Check **CODEGEN_IMPLEMENTATION_PLAN.md** Phase 0 (docker-compose)
3. Prepare infrastructure for Phases 0-5 critical path

---

## Phase Overview

| Phase | Name | Duration | Blocking | Key Deliverable |
|-------|------|----------|----------|-----------------|
| 0 | Foundation & Scaffolding | 1-2 weeks | YES | Pnpm workspace + 17 packages |
| 1 | Core Generation Engine | 2-3 weeks | YES | GeneratorManager + HTTP API |
| 2 | Templates & Validation | 2-3 weeks | YES | Handlebars engine + Pipeline |
| 3 | Artifact Storage | 2-3 weeks | NO | MinIO integration + Provenance |
| 4 | Sandbox Testing | 2-3 weeks | NO | Docker-based test execution |
| 5 | **MCP Interface** | 2 weeks | **YES** | Agent integration tools |
| 6 | Composition | 2 weeks | NO | Multi-artifact generation |
| 7 | Security | 2-3 weeks | NO | Auth + Audit logging |
| 8 | Developer Tools | 2 weeks | NO | SDK + Dependency graphs |
| 9 | Observability | 1-2 weeks | NO | Metrics + Tracing |
| 10 | Performance & Scale | 2 weeks | NO | Caching + Load testing |

---

## Decision Gates

These checkpoints can halt progress if not met:

| Gate | Phase | Requirement | Action if Fails |
|------|-------|-------------|-----------------|
| Determinism | 2 | Templates produce identical output repeatedly | **Redesign** TemplateEngine |
| Sandbox Safety | 4 | No successful escape attempts | Security review required |
| Agent Adoption | 5 | 50%+ of agents successfully use MCP tools | Reassess API design |
| Production Ready | 7 | Security audit passes | Cannot deploy to production |

---

## Getting Started

### Step 1: Review Plan
```bash
# Read main implementation plan (30 minutes)
cat CODEGEN_IMPLEMENTATION_PLAN.md
```

### Step 2: Choose Strategy
- **MVP**: Focus on Phases 0-5, agent integration in 14-16 weeks
- **Production**: Add Phases 6-7, production-ready in 21-24 weeks
- **Enterprise**: All phases, fully featured in 25-29 weeks

### Step 3: Set Up Workspace
```bash
# Phase 0 tasks:
# - Initialize pnpm workspace
# - Create 17 package scaffolds
# - Set up docker-compose
# - Configure CI/CD
```

### Step 4: Execute Phases
- Phase 0 (Foundation): Bootstrap the project
- Phase 1 (Core Engine): Implement GeneratorManager
- Phase 2 (Templates): Add Handlebars + validation
- Phase 5 (MCP): Agent integration
- Then: Parallelize Phases 3, 4, 6, 7, 8, 9, 10

---

## Key Contacts & Resources

### Documentation
- **Full Plan**: CODEGEN_IMPLEMENTATION_PLAN.md (2,179 lines)
- **Quick Start**: AGENT_QUICK_START.md (350 lines)
- **MinIO Guide**: MINIO_INTEGRATION_NOTES.md (280 lines)
- **Optimization**: OPTIMIZATION_SUMMARY.md (180 lines)

### Infrastructure
- **Monorepo**: pnpm workspace (see Phase 0 for setup)
- **Object Storage**: MinIO (Docker-based for local dev)
- **Database**: PostgreSQL (Phase 3)
- **Caching**: Redis (Phase 10)
- **CI/CD**: GitHub Actions (Phase 0)

### Tools & SDKs
- **Template Engine**: Handlebars with deterministic helpers
- **Framework**: Fastify 5
- **Testing**: Vitest (90%+ coverage required)
- **Language**: TypeScript (strict mode)

---

## Success Metrics

### Functional
- ✅ 10+ production generators by Phase 8
- ✅ >95% generation success rate
- ✅ 100% of golden tests pass
- ✅ MCP interface adopted by 5+ agents

### Performance
- ✅ p95 generation latency < 10 seconds
- ✅ 1000+ generations per minute throughput
- ✅ >80% cache hit rate for repeated specs
- ✅ >99.9% system uptime in production

### Quality
- ✅ >90% code coverage all packages
- ✅ Zero critical vulnerabilities
- ✅ 100% public API documentation
- ✅ 100% artifact reproducibility

---

## Timeline Summary

**Total Project Duration**: 5-7 months (25-29 weeks)

**Critical Path** (Must be sequential):
- Phase 0: 1-2 weeks
- Phase 1: 2-3 weeks
- Phase 2: 2-3 weeks
- Phase 5: 2 weeks
- **Subtotal**: 10-14 weeks

**Parallel Work** (Can run simultaneously):
- Phases 3 & 4: 2-3 weeks (after Phase 2)
- Phases 6, 7, 8: 2-3 weeks (after Phase 5)
- Phases 9, 10: 2-3 weeks (after Phase 8)

---

## Next Steps

1. **Review** this README (5 min)
2. **Read** AGENT_QUICK_START.md (15 min)
3. **Choose** execution strategy (MVP/Production/Enterprise)
4. **Begin** Phase 0 (Foundation & Scaffolding)
5. **Track** progress using task IDs (0.1.1, 0.1.2, etc.)
6. **Check** decision gates before advancing phases

---

**Version**: 2.1.0 (Agent-Optimized with MinIO)
**Last Updated**: 2025-11-24
**Target Audience**: Development Teams + AI Code Generator Agents

---

## Files in This Directory

```
codegen/
├── README.md                              (this file)
├── CODEGEN_IMPLEMENTATION_PLAN.md         (76 KB - full plan)
├── AGENT_QUICK_START.md                   (9.7 KB - quick reference)
├── OPTIMIZATION_SUMMARY.md                (9.0 KB - agent optimization explanation)
├── MINIO_INTEGRATION_NOTES.md             (7.9 KB - storage implementation guide)
└── tasks.agent.json                       (2.4 KB - machine-readable metadata)
```

All files ready for Phase 0 execution. Start with the main implementation plan.
