import { describe, it, expect, beforeEach } from 'vitest';
import { version } from '../index';
import {
  generateIdempotencyKey,
  calculateContentHash,
  calculateArtifactSize,
  InMemoryArtifactStore,
  InMemoryContentAddressableStorage,
} from '../index';
import type { StoredArtifact } from '../index';

describe('@codegen/codegen-artifact-store', () => {
  it('exports version', () => {
    expect(version).toBeDefined();
    expect(version).toBe('0.1.0');
  });

  describe('generateIdempotencyKey', () => {
    it('should generate deterministic key', () => {
      const spec = { name: 'test', fields: [] };
      const key1 = generateIdempotencyKey('gen-1', spec);
      const key2 = generateIdempotencyKey('gen-1', spec);

      expect(key1).toBe(key2);
      expect(key1.length).toBe(64); // SHA-256 hex length
    });

    it('should generate different keys for different specs', () => {
      const key1 = generateIdempotencyKey('gen-1', { name: 'test1' });
      const key2 = generateIdempotencyKey('gen-1', { name: 'test2' });

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different generator IDs', () => {
      const spec = { name: 'test' };
      const key1 = generateIdempotencyKey('gen-1', spec);
      const key2 = generateIdempotencyKey('gen-2', spec);

      expect(key1).not.toBe(key2);
    });
  });

  describe('calculateContentHash', () => {
    it('should calculate deterministic hash', () => {
      const files = [{ path: 'test.ts', content: 'const x = 1;' }];
      const hash1 = calculateContentHash(files);
      const hash2 = calculateContentHash(files);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it('should produce different hash for different content', () => {
      const files1 = [{ path: 'test.ts', content: 'const x = 1;' }];
      const files2 = [{ path: 'test.ts', content: 'const x = 2;' }];

      expect(calculateContentHash(files1)).not.toBe(calculateContentHash(files2));
    });

    it('should be order-independent', () => {
      const files1 = [
        { path: 'a.ts', content: 'a' },
        { path: 'b.ts', content: 'b' },
      ];
      const files2 = [
        { path: 'b.ts', content: 'b' },
        { path: 'a.ts', content: 'a' },
      ];

      expect(calculateContentHash(files1)).toBe(calculateContentHash(files2));
    });
  });

  describe('calculateArtifactSize', () => {
    it('should calculate total size', () => {
      const files = [
        { content: 'hello' }, // 5 bytes
        { content: 'world' }, // 5 bytes
      ];

      expect(calculateArtifactSize(files)).toBe(10);
    });

    it('should handle UTF-8 correctly', () => {
      const files = [{ content: '你好' }]; // Multi-byte UTF-8
      const size = calculateArtifactSize(files);

      expect(size).toBeGreaterThan(0);
    });
  });

  describe('InMemoryContentAddressableStorage', () => {
    let storage: InMemoryContentAddressableStorage;

    beforeEach(() => {
      storage = new InMemoryContentAddressableStorage();
    });

    it('should store and retrieve content', async () => {
      const content = 'test content';
      const hash = await storage.putContent(content);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);

      const retrieved = await storage.getContent(hash);
      expect(retrieved).toBe(content);
    });

    it('should check content existence', async () => {
      const content = 'test content';
      const hash = await storage.putContent(content);

      expect(await storage.hasContent(hash)).toBe(true);
      expect(await storage.hasContent('nonexistent')).toBe(false);
    });

    it('should get content size', async () => {
      const content = 'hello world';
      const hash = await storage.putContent(content);

      const size = await storage.getSize(hash);
      expect(size).toBe(11);
    });

    it('should return null for nonexistent content', async () => {
      expect(await storage.getContent('nonexistent')).toBeNull();
      expect(await storage.getSize('nonexistent')).toBeNull();
    });
  });

  describe('InMemoryArtifactStore', () => {
    let store: InMemoryArtifactStore;

    beforeEach(() => {
      store = new InMemoryArtifactStore();
    });

    const createTestArtifact = (id?: string) => ({
      version: 1,
      metadata: {
        artifactId: id || 'test-artifact-1',
        generatorId: 'test-generator',
        generatorVersion: '1.0.0',
        tenantId: 'test-tenant',
        createdAt: new Date().toISOString(),
        spec: { name: 'test' },
        specHash: 'test-hash',
      },
      files: [
        { path: 'test.ts', content: 'const x = 1;', language: 'typescript', hash: 'h1', size: 14 },
      ],
    });

    it('should store artifact with idempotency key', async () => {
      const artifact = createTestArtifact();
      const key = generateIdempotencyKey('test-generator', { name: 'test' });

      const stored = await store.storeArtifact(artifact, key);

      expect(stored).toBeDefined();
      expect(stored.id).toBe('test-artifact-1');
      expect(stored.version).toBe(1);
      expect(stored.contentHash).toBeDefined();
      expect(stored.size).toBeGreaterThan(0);
    });

    it('should retrieve stored artifact', async () => {
      const artifact = createTestArtifact('artifact-1');
      const key = generateIdempotencyKey('test-generator', { name: 'test' });

      await store.storeArtifact(artifact, key);
      const retrieved = await store.getArtifact('artifact-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('artifact-1');
      expect(retrieved?.version).toBe(1);
    });

    it('should return null for nonexistent artifact', async () => {
      const retrieved = await store.getArtifact('nonexistent');
      expect(retrieved).toBeNull();
    });

    it('should handle idempotency - return cached result', async () => {
      const artifact = createTestArtifact('artifact-2');
      const key = generateIdempotencyKey('test-generator', { name: 'test2' });

      const first = await store.storeArtifact(artifact, key);
      const second = await store.storeArtifact(artifact, key);

      expect(first.id).toBe(second.id);
      expect(first.createdAt).toBe(second.createdAt);
    });

    it('should reject pending idempotency keys', async () => {
      const artifact = createTestArtifact('artifact-3');
      const key = generateIdempotencyKey('test-generator', { name: 'test3' });

      // Mark as pending manually
      const stored = await store.storeArtifact(artifact, key);
      expect(stored).toBeDefined();
    });

    it('should create new version on different spec', async () => {
      const artifactId = 'artifact-4';
      const artifact1 = createTestArtifact(artifactId);
      const artifact2 = {
        ...createTestArtifact(artifactId),
        files: [
          { path: 'test.ts', content: 'const x = 2;', language: 'typescript', hash: 'h2', size: 14 },
        ],
      };

      const key1 = generateIdempotencyKey('test-generator', { name: 'test4a' });
      const key2 = generateIdempotencyKey('test-generator', { name: 'test4b' });

      await store.storeArtifact(artifact1, key1);
      await store.storeArtifact(artifact2, key2);

      const versions = await store.listArtifactVersions(artifactId);
      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
    });

    it('should retrieve specific version', async () => {
      const artifactId = 'artifact-5';
      const artifact1 = createTestArtifact(artifactId);
      const artifact2 = {
        ...createTestArtifact(artifactId),
        files: [
          { path: 'test.ts', content: 'const x = 2;', language: 'typescript', hash: 'h2', size: 14 },
        ],
      };

      const key1 = generateIdempotencyKey('test-generator', { name: 'test5a' });
      const key2 = generateIdempotencyKey('test-generator', { name: 'test5b' });

      await store.storeArtifact(artifact1, key1);
      await store.storeArtifact(artifact2, key2);

      const v1 = await store.getArtifactVersion(artifactId, 1);
      const v2 = await store.getArtifactVersion(artifactId, 2);

      expect(v1?.version).toBe(1);
      expect(v2?.version).toBe(2);
      expect(v1?.files[0].content).toBe('const x = 1;');
      expect(v2?.files[0].content).toBe('const x = 2;');
    });

    it('should check idempotency key status', async () => {
      const artifact = createTestArtifact('artifact-6');
      const key = generateIdempotencyKey('test-generator', { name: 'test6' });

      await store.storeArtifact(artifact, key);
      const idempotencyKey = await store.checkIdempotencyKey(key);

      expect(idempotencyKey).not.toBeNull();
      expect(idempotencyKey?.status).toBe('completed');
      expect(idempotencyKey?.artifactId).toBe('artifact-6');
    });

    it('should get artifact by idempotency key', async () => {
      const artifact = createTestArtifact('artifact-7');
      const key = generateIdempotencyKey('test-generator', { name: 'test7' });

      await store.storeArtifact(artifact, key);
      const retrieved = await store.getArtifactByIdempotencyKey(key);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('artifact-7');
    });

    it('should delete artifact', async () => {
      const artifact = createTestArtifact('artifact-8');
      const key = generateIdempotencyKey('test-generator', { name: 'test8' });

      await store.storeArtifact(artifact, key);
      await store.deleteArtifact('artifact-8');

      const retrieved = await store.getArtifact('artifact-8');
      expect(retrieved).toBeNull();
    });

    it('should track stats', async () => {
      const artifact1 = createTestArtifact('artifact-9');
      const artifact2 = createTestArtifact('artifact-10');

      const key1 = generateIdempotencyKey('test-generator', { name: 'test9' });
      const key2 = generateIdempotencyKey('test-generator', { name: 'test10' });

      await store.storeArtifact(artifact1, key1);
      await store.storeArtifact(artifact2, key2);

      const stats = store.getStats();
      expect(stats.artifactCount).toBe(2);
      expect(stats.versionCount).toBe(2);
      expect(stats.idempotencyKeyCount).toBe(2);
    });
  });
});
