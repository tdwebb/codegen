# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodeGen is a state-of-the-art ai agent optimized code generator

## Essential Commands

### Development

```bash
# Install dependencies
pnpm install

 

# Start all services
pnpm run dev
```

### Building

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm --filter @codegen/minio build
# OR shorthand:
pnpm -F @codegen/minio build
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm -F @codegen/minio test

# Watch mode for package
pnpm -F @codegen/minio test:watch

# Coverage for package
pnpm -F @codegen/minio test:coverage

# Integration tests
pnpm test:integration

# Generate coverage report
pnpm test:coverage-report
```

### Specification Workflow

```bash
# Validate all specs
pnpm -F @codegen/spec-validators validate

# Validate specific domain specs
pnpm -F @codegen/spec-validators validate --specs specs/email/

# Compile specs to artifacts
pnpm -F @codegen/spec-compiler compile

# Create spec bundle
pnpm -F @codegen/spec-bundler bundle
```

### Infrastructure

```bash
# Database migrations
postgres is on server appgenserver
database for this project should be codegen
user: appgen
password: appgen
pnpm db:migrate

# minio
minio is also on server appgenserver
