import { describe, it, expect, beforeEach } from 'vitest';
import { version, ProvenanceTracker, createStepRecord } from '../index';
import type { GeneratorVersion, HelperVersion, TemplateInfo } from '../index';

describe('@codegen/codegen-provenance', () => {
  it('exports version', () => {
    expect(version).toBeDefined();
    expect(version).toBe('0.1.0');
  });

  describe('ProvenanceTracker', () => {
    let tracker: ProvenanceTracker;

    beforeEach(() => {
      tracker = new ProvenanceTracker();
    });

    it('should initialize without tracking', () => {
      expect(tracker.getCurrent()).toBeNull();
    });

    it('should record generator version', () => {
      const genVersion: GeneratorVersion = {
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test Generator',
        description: 'A test generator',
      };

      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion(genVersion);

      const current = tracker.getCurrent();
      expect(current).not.toBeNull();
      expect(current?.generatorVersion).toEqual(genVersion);
    });

    it('should record helper versions', () => {
      const helpers: HelperVersion[] = [
        {
          name: 'case-helpers',
          version: '1.0.0',
          helpers: ['pascalcase', 'camelcase'],
        },
      ];

      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion({
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test',
        description: 'Test',
      });
      tracker.recordHelperVersions(helpers);

      const current = tracker.getCurrent();
      expect(current?.helperVersions).toEqual(helpers);
    });

    it('should record template info', () => {
      const templates: TemplateInfo[] = [
        {
          path: 'test.hbs',
          hash: 'abc123',
          isDeterministic: true,
        },
      ];

      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion({
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test',
        description: 'Test',
      });
      tracker.recordTemplateInfo(templates);

      const current = tracker.getCurrent();
      expect(current?.templateInfos).toEqual(templates);
    });

    it('should record pipeline steps', () => {
      const step = createStepRecord(
        'validate-input',
        'success',
        new Date().toISOString(),
        new Date().toISOString(),
        { test: 'input' },
        { validated: true },
      );

      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion({
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test',
        description: 'Test',
      });
      tracker.recordStep(step);

      const current = tracker.getCurrent();
      expect(current?.pipelineSteps.length).toBe(1);
      expect(current?.pipelineSteps[0].name).toBe('validate-input');
    });

    it('should include environment info', () => {
      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion({
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test',
        description: 'Test',
      });

      const current = tracker.getCurrent();
      expect(current?.environment).toBeDefined();
      expect(current?.environment.nodeVersion).toBe(process.version);
      expect(current?.environment.platform).toBe(process.platform);
      expect(current?.environment.arch).toBe(process.arch);
      expect(current?.environment.timezone).toBeDefined();
    });

    it('should finalize provenance record', () => {
      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion({
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test',
        description: 'Test',
      });

      const record = tracker.finalize();
      expect(record.artifactId).toBe('artifact-1');
      expect(record.specHash).toBe('spec-hash-123');
      expect(record.createdAt).toBeDefined();
    });

    it('should throw when finalizing without required data', () => {
      expect(() => tracker.finalize()).toThrow('Cannot finalize provenance without required tracking data');
    });

    it('should reset tracker', () => {
      tracker.startTracking('artifact-1', 'spec-hash-123');
      tracker.recordGeneratorVersion({
        generatorId: 'test-gen',
        generatorVersion: '1.0.0',
        displayName: 'Test',
        description: 'Test',
      });

      tracker.reset();
      expect(tracker.getCurrent()).toBeNull();
    });
  });

  describe('createStepRecord', () => {
    it('should create step record with duration', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 1000);

      const step = createStepRecord(
        'test-step',
        'success',
        start.toISOString(),
        end.toISOString(),
        { input: 'test' },
        { output: 'result' },
      );

      expect(step.name).toBe('test-step');
      expect(step.status).toBe('success');
      expect(step.duration).toBe(1000);
      expect(step.input).toEqual({ input: 'test' });
      expect(step.output).toEqual({ output: 'result' });
    });

    it('should handle failed step with error', () => {
      const start = new Date().toISOString();
      const end = new Date().toISOString();

      const step = createStepRecord(
        'test-step',
        'failed',
        start,
        end,
        undefined,
        undefined,
        'Test error',
      );

      expect(step.status).toBe('failed');
      expect(step.error).toBe('Test error');
    });

    it('should handle zero duration', () => {
      const time = new Date().toISOString();
      const step = createStepRecord('test-step', 'success', time, time);

      expect(step.duration).toBe(0);
    });
  });
});
