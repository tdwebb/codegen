/**
 * Standard step executors for the code generation pipeline
 */

import type { PipelineContext } from './types';
import type { PipelineStepExecutor, StepExecutionResult } from './types';
import { AjvSpecValidator, OutputValidator } from '@codegen/codegen-validator';

/**
 * Validates input spec against the generator's input schema
 */
export class ValidateInputStepExecutor implements PipelineStepExecutor {
  private specValidator = new AjvSpecValidator();

  async execute(context: PipelineContext): Promise<StepExecutionResult> {
    const startTime = performance.now();

    try {
      // Validate spec exists
      if (!context.spec) {
        throw new Error('Specification is required');
      }

      // Validate spec against generator's input schema if schema has explicit constraints
      if (context.generator?.manifest?.inputSchema) {
        const schema = context.generator.manifest.inputSchema;
        // Only validate if schema has properties or required fields defined
        const hasConstraints =
          ('properties' in schema && Object.keys(schema.properties || {}).length > 0) ||
          ('required' in schema && (schema.required || []).length > 0) ||
          ('pattern' in schema) ||
          ('enum' in schema);

        if (hasConstraints) {
          const validation = this.specValidator.validate(context.spec, schema);

          if (!validation.isValid) {
            const errorMessages = validation.errors
              .map((e) => `${e.path}: ${e.message}`)
              .join('; ');
            throw new Error(`Input validation failed: ${errorMessages}`);
          }
        }
      }

      const duration = performance.now() - startTime;
      return {
        stepId: 'validate-input',
        status: 'success',
        duration,
        output: { validated: true, spec: context.spec },
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      return {
        stepId: 'validate-input',
        status: 'failed',
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

/**
 * Resolves and loads templates from the generator manifest
 */
export class ResolveTemplatesStepExecutor implements PipelineStepExecutor {
  async execute(context: PipelineContext): Promise<StepExecutionResult> {
    const startTime = performance.now();

    try {
      // Template resolution will be implemented in Task 2.1
      // This is a placeholder that loads templates from the generator manifest

      if (!context.generator?.manifest?.outputs) {
        throw new Error('Generator manifest has no outputs defined');
      }

      const templates = context.generator.manifest.outputs.map((output) => ({
        path: output.path,
        templateKey: output.template,
      }));

      const duration = performance.now() - startTime;
      return {
        stepId: 'resolve-templates',
        status: 'success',
        duration,
        output: { templates },
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      return {
        stepId: 'resolve-templates',
        status: 'failed',
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

/**
 * Renders templates with the specification
 */
export class RenderStepExecutor implements PipelineStepExecutor {
  async execute(context: PipelineContext): Promise<StepExecutionResult> {
    const startTime = performance.now();

    try {
      // Template rendering will be implemented in Task 2.1
      // This is a placeholder that will use the Handlebars template engine

      const duration = performance.now() - startTime;
      return {
        stepId: 'render',
        status: 'success',
        duration,
        output: { files: [] },
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      return {
        stepId: 'render',
        status: 'failed',
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

/**
 * Validates generated output files
 */
export class ValidateOutputStepExecutor implements PipelineStepExecutor {
  private outputValidator = new OutputValidator();

  async execute(context: PipelineContext): Promise<StepExecutionResult> {
    const startTime = performance.now();

    try {
      // Validate files exist from previous step
      if (!context.artifacts || context.artifacts.length === 0) {
        throw new Error('No artifacts to validate');
      }

      const validationResults = [];
      for (const artifact of context.artifacts) {
        const extension = artifact.path.split('.').pop() || '';
        const result = this.outputValidator.validate(artifact.content, extension);

        validationResults.push({
          path: artifact.path,
          isValid: result.isValid,
          issues: result.issues,
        });

        // Fail if critical issues found
        if (!result.isValid) {
          throw new Error(
            `Validation failed for ${artifact.path}: ${result.issues[0]?.message}`,
          );
        }
      }

      const duration = performance.now() - startTime;
      return {
        stepId: 'validate-output',
        status: 'success',
        duration,
        output: { validationResults },
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      return {
        stepId: 'validate-output',
        status: 'failed',
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

/**
 * Automatically fixes common issues in generated output
 */
export class AutofixStepExecutor implements PipelineStepExecutor {
  private outputValidator = new OutputValidator();

  async execute(context: PipelineContext): Promise<StepExecutionResult> {
    const startTime = performance.now();

    try {
      // Skip if no artifacts to fix
      if (!context.artifacts || context.artifacts.length === 0) {
        const duration = performance.now() - startTime;
        return {
          stepId: 'autofix',
          status: 'success',
          duration,
          output: { fixed: 0, totalAttempted: 0 },
        };
      }

      let totalFixed = 0;
      const fixedArtifacts = [];

      for (const artifact of context.artifacts) {
        const extension = artifact.path.split('.').pop() || '';
        const result = this.outputValidator.autoFix(artifact.content, extension);

        if (result.success && result.changes.length > 0) {
          totalFixed++;
          fixedArtifacts.push({
            path: artifact.path,
            originalContent: artifact.content,
            fixedContent: result.fixed,
            changes: result.changes,
          });

          // Update artifact with fixed content
          artifact.content = result.fixed;
        }
      }

      const duration = performance.now() - startTime;
      return {
        stepId: 'autofix',
        status: 'success',
        duration,
        output: {
          fixed: totalFixed,
          totalAttempted: context.artifacts.length,
          fixedArtifacts,
        },
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      return {
        stepId: 'autofix',
        status: 'failed',
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

/**
 * Stores generated artifacts (stub for now)
 */
export class StoreStepExecutor implements PipelineStepExecutor {
  async execute(context: PipelineContext): Promise<StepExecutionResult> {
    const startTime = performance.now();

    try {
      // Storage will be implemented in Task 2.6
      // This is a placeholder that would store artifacts

      const duration = performance.now() - startTime;
      return {
        stepId: 'store',
        status: 'success',
        duration,
        output: { stored: true },
      };
    } catch (err) {
      const duration = performance.now() - startTime;
      return {
        stepId: 'store',
        status: 'failed',
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}
