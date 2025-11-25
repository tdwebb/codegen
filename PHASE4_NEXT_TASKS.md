# Phase 4: Remaining Tasks Overview

## Task Completion Progress

| Task | Name | Status | Est. Lines | Dependencies |
|------|------|--------|-----------|--------------|
| 4.1 | Sandbox Executor Core | ✅ **COMPLETE** | 262 impl + 288 tests | None |
| 4.2 | Sandbox Images | ⏳ Pending | ~300 (Dockerfiles) | 4.1 |
| 4.3 | Test Execution (TestRunner) | ⏳ Pending | ~400 | 4.1, 4.2 |
| 4.4 | Build/Compile Execution | ⏳ Pending | ~350 | 4.1, 4.2 |
| 4.5 | Golden Tests Framework | ⏳ Pending | ~500 | 4.1-4.4 |
| 4.6 | Integration Tests | ⏳ Pending | ~400 | 4.1-4.5 |
| 4.7 | API for Testing | ⏳ Pending | ~200 | 4.1-4.6 |

**Total Remaining**: ~2,150 lines of implementation code

## Next: Task 4.2 - Sandbox Images

### Deliverables
Create Docker images for code execution sandboxes:

1. **Base Image** (`Dockerfile.sandbox-base`)
   - Node.js, TypeScript, pnpm
   - Python, pip
   - Java, Maven
   - Common build tools (git, curl, etc.)
   - Non-root user setup
   - ~150 lines

2. **Language-Specific Images**
   - `sandbox-typescript:latest` - Node.js 20 + pnpm
   - `sandbox-python:latest` - Python 3.11 + pip
   - `sandbox-java:latest` - Java 21 + Maven
   - `docker-compose.yml` for local testing

3. **Registry Configuration**
   - Push to DockerHub or private registry
   - Image metadata
   - Version tagging

### Key Features
- All images use non-root user (uid=1000)
- Pre-installed package managers
- Minimal, optimized images (~500MB each)
- /tmp with 1GB limit
- Read-only root filesystem compatible

### Dockerfile Structure
```dockerfile
FROM alpine:3.18

# Install base tools
RUN apk add --no-cache bash curl git

# Add non-root user
RUN addgroup -g 1000 appgen && adduser -D -u 1000 -G appgen appgen

# Language-specific: Node.js
RUN apk add --no-cache nodejs npm && npm install -g pnpm

# Language-specific: Python
RUN apk add --no-cache python3 py3-pip

# Working directory and permissions
WORKDIR /work
RUN chown -R appgen:appgen /work

USER appgen
```

## Task 4.3 - Test Execution (TestRunner)

### Key Classes
- `TestRunner`: Main class for test execution
  - `runTests(artifact, testCommand): Promise<TestResult>`
  - Framework detection
  - Output parsing and structuring

### Test Framework Support
- **Vitest** (JSON reporter)
- **Pytest** (JSON reporter)
- **JUnit** (XML format)

### TestResult Structure
```typescript
interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestCase[];
  coverage?: CoverageReport;
}

interface TestCase {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}
```

### Implementation Steps
1. Create `TestRunner` class
2. Implement framework detectors
3. Add JSON/XML parsers
4. Create TestResult builders
5. Add coverage collection
6. Write comprehensive tests

## Task 4.4 - Build/Compile Execution

### Key Classes
- `BuildRunner`: Main class for compilation
  - `build(artifact): Promise<BuildResult>`
  - Build system detection
  - Compiler error parsing

### Build System Detection
- TypeScript: `tsconfig.json`
- Java: `pom.xml`
- Python: `setup.py` or `pyproject.toml`
- Node.js: `package.json`

### Error Parsing
- TypeScript: `tsc` diagnostics
- Python: SyntaxError/IndentationError
- Java: `javac` error format

### BuildResult Structure
```typescript
interface BuildResult {
  success: boolean;
  duration: number;
  diagnostics: Diagnostic[];
  logs: string;
}

interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}
```

## Task 4.5 - Golden Tests Framework

### Format
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

### GoldenTestRunner
- Load test cases from directory
- Generate artifacts from inputs
- Compare outputs (with normalization)
- Report diffs
- Bless mode for updates

### Integration
- CI check: fails if diffs found
- CLI: `codegen test --golden`
- Guards against regressions

## Recommended Implementation Order

### Week 1
1. **Task 4.2** - Create Dockerfiles (container setup)
2. **Task 4.3** - TestRunner (using 4.1 + 4.2)

### Week 2
3. **Task 4.4** - BuildRunner (using 4.1 + 4.2)
4. **Task 4.5** - Golden tests framework

### Week 3
5. **Task 4.6** - Integration tests for generators
6. **Task 4.7** - API endpoints for testing

## Key Integration Points

- All tasks depend on **Task 4.1** (DockerSandboxExecutor) ✅
- Tasks 4.3-4.4 depend on **Task 4.2** (Images)
- Tasks 4.5-4.7 depend on 4.3-4.4

## Testing Strategy

For each task:
1. Unit tests for business logic
2. Integration tests with real Docker (optional for CI)
3. Mock tests for framework parsing
4. End-to-end tests with sample generators

## Expected Metrics

- **Task 4.2**: ~2-3 hours (Dockerfile creation)
- **Task 4.3**: ~4-5 hours (TestRunner + parsers)
- **Task 4.4**: ~3-4 hours (BuildRunner + parsers)
- **Task 4.5**: ~4-5 hours (Golden test framework)
- **Task 4.6**: ~3-4 hours (Integration tests)
- **Task 4.7**: ~2-3 hours (API endpoints)

**Total Phase 4 Duration**: 18-24 hours of development

## Success Criteria

✅ Task 4.1: Executor runs commands in isolated containers
✅ Task 4.2: Sandbox images available locally
✅ Task 4.3: Test output parsed and structured
✅ Task 4.4: Build errors captured and reported
✅ Task 4.5: Golden tests guard regressions
✅ Task 4.6: Full end-to-end generator testing
✅ Task 4.7: API endpoints expose testing functionality

---

**Ready to begin Task 4.2**: Create sandbox Docker images for TypeScript, Python, and Java environments.
