import { describe, it, expect } from 'vitest';
import { TemplateValidator } from '../template-validator';

describe('TemplateValidator', () => {
  let validator: TemplateValidator;

  beforeEach(() => {
    validator = new TemplateValidator();
  });

  describe('Deterministic Templates', () => {
    it('should validate simple deterministic template', () => {
      const template = 'Hello {{name}}!';
      const result = validator.validate(template);

      expect(result.isValid).toBe(true);
      expect(result.isDeterministic).toBe(true);
      // May have warnings about unknown helpers, but no critical issues
      expect(result.hasCriticalIssues).toBe(false);
      expect(result.nonDeterministicPatterns.length).toBe(0);
    });

    it('should validate template with helpers', () => {
      const template = '{{uppercase name}} - {{lowercase email}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(true);
      expect(result.hasCriticalIssues).toBe(false);
    });

    it('should validate template with conditionals', () => {
      const template = `{{#if active}}Active{{else}}Inactive{{/if}}`;
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should validate template with loops', () => {
      const template = `{{#each items}}{{this}}{{/each}}`;
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(true);
    });

    it('should validate template with nested objects', () => {
      const template = '{{user.name}} - {{user.email}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Non-Deterministic Patterns - Date/Time', () => {
    it('should detect {{now}} pattern', () => {
      const template = 'Generated at {{now}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('now/today/currentTime');
      expect(result.hasCriticalIssues).toBe(true);
    });

    it('should detect new Date() pattern', () => {
      const template = 'const date = new Date();';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('new Date()');
    });

    it('should detect Date.now() pattern', () => {
      const template = 'const timestamp = Date.now();';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('Date methods');
    });

    it('should detect {{today}} helper', () => {
      const template = 'Today is {{today}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Non-Deterministic Patterns - Random', () => {
    it('should detect Math.random() pattern', () => {
      const template = 'const rand = Math.random();';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('Math.random()');
      expect(result.hasCriticalIssues).toBe(true);
    });

    it('should detect {{random}} helper', () => {
      const template = 'Random value: {{random}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('random/uuid/guid helpers');
    });

    it('should detect {{uuid}} helper', () => {
      const template = 'ID: {{uuid}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });

    it('should detect {{guid}} helper', () => {
      const template = 'GUID: {{guid}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });
  });

  describe('Non-Deterministic Patterns - Environment', () => {
    it('should detect process.env access', () => {
      const template = 'Node version: {{process.env.NODE_VERSION}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('process/environment variables');
    });

    it('should detect __dirname access', () => {
      const template = 'Path: {{__dirname}}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });
  });

  describe('Non-Deterministic Patterns - Network', () => {
    it('should detect fetch() call', () => {
      const template = 'await fetch(url);';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('Network access');
    });

    it('should detect http module access', () => {
      const template = 'http.request(options);';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });

    it('should detect axios usage', () => {
      const template = 'axios.get(url);';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });
  });

  describe('Non-Deterministic Patterns - Async', () => {
    it('should detect async keyword', () => {
      const template = 'async function getData() {}';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
      expect(result.nonDeterministicPatterns).toContain('Async operations');
    });

    it('should detect await keyword', () => {
      const template = 'const data = await promise;';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });

    it('should detect setTimeout', () => {
      const template = 'setTimeout(() => {}, 1000);';
      const result = validator.validate(template);

      expect(result.isDeterministic).toBe(false);
    });
  });

  describe('Syntax Validation', () => {
    it('should detect unbalanced opening braces', () => {
      const template = '{{hello}';
      const result = validator.validate(template);

      expect(result.isValid).toBe(false);
      expect(result.hasCriticalIssues).toBe(true);
      const syntaxIssue = result.issues.find((i) => i.message.includes('Unbalanced'));
      expect(syntaxIssue).toBeDefined();
    });

    it('should detect unbalanced closing braces', () => {
      const template = 'hello}}';
      const result = validator.validate(template);

      expect(result.isValid).toBe(false);
    });

    it('should detect unbalanced block helpers', () => {
      const template = '{{#if condition}}content';
      const result = validator.validate(template);

      expect(result.isValid).toBe(false);
      const blockIssue = result.issues.find((i) =>
        i.message.includes('Unbalanced block'),
      );
      expect(blockIssue).toBeDefined();
    });

    it('should accept balanced block helpers', () => {
      const template = '{{#if condition}}content{{/if}}';
      const result = validator.validate(template);

      expect(result.hasCriticalIssues).toBe(false);
    });

    it('should accept balanced nested block helpers', () => {
      const template = '{{#each items}}{{#if active}}{{name}}{{/if}}{{/each}}';
      const result = validator.validate(template);

      expect(result.hasCriticalIssues).toBe(false);
    });
  });

  describe('Helper Validation', () => {
    it('should warn about unknown helpers', () => {
      const template = '{{unknownHelper value}}';
      const result = validator.validate(template);

      const warnings = result.issues.filter((i) => i.type === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should not warn about built-in helpers', () => {
      const template = '{{#if true}}test{{/if}}';
      const result = validator.validate(template);

      const ifWarning = result.issues.find((i) => i.message.includes("'if'"));
      expect(ifWarning).toBeUndefined();
    });

    it('should not warn about standard helpers', () => {
      const template = '{{uppercase name}}';
      const result = validator.validate(template);

      const warnings = result.issues.filter((i) => i.type === 'warning');
      expect(warnings.length).toBe(0);
    });
  });

  describe('checkDeterminism method', () => {
    it('should return true for deterministic template', () => {
      const template = 'Hello {{name}}';
      expect(validator.checkDeterminism(template)).toBe(true);
    });

    it('should return false for non-deterministic template', () => {
      const template = 'Time: {{now}}';
      expect(validator.checkDeterminism(template)).toBe(false);
    });

    it('should handle multiple patterns', () => {
      const template = 'Time: {{now}}, Random: {{random}}';
      expect(validator.checkDeterminism(template)).toBe(false);
    });
  });

  describe('getNonDeterministicPatterns method', () => {
    it('should return empty array for deterministic template', () => {
      const template = 'Hello {{name}}';
      const patterns = validator.getNonDeterministicPatterns(template);
      expect(patterns.length).toBe(0);
    });

    it('should return patterns found in template', () => {
      const template = 'Time: {{now}}, Random: {{random}}';
      const patterns = validator.getNonDeterministicPatterns(template);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.join(',')).toMatch(/now|random/);
    });

    it('should identify specific patterns', () => {
      const tests = [
        { template: 'const x = Math.random();', shouldContain: 'Math.random()' },
        { template: 'const d = new Date();', shouldContain: 'new Date()' },
        { template: 'await fetch(url);', shouldContain: 'Network access' },
      ];

      for (const test of tests) {
        const patterns = validator.getNonDeterministicPatterns(test.template);
        expect(patterns.join(',')).toMatch(new RegExp(test.shouldContain.replace(/[()]/g, '\\$&')));
      }
    });
  });

  describe('getDeterminismReport method', () => {
    it('should provide detailed report', () => {
      const template = 'Time: {{now}}, Random: Math.random()';
      const report = validator.getDeterminismReport(template);

      expect(report.isDeterministic).toBe(false);
      expect(report.patterns.length).toBeGreaterThan(0);
      expect(report.patterns[0]).toHaveProperty('name');
      expect(report.patterns[0]).toHaveProperty('severity');
      expect(report.patterns[0]).toHaveProperty('message');
    });

    it('should show critical issues in report', () => {
      const template = '{{now}} and Math.random()';
      const report = validator.getDeterminismReport(template);

      const criticalPatterns = report.patterns.filter((p) => p.severity === 'critical');
      expect(criticalPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Issue location tracking', () => {
    it('should identify issue line and column', () => {
      const template = 'Line 1\nLine 2 {{now}}\nLine 3';
      const result = validator.validate(template);

      const issue = result.issues.find((i) => i.severity === 'critical');
      expect(issue?.location).toBeDefined();
      expect(issue?.location?.line).toBe(2);
    });
  });

  describe('Multiple issues in single template', () => {
    it('should detect all issues in complex template', () => {
      const template = `
        {{#each items
        {{#if active}}
        {{now}} - {{random}}
        {{/if}}
      `;

      const result = validator.validate(template);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      // Should have syntax error (unbalanced braces)
      const syntaxError = result.issues.find((i) => i.message.includes('Unbalanced'));
      expect(syntaxError).toBeDefined();
      // Should have non-deterministic patterns
      expect(result.nonDeterministicPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Suggestions for issues', () => {
    it('should provide suggestions for non-deterministic patterns', () => {
      const template = 'Time: {{now}}';
      const result = validator.validate(template);

      const issue = result.issues.find((i) => i.message.includes('date/time'));
      expect(issue?.suggestion).toBeDefined();
      expect(issue?.suggestion?.toLowerCase()).toContain('context');
    });

    it('should provide suggestions for syntax errors', () => {
      const template = '{{unclosed';
      const result = validator.validate(template);

      const issue = result.issues.find((i) => i.message.includes('Unbalanced'));
      expect(issue?.suggestion).toBeDefined();
    });
  });

  describe('Issue severity levels', () => {
    it('should mark date/time issues as critical', () => {
      const template = '{{now}}';
      const result = validator.validate(template);

      const issue = result.issues.find((i) => i.severity === 'critical');
      expect(issue).toBeDefined();
    });

    it('should mark network issues as critical', () => {
      const template = 'await fetch(url);';
      const result = validator.validate(template);

      const criticalIssues = result.issues.filter((i) => i.severity === 'critical');
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('should mark helper issues as warnings', () => {
      const template = '{{unknownHelper}}';
      const result = validator.validate(template);

      const warnings = result.issues.filter((i) => i.severity === 'low');
      expect(warnings.length).toBeGreaterThan(0);
    });
  });
});
