import { describe, it, expect, beforeEach } from 'vitest';
import {
  GeneratorManager,
  type Generator,
  type GeneratorManifest,
  type GenerationResult,
  type GenerateOptions,
} from '../index';

// Mock generator for testing
function createMockGenerator(
  id: string,
  version: string,
): Generator {
  const manifest: GeneratorManifest = {
    id,
    version,
    displayName: `Test Generator ${id}`,
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
  };

  return {
    id,
    version,
    manifest,
    async generate(
      _spec: unknown,
      _options: GenerateOptions,
    ): Promise<GenerationResult> {
      return {
        artifactId: 'test-artifact',
        files: [
          {
            path: 'test.ts',
            content: 'console.log("test");',
            hash: 'abc123',
            size: 23,
          },
        ],
        diagnostics: [],
        metadata: {
          artifactId: 'test-artifact',
          generatorId: id,
          generatorVersion: version,
          tenantId: 'test-tenant',
          createdAt: new Date().toISOString(),
          spec: _spec,
          specHash: 'spec-hash',
        },
      };
    },
  };
}

describe('GeneratorManager', () => {
  let manager: GeneratorManager;

  beforeEach(() => {
    manager = new GeneratorManager();
  });

  describe('register', () => {
    it('should register a generator', () => {
      const gen = createMockGenerator('test-gen', '1.0.0');
      manager.register(gen);

      const retrieved = manager.get('test-gen');
      expect(retrieved).toBeDefined();
      expect(retrieved?.version).toBe('1.0.0');
    });

    it('should throw when registering duplicate version', () => {
      const gen = createMockGenerator('test-gen', '1.0.0');
      manager.register(gen);

      expect(() => manager.register(gen)).toThrow(
        'is already registered',
      );
    });

    it('should allow multiple versions of same generator', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      expect(manager.get('test-gen', '1.0.0')).toBeDefined();
      expect(manager.get('test-gen', '2.0.0')).toBeDefined();
    });

    it('should return latest version when version not specified', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      const retrieved = manager.get('test-gen');
      expect(retrieved?.version).toBe('2.0.0');
    });
  });

  describe('unregister', () => {
    it('should unregister a specific version', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      manager.unregister('test-gen', '1.0.0');

      expect(manager.get('test-gen', '1.0.0')).toBeUndefined();
      expect(manager.get('test-gen', '2.0.0')).toBeDefined();
    });

    it('should unregister all versions when version not specified', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      manager.unregister('test-gen');

      expect(manager.get('test-gen')).toBeUndefined();
    });

    it('should not throw when unregistering non-existent generator', () => {
      expect(() => manager.unregister('non-existent')).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent generator', () => {
      expect(manager.get('non-existent')).toBeUndefined();
    });

    it('should return generator with specific version', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      const retrieved = manager.get('test-gen', '1.0.0');
      expect(retrieved?.version).toBe('1.0.0');
    });

    it('should return latest version when version not specified', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      const retrieved = manager.get('test-gen');
      expect(retrieved?.version).toBe('2.0.0');
    });
  });

  describe('list', () => {
    it('should return empty list when no generators registered', () => {
      expect(manager.list()).toEqual([]);
    });

    it('should return all registered generators', () => {
      const gen1 = createMockGenerator('gen1', '1.0.0');
      const gen2 = createMockGenerator('gen2', '1.0.0');

      manager.register(gen1);
      manager.register(gen2);

      const list = manager.list();
      expect(list).toHaveLength(2);
    });

    it('should include all versions of same generator', () => {
      const gen1 = createMockGenerator('test-gen', '1.0.0');
      const gen2 = createMockGenerator('test-gen', '2.0.0');

      manager.register(gen1);
      manager.register(gen2);

      const list = manager.list();
      expect(list).toHaveLength(2);
    });

    it('should filter by capability', () => {
      const gen1 = createMockGenerator('gen1', '1.0.0');
      const gen2 = createMockGenerator('gen2', '1.0.0');
      // gen2 only has 'single-file' capability, gen1 has both

      manager.register(gen1);
      manager.register(gen2);

      const filtered = manager.list({ capabilities: ['templating'] });
      expect(filtered).toHaveLength(2); // Both have templating
    });
  });

  describe('listSummaries', () => {
    it('should return generator summaries', () => {
      const gen = createMockGenerator('test-gen', '1.0.0');
      manager.register(gen);

      const summaries = manager.listSummaries();
      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toEqual({
        id: 'test-gen',
        version: '1.0.0',
        displayName: 'Test Generator test-gen',
        description: 'A test generator',
        capabilities: ['single-file', 'templating'],
      });
    });
  });

  describe('events', () => {
    it('should emit event on registration', () => {
      const events: any[] = [];
      manager.on((event) => events.push(event));

      const gen = createMockGenerator('test-gen', '1.0.0');
      manager.register(gen);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('generator-registered');
      expect(events[0].generatorId).toBe('test-gen');
      expect(events[0].generatorVersion).toBe('1.0.0');
    });

    it('should emit event on unregistration', () => {
      const events: any[] = [];
      manager.on((event) => events.push(event));

      const gen = createMockGenerator('test-gen', '1.0.0');
      manager.register(gen);
      events.length = 0; // Clear registration event

      manager.unregister('test-gen', '1.0.0');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('generator-unregistered');
      expect(events[0].generatorId).toBe('test-gen');
    });

    it('should allow unsubscribing from events', () => {
      const events: any[] = [];
      const unsubscribe = manager.on((event) => events.push(event));

      const gen = createMockGenerator('test-gen', '1.0.0');
      manager.register(gen);

      unsubscribe();
      manager.unregister('test-gen');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('generator-registered');
    });

    it('should handle errors in event listeners', () => {
      manager.on(() => {
        throw new Error('Listener error');
      });

      manager.on((event) => {
        expect(event.type).toBe('generator-registered');
      });

      const gen = createMockGenerator('test-gen', '1.0.0');
      // Should not throw despite first listener throwing
      expect(() => manager.register(gen)).not.toThrow();
    });
  });
});
