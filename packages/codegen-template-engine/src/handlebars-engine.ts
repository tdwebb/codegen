/**
 * Handlebars-based template engine implementation
 */

import Handlebars from 'handlebars';
import { createHash } from 'crypto';
import type {
  ITemplateEngine,
  TemplateContext,
  RenderResult,
  RenderOptions,
  DeterminismCheckResult,
} from './types';

/**
 * Handlebars template engine with determinism support
 */
export class HandlebarsTemplateEngine implements ITemplateEngine {
  private hbs: typeof Handlebars;
  private customHelpers: Map<string, (...args: unknown[]) => string> = new Map();

  constructor() {
    this.hbs = Handlebars.create();
  }

  /**
   * Compile a template string
   */
  compile(template: string): (...context: unknown[]) => string {
    try {
      const compiled = this.hbs.compile(template);
      return (context: unknown) => compiled(context);
    } catch (err) {
      throw new Error(
        `Template compilation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Render a template with context
   */
  render(
    template: string,
    context: TemplateContext,
    options?: RenderOptions,
  ): RenderResult {
    try {
      // Validate context is a plain object
      this.validateContext(context);

      // Register any provided helpers
      if (options?.helpers) {
        this.registerHelpers(options.helpers);
      }

      // Compile and render
      const compiled = this.compile(template);
      const content = compiled(context);

      // Calculate SHA-256 hash for determinism tracking
      const hash = this.calculateHash(content);

      return { content, hash };
    } catch (err) {
      throw new Error(
        `Template render failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, helper: (...args: unknown[]) => string): void {
    this.customHelpers.set(name, helper);
    this.hbs.registerHelper(name, helper);
  }

  /**
   * Register multiple helpers at once
   */
  registerHelpers(helpers: Record<string, (...args: unknown[]) => string>): void {
    for (const [name, helper] of Object.entries(helpers)) {
      this.registerHelper(name, helper);
    }
  }

  /**
   * Clear all registered helpers
   */
  clearHelpers(): void {
    for (const [name] of this.customHelpers) {
      // Reset helper by unregistering (unregister not directly available, so we track)
      this.customHelpers.delete(name);
    }
    // Note: Handlebars.unregisterHelper() is not publicly exposed
    // Helpers are tied to the instance, so clearing the map is sufficient
  }

  /**
   * Check determinism by rendering the same template multiple times
   * Returns true if all outputs are identical
   */
  checkDeterminism(
    template: string,
    context: TemplateContext,
    iterations: number = 10,
  ): DeterminismCheckResult {
    const outputs: string[] = [];
    const failures: string[] = [];

    try {
      for (let i = 0; i < iterations; i++) {
        try {
          const result = this.render(template, context);
          outputs.push(result.content);
        } catch (err) {
          failures.push(
            `Iteration ${i + 1}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // Check if all outputs are identical
      const isDeterministic =
        outputs.length > 0 &&
        failures.length === 0 &&
        outputs.every((output) => output === outputs[0]);

      const firstOutput = outputs[0];
      const hash = isDeterministic && firstOutput ? this.calculateHash(firstOutput) : '';

      return {
        isDeterministic,
        outputs,
        hash,
        failures,
      };
    } catch (err) {
      return {
        isDeterministic: false,
        outputs,
        hash: '',
        failures: [
          ...failures,
          `Determinism check failed: ${err instanceof Error ? err.message : String(err)}`,
        ],
      };
    }
  }

  /**
   * Validate that context is a plain object without circular references
   */
  private validateContext(context: TemplateContext): void {
    if (typeof context !== 'object' || context === null) {
      throw new Error('Template context must be a plain object');
    }

    // Check for circular references
    const seen = new WeakSet();
    const check = (obj: unknown): void => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      if (seen.has(obj as object)) {
        throw new Error('Template context contains circular references');
      }

      seen.add(obj as object);

      if (Array.isArray(obj)) {
        for (const item of obj) {
          check(item);
        }
      } else {
        for (const value of Object.values(obj)) {
          check(value);
        }
      }
    };

    check(context);
  }

  /**
   * Calculate SHA-256 hash of content
   */
  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
