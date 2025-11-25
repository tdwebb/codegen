/**
 * Manifest Validator - Validates generator manifests
 */

import type {
  GeneratorManifest,
  PipelineDefinition,
  PipelineStep,
} from '@codegen/codegen-core';
import type { ValidationResult, ValidationError } from './types';

export class ManifestValidator {
  validate(manifest: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!manifest || typeof manifest !== 'object') {
      errors.push({
        path: '$',
        message: 'Manifest must be an object',
        code: 'INVALID_TYPE',
      });
      return { valid: false, errors };
    }

    const m = manifest as Record<string, unknown>;

    // Validate required fields
    if (!m.id || typeof m.id !== 'string') {
      errors.push({
        path: '$.id',
        message: 'id is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!m.version || typeof m.version !== 'string') {
      errors.push({
        path: '$.version',
        message: 'version is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!m.displayName || typeof m.displayName !== 'string') {
      errors.push({
        path: '$.displayName',
        message: 'displayName is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!m.description || typeof m.description !== 'string') {
      errors.push({
        path: '$.description',
        message: 'description is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!m.inputSchema || typeof m.inputSchema !== 'object') {
      errors.push({
        path: '$.inputSchema',
        message: 'inputSchema is required and must be an object',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!Array.isArray(m.outputs)) {
      errors.push({
        path: '$.outputs',
        message: 'outputs is required and must be an array',
        code: 'MISSING_REQUIRED_FIELD',
      });
    } else if (m.outputs.length === 0) {
      errors.push({
        path: '$.outputs',
        message: 'outputs must contain at least one output definition',
        code: 'INVALID_ARRAY_LENGTH',
      });
    } else {
      (m.outputs as unknown[]).forEach((output, idx) => {
        if (typeof output !== 'object' || !output) {
          errors.push({
            path: `$.outputs[${idx}]`,
            message: 'Output must be an object',
            code: 'INVALID_TYPE',
          });
          return;
        }

        const o = output as Record<string, unknown>;
        if (!o.name || typeof o.name !== 'string') {
          errors.push({
            path: `$.outputs[${idx}].name`,
            message: 'name is required and must be a string',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }

        if (!o.path || typeof o.path !== 'string') {
          errors.push({
            path: `$.outputs[${idx}].path`,
            message: 'path is required and must be a string',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }

        if (!o.template || typeof o.template !== 'string') {
          errors.push({
            path: `$.outputs[${idx}].template`,
            message: 'template is required and must be a string',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
      });
    }

    if (!m.entryTemplate || typeof m.entryTemplate !== 'string') {
      errors.push({
        path: '$.entryTemplate',
        message: 'entryTemplate is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!Array.isArray(m.capabilities)) {
      errors.push({
        path: '$.capabilities',
        message: 'capabilities is required and must be an array',
        code: 'MISSING_REQUIRED_FIELD',
      });
    } else if (m.capabilities.length === 0) {
      errors.push({
        path: '$.capabilities',
        message: 'capabilities must contain at least one capability',
        code: 'INVALID_ARRAY_LENGTH',
      });
    }

    // Validate optional pipeline
    if (m.pipeline) {
      const pipelineErrors = this.validatePipeline(
        m.pipeline,
        '$.pipeline',
      );
      errors.push(...pipelineErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validatePipeline(
    pipeline: unknown,
    path: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!pipeline || typeof pipeline !== 'object') {
      errors.push({
        path,
        message: 'Pipeline must be an object',
        code: 'INVALID_TYPE',
      });
      return errors;
    }

    const p = pipeline as Record<string, unknown>;

    if (!p.id || typeof p.id !== 'string') {
      errors.push({
        path: `${path}.id`,
        message: 'id is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!Array.isArray(p.steps)) {
      errors.push({
        path: `${path}.steps`,
        message: 'steps is required and must be an array',
        code: 'MISSING_REQUIRED_FIELD',
      });
    } else if (p.steps.length === 0) {
      errors.push({
        path: `${path}.steps`,
        message: 'steps must contain at least one step',
        code: 'INVALID_ARRAY_LENGTH',
      });
    } else {
      (p.steps as unknown[]).forEach((step, idx) => {
        const stepErrors = this.validatePipelineStep(
          step,
          `${path}.steps[${idx}]`,
        );
        errors.push(...stepErrors);
      });
    }

    if (p.onError && !['abort', 'continue', 'retry'].includes(p.onError as string)) {
      errors.push({
        path: `${path}.onError`,
        message: "onError must be one of: 'abort', 'continue', 'retry'",
        code: 'INVALID_ENUM_VALUE',
      });
    }

    return errors;
  }

  private validatePipelineStep(
    step: unknown,
    path: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!step || typeof step !== 'object') {
      errors.push({
        path,
        message: 'Step must be an object',
        code: 'INVALID_TYPE',
      });
      return errors;
    }

    const s = step as Record<string, unknown>;

    if (!s.id || typeof s.id !== 'string') {
      errors.push({
        path: `${path}.id`,
        message: 'id is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!s.type || typeof s.type !== 'string') {
      errors.push({
        path: `${path}.type`,
        message: 'type is required and must be a string',
        code: 'MISSING_REQUIRED_FIELD',
      });
    } else {
      const validTypes = [
        'validate-input',
        'resolve-templates',
        'render',
        'validate-output',
        'autofix',
        'sandbox-test',
        'store',
        'custom',
      ];
      if (!validTypes.includes(s.type as string)) {
        errors.push({
          path: `${path}.type`,
          message: `type must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_ENUM_VALUE',
        });
      }
    }

    if (typeof s.required !== 'boolean') {
      errors.push({
        path: `${path}.required`,
        message: 'required is required and must be a boolean',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    return errors;
  }
}
