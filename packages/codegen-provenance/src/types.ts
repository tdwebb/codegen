/**
 * Type definitions for @codegen/codegen-provenance
 * Tracks generator provenance and reproducibility
 */

/**
 * Pipeline step execution record
 */
export interface StepRecord {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  startTime: string;
  endTime: string;
  duration: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * Generator version information
 */
export interface GeneratorVersion {
  generatorId: string;
  generatorVersion: string;
  displayName: string;
  description: string;
}

/**
 * Helper version information
 */
export interface HelperVersion {
  name: string;
  version: string;
  helpers: string[];
}

/**
 * Template information
 */
export interface TemplateInfo {
  path: string;
  hash: string;
  isDeterministic: boolean;
}

/**
 * Environment information captured at generation time
 */
export interface EnvironmentInfo {
  nodeVersion: string;
  npmVersion: string;
  timestamp: string;
  platform: string;
  arch: string;
  timezone: string;
}

/**
 * Complete provenance record for an artifact
 */
export interface ProvenanceRecord {
  artifactId: string;
  specHash: string;
  generatorVersion: GeneratorVersion;
  helperVersions: HelperVersion[];
  templateInfos: TemplateInfo[];
  pipelineSteps: StepRecord[];
  environment: EnvironmentInfo;
  createdAt: string;
  signature?: string; // Ed25519 signature (Phase 7)
}

/**
 * Provenance tracker interface
 */
export interface IProvenanceTracker {
  /**
   * Start tracking a generation
   */
  startTracking(artifactId: string, specHash: string): void;

  /**
   * Record generator version
   */
  recordGeneratorVersion(version: GeneratorVersion): void;

  /**
   * Record helper versions
   */
  recordHelperVersions(helpers: HelperVersion[]): void;

  /**
   * Record template information
   */
  recordTemplateInfo(templates: TemplateInfo[]): void;

  /**
   * Record pipeline step
   */
  recordStep(step: StepRecord): void;

  /**
   * Finish tracking and generate provenance record
   */
  finalize(): ProvenanceRecord;

  /**
   * Get current provenance record (without finalization)
   */
  getCurrent(): ProvenanceRecord | null;
}
