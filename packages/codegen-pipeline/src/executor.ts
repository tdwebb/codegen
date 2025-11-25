/**
 * Pipeline execution engine for code generation
 */

import type { PipelineDefinition, ExecutedStep } from '@codegen/codegen-core';
import type {
  GenerationContext,
  StepExecutionResult,
  PipelineContext,
  PipelineStepExecutor,
  StepExecutorRegistry,
} from './types';

/**
 * Execution trace returned from pipeline execution
 */
export interface PipelineExecutionTrace {
  pipelineId: string;
  status: 'success' | 'failed' | 'partial';
  steps: ExecutedStep[];
  duration: number;
  timestamp: string;
}

/**
 * Default step executor registry
 */
class DefaultStepExecutorRegistry implements StepExecutorRegistry {
  private executors: Map<string, PipelineStepExecutor> = new Map();

  register(stepType: string, executor: PipelineStepExecutor): void {
    this.executors.set(stepType, executor);
  }

  get(stepType: string): PipelineStepExecutor | undefined {
    return this.executors.get(stepType);
  }

  getAll(): Map<string, PipelineStepExecutor> {
    return new Map(this.executors);
  }
}

/**
 * Pipeline executor - orchestrates step execution
 */
export class PipelineExecutor {
  private registry: StepExecutorRegistry;
  private defaultPipeline: PipelineDefinition;

  constructor(registry?: StepExecutorRegistry) {
    this.registry = registry || new DefaultStepExecutorRegistry();
    this.defaultPipeline = this.createDefaultPipeline();
  }

  /**
   * Create default generation pipeline
   */
  private createDefaultPipeline(): PipelineDefinition {
    return {
      id: 'default-generation',
      steps: [
        { id: 'validate-input', type: 'validate-input', required: true },
        { id: 'resolve-templates', type: 'resolve-templates', required: true },
        { id: 'render', type: 'render', required: true },
        { id: 'validate-output', type: 'validate-output', required: true },
        { id: 'autofix', type: 'autofix', required: false },
        { id: 'store', type: 'store', required: true },
      ],
    };
  }

  /**
   * Execute a pipeline with the given context
   */
  async execute(
    context: GenerationContext,
    pipeline?: PipelineDefinition,
  ): Promise<PipelineExecutionTrace> {
    const pipelineDef = pipeline || this.defaultPipeline;
    const pipelineContext: PipelineContext = {
      ...context,
      pipelineId: pipelineDef.id,
      currentStepIndex: 0,
      stepResults: new Map(),
    };

    const executedSteps: ExecutedStep[] = [];
    const stepRequirements: Map<string, boolean> = new Map();
    const startTime = Date.now();

    for (let i = 0; i < pipelineDef.steps.length; i++) {
      const step = pipelineDef.steps[i];
      if (!step) break;

      pipelineContext.currentStepIndex = i;
      stepRequirements.set(step.id, step.required);

      const stepStartTime = Date.now();
      const result = await this.executeStep(step, pipelineContext);
      const stepDuration = Date.now() - stepStartTime;

      pipelineContext.stepResults.set(step.id, result);

      const executedStep: ExecutedStep = {
        stepId: step.id,
        type: step.type,
        status: result.status,
        duration: stepDuration,
        ...(result.error && { error: result.error.message }),
      };

      executedSteps.push(executedStep);

      if (result.status === 'failed' && step.required) {
        break;
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      pipelineId: pipelineDef.id,
      status: this.determineTraceStatus(executedSteps, stepRequirements),
      steps: executedSteps,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: { id: string; type: string; required: boolean },
    context: PipelineContext,
  ): Promise<StepExecutionResult> {
    const executor = this.registry.get(step.type);

    if (!executor) {
      return {
        stepId: step.id,
        status: 'failed',
        duration: 0,
        error: new Error(`No executor found for step type: ${step.type}`),
      };
    }

    try {
      return await executor.execute(context);
    } catch (err) {
      return {
        stepId: step.id,
        status: 'failed',
        duration: 0,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  /**
   * Determine overall trace status based on step results and requirements
   */
  private determineTraceStatus(
    steps: ExecutedStep[],
    stepRequirements: Map<string, boolean>,
  ): 'success' | 'failed' | 'partial' {
    if (steps.length === 0) return 'failed';

    // Check if any required step failed
    const requiredStepFailed = steps.some(
      (s) => s.status === 'failed' && stepRequirements.get(s.stepId),
    );

    // If a required step failed, it's failed
    if (requiredStepFailed) return 'failed';

    // If all steps succeeded, return success
    const allSuccess = steps.every((s) => s.status === 'success');
    if (allSuccess) return 'success';

    // Otherwise we have skipped or optional failures, so it's partial
    return 'partial';
  }

  /**
   * Register a step executor
   */
  registerExecutor(stepType: string, executor: PipelineStepExecutor): void {
    this.registry.register(stepType, executor);
  }

  /**
   * Get the registry for advanced use cases
   */
  getRegistry(): StepExecutorRegistry {
    return this.registry;
  }
}
