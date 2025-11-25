/**
 * Type definitions for @codegen/codegen-core
 */

import type { JSONSchema7 } from 'json-schema';

// ============================================================================
// Core Generator Interfaces
// ============================================================================

export interface Generator {
  id: string;
  version: string;
  manifest: GeneratorManifest;
  generate(spec: unknown, options: GenerateOptions): Promise<GenerationResult>;
}

export interface GeneratorManifest {
  id: string;
  version: string;
  manifestHash?: string; // SHA-256, computed on registration
  displayName: string;
  description: string;
  inputSchema: JSONSchema7;
  outputs: OutputDefinition[];
  entryTemplate: string;
  capabilities: Capability[];
  helpers?: HelperDefinition[];
  tests?: TestDefinition;
  security?: SecurityDefinition;
  pipeline?: PipelineDefinition;
}

export interface OutputDefinition {
  name: string;
  path: string;
  template: string;
  language?: string;
  description?: string;
}

export type Capability =
  | 'single-file'
  | 'multi-file'
  | 'composition'
  | 'templating'
  | 'validation'
  | 'sandboxing'
  | 'testing';

export interface HelperDefinition {
  name: string;
  version: string;
  path?: string;
  description?: string;
}

export interface TestDefinition {
  goldenTests?: GoldenTest[];
  integrationTests?: string[];
}

export interface GoldenTest {
  name: string;
  input: unknown;
  expectedOutputs: Record<string, string>;
}

export interface SecurityDefinition {
  allowedEnvironmentVariables?: string[];
  maxExecutionTime?: number;
  sandboxRequired?: boolean;
}

export interface PipelineDefinition {
  id: string;
  steps: PipelineStep[];
  onError?: 'abort' | 'continue' | 'retry';
}

export interface PipelineStep {
  id: string;
  type:
    | 'validate-input'
    | 'resolve-templates'
    | 'render'
    | 'validate-output'
    | 'autofix'
    | 'sandbox-test'
    | 'store'
    | 'custom';
  config?: unknown;
  required: boolean;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier?: number;
}

// ============================================================================
// Generation Request/Response
// ============================================================================

export interface GenerateOptions {
  tenantId: string;
  context?: Record<string, unknown>;
  autofix?: boolean;
  skipValidation?: boolean;
  pipelineOverride?: PipelineDefinition;
}

export interface GenerationResult {
  artifactId: string;
  files: GeneratedFile[];
  diagnostics: Diagnostic[];
  metadata: ArtifactMetadata;
  pipelineExecution?: PipelineExecutionTrace;
}

export interface GeneratedFile {
  path: string;
  content: string;
  hash: string;
  language?: string;
  size: number;
}

export interface Diagnostic {
  level: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  suggestion?: string;
}

export interface ArtifactMetadata {
  artifactId: string;
  generatorId: string;
  generatorVersion: string;
  tenantId: string;
  createdAt: string;
  createdBy?: string;
  spec: unknown;
  specHash: string;
  manifestHash?: string;
  provenance?: ProvenanceMetadata;
}

export interface ProvenanceMetadata {
  generatorVersion: string;
  manifestHash: string;
  templateHashes: Record<string, string>;
  helperVersions: Record<string, string>;
  pipelineId: string;
  executionTrace: PipelineExecutionTrace;
  environmentSnapshot?: Record<string, string>;
  signatureVersion?: string;
  signature?: string;
}

export interface PipelineExecutionTrace {
  pipelineId: string;
  steps: ExecutedStep[];
  totalDuration: number;
  startedAt: string;
  completedAt: string;
}

export interface ExecutedStep {
  stepId: string;
  type: PipelineStep['type'];
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  output?: unknown;
}

// ============================================================================
// Generator Manager
// ============================================================================

export interface GeneratorSummary {
  id: string;
  version: string;
  displayName: string;
  description: string;
  capabilities: Capability[];
  createdAt?: string;
}

export interface GeneratorRegistry {
  register(generator: Generator): void;
  unregister(id: string, version?: string): void;
  get(id: string, version?: string): Generator | undefined;
  list(filters?: GeneratorFilters): Generator[];
  listSummaries(filters?: GeneratorFilters): GeneratorSummary[];
}

export interface GeneratorFilters {
  domain?: string;
  capabilities?: Capability[];
  tags?: string[];
}

// ============================================================================
// Events
// ============================================================================

export interface GeneratorEvent {
  type: 'generator-registered' | 'generator-unregistered';
  generatorId: string;
  generatorVersion: string;
  timestamp: string;
}

export interface GeneratorRegisteredEvent extends GeneratorEvent {
  type: 'generator-registered';
  manifest: GeneratorManifest;
}

export interface GeneratorUnregisteredEvent extends GeneratorEvent {
  type: 'generator-unregistered';
}
