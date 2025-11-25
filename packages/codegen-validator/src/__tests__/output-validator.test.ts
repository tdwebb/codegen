import { describe, it, expect } from 'vitest';
import { OutputValidator } from '../output-validator';

describe('OutputValidator', () => {
  let validator: OutputValidator;

  beforeEach(() => {
    validator = new OutputValidator();
  });

  describe('JavaScript/TypeScript Validation', () => {
    it('should validate valid JavaScript', () => {
      const code = `function hello() {
  return 'world';
}`;

      const result = validator.validate(code, 'javascript');
      expect(result.isValid).toBe(true);
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should detect unbalanced braces', () => {
      const code = `function hello() {
  return 'world';`;

      const result = validator.validate(code, 'javascript');
      expect(result.isValid).toBe(false);
      const braceError = result.issues.find((i) =>
        i.message.includes('Unbalanced braces'),
      );
      expect(braceError).toBeDefined();
      expect(braceError?.severity).toBe('critical');
    });

    it('should detect unbalanced parentheses', () => {
      const code = `function hello(x, y {
  return x + y;
}`;

      const result = validator.validate(code, 'javascript');
      expect(result.isValid).toBe(false);
      const parenError = result.issues.find((i) =>
        i.message.includes('Unbalanced parentheses'),
      );
      expect(parenError).toBeDefined();
    });

    it('should detect unbalanced brackets', () => {
      const code = `const arr = [1, 2, 3;`;

      const result = validator.validate(code, 'javascript');
      expect(result.isValid).toBe(false);
      const bracketError = result.issues.find((i) =>
        i.message.includes('Unbalanced brackets'),
      );
      expect(bracketError).toBeDefined();
    });

    it('should warn about console.log', () => {
      const code = `function process() {
  console.log('processing');
  return 'done';
}`;

      const result = validator.validate(code, 'javascript');
      const consoleWarning = result.issues.find((i) =>
        i.message.includes('console.log'),
      );
      expect(consoleWarning).toBeDefined();
      expect(consoleWarning?.severity).toBe('medium');
      expect(consoleWarning?.autoFixable).toBe(true);
    });

    it('should warn about var keyword', () => {
      const code = `var x = 10;
var y = 20;`;

      const result = validator.validate(code, 'javascript');
      const varWarnings = result.issues.filter((i) =>
        i.message.includes('var keyword'),
      );
      expect(varWarnings.length).toBeGreaterThan(0);
      expect(varWarnings[0].autoFixable).toBe(true);
    });

    it('should detect trailing whitespace', () => {
      const code = 'function hello() {  \n  return "world";\n}';

      const result = validator.validate(code, 'javascript');
      const trailingWhitespace = result.issues.filter((i) =>
        i.message.includes('Trailing whitespace'),
      );
      expect(trailingWhitespace.length).toBeGreaterThan(0);
    });

    it('should detect mixed tabs and spaces', () => {
      const code = `function hello() {
\t  return 'world';
}`;

      const result = validator.validate(code, 'javascript');
      const mixedIndentation = result.issues.find((i) =>
        i.message.includes('Mixed tabs and spaces'),
      );
      expect(mixedIndentation).toBeDefined();
      expect(mixedIndentation?.autoFixable).toBe(true);
    });
  });

  describe('JSON Validation', () => {
    it('should validate valid JSON', () => {
      const json = '{"name": "John", "age": 30}';

      const result = validator.validate(json, 'json');
      expect(result.isValid).toBe(true);
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should detect invalid JSON with trailing comma', () => {
      const json = '{"name": "John", "age": 30,}';

      const result = validator.validate(json, 'json');
      expect(result.isValid).toBe(false);
      const jsonError = result.issues.find((i) =>
        i.message.includes('Invalid JSON'),
      );
      expect(jsonError).toBeDefined();
      expect(jsonError?.severity).toBe('critical');
    });

    it('should detect unmatched braces in JSON', () => {
      const json = '{"name": "John"';

      const result = validator.validate(json, 'json');
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect JSON with missing quotes', () => {
      const json = '{name: "John", age: 30}';

      const result = validator.validate(json, 'json');
      expect(result.isValid).toBe(false);
    });

    it('should validate JSON arrays', () => {
      const json = '[1, 2, 3, {"name": "John"}]';

      const result = validator.validate(json, 'json');
      expect(result.isValid).toBe(true);
    });
  });

  describe('YAML Validation', () => {
    it('should validate valid YAML', () => {
      const yaml = `name: John
age: 30
email: john@example.com`;

      const result = validator.validate(yaml, 'yaml');
      expect(result.isValid).toBe(true);
    });

    it('should detect tabs in YAML', () => {
      const yaml = `name: John
\tage: 30`;

      const result = validator.validate(yaml, 'yaml');
      const tabError = result.issues.find((i) =>
        i.message.includes('Tabs not allowed'),
      );
      expect(tabError).toBeDefined();
      expect(tabError?.severity).toBe('critical');
      expect(tabError?.autoFixable).toBe(true);
    });
  });

  describe('Python Validation', () => {
    it('should validate valid Python', () => {
      const code = `def hello():
    return 'world'`;

      const result = validator.validate(code, 'python');
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should detect unbalanced parentheses in Python', () => {
      const code = `def hello(x, y:
    return x + y`;

      const result = validator.validate(code, 'python');
      const parenError = result.issues.find((i) =>
        i.message.includes('Unbalanced parentheses'),
      );
      expect(parenError).toBeDefined();
    });
  });

  describe('Auto-Fix Functionality', () => {
    it('should auto-fix trailing whitespace', () => {
      const code = 'function hello() {  \n  return "world";\n}';

      const result = validator.autoFix(code, 'javascript');
      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      // Verify trailing whitespace was removed
      expect(result.fixed).not.toMatch(/\s+$/m);
    });

    it('should auto-fix mixed indentation', () => {
      const code = `function hello() {
\t  return 'world';
}`;

      const result = validator.autoFix(code, 'javascript');
      expect(result.success).toBe(true);
      const changeMessages = result.changes.map((c) => c.fix);
      expect(
        changeMessages.some((msg) => msg.includes('indentation')),
      ).toBe(true);
    });

    it('should auto-fix console.log statements', () => {
      const code = `function process() {
  console.log('test');
  return 'done';
}`;

      const result = validator.autoFix(code, 'javascript');
      expect(result.success).toBe(true);
      expect(result.fixed).not.toContain('console.log');
    });

    it('should auto-fix var to const', () => {
      const code = `var x = 10;
var y = 20;`;

      const result = validator.autoFix(code, 'javascript');
      expect(result.success).toBe(true);
      expect(result.fixed).toContain('const');
      expect(result.fixed).not.toContain('var');
    });

    it('should auto-fix tabs in YAML', () => {
      const yaml = `name: John
\tage: 30
\temail: john@example.com`;

      const result = validator.autoFix(yaml, 'yaml');
      expect(result.success).toBe(true);
      expect(result.fixed).not.toContain('\t');
    });

    it('should track all changes made', () => {
      const code = `var x = 10;
console.log(x);   `;

      const result = validator.autoFix(code, 'javascript');
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes[0]).toHaveProperty('line');
      expect(result.changes[0]).toHaveProperty('issue');
      expect(result.changes[0]).toHaveProperty('fix');
    });

    it('should report warnings for unfixable issues', () => {
      const code = `function test() {
  var x = 10;
}`;

      const result = validator.autoFix(code, 'javascript');
      // Should have changes from the fixes that were applied
      expect(result.changes.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Rules', () => {
    it('should register and apply custom rules', () => {
      validator.registerRule('custom', () => [
        {
          type: 'warning',
          severity: 'low',
          message: 'Custom rule violation',
          suggestion: 'Fix the custom issue',
        },
      ]);

      const result = validator.validate('some content', 'custom');
      const customIssue = result.issues.find((i) =>
        i.message.includes('Custom rule'),
      );
      expect(customIssue).toBeDefined();
    });

    it('should override default rules with custom rules', () => {
      validator.registerRule('javascript', () => [
        {
          type: 'error',
          severity: 'critical',
          message: 'Custom JS rule',
        },
      ]);

      const result = validator.validate('var x = 10;', 'javascript');
      const customIssue = result.issues.find((i) =>
        i.message.includes('Custom JS rule'),
      );
      expect(customIssue).toBeDefined();
    });
  });

  describe('Issue Location Tracking', () => {
    it('should provide line numbers for issues', () => {
      const code = `function test() {
  console.log('error');
  return true;
}`;

      const result = validator.validate(code, 'javascript');
      const consoleIssue = result.issues.find((i) =>
        i.message.includes('console.log'),
      );
      expect(consoleIssue?.location).toBeDefined();
      expect(consoleIssue?.location?.line).toBe(2);
    });

    it('should track multiple issues with correct line numbers', () => {
      const code = `var x = 10;
var y = 20;
console.log(x, y);`;

      const result = validator.validate(code, 'javascript');
      const issues = result.issues.filter(
        (i) => i.location?.line && i.location.line > 0,
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(
        issues.some((i) => i.location?.line === 1),
      ).toBe(true);
      expect(
        issues.some((i) => i.location?.line === 3),
      ).toBe(true);
    });
  });

  describe('Content Preservation', () => {
    it('should preserve original content in result', () => {
      const code = 'function test() {}';

      const result = validator.validate(code, 'javascript');
      expect(result.content).toBe(code);
    });

    it('should preserve valid content through validation', () => {
      const code = `const obj = {
  name: 'John',
  age: 30
};`;

      const result = validator.validate(code, 'javascript');
      expect(result.content).toBe(code);
    });
  });

  describe('Multiple Language Support', () => {
    it('should support TypeScript alias', () => {
      const code = 'function test(): void {}';

      const result = validator.validate(code, 'typescript');
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should support ts alias', () => {
      const code = 'interface User { name: string; }';

      const result = validator.validate(code, 'ts');
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should support js alias', () => {
      const code = 'const x = 10;';

      const result = validator.validate(code, 'js');
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should support yml alias', () => {
      const yaml = 'name: John\nage: 30';

      const result = validator.validate(yaml, 'yml');
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });
  });

  describe('Determinism', () => {
    it('should validate same code consistently', () => {
      const code = `function test() {
  console.log('test');
}`;

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(validator.validate(code, 'javascript'));
      }

      // All results should have same issue count
      const issueCounts = results.map((r) => r.issues.length);
      expect(
        issueCounts.every((count) => count === issueCounts[0]),
      ).toBe(true);

      // All results should have same validity
      const validities = results.map((r) => r.isValid);
      expect(
        validities.every((valid) => valid === validities[0]),
      ).toBe(true);
    });

    it('should auto-fix consistently', () => {
      const code = `var x = 10;
console.log(x);   `;

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(validator.autoFix(code, 'javascript'));
      }

      // All results should produce same fixed code
      const fixedCodes = results.map((r) => r.fixed);
      expect(
        fixedCodes.every((code) => code === fixedCodes[0]),
      ).toBe(true);

      // All results should have same number of changes
      const changeCounts = results.map((r) => r.changes.length);
      expect(
        changeCounts.every((count) => count === changeCounts[0]),
      ).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = validator.validate('', 'javascript');
      expect(result.isValid).toBe(true);
    });

    it('should handle whitespace-only content', () => {
      const result = validator.validate('   \n  \n  ', 'javascript');
      const warnings = result.issues.filter((i) => i.severity === 'critical');
      expect(warnings).toHaveLength(0);
    });

    it('should handle very long code', () => {
      const code = Array(1000)
        .fill('const x = 10;')
        .join('\n');

      const result = validator.validate(code, 'javascript');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('isValid');
    });

    it('should handle special characters', () => {
      const code = 'const emoji = "😀"; // test ©';

      const result = validator.validate(code, 'javascript');
      expect(
        result.issues.filter((i) => i.severity === 'critical'),
      ).toHaveLength(0);
    });

    it('should handle code with multiple issues per line', () => {
      const code = `var x = 10;  \t  console.log(x);`;

      const result = validator.validate(code, 'javascript');
      expect(result.issues.length).toBeGreaterThan(1);
    });
  });

  describe('Severity Levels', () => {
    it('should mark syntax errors as critical', () => {
      const code = `function test() {`;

      const result = validator.validate(code, 'javascript');
      const criticalIssues = result.issues.filter(
        (i) => i.severity === 'critical',
      );
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('should mark style warnings as medium/low', () => {
      const code = `var x = 10;  `;

      const result = validator.validate(code, 'javascript');
      const warnings = result.issues.filter(
        (i) => i.severity === 'medium' || i.severity === 'low',
      );
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should determine validity based on critical issues', () => {
      const codeWithWarning = `var x = 10;`;
      const result1 = validator.validate(codeWithWarning, 'javascript');
      expect(result1.isValid).toBe(true); // Warnings don't make it invalid

      const codeWithError = `function test() {`;
      const result2 = validator.validate(codeWithError, 'javascript');
      expect(result2.isValid).toBe(false); // Errors make it invalid
    });
  });
});
