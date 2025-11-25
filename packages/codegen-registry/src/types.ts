/**
 * Type definitions for @codegen/codegen-registry
 */

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ManifestLoadOptions {
  path?: string;
  strict?: boolean;
}
