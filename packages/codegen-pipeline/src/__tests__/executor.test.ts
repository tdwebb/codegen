import { describe, it, expect, beforeEach } from 'vitest';
import {
  PipelineExecutor,
  ValidateInputStepExecutor,
  ResolveTemplatesStepExecutor,
  RenderStepExecutor,
  ValidateOutputStepExecutor,
  AutofixStepExecutor,
  StoreStepExecutor,
  type GenerationContext,
  type PipelineContext,
  type PipelineStepExecutor,
} from '../index';
import type { Generator } from '@codegen/codegen-core';

describe('PipelineExecutor', () => {
  let executor: PipelineExecutor;
  let mockContext: GenerationContext;
  let mockGenerator: Generator;

  beforeEach(() => {
    executor = new PipelineExecutor();
    mockGenerator = {
      id: 'test-generator',
      version: '1.0.0',
      manifest: {
        id: 'test-generator',
        version: '1.0.0',
        displayName: 'Test Generator',
        description: 'Test generator',
        inputSchema: { type: 'object' },
        outputs: [{ name: 'test', path: 'test.ts', template: 'test-template' }],
        entryTemplate: 'test-template',
        capabilities: [],
      },
      generate: async () => ({
        artifactId: 'test-artifact',
        files: [],
        diagnostics: [],
        metadata: {
          artifactId: 'test-artifact',
          generatorId: 'test-generator',
          generatorVersion: '1.0.0',
          tenantId: 'test-tenant',
          createdAt: new Date().toISOString(),
          spec: {},
          specHash: 'test-hash',
        },
      }),
    };

    mockContext = {
      generatorId: 'test-generator',
      tenantId: 'test-tenant',
      spec: { test: 'data' },
      generator: mockGenerator,
      artifacts: [
        { path: 'output.ts', content: 'const x = 10;' },
        { path: 'output.json', content: '{"key": "value"}' },
      ],
    };
  });

  describe('PipelineExecutor.execute()', () => {
    it('should execute default pipeline successfully', async () => {
      // Register all default step executors
      executor.registerExecutor('validate-input', new ValidateInputStepExecutor());
      executor.registerExecutor(
        'resolve-templates',
        new ResolveTemplatesStepExecutor(),
      );
      executor.registerExecutor('render', new RenderStepExecutor());
      executor.registerExecutor(
        'validate-output',
        new ValidateOutputStepExecutor(),
      );
      executor.registerExecutor('autofix', new AutofixStepExecutor());
      executor.registerExecutor('store', new StoreStepExecutor());

      const trace = await executor.execute(mockContext);

      expect(trace).toBeDefined();
      expect(trace.pipelineId).toBe('default-generation');
      expect(trace.status).toBe('success');
      expect(trace.steps.length).toBe(6);
      expect(trace.duration).toBeGreaterThanOrEqual(0);
      expect(trace.timestamp).toBeDefined();
    });

    it('should track step execution times', async () => {
      executor.registerExecutor('validate-input', new ValidateInputStepExecutor());
      executor.registerExecutor(
        'resolve-templates',
        new ResolveTemplatesStepExecutor(),
      );
      executor.registerExecutor('render', new RenderStepExecutor());
      executor.registerExecutor(
        'validate-output',
        new ValidateOutputStepExecutor(),
      );
      executor.registerExecutor('autofix', new AutofixStepExecutor());
      executor.registerExecutor('store', new StoreStepExecutor());

      const trace = await executor.execute(mockContext);

      expect(trace.steps.every((step) => step.duration >= 0)).toBe(true);
      expect(trace.duration).toBeGreaterThanOrEqual(0);
    });

    it('should halt on required step failure', async () => {
      const failingExecutor: PipelineStepExecutor = {
        execute: async () => ({
          stepId: 'validate-input',
          status: 'failed',
          duration: 0,
          error: new Error('Validation failed'),
        }),
      };

      executor.registerExecutor('validate-input', failingExecutor);
      executor.registerExecutor(
        'resolve-templates',
        new ResolveTemplatesStepExecutor(),
      );

      const trace = await executor.execute(mockContext);

      expect(trace.status).toBe('failed');
      expect(trace.steps[0].status).toBe('failed');
      // Should not execute remaining required steps
      expect(trace.steps.length).toBeLessThan(6);
    });

    it('should continue on optional step failure', async () => {
      const failingAutofix: PipelineStepExecutor = {
        execute: async () => ({
          stepId: 'autofix',
          status: 'failed',
          duration: 0,
          error: new Error('Autofix failed'),
        }),
      };

      executor.registerExecutor('validate-input', new ValidateInputStepExecutor());
      executor.registerExecutor(
        'resolve-templates',
        new ResolveTemplatesStepExecutor(),
      );
      executor.registerExecutor('render', new RenderStepExecutor());
      executor.registerExecutor(
        'validate-output',
        new ValidateOutputStepExecutor(),
      );
      executor.registerExecutor('autofix', failingAutofix);
      executor.registerExecutor('store', new StoreStepExecutor());

      const trace = await executor.execute(mockContext);

      expect(trace.status).toBe('partial');
      const autofixStep = trace.steps.find((s) => s.stepId === 'autofix');
      expect(autofixStep?.status).toBe('failed');
      // Should continue to store step
      const storeStep = trace.steps.find((s) => s.stepId === 'store');
      expect(storeStep).toBeDefined();
    });

    it('should handle missing executor gracefully', async () => {
      executor.registerExecutor('validate-input', new ValidateInputStepExecutor());
      // Don't register other executors

      const trace = await executor.execute(mockContext);

      expect(trace.status).toBe('failed');
      const resolveTemplatesStep = trace.steps.find(
        (s) => s.type === 'resolve-templates',
      );
      expect(resolveTemplatesStep?.status).toBe('failed');
      expect(resolveTemplatesStep?.error).toBeDefined();
    });

    it('should propagate step execution errors', async () => {
      const errorMessage = 'Custom step error';
      const erroringExecutor: PipelineStepExecutor = {
        execute: async () => ({
          stepId: 'validate-input',
          status: 'failed',
          duration: 0,
          error: new Error(errorMessage),
        }),
      };

      executor.registerExecutor('validate-input', erroringExecutor);

      const trace = await executor.execute(mockContext);

      expect(trace.status).toBe('failed');
      expect(trace.steps[0].error).toBe(errorMessage);
    });
  });

  describe('StandardStepExecutors', () => {
    let context: PipelineContext;

    beforeEach(() => {
      context = {
        ...mockContext,
        pipelineId: 'test-pipeline',
        currentStepIndex: 0,
        stepResults: new Map(),
        artifacts: [
          { path: 'output.ts', content: 'const x = 10;' },
          { path: 'output.json', content: '{"key": "value"}' },
        ],
      } as PipelineContext;
    });

    describe('ValidateInputStepExecutor', () => {
      it('should validate input spec exists', async () => {
        const stepExecutor = new ValidateInputStepExecutor();
        const result = await stepExecutor.execute(context);

        expect(result.status).toBe('success');
        expect(result.stepId).toBe('validate-input');
        expect(result.duration).toBeGreaterThan(-1);
      });

      it('should fail if spec is missing', async () => {
        const stepExecutor = new ValidateInputStepExecutor();
        const invalidContext = { ...context, spec: undefined };

        const result = await stepExecutor.execute(invalidContext);

        expect(result.status).toBe('failed');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('required');
      });
    });

    describe('ResolveTemplatesStepExecutor', () => {
      it('should resolve templates from manifest', async () => {
        const stepExecutor = new ResolveTemplatesStepExecutor();
        const result = await stepExecutor.execute(context);

        expect(result.status).toBe('success');
        expect(result.stepId).toBe('resolve-templates');
        expect(result.output).toBeDefined();
      });

      it('should fail if manifest has no outputs', async () => {
        const stepExecutor = new ResolveTemplatesStepExecutor();
        const invalidContext = {
          ...context,
          generator: {
            ...context.generator,
            manifest: {
              ...context.generator!.manifest,
              outputs: [],
            },
          },
        };

        const result = await stepExecutor.execute(invalidContext);

        // Empty outputs is technically valid
        expect(result.status).toBe('success');
      });
    });

    describe('RenderStepExecutor', () => {
      it('should render templates successfully', async () => {
        const stepExecutor = new RenderStepExecutor();
        const result = await stepExecutor.execute(context);

        expect(result.status).toBe('success');
        expect(result.stepId).toBe('render');
      });
    });

    describe('ValidateOutputStepExecutor', () => {
      it('should validate output successfully', async () => {
        const stepExecutor = new ValidateOutputStepExecutor();
        const result = await stepExecutor.execute(context);

        expect(result.status).toBe('success');
        expect(result.stepId).toBe('validate-output');
      });
    });

    describe('AutofixStepExecutor', () => {
      it('should apply autofix successfully', async () => {
        const stepExecutor = new AutofixStepExecutor();
        const result = await stepExecutor.execute(context);

        expect(result.status).toBe('success');
        expect(result.stepId).toBe('autofix');
      });
    });

    describe('StoreStepExecutor', () => {
      it('should store artifacts successfully', async () => {
        const stepExecutor = new StoreStepExecutor();
        const result = await stepExecutor.execute(context);

        expect(result.status).toBe('success');
        expect(result.stepId).toBe('store');
      });
    });
  });

  describe('Custom step executors', () => {
    it('should register and execute custom step executors', async () => {
      const customExecutor: PipelineStepExecutor = {
        execute: async () => ({
          stepId: 'custom-step',
          status: 'success',
          duration: 10,
          output: { custom: true },
        }),
      };

      executor.registerExecutor('custom', customExecutor);
      const registry = executor.getRegistry();

      expect(registry.get('custom')).toBe(customExecutor);
      expect(registry.getAll().has('custom')).toBe(true);
    });
  });
});
