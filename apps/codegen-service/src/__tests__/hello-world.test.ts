import { describe, it, expect } from 'vitest';
import { HelloWorldGenerator } from '../generators/hello-world';

describe('HelloWorldGenerator', () => {
  const generator = new HelloWorldGenerator();

  describe('metadata', () => {
    it('should have correct id and version', () => {
      expect(generator.id).toBe('hello-world');
      expect(generator.version).toBe('1.0.0');
    });

    it('should have valid manifest', () => {
      expect(generator.manifest).toBeDefined();
      expect(generator.manifest.id).toBe('hello-world');
      expect(generator.manifest.displayName).toBe('Hello World Generator');
      expect(generator.manifest.outputs).toHaveLength(1);
      expect(generator.manifest.capabilities).toContain('single-file');
      expect(generator.manifest.capabilities).toContain('templating');
    });
  });

  describe('generate', () => {
    it('should generate hello.ts file with provided name', async () => {
      const result = await generator.generate(
        { name: 'World' },
        { tenantId: 'test-tenant' },
      );

      expect(result).toBeDefined();
      expect(result.artifactId).toMatch(/^hello-world-\d+$/);
      expect(result.files).toHaveLength(1);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.metadata).toBeDefined();
    });

    it('should include name in generated file content', async () => {
      const result = await generator.generate(
        { name: 'Alice' },
        { tenantId: 'test-tenant' },
      );

      const file = result.files[0];
      expect(file).toBeDefined();
      expect(file.path).toBe('hello.ts');
      expect(file.content).toContain('Alice');
      expect(file.language).toBe('typescript');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should generate valid TypeScript content', async () => {
      const result = await generator.generate(
        { name: 'Test' },
        { tenantId: 'test-tenant' },
      );

      const file = result.files[0];
      expect(file.content).toContain('export function greet');
      expect(file.content).toContain('return `Hello, Test!`;');
      expect(file.content).toContain('export const DEFAULT_GREETING');
    });

    it('should generate consistent hash for same input', async () => {
      const result1 = await generator.generate(
        { name: 'Bob' },
        { tenantId: 'test-tenant' },
      );

      const result2 = await generator.generate(
        { name: 'Bob' },
        { tenantId: 'test-tenant' },
      );

      expect(result1.files[0].hash).toBe(result2.files[0].hash);
    });

    it('should generate different hash for different input', async () => {
      const result1 = await generator.generate(
        { name: 'Alice' },
        { tenantId: 'test-tenant' },
      );

      const result2 = await generator.generate(
        { name: 'Bob' },
        { tenantId: 'test-tenant' },
      );

      expect(result1.files[0].hash).not.toBe(result2.files[0].hash);
    });

    it('should include metadata with tenant and spec info', async () => {
      const spec = { name: 'World' };
      const result = await generator.generate(spec, {
        tenantId: 'my-tenant',
      });

      expect(result.metadata.generatorId).toBe('hello-world');
      expect(result.metadata.generatorVersion).toBe('1.0.0');
      expect(result.metadata.tenantId).toBe('my-tenant');
      expect(result.metadata.spec).toEqual(spec);
      expect(result.metadata.specHash).toBeDefined();
      expect(result.metadata.createdAt).toBeDefined();
    });

    it('should reject invalid spec without name', async () => {
      await expect(
        generator.generate({}, { tenantId: 'test-tenant' }),
      ).rejects.toThrow('name property');
    });

    it('should reject spec with non-string name', async () => {
      await expect(
        generator.generate(
          { name: 123 },
          { tenantId: 'test-tenant' },
        ),
      ).rejects.toThrow('name property');
    });

    it('should reject non-object spec', async () => {
      await expect(
        generator.generate('not-an-object', { tenantId: 'test-tenant' }),
      ).rejects.toThrow('object');
    });

    it('should reject null spec', async () => {
      await expect(
        generator.generate(null, { tenantId: 'test-tenant' }),
      ).rejects.toThrow('object');
    });
  });

  describe('output format', () => {
    it('should have correct file structure', async () => {
      const result = await generator.generate(
        { name: 'Test' },
        { tenantId: 'test-tenant' },
      );

      const file = result.files[0];
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('content');
      expect(file).toHaveProperty('hash');
      expect(file).toHaveProperty('language');
      expect(file).toHaveProperty('size');
    });

    it('should have correct artifact result structure', async () => {
      const result = await generator.generate(
        { name: 'Test' },
        { tenantId: 'test-tenant' },
      );

      expect(result).toHaveProperty('artifactId');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('diagnostics');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in name', async () => {
      const result = await generator.generate(
        { name: "O'Brien" },
        { tenantId: 'test-tenant' },
      );

      expect(result.files[0].content).toContain("O'Brien");
    });

    it('should handle unicode names', async () => {
      const result = await generator.generate(
        { name: '世界' },
        { tenantId: 'test-tenant' },
      );

      expect(result.files[0].content).toContain('世界');
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(1000);
      const result = await generator.generate(
        { name: longName },
        { tenantId: 'test-tenant' },
      );

      expect(result.files[0].content).toContain(longName);
    });
  });
});
