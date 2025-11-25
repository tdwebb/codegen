/**
 * Type definitions for @codegen/codegen-artifact-store
 * Handles artifact storage, versioning, and idempotency
 */

/**
 * Generated file type from code generation
 */
export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  hash: string;
  size: number;
}

/**
 * Core artifact metadata
 */
export interface ArtifactMetadata {
  artifactId: string;
  generatorId: string;
  generatorVersion: string;
  tenantId: string;
  createdAt: string;
  spec: unknown;
  specHash: string;
}

/**
 * Stored artifact with versioning and content addressing
 */
export interface StoredArtifact {
  id: string;
  version: number;
  metadata: ArtifactMetadata;
  files: GeneratedFile[];
  contentHash: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

/**
 * Idempotency key for safe request retries
 * Prevents duplicate generation for the same spec
 */
export interface IdempotencyKey {
  id: string;
  key: string;
  generatorId: string;
  tenantId: string;
  status: 'pending' | 'completed' | 'failed';
  artifactId?: string;
  error?: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Artifact store interface
 */
export interface IArtifactStore {
  /**
   * Store artifact with idempotency
   */
  storeArtifact(
    artifact: Omit<StoredArtifact, 'id' | 'contentHash' | 'createdAt' | 'updatedAt' | 'size'>,
    idempotencyKey: string,
  ): Promise<StoredArtifact>;

  /**
   * Retrieve artifact by ID
   */
  getArtifact(artifactId: string): Promise<StoredArtifact | null>;

  /**
   * Retrieve artifact version
   */
  getArtifactVersion(artifactId: string, version: number): Promise<StoredArtifact | null>;

  /**
   * List artifact versions
   */
  listArtifactVersions(artifactId: string): Promise<StoredArtifact[]>;

  /**
   * Check idempotency key status
   */
  checkIdempotencyKey(key: string): Promise<IdempotencyKey | null>;

  /**
   * Get artifact by idempotency key
   */
  getArtifactByIdempotencyKey(key: string): Promise<StoredArtifact | null>;

  /**
   * Delete artifact
   */
  deleteArtifact(artifactId: string): Promise<void>;
}

/**
 * Content-addressable storage for files
 */
export interface IContentAddressableStorage {
  /**
   * Store file content and return hash
   */
  putContent(content: string): Promise<string>;

  /**
   * Retrieve file by hash
   */
  getContent(hash: string): Promise<string | null>;

  /**
   * Check if content exists
   */
  hasContent(hash: string): Promise<boolean>;

  /**
   * Get file size by hash
   */
  getSize(hash: string): Promise<number | null>;
}

/**
 * Compatibility matrix for generator versions
 */
export interface CompatibilityMatrix {
  [runtime: string]: string; // e.g., { "fastify": ">=5.0.0 <6.0.0", "typescript": ">=5.0.0" }
}

/**
 * Generator manifest with versioning
 */
export interface GeneratorManifest {
  generatorId: string;
  version: string;
  displayName: string;
  description: string;
  compatibility: CompatibilityMatrix;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Generator version record
 */
export interface GeneratorVersion {
  generatorId: string;
  version: string;
  manifest: GeneratorManifest;
  manifestHash: string;
  registeredAt: string;
  deprecatedAt?: string;
}

/**
 * Upgrade availability information
 */
export interface UpgradeInfo {
  currentVersion: string;
  latestVersion: string;
  isAvailable: boolean;
  isCompatible: boolean;
  compatibilityIssues?: string[];
}

/**
 * Generator version store interface
 */
export interface IGeneratorVersionStore {
  /**
   * Register a new generator version
   */
  registerVersion(manifest: GeneratorManifest): Promise<GeneratorVersion>;

  /**
   * Get latest version for a generator
   */
  getLatestVersion(generatorId: string): Promise<GeneratorVersion | null>;

  /**
   * Get specific version
   */
  getVersion(generatorId: string, version: string): Promise<GeneratorVersion | null>;

  /**
   * Get compatible versions for a target runtime
   */
  getCompatibleVersions(
    generatorId: string,
    targetRuntime: string,
    targetVersion?: string,
  ): Promise<GeneratorVersion[]>;

  /**
   * Mark version as deprecated
   */
  deprecateVersion(generatorId: string, version: string): Promise<void>;

  /**
   * Check upgrade availability
   */
  checkUpgrade(generatorId: string, currentVersion: string): Promise<UpgradeInfo>;

  /**
   * List all versions for a generator
   */
  listVersions(generatorId: string): Promise<GeneratorVersion[]>;
}
