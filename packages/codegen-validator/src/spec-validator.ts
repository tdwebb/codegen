/**
 * Spec validator using Ajv for JSON Schema validation
 */

import Ajv, { type ValidateFunction } from 'ajv';
import type { JSONSchema7 } from 'json-schema';
import type {
  ISpecValidator,
  SpecValidationResult,
  ValidationError,
} from './types';

/**
 * Ajv-based spec validator
 */
export class AjvSpecValidator implements ISpecValidator {
  private ajv: Ajv;
  private compiledSchemas: Map<string, ValidateFunction> = new Map();

  constructor() {
    this.ajv = new Ajv({
      useDefaults: false,
      removeAdditional: false,
      strict: false,
      allErrors: true,
      verbose: true,
    });

    // Register custom formats
    this.registerCustomFormats();
  }

  /**
   * Validate data against a JSON schema
   */
  validate(data: unknown, schema: JSONSchema7): SpecValidationResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validate = this.ajv.compile(schema as any);
    const isValid = validate(data);

    if (isValid) {
      return {
        isValid: true,
        errors: [],
        data,
      };
    }

    const errors = this.formatErrors(validate.errors || []);
    return {
      isValid: false,
      errors,
      data,
    };
  }

  /**
   * Compile a schema for reuse
   */
  compile(schema: JSONSchema7): (data: unknown) => SpecValidationResult {
    // Create a cache key from schema
    const schemaKey = JSON.stringify(schema);

    // Return cached validator if available
    if (this.compiledSchemas.has(schemaKey)) {
      const cachedValidate = this.compiledSchemas.get(schemaKey)!;
      return (data: unknown) => {
        const isValid = cachedValidate(data) as boolean;

        if (isValid) {
          return {
            isValid: true,
            errors: [],
            data,
          };
        }

        const errors = this.formatErrors(cachedValidate.errors || []);
        return {
          isValid: false,
          errors,
          data,
        };
      };
    }

    // Compile new schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validate = this.ajv.compile(schema as any);
    this.compiledSchemas.set(schemaKey, validate);

    // Return validation function
    return (data: unknown) => {
      const isValid = validate(data) as boolean;

      if (isValid) {
        return {
          isValid: true,
          errors: [],
          data,
        };
      }

      const errors = this.formatErrors(validate.errors || []);
      return {
        isValid: false,
        errors,
        data,
      };
    };
  }

  /**
   * Add a custom format validator
   */
  addFormat(
    name: string,
    pattern: RegExp | ((value: string) => boolean),
  ): void {
    if (pattern instanceof RegExp) {
      this.ajv.addFormat(name, pattern);
    } else {
      this.ajv.addFormat(name, pattern);
    }
  }

  /**
   * Register common custom formats
   */
  private registerCustomFormats(): void {
    // Email format (simple validation)
    this.ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // URL format (simple validation)
    this.ajv.addFormat('url', /^https?:\/\/.+/);

    // UUID format
    this.ajv.addFormat(
      'uuid',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Date format (ISO 8601)
    this.ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);

    // Time format (ISO 8601)
    this.ajv.addFormat('time', /^\d{2}:\d{2}:\d{2}(.\d{3})?/);

    // Date-time format (ISO 8601)
    this.ajv.addFormat(
      'date-time',
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z?$/,
    );

    // Semantic version format
    this.ajv.addFormat(
      'semver',
      /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/,
    );

    // Hostname format
    this.ajv.addFormat(
      'hostname',
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    );

    // IPv4 format
    this.ajv.addFormat(
      'ipv4',
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    );
  }

  /**
   * Format Ajv errors to standard ValidationError format
   */
  private formatErrors(
    ajvErrors: Array<{
      keyword?: string;
      instancePath?: string;
      message?: string;
      params?: Record<string, unknown>;
    }>,
  ): ValidationError[] {
    return ajvErrors.map((error) => ({
      path: error.instancePath || '/',
      message: error.message || 'Unknown validation error',
      keyword: error.keyword || 'unknown',
      params: error.params || {},
    }));
  }
}
