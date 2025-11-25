# Workspace Conventions

## Overview

This document defines the coding and structural conventions for the CodeGen project.

## Project Structure

### Top-Level Directories

```
codegen/
├── apps/                    # Applications (services, CLIs)
├── packages/                # Reusable packages
├── docs/                    # Documentation
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Local development environment
├── Dockerfile              # Production Docker image
├── tsconfig.base.json      # Base TypeScript configuration
├── pnpm-workspace.yaml     # Workspace configuration
├── package.json            # Root package.json
└── .eslintrc.json         # ESLint configuration
```

### Package Structure

Each package follows this structure:

```
packages/{name}/
├── src/
│   ├── index.ts            # Main export
│   ├── types.ts            # Type definitions
│   ├── *.ts                # Implementation files
│   └── __tests__/          # Unit tests
├── tests/                  # Integration tests
├── package.json           # Package manifest
├── tsconfig.json          # TypeScript config
├── tsup.config.ts         # Build config
├── vitest.config.ts       # Test config
└── README.md              # Package documentation
```

## File Naming

- **Directories**: `kebab-case` (e.g., `src/config/validation`)
- **Files**: `kebab-case` (e.g., `user-service.ts`)
- **Classes**: `PascalCase` (e.g., `UserService`)
- **Functions**: `camelCase` (e.g., `validateEmail`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Interfaces**: `PascalCase` with `I` prefix optional (e.g., `IUserRepository` or `UserRepository`)
- **Types**: `PascalCase` (e.g., `UserType`)

### Specification Files

Specifications follow this naming convention:

```
{kind}.{domain}.{name}.v{version}.yaml
```

**Examples:**
- `generator.web.react-component.v1.0.0.yaml`
- `transformer.api.openapi-to-rest.v1.0.0.yaml`

## TypeScript Conventions

### Configuration

All packages extend `tsconfig.base.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Import Statements

```typescript
// Node.js modules
import * as fs from 'fs/promises';
import { promises as fsPromises } from 'fs';

// Third-party modules
import fastify from 'fastify';

// Workspace packages
import { Validator } from '@appgen/codegen-validator';

// Local modules
import { config } from './config';
```

### Type Safety

- Use strict TypeScript settings
- Enable `noUncheckedIndexedAccess`
- Enable `exactOptionalPropertyTypes`
- Avoid `any` (use `unknown` if needed)
- Use discriminated unions for complex types

### Error Handling

Use AppGen error taxonomy:

```typescript
import { AppgenError, ErrorCode } from '@appgen/error-taxonomy';

throw new AppgenError(
  ErrorCode.VALIDATION_ERROR,
  'Specification validation failed',
  { field: 'name' }
);
```

## Code Quality

### Linting

Run ESLint before committing:

```bash
pnpm run lint
pnpm run lint:fix
```

### Testing

- Write unit tests in `src/__tests__/`
- Write integration tests in `tests/`
- Minimum 90% code coverage
- Use Vitest for testing

```bash
pnpm -F @appgen/codegen-core test
pnpm -F @appgen/codegen-core test:watch
pnpm -F @appgen/codegen-core test:coverage
```

### Type Checking

Run TypeScript compiler before committing:

```bash
pnpm run type-check
```

## Development Workflow

### Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

3. Start Fastify service:
   ```bash
   pnpm run dev
   ```

### Building

Build specific package:
```bash
pnpm -F @appgen/codegen-core build
```

Build all packages:
```bash
pnpm run build
```

### Testing

Run all tests:
```bash
pnpm run test
```

Run tests for specific package:
```bash
pnpm -F @appgen/codegen-validator test:watch
```

## Async/Await

- All I/O operations must be async
- Use `async/await` instead of `.then()`
- Use `fs/promises` instead of `fs` synchronous methods
- Avoid blocking operations

### Incorrect

```typescript
const data = fs.readFileSync('file.txt', 'utf-8');
```

### Correct

```typescript
const data = await fs.readFile('file.txt', 'utf-8');
```

## Multi-Tenant Architecture

All database operations include tenant isolation:

```typescript
// Always include tenant_id in queries
const users = await db.select('*').from('users')
  .where('tenant_id', '=', tenantId);
```

## Database

- Use PostgreSQL for persistent storage
- Always include `tenant_id` column
- Add timestamps: `created_at`, `updated_at`
- Use snake_case for column names

## Logging

Use Pino for structured logging:

```typescript
import pino from 'pino';

const logger = pino();

logger.info({ userId: '123' }, 'User created');
logger.error({ error }, 'Generation failed');
```

## Caching

Use Redis for distributed caching:

```typescript
const cacheKey = `${tenantId}:${specId}`;
const cached = await redis.get(cacheKey);
```

## Documentation

- Each package must have a README.md
- Document complex logic with comments
- Use TypeScript JSDoc for public APIs
- Update CHANGELOG on releases

## Git Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test: `pnpm test`
3. Commit with descriptive message
4. Push and create pull request
5. Address code review feedback
6. Merge when approved

## CI/CD

All PRs must pass:

- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Building (tsup)
- ✅ Testing with 90%+ coverage
- ✅ Integration tests

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG
3. Tag release: `git tag v1.0.0`
4. Push tags: `git push --tags`
5. GitHub Actions builds and publishes

## Environment Variables

Create `.env` file for local development:

```bash
NODE_ENV=development
LOG_LEVEL=info
PORT=3000
DATABASE_URL=postgres://appgen:appgen@localhost:5432/codegen
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## Performance Considerations

- Implement caching for expensive operations
- Use pagination for large datasets
- Profile hot paths
- Use database indexes
- Consider async job queues

## Security

- Validate all inputs
- Use prepared statements
- Implement rate limiting
- Use HTTPS in production
- Rotate API keys regularly
- Audit all data access

## Troubleshooting

### Build Failures

```bash
pnpm install --frozen-lockfile
pnpm run build
```

### Test Failures

```bash
pnpm run test --reporter=verbose
```

### Type Errors

```bash
pnpm run type-check
```

### Linting Errors

```bash
pnpm run lint:fix
```
