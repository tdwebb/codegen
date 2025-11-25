import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryGeneratorVersionStore } from '../in-memory-version-store';
import type { GeneratorManifest, IGeneratorVersionStore } from '../types';

describe('Generator Version Store', () => {
  let store: IGeneratorVersionStore;

  beforeEach(() => {
    store = new InMemoryGeneratorVersionStore();
  });

  describe('registerVersion', () => {
    it('should register a new generator version', async () => {
      const manifest: GeneratorManifest = {
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test Generator',
        description: 'A test generator',
        compatibility: {
          fastify: '>=5.0.0 <6.0.0',
          typescript: '>=5.0.0',
        },
      };

      const version = await store.registerVersion(manifest);

      expect(version.generatorId).toBe('test-gen');
      expect(version.version).toBe('1.0.0');
      expect(version.manifest).toEqual(manifest);
      expect(version.manifestHash).toBeDefined();
      expect(version.registeredAt).toBeDefined();
      expect(version.deprecatedAt).toBeUndefined();
    });

    it('should update existing version', async () => {
      const manifest1: GeneratorManifest = {
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test Generator',
        description: 'Original',
        compatibility: {},
      };

      const manifest2: GeneratorManifest = {
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test Generator',
        description: 'Updated',
        compatibility: {},
      };

      const v1 = await store.registerVersion(manifest1);
      const v2 = await store.registerVersion(manifest2);

      expect(v2.manifest.description).toBe('Updated');
      expect(v1.manifestHash).not.toBe(v2.manifestHash);
    });

    it('should compute consistent manifest hash', async () => {
      const manifest1: GeneratorManifest = {
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: { fastify: '>=5.0.0' },
      };

      const manifest2: GeneratorManifest = {
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: { fastify: '>=5.0.0' },
      };

      const v1 = await store.registerVersion(manifest1);
      const v2 = await store.registerVersion(manifest2);

      expect(v1.manifestHash).toBe(v2.manifestHash);
    });
  });

  describe('getLatestVersion', () => {
    it('should get latest version', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '2.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      const latest = await store.getLatestVersion('test-gen');
      expect(latest?.version).toBe('2.0.0');
    });

    it('should return null for non-existent generator', async () => {
      const latest = await store.getLatestVersion('non-existent');
      expect(latest).toBeNull();
    });

    it('should exclude deprecated versions', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '2.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.deprecateVersion('test-gen', '2.0.0');

      const latest = await store.getLatestVersion('test-gen');
      expect(latest?.version).toBe('1.0.0');
    });
  });

  describe('getVersion', () => {
    it('should get specific version', async () => {
      const manifest: GeneratorManifest = {
        generatorId: 'test-gen',
        version: '1.5.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      };

      await store.registerVersion(manifest);
      const version = await store.getVersion('test-gen', '1.5.0');

      expect(version?.version).toBe('1.5.0');
    });

    it('should return null for non-existent version', async () => {
      const version = await store.getVersion('test-gen', '1.0.0');
      expect(version).toBeNull();
    });
  });

  describe('getCompatibleVersions', () => {
    it('should filter by compatibility', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {
          fastify: '>=5.0.0 <6.0.0',
          typescript: '>=5.0.0',
        },
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '2.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {
          fastify: '>=6.0.0',
          typescript: '>=5.1.0',
        },
      });

      const compatible = await store.getCompatibleVersions('test-gen', 'fastify', '5.5.0');

      expect(compatible.length).toBe(1);
      expect(compatible[0].version).toBe('1.0.0');
    });

    it('should return versions without compatibility check', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {
          fastify: '>=5.0.0',
        },
      });

      const compatible = await store.getCompatibleVersions('test-gen', 'fastify');

      expect(compatible.length).toBe(1);
      expect(compatible[0].version).toBe('1.0.0');
    });

    it('should exclude deprecated versions', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: { fastify: '>=5.0.0' },
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.5.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: { fastify: '>=5.0.0' },
      });

      await store.deprecateVersion('test-gen', '1.5.0');

      const compatible = await store.getCompatibleVersions('test-gen', 'fastify');

      expect(compatible.length).toBe(1);
      expect(compatible[0].version).toBe('1.0.0');
    });
  });

  describe('deprecateVersion', () => {
    it('should mark version as deprecated', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.deprecateVersion('test-gen', '1.0.0');

      const version = await store.getVersion('test-gen', '1.0.0');
      expect(version?.deprecatedAt).toBeDefined();
    });
  });

  describe('checkUpgrade', () => {
    it('should detect available upgrade', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '2.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      const upgrade = await store.checkUpgrade('test-gen', '1.0.0');

      expect(upgrade.currentVersion).toBe('1.0.0');
      expect(upgrade.latestVersion).toBe('2.0.0');
      expect(upgrade.isAvailable).toBe(true);
      expect(upgrade.isCompatible).toBe(true);
    });

    it('should return no upgrade available if on latest', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      const upgrade = await store.checkUpgrade('test-gen', '1.0.0');

      expect(upgrade.currentVersion).toBe('1.0.0');
      expect(upgrade.latestVersion).toBe('1.0.0');
      expect(upgrade.isAvailable).toBe(false);
    });

    it('should handle non-existent generator', async () => {
      const upgrade = await store.checkUpgrade('non-existent', '1.0.0');

      expect(upgrade.currentVersion).toBe('1.0.0');
      expect(upgrade.latestVersion).toBe('1.0.0');
      expect(upgrade.isAvailable).toBe(false);
      expect(upgrade.isCompatible).toBe(false);
    });
  });

  describe('listVersions', () => {
    it('should list all versions in reverse chronological order', async () => {
      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '2.0.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      await store.registerVersion({
        generatorId: 'test-gen',
        version: '1.5.0',
        displayName: 'Test',
        description: 'Test',
        compatibility: {},
      });

      const versions = await store.listVersions('test-gen');

      expect(versions.length).toBe(3);
      expect(versions[0].version).toBe('2.0.0');
      expect(versions[1].version).toBe('1.5.0');
      expect(versions[2].version).toBe('1.0.0');
    });

    it('should return empty array for non-existent generator', async () => {
      const versions = await store.listVersions('non-existent');
      expect(versions).toEqual([]);
    });
  });
});
