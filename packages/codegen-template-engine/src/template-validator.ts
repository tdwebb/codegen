/**
 * Template validator for detecting non-deterministic constructs
 */

import type {
  ITemplateValidator,
  TemplateValidationResult,
  TemplateValidationIssue,
} from './types';

/**
 * Non-deterministic pattern definitions
 */
interface NonDeterministicPattern {
  pattern: RegExp;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
}

/**
 * Template validator for Handlebars templates
 */
export class TemplateValidator implements ITemplateValidator {
  private nonDeterministicPatterns: NonDeterministicPattern[] = [
    // Date/Time patterns
    {
      pattern: /\{\{now\}\}|\{\{today\}\}|\{\{currentTime\}\}/gi,
      name: 'now/today/currentTime',
      severity: 'critical',
      message: 'Template uses current date/time which is non-deterministic',
      suggestion: 'Pass current date/time as context variable instead',
    },
    {
      pattern: /new\s+Date\(\)/gi,
      name: 'new Date()',
      severity: 'critical',
      message: 'Template uses new Date() which is non-deterministic',
      suggestion: 'Pass date as context variable instead',
    },

    // Random patterns
    {
      pattern: /Math\.random\(\)/gi,
      name: 'Math.random()',
      severity: 'critical',
      message: 'Template uses Math.random() which is non-deterministic',
      suggestion: 'Pass random value as context variable instead',
    },
    {
      pattern: /\{\{random[^}]*\}\}|\{\{uuid[^}]*\}\}|\{\{guid[^}]*\}\}/gi,
      name: 'random/uuid/guid helpers',
      severity: 'critical',
      message: 'Template uses random value generation which is non-deterministic',
      suggestion: 'Pass generated value as context variable instead',
    },

    // Environment patterns
    {
      pattern: /process\.env|process\.argv|__dirname|__filename/gi,
      name: 'process/environment variables',
      severity: 'high',
      message: 'Template accesses process environment which may vary',
      suggestion: 'Pass environment values as context variables instead',
    },

    // Timestamp patterns
    {
      pattern: /Date\.now\(\)|getTime\(\)|valueOf\(\)/gi,
      name: 'Date methods',
      severity: 'critical',
      message: 'Template uses timestamp methods which are non-deterministic',
      suggestion: 'Pass timestamp as context variable instead',
    },

    // File system patterns
    {
      pattern: /fs\.|readFile|writeFile|readdir|readlink/gi,
      name: 'File system access',
      severity: 'high',
      message: 'Template accesses file system which is non-deterministic',
      suggestion: 'Load file content at generation time and pass as context',
    },

    // Network patterns
    {
      pattern: /http\.|fetch\(|axios\.|request\(|\.get\(|\.post\(/gi,
      name: 'Network access',
      severity: 'critical',
      message: 'Template makes network requests which are non-deterministic',
      suggestion: 'Fetch data before template rendering and pass as context',
    },

    // Object/Array iteration order patterns
    {
      pattern: /\{\{#each\s+[^}]*\}\}[\s\S]*?@index/gi,
      name: 'unordered iteration',
      severity: 'medium',
      message: 'Template iterates over unordered data (@index usage)',
      suggestion: 'Ensure data is pre-sorted or use deterministic ordering',
    },

    // Async patterns
    {
      pattern: /async\s+|await\s+|Promise\.|setTimeout\(|setInterval\(/gi,
      name: 'Async operations',
      severity: 'critical',
      message: 'Template uses async operations which are non-deterministic',
      suggestion: 'Resolve promises before template rendering',
    },

    // Global variable access patterns
    {
      pattern: /global\.|globalThis\.|window\.|this\.[a-zA-Z]/gi,
      name: 'global/this access',
      severity: 'high',
      message: 'Template accesses global/this variables which may vary',
      suggestion: 'Pass necessary values as context variables instead',
    },

    // Math operations that could vary
    {
      pattern: /Math\.random|Math\.floor|Math\.ceil|Math\.round/gi,
      name: 'Math operations',
      severity: 'medium',
      message: 'Template uses Math operations which may produce varying results',
      suggestion: 'Pre-calculate values and pass as context instead',
    },

    // Floating point operations
    {
      pattern: /0\.\d+\s*\*|\/\s*0\.\d+|NaN|Infinity/gi,
      name: 'Floating point issues',
      severity: 'medium',
      message: 'Template may produce inconsistent floating point results',
      suggestion: 'Use integer arithmetic or pre-calculate precision values',
    },

    // Array/Object method patterns that depend on iteration order
    {
      pattern: /for\s+\(.*in\s+|\{for\s+\(.*in\s+/gi,
      name: 'for...in iteration',
      severity: 'high',
      message: 'Template uses for...in which has undefined iteration order',
      suggestion: 'Use Object.keys() sorted or for...of instead',
    },

    // require() for dynamic imports
    {
      pattern: /require\s*\(\s*['"][^'"]+['"]\s*\)(?!\.)\s|import\s+[^;]*from\s+[^;]*variables/gi,
      name: 'Dynamic imports',
      severity: 'high',
      message: 'Template uses dynamic imports which are non-deterministic',
      suggestion: 'Load modules before rendering and pass as context',
    },
  ];

  /**
   * Validate a template for issues
   */
  validate(template: string): TemplateValidationResult {
    const issues: TemplateValidationIssue[] = [];
    const nonDeterministicPatterns: string[] = [];

    // Check for non-deterministic patterns
    for (const patternDef of this.nonDeterministicPatterns) {
      const matches = template.match(patternDef.pattern);
      if (matches && matches.length > 0) {
        nonDeterministicPatterns.push(patternDef.name);

        // Add issue for first match
        const matchIndex = template.indexOf(matches[0]);
        const lineNumber = template.substring(0, matchIndex).split('\n').length;
        const lineStart = template.lastIndexOf('\n', matchIndex) + 1;
        const columnNumber = matchIndex - lineStart + 1;

        issues.push({
          type: 'error',
          severity: patternDef.severity,
          message: patternDef.message,
          location: {
            line: lineNumber,
            column: columnNumber,
          },
          suggestion: patternDef.suggestion,
        });
      }
    }

    // Check for syntax errors
    const syntaxIssues = this.checkSyntax(template);
    issues.push(...syntaxIssues);

    // Check for missing helper definitions
    const helperIssues = this.checkUndefinedHelpers(template);
    issues.push(...helperIssues);

    const isDeterministic = nonDeterministicPatterns.length === 0;
    const hasCriticalIssues = issues.some((i) => i.severity === 'critical');
    const isValid = hasCriticalIssues === false && syntaxIssues.length === 0;

    return {
      isValid,
      isDeterministic,
      issues,
      nonDeterministicPatterns,
      hasCriticalIssues,
    };
  }

  /**
   * Check if template contains non-deterministic constructs
   */
  checkDeterminism(template: string): boolean {
    for (const patternDef of this.nonDeterministicPatterns) {
      if (patternDef.pattern.test(template)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all non-deterministic patterns found in template
   */
  getNonDeterministicPatterns(template: string): string[] {
    const patterns: string[] = [];
    for (const patternDef of this.nonDeterministicPatterns) {
      if (patternDef.pattern.test(template)) {
        patterns.push(patternDef.name);
      }
    }
    return patterns;
  }

  /**
   * Check for basic syntax errors in Handlebars template
   */
  private checkSyntax(template: string): TemplateValidationIssue[] {
    const issues: TemplateValidationIssue[] = [];

    // Check for unbalanced braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced handlebars: ${openBraces} opening, ${closeBraces} closing`,
        suggestion: 'Check for missing or extra {{ or }}',
      });
    }

    // Check for unbalanced block helpers
    const blockOpeners = (template.match(/\{\{#\w+/g) || []).length;
    const blockClosers = (template.match(/\{\{\/\w+/g) || []).length;

    if (blockOpeners !== blockClosers) {
      issues.push({
        type: 'error',
        severity: 'critical',
        message: `Unbalanced block helpers: ${blockOpeners} opening, ${blockClosers} closing`,
        suggestion: 'Check for missing {{/blockname}} closing tags',
      });
    }

    return issues;
  }

  /**
   * Check for potentially undefined helpers
   */
  private checkUndefinedHelpers(template: string): TemplateValidationIssue[] {
    const issues: TemplateValidationIssue[] = [];

    // Extract helper names from template
    const helperPattern = /\{\{(\w+)(?:\s+|}})/g;
    const matches = template.matchAll(helperPattern);

    // List of built-in Handlebars helpers
    const builtInHelpers = new Set([
      'if',
      'unless',
      'each',
      'with',
      'lookup',
      'log',
      'blockHelperMissing',
      'helperMissing',
      'default',
      'inverse',
    ]);

    for (const match of matches) {
      const helperName = match[1];
      if (!helperName) continue;
      if (!builtInHelpers.has(helperName)) {
        // Helper might be custom, warn if not registered
        // This is a gentle warning since we can't know all registered helpers
        if (!this.isCommonHelper(helperName)) {
          const matchIndex = match.index ?? 0;
          const lineNumber = template.substring(0, matchIndex).split('\n').length;
          issues.push({
            type: 'warning',
            severity: 'low',
            message: `Helper '${helperName}' is not a built-in Handlebars helper`,
            location: {
              line: lineNumber,
              column: matchIndex - template.lastIndexOf('\n', matchIndex),
            },
            suggestion: 'Ensure this helper is registered with the template engine',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check if helper is a common standard helper
   */
  private isCommonHelper(name: string): boolean {
    const commonHelpers = new Set([
      'uppercase',
      'lowercase',
      'camelcase',
      'pascalcase',
      'snakecase',
      'kebabcase',
      'capitalize',
      'reverse',
      'repeat',
      'trim',
      'truncate',
      'indent',
      'comment',
      'importTs',
      'exportTs',
      'isArray',
      'isObject',
      'typeof',
      'length',
      'add',
      'subtract',
      'multiply',
      'stringify',
    ]);

    return commonHelpers.has(name);
  }

  /**
   * Get detailed determinism report
   */
  getDeterminismReport(template: string): {
    isDeterministic: boolean;
    patterns: Array<{ name: string; severity: string; message: string }>;
  } {
    const patterns: Array<{ name: string; severity: string; message: string }> = [];

    for (const patternDef of this.nonDeterministicPatterns) {
      if (patternDef.pattern.test(template)) {
        patterns.push({
          name: patternDef.name,
          severity: patternDef.severity,
          message: patternDef.message,
        });
      }
    }

    return {
      isDeterministic: patterns.length === 0,
      patterns,
    };
  }
}
