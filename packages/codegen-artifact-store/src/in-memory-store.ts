/**
 * In-memory implementation of artifact store
 * Useful for testing and development
 */

import { randomUUID } from 'crypto';
import type {
  IArtifactStore,
  IContentAddressableStorage,
  StoredArtifact,
  IdempotencyKey,
} from './types';
import {
  calculateContentHash,
  calculateArtifactSize,
  getIdempotencyKeyExpiration,
  isIdempotencyKeyExpired,
} from './idempotency';

/**
 * In-memory content-addressable storage
 */
export class InMemoryContentAddressableStorage implements IContentAddressableStorage {
  private store: Map<string, string> = new Map();

  async putContent(content: string): Promise<string> {
    const hash = this.calculateHash(content);
    this.store.set(hash, content);
    return hash;
  }

  async getContent(hash: string): Promise<string | null> {
    return this.store.get(hash) || null;
  }

  async hasContent(hash: string): Promise<boolean> {
    return this.store.has(hash);
  }

  async getSize(hash: string): Promise<number | null> {
    const content = this.store.get(hash);
    if (!content) return null;
    return Buffer.byteLength(content, 'utf-8');
  }

  private calculateHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

/**
 * In-memory artifact store
 */
export class InMemoryArtifactStore implements IArtifactStore {
  private artifacts: Map<string, StoredArtifact[]> = new Map();
  private idempotencyKeys: Map<string, IdempotencyKey> = new Map();
  private contentStore: InMemoryContentAddressableStorage;

  constructor() {
    this.contentStore = new InMemoryContentAddressableStorage();
  }

  async storeArtifact(
    artifact: Omit<StoredArtifact, 'id' | 'contentHash' | 'createdAt' | 'updatedAt' | 'size'>,
    idempotencyKey: string,
  ): Promise<StoredArtifact> {
    // Check if idempotency key already exists
    const existingKey = this.idempotencyKeys.get(idempotencyKey);

    if (existingKey) {
      if (existingKey.status === 'pending') {
        throw new Error('Request in progress');
      }
      if (existingKey.status === 'failed') {
        throw new Error(`Previous request failed: ${existingKey.error}`);
      }
      // Return cached result
      if (existingKey.artifactId) {
        const cached = await this.getArtifact(existingKey.artifactId);
        if (cached) return cached;
      }
    }

    // Mark as pending
    const keyId = randomUUID();
    this.idempotencyKeys.set(idempotencyKey, {
      id: keyId,
      key: idempotencyKey,
      generatorId: artifact.metadata.generatorId,
      tenantId: artifact.metadata.tenantId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: getIdempotencyKeyExpiration(),
    });

    try {
      // Generate artifact ID and version
      const artifactId = artifact.metadata.artifactId || randomUUID();
      const existingVersions = this.artifacts.get(artifactId) || [];
      const version = existingVersions.length + 1;

      // Calculate content hash
      const contentHash = calculateContentHash(artifact.files);

      // Calculate size
      const size = calculateArtifactSize(artifact.files);

      // Create stored artifact
      const now = new Date().toISOString();
      const stored: StoredArtifact = {
        id: artifactId,
        version,
        metadata: artifact.metadata,
        files: artifact.files,
        contentHash,
        createdAt: now,
        updatedAt: now,
        size,
      };

      // Store artifact
      if (!this.artifacts.has(artifactId)) {
        this.artifacts.set(artifactId, []);
      }
      this.artifacts.get(artifactId)!.push(stored);

      // Update idempotency key as completed
      this.idempotencyKeys.set(idempotencyKey, {
        id: keyId,
        key: idempotencyKey,
        generatorId: artifact.metadata.generatorId,
        tenantId: artifact.metadata.tenantId,
        status: 'completed',
        artifactId,
        createdAt: new Date().toISOString(),
        expiresAt: getIdempotencyKeyExpiration(),
      });

      return stored;
    } catch (error) {
      // Update idempotency key as failed
      this.idempotencyKeys.set(idempotencyKey, {
        id: keyId,
        key: idempotencyKey,
        generatorId: artifact.metadata.generatorId,
        tenantId: artifact.metadata.tenantId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date().toISOString(),
        expiresAt: getIdempotencyKeyExpiration(),
      });

      throw error;
    }
  }

  async getArtifact(artifactId: string): Promise<StoredArtifact | null> {
    const versions = this.artifacts.get(artifactId);
    if (!versions || versions.length === 0) return null;
    const latest = versions[versions.length - 1];
    return latest ?? null; // Return latest version
  }

  async getArtifactVersion(artifactId: string, version: number): Promise<StoredArtifact | null> {
    const versions = this.artifacts.get(artifactId);
    if (!versions) return null;
    return versions.find((a) => a.version === version) || null;
  }

  async listArtifactVersions(artifactId: string): Promise<StoredArtifact[]> {
    return this.artifacts.get(artifactId) || [];
  }

  async checkIdempotencyKey(key: string): Promise<IdempotencyKey | null> {
    const idempotencyKey = this.idempotencyKeys.get(key);
    if (!idempotencyKey) return null;

    // Check if expired
    if (isIdempotencyKeyExpired(idempotencyKey.expiresAt)) {
      this.idempotencyKeys.delete(key);
      return null;
    }

    return idempotencyKey;
  }

  async getArtifactByIdempotencyKey(key: string): Promise<StoredArtifact | null> {
    const idempotencyKey = await this.checkIdempotencyKey(key);
    if (!idempotencyKey || !idempotencyKey.artifactId) return null;
    return this.getArtifact(idempotencyKey.artifactId);
  }

  async deleteArtifact(artifactId: string): Promise<void> {
    this.artifacts.delete(artifactId);
  }

  /**
   * Get content-addressable storage instance
   */
  getContentStore(): IContentAddressableStorage {
    return this.contentStore;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.artifacts.clear();
    this.idempotencyKeys.clear();
  }

  /**
   * Get statistics (for testing)
   */
  getStats(): { artifactCount: number; versionCount: number; idempotencyKeyCount: number } {
    let versionCount = 0;
    for (const versions of this.artifacts.values()) {
      versionCount += versions.length;
    }

    return {
      artifactCount: this.artifacts.size,
      versionCount,
      idempotencyKeyCount: this.idempotencyKeys.size,
    };
  }
}
