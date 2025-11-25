/**
 * @codegen/codegen-artifact-store
 * Artifact storage with idempotency, versioning, and content addressing
 */

export const version = '0.1.0';

// Types
export type {
  ArtifactMetadata,
  StoredArtifact,
  IdempotencyKey,
  IArtifactStore,
  IContentAddressableStorage,
  CompatibilityMatrix,
  GeneratorManifest,
  GeneratorVersion,
  UpgradeInfo,
  IGeneratorVersionStore,
} from './types';

// Idempotency utilities
export {
  generateIdempotencyKey,
  getIdempotencyKeyExpiration,
  isIdempotencyKeyExpired,
  calculateContentHash,
  calculateArtifactSize,
  calculateManifestHash,
} from './idempotency';

// Versioning utilities
export {
  parseVersion,
  compareVersions,
  versionSatisfies,
  getLatestVersion,
  filterByConstraint,
} from './versioning';

// In-memory implementations
export {
  InMemoryArtifactStore,
  InMemoryContentAddressableStorage,
} from './in-memory-store';

// MinIO implementations
export type { MinIOConfig } from './minio-store';
export {
  MinIOArtifactStore,
  MinIOContentAddressableStorage,
} from './minio-store';

// PostgreSQL implementations
export type { PostgreSQLConfig } from './postgres-store';
export { PostgreSQLArtifactStore } from './postgres-store';

// In-memory version store
export { InMemoryGeneratorVersionStore } from './in-memory-version-store';

// PostgreSQL version store
export type { PostgreSQLVersionStoreConfig } from './postgres-version-store';
export { PostgreSQLGeneratorVersionStore } from './postgres-version-store';
