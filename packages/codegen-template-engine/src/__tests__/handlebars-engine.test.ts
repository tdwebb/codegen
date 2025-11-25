import { describe, it, expect, beforeEach } from 'vitest';
import { HandlebarsTemplateEngine } from '../handlebars-engine';

describe('HandlebarsTemplateEngine', () => {
  let engine: HandlebarsTemplateEngine;

  beforeEach(() => {
    engine = new HandlebarsTemplateEngine();
  });

  describe('Template Compilation and Rendering', () => {
    it('should compile and render simple templates', () => {
      const template = 'Hello {{name}}!';
      const result = engine.render(template, { name: 'World' });

      expect(result.content).toBe('Hello World!');
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64); // SHA-256 hex string
    });

    it('should handle missing context variables', () => {
      const template = 'Hello {{name}}!';
      const result = engine.render(template, {});

      // Handlebars renders empty string for missing variables
      expect(result.content).toBe('Hello !');
    });

    it('should handle nested objects', () => {
      const template = 'User: {{user.name}} ({{user.email}})';
      const result = engine.render(template, {
        user: { name: 'Alice', email: 'alice@example.com' },
      });

      expect(result.content).toBe('User: Alice (alice@example.com)');
    });

    it('should render arrays with each helper', () => {
      const template = `{{#each items}}{{this}}{{#unless @last}},{{/unless}}{{/each}}`;
      const result = engine.render(template, { items: ['a', 'b', 'c'] });

      expect(result.content).toBe('a,b,c');
    });

    it('should handle conditional blocks', () => {
      const template = `{{#if active}}Active{{else}}Inactive{{/if}}`;
      const result1 = engine.render(template, { active: true });
      const result2 = engine.render(template, { active: false });

      expect(result1.content).toBe('Active');
      expect(result2.content).toBe('Inactive');
    });
  });

  describe('Custom Helpers', () => {
    it('should register and use custom helpers', () => {
      engine.registerHelper('uppercase', (str: string) => str.toUpperCase());
      const template = '{{uppercase name}}';
      const result = engine.render(template, { name: 'alice' });

      expect(result.content).toBe('ALICE');
    });

    it('should register multiple helpers at once', () => {
      engine.registerHelpers({
        uppercase: (str: string) => str.toUpperCase(),
        reverse: (str: string) => str.split('').reverse().join(''),
      });

      const template1 = '{{uppercase name}}';
      const template2 = '{{reverse name}}';

      expect(engine.render(template1, { name: 'alice' }).content).toBe('ALICE');
      expect(engine.render(template2, { name: 'alice' }).content).toBe('ecila');
    });

    it('should support helper arguments', () => {
      engine.registerHelper('repeat', (str: string, times: number) => {
        return new Array(times + 1).join(str);
      });

      const template = '{{repeat "ab" 3}}';
      const result = engine.render(template, {});

      expect(result.content).toBe('ababab');
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid template syntax', () => {
      const template = '{{unclosed';
      expect(() => engine.render(template, {})).toThrow();
    });

    it('should throw on circular references in context', () => {
      const context: any = { name: 'test' };
      context.self = context;

      expect(() => engine.render('{{name}}', context)).toThrow(/circular/i);
    });

    it('should throw on non-object context', () => {
      expect(() => engine.render('test', 'not an object' as any)).toThrow(
        /plain object/i,
      );
    });
  });

  describe('Hashing for Deduplication', () => {
    it('should generate consistent hashes', () => {
      const template = 'Hello {{name}}';
      const context = { name: 'World' };

      const result1 = engine.render(template, context);
      const result2 = engine.render(template, context);

      expect(result1.hash).toBe(result2.hash);
    });

    it('should generate different hashes for different outputs', () => {
      const template = 'Hello {{name}}';

      const result1 = engine.render(template, { name: 'World' });
      const result2 = engine.render(template, { name: 'Alice' });

      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should use SHA-256 for hashing', () => {
      const result = engine.render('test', {});

      // SHA-256 produces 64 hex characters
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('DETERMINISM VERIFICATION - CRITICAL DECISION GATE', () => {
    it('should verify determinism for simple templates (10 iterations)', () => {
      const template = 'Hello {{name}}!';
      const context = { name: 'World' };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.length).toBe(10);
      expect(result.outputs.every((o) => o === 'Hello World!')).toBe(true);
      expect(result.failures.length).toBe(0);
    });

    it('should verify determinism with custom helpers (10 iterations)', () => {
      engine.registerHelper('uppercase', (str: string) => str.toUpperCase());
      const template = '{{uppercase name}}';
      const context = { name: 'alice' };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.every((o) => o === 'ALICE')).toBe(true);
      expect(result.failures.length).toBe(0);
    });

    it('should verify determinism with nested objects (10 iterations)', () => {
      const template = '{{user.name}} - {{user.email}}';
      const context = {
        user: { name: 'Alice', email: 'alice@example.com' },
      };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.every((o) => o === 'Alice - alice@example.com')).toBe(
        true,
      );
    });

    it('should verify determinism with arrays (10 iterations)', () => {
      const template = `{{#each items}}{{this}}{{#unless @last}},{{/unless}}{{/each}}`;
      const context = { items: ['a', 'b', 'c'] };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.every((o) => o === 'a,b,c')).toBe(true);
    });

    it('should verify determinism with conditionals (10 iterations)', () => {
      const template = `{{#if active}}ACTIVE{{else}}INACTIVE{{/if}}`;
      const context = { active: true };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.every((o) => o === 'ACTIVE')).toBe(true);
    });

    it('should verify determinism with multiple helpers (10 iterations)', () => {
      engine.registerHelpers({
        uppercase: (str: string) => str.toUpperCase(),
        lowercase: (str: string) => str.toLowerCase(),
        reverse: (str: string) => str.split('').reverse().join(''),
      });

      const template = '{{uppercase name}}-{{lowercase name}}-{{reverse name}}';
      const context = { name: 'Alice' };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.every((o) => o === 'ALICE-alice-ecilA')).toBe(true);
    });

    it('should verify determinism with complex nested structure (10 iterations)', () => {
      const template = `
        {{#each users}}
          User: {{this.name}}
          Email: {{this.email}}
          {{#if this.active}}Status: Active{{else}}Status: Inactive{{/if}}
        {{/each}}
      `.trim();

      const context = {
        users: [
          { name: 'Alice', email: 'alice@example.com', active: true },
          { name: 'Bob', email: 'bob@example.com', active: false },
        ],
      };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.isDeterministic).toBe(true);
      expect(result.failures.length).toBe(0);
      // All outputs should be identical
      expect(result.outputs.length).toBe(10);
      const firstOutput = result.outputs[0];
      expect(result.outputs.every((o) => o === firstOutput)).toBe(true);
    });

    it('should detect determinism failures with compile errors', () => {
      const template = '{{unclosed';
      const context = {};

      const result = engine.checkDeterminism(template, context, 3);

      expect(result.isDeterministic).toBe(false);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it('should generate consistent hash for deterministic template', () => {
      const template = 'Hello {{name}}!';
      const context = { name: 'World' };

      const result = engine.checkDeterminism(template, context, 10);

      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64);
      // Verify the hash matches the actual content
      expect(result.hash).toBe(engine.render(template, context).hash);
    });

    it('CRITICAL: should verify 10 identical outputs with standard helpers', () => {
      // This is the critical gate test - must pass before proceeding
      engine.registerHelper('stringify', (obj: unknown) =>
        JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort()),
      );

      const template = `
        Data: {{stringify data}}
        Items: {{#each data.items}}[{{this}}]{{/each}}
        Count: {{data.items.length}}
      `.trim();

      const context = {
        data: {
          items: ['first', 'second', 'third'],
          name: 'test',
        },
      };

      const result = engine.checkDeterminism(template, context, 10);

      // CRITICAL: ALL outputs must be identical
      expect(result.isDeterministic).toBe(true);
      expect(result.outputs.length).toBe(10);
      expect(result.failures.length).toBe(0);

      // Verify all outputs are byte-for-byte identical
      const expected = result.outputs[0];
      for (let i = 1; i < result.outputs.length; i++) {
        expect(result.outputs[i]).toBe(expected);
      }

      expect(result.hash).toBeDefined();
    });
  });

  describe('Template Compilation', () => {
    it('should compile templates into functions', () => {
      const template = 'Hello {{name}}!';
      const compiled = engine.compile(template);

      expect(typeof compiled).toBe('function');
      expect(compiled({ name: 'World' })).toBe('Hello World!');
    });

    it('should compile templates with helpers', () => {
      engine.registerHelper('shout', (str: string) => str.toUpperCase() + '!!!');
      const template = '{{shout message}}';
      const compiled = engine.compile(template);

      expect(compiled({ message: 'hello' })).toBe('HELLO!!!');
    });
  });
});
