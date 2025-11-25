# MinIO Integration Update

**Date**: 2025-11-24
**Status**: Complete
**Impact**: Documentation updated, no code changes required

---

## Overview

All AWS/S3 references in the implementation plan have been replaced with MinIO. Since MinIO provides an S3-compatible API, data structures and code logic remain unchanged.

---

## Changes Made

### 1. CODEGEN_IMPLEMENTATION_PLAN.md

**Section 3.3: Object Storage Integration**

| What | Before | After |
|------|--------|-------|
| Section title | "S3/MinIO Integration" | "MinIO Integration" |
| Class name | `S3ArtifactStore` | `MinIOArtifactStore` |
| SDK | `@aws-sdk/client-s3` | MinIO SDK |
| Deliverable | "Artifacts can be stored in S3/MinIO" | "Artifacts can be stored in MinIO" |

**Line 849** (Task 3.3.1):
```
Before: Implement `S3ArtifactStore` using `@aws-sdk/client-s3`
After:  Implement `MinIOArtifactStore` using MinIO SDK
```

**Line 881** (Task 3.4.2):
```
Before: Files in S3/FS
After:  Files in MinIO
```

### 2. Deployment Configuration

**Line 1072** (Task 4.2.4 - Sandbox Images):
```
Before: Set up image registry (ECR or DockerHub)
After:  Set up image registry (DockerHub or private registry)
```

**Line 1954** (CD Pipeline):
```
Before: Push to registry (ECR/DockerHub)
After:  Push to registry (DockerHub or private registry)
```

---

## Files Verified

✅ **CODEGEN_IMPLEMENTATION_PLAN.md** - 5 changes applied, 0 AWS references remain
✅ **OPTIMIZATION_SUMMARY.md** - No AWS references found
✅ **AGENT_QUICK_START.md** - No AWS references found
✅ **tasks.agent.json** - No AWS references found
✅ **CLAUDE.md** - Already documents MinIO (`@appgen/minio` package)

---

## Why This Works

### S3 API Compatibility

MinIO implements the S3 API, making it a drop-in replacement:

```typescript
// Code remains identical, only imports change

// Before
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// After
import { Client as MinIOClient } from "minio";

// Both support the same operations:
// - putObject()
// - getObject()
// - deleteObject()
// - presignedGetObject()
// - listObjects()
```

### Data Structure Compatibility

All data structures remain unchanged:

```typescript
interface ArtifactMetadata {
  artifactId: string;
  generatorId: string;
  specHash: string;
  files: FileMetadata[];
  // ... all other fields unchanged
}
```

Storage backend is just an implementation detail - the interface and data model are identical.

---

## Implementation Details

### MinIOArtifactStore Class

```typescript
interface MinIOArtifactStore {
  save(result: GenerationResult, metadata: ArtifactMetadata): Promise<string>;
  get(artifactId: string): Promise<Artifact | null>;
  getByIdempotencyKey(key: string): Promise<Artifact | null>;
  list(filters?: ArtifactFilters): Promise<ArtifactMetadata[]>;
  delete(artifactId: string): Promise<void>;
}
```

**Implementation Pattern** (unchanged from S3 version):
1. Store metadata in PostgreSQL
2. Store files in MinIO buckets
3. Generate presigned URLs for downloads
4. Implement idempotency key lookups
5. Support content-addressed file storage

### Bucket Structure

```
minio://
├── codegen-artifacts/
│   ├── artifact-id-1/
│   │   ├── metadata.json
│   │   ├── file1.ts
│   │   └── file2.ts
│   ├── artifact-id-2/
│   └── ...
└── objects/
    ├── <sha256-hash-1>
    ├── <sha256-hash-2>
    └── ...
```

### Configuration

MinIO is already configured in AppGen's infrastructure:

```yaml
# From CLAUDE.md - existing infrastructure
services:
  minio:
    image: minio/minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
```

### SDK Choice

For MinIO, use the official Node.js SDK:

```bash
npm install minio
```

Example usage:
```typescript
import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// All operations match S3 API
await minioClient.putObject("codegen-artifacts", "key", data);
const presignedUrl = await minioClient.presignedGetObject("codegen-artifacts", "key");
```

---

## Implementation Checklist

- [x] Documentation updated (CODEGEN_IMPLEMENTATION_PLAN.md)
- [x] All AWS references removed
- [x] MinIO SDK documented (package: `minio`)
- [x] Bucket configuration documented
- [x] Environment variables identified
- [x] Docker-compose integration verified (existing)
- [x] Data structures confirmed identical
- [x] S3 API compatibility confirmed
- [ ] Code implementation (Phase 3 - Artifact Storage)

---

## Phase 3 Implementation Notes

When implementing **Task 3.3** (MinIO Integration):

### Environment Variables
```bash
MINIO_ENDPOINT=minio      # or your MinIO host
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false       # for local dev, true for production
```

### Connection Pattern
```typescript
// packages/codegen-artifact-store/src/minio-store.ts

import { Client } from "minio";

export class MinIOArtifactStore implements ArtifactStore {
  private client: Client;

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });
  }

  async save(result: GenerationResult, metadata: ArtifactMetadata): Promise<string> {
    const artifactId = metadata.artifactId;

    // Save metadata
    await this.client.putObject(
      "codegen-artifacts",
      `${artifactId}/metadata.json`,
      JSON.stringify(metadata)
    );

    // Save files
    for (const file of result.files) {
      await this.client.putObject(
        "codegen-artifacts",
        `${artifactId}/${file.path}`,
        file.content
      );
    }

    return artifactId;
  }

  async getByIdempotencyKey(key: string): Promise<Artifact | null> {
    // Query PostgreSQL for idemopotency key lookup
    // Then retrieve artifact from MinIO
  }

  // ... other methods
}
```

### Testing with Docker Compose
```bash
# Existing docker-compose.yml already includes MinIO
docker-compose up

# MinIO console: http://localhost:9001
# Username: minioadmin
# Password: minioadmin
```

---

## Migration Path (If Needed)

If migrating from S3 to MinIO in future:

```typescript
// 1. Data is identical (same JSON structure)
// 2. Use s3-to-minio migration tool if needed
// 3. Update connection strings only
// 4. No application code changes required
```

---

## Why MinIO Over S3

Benefits for AppGen:

| Aspect | MinIO | AWS S3 |
|--------|-------|--------|
| **Cost** | Free, self-hosted | Pay-per-use |
| **Control** | Full infrastructure control | Vendor lock-in |
| **Compliance** | On-premise capable | Cloud-dependent |
| **Integration** | Native AppGen infra | External dependency |
| **S3 Compatibility** | 100% API compatible | Native |
| **Local Dev** | docker-compose | Needs AWS credentials |

---

## Success Criteria

✅ All AWS references removed from documentation
✅ MinIO SDK documented for Phase 3 implementation
✅ Data structures unchanged (backward compatible)
✅ Code patterns compatible with existing S3 patterns
✅ Integration with existing AppGen infrastructure confirmed
✅ Environment variables and configuration documented
✅ Testing strategy aligned with MinIO

---

## Next Steps

1. **Phase 3 Implementation**: Use MinIO SDK with patterns documented above
2. **Integration Tests**: Test with docker-compose MinIO instance
3. **Production Deployment**: Configure MinIO cluster with persistence
4. **Monitoring**: Add MinIO metrics to observability stack (Phase 9)

---

**Version**: 2.1.0
**Updated**: 2025-11-24
**Status**: Ready for Phase 3 Implementation
