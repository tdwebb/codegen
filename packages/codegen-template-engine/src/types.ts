/**
 * Type definitions for @codegen/codegen-template-engine
 */

/**
 * Template rendering context
 */
export interface TemplateContext {
  [key: string]: unknown;
}

/**
 * Template rendering result
 */
export interface RenderResult {
  content: string;
  hash: string;
}

/**
 * Options for template compilation and rendering
 */
export interface RenderOptions {
  strict?: boolean;
  noEscape?: boolean;
  data?: Record<string, unknown>;
  helpers?: Record<string, (...args: unknown[]) => string>;
}

/**
 * Template engine interface
 */
export interface ITemplateEngine {
  /**
   * Compile a template string
   */
  compile(template: string): (...context: unknown[]) => string;

  /**
   * Render a template with context
   */
  render(
    template: string,
    context: TemplateContext,
    options?: RenderOptions,
  ): RenderResult;

  /**
   * Register a custom helper
   */
  registerHelper(name: string, helper: (...args: unknown[]) => string): void;

  /**
   * Register multiple helpers at once
   */
  registerHelpers(helpers: Record<string, (...args: unknown[]) => string>): void;

  /**
   * Clear all registered helpers
   */
  clearHelpers(): void;
}

/**
 * Determinism check result
 */
export interface DeterminismCheckResult {
  isDeterministic: boolean;
  outputs: string[];
  hash: string;
  failures: string[];
}

/**
 * Template validation issue
 */
export interface TemplateValidationIssue {
  type: 'error' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: {
    line: number;
    column: number;
  };
  suggestion?: string;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  isDeterministic: boolean;
  issues: TemplateValidationIssue[];
  nonDeterministicPatterns: string[];
  hasCriticalIssues: boolean;
}

/**
 * Template validator interface
 */
export interface ITemplateValidator {
  /**
   * Validate a template for issues
   */
  validate(template: string): TemplateValidationResult;

  /**
   * Check if template contains non-deterministic constructs
   */
  checkDeterminism(template: string): boolean;

  /**
   * Get all non-deterministic patterns found in template
   */
  getNonDeterministicPatterns(template: string): string[];
}
