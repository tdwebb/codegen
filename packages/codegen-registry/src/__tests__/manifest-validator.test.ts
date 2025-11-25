import { describe, it, expect, beforeEach } from 'vitest';
import { ManifestValidator } from '../manifest-validator';
import type { GeneratorManifest } from '@codegen/codegen-core';

describe('ManifestValidator', () => {
  let validator: ManifestValidator;

  beforeEach(() => {
    validator = new ManifestValidator();
  });

  const createValidManifest = (): GeneratorManifest => ({
    id: 'test-generator',
    version: '1.0.0',
    displayName: 'Test Generator',
    description: 'A test generator',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
    outputs: [
      {
        name: 'test.ts',
        path: 'test.ts',
        template: 'hello {{name}}',
      },
    ],
    entryTemplate: 'test.ts',
    capabilities: ['single-file', 'templating'],
  });

  describe('valid manifests', () => {
    it('should validate a complete manifest', () => {
      const manifest = createValidManifest();
      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate manifest with optional fields', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        helpers: [
          {
            name: 'test-helper',
            version: '1.0.0',
          },
        ],
        tests: {
          goldenTests: [
            {
              name: 'basic',
              input: { name: 'World' },
              expectedOutputs: { 'test.ts': 'hello World' },
            },
          ],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate manifest with custom pipeline', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: 'custom-pipeline',
          steps: [
            {
              id: 'validate',
              type: 'validate-input',
              required: true,
            },
            {
              id: 'render',
              type: 'render',
              required: true,
            },
          ],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('invalid manifests', () => {
    it('should reject non-object manifest', () => {
      const result = validator.validate('not-an-object');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should reject manifest without id', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).id;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.id')).toBe(true);
    });

    it('should reject manifest without version', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).version;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.version')).toBe(true);
    });

    it('should reject manifest without displayName', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).displayName;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.displayName')).toBe(true);
    });

    it('should reject manifest without inputSchema', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).inputSchema;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.inputSchema')).toBe(true);
    });

    it('should reject manifest without outputs', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).outputs;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.outputs')).toBe(true);
    });

    it('should reject manifest with empty outputs', () => {
      const manifest = createValidManifest();
      manifest.outputs = [];

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.outputs')).toBe(true);
    });

    it('should reject output without name', () => {
      const manifest = createValidManifest();
      manifest.outputs[0] = {
        ...manifest.outputs[0],
      };
      delete (manifest.outputs[0] as Partial<typeof manifest.outputs[0]>).name;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === '$.outputs[0].name')).toBe(
        true,
      );
    });

    it('should reject manifest without entryTemplate', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).entryTemplate;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.entryTemplate'),
      ).toBe(true);
    });

    it('should reject manifest without capabilities', () => {
      const manifest = createValidManifest();
      delete (manifest as Partial<GeneratorManifest>).capabilities;

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.capabilities'),
      ).toBe(true);
    });

    it('should reject manifest with empty capabilities', () => {
      const manifest = createValidManifest();
      manifest.capabilities = [];

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.capabilities'),
      ).toBe(true);
    });
  });

  describe('pipeline validation', () => {
    it('should validate custom pipeline', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: 'custom',
          steps: [
            {
              id: 'validate',
              type: 'validate-input',
              required: true,
            },
          ],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(true);
    });

    it('should reject pipeline without id', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: '',
          steps: [
            {
              id: 'validate',
              type: 'validate-input',
              required: true,
            },
          ],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.pipeline.id'),
      ).toBe(true);
    });

    it('should reject pipeline without steps', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: 'custom',
          steps: [],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.pipeline.steps'),
      ).toBe(true);
    });

    it('should reject step without id', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: 'custom',
          steps: [
            {
              id: '',
              type: 'validate-input',
              required: true,
            },
          ],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.pipeline.steps[0].id'),
      ).toBe(true);
    });

    it('should reject step with invalid type', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: 'custom',
          steps: [
            {
              id: 'validate',
              type: 'invalid-type' as any,
              required: true,
            },
          ],
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.pipeline.steps[0].type'),
      ).toBe(true);
    });

    it('should reject pipeline with invalid onError', () => {
      const manifest: GeneratorManifest = {
        ...createValidManifest(),
        pipeline: {
          id: 'custom',
          steps: [
            {
              id: 'validate',
              type: 'validate-input',
              required: true,
            },
          ],
          onError: 'invalid-action' as any,
        },
      };

      const result = validator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.path === '$.pipeline.onError'),
      ).toBe(true);
    });
  });
});
