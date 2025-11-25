/**
 * Type definitions for @codegen/codegen-validator
 */

import type { JSONSchema7 } from 'json-schema';

/**
 * Validation error detail
 */
export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params: Record<string, unknown>;
}

/**
 * Spec validation result
 */
export interface SpecValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: unknown;
}

/**
 * Spec validator interface
 */
export interface ISpecValidator {
  /**
   * Validate data against a JSON schema
   */
  validate(data: unknown, schema: JSONSchema7): SpecValidationResult;

  /**
   * Compile a schema for reuse
   */
  compile(schema: JSONSchema7): (data: unknown) => SpecValidationResult;

  /**
   * Add a custom format validator
   */
  addFormat(
    name: string,
    pattern: RegExp | ((value: string) => boolean),
  ): void;
}

/**
 * Output validation issue
 */
export interface OutputValidationIssue {
  type: 'error' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: {
    line: number;
    column?: number;
  };
  suggestion?: string;
  autoFixable?: boolean;
}

/**
 * Output validation result
 */
export interface OutputValidationResult {
  isValid: boolean;
  issues: OutputValidationIssue[];
  content: string;
  fixed?: string;
}

/**
 * Output auto-fix result
 */
export interface OutputAutoFixResult {
  success: boolean;
  fixed: string;
  changes: Array<{
    line: number;
    issue: OutputValidationIssue;
    fix: string;
  }>;
  warnings: string[];
}

/**
 * Output validator interface
 */
export interface IOutputValidator {
  /**
   * Validate output content (code)
   */
  validate(content: string, language: string): OutputValidationResult;

  /**
   * Try to automatically fix validation issues
   */
  autoFix(content: string, language: string): OutputAutoFixResult;

  /**
   * Register custom validation rule
   */
  registerRule(
    language: string,
    rule: (content: string) => OutputValidationIssue[],
  ): void;
}
