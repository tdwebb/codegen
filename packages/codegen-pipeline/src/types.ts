/**
 * Type definitions for @codegen/codegen-pipeline
 */

import type { Generator } from '@codegen/codegen-core';

/**
 * Generation context for pipeline execution
 */
export interface GenerationContext {
  generatorId: string;
  tenantId: string;
  spec: unknown;
  generator?: Generator;
}

/**
 * Result of executing a pipeline step
 */
export interface StepExecutionResult {
  stepId: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
  output?: unknown;
}

/**
 * Pipeline execution context
 */
export interface PipelineContext extends GenerationContext {
  pipelineId: string;
  currentStepIndex: number;
  stepResults: Map<string, StepExecutionResult>;
}

/**
 * Interface for pipeline step executors
 */
export interface PipelineStepExecutor {
  execute(context: PipelineContext): Promise<StepExecutionResult>;
}

/**
 * Step executor registry
 */
export interface StepExecutorRegistry {
  register(stepType: string, executor: PipelineStepExecutor): void;
  get(stepType: string): PipelineStepExecutor | undefined;
  getAll(): Map<string, PipelineStepExecutor>;
}
