/**
 * MinIO implementation of artifact store and content-addressable storage
 * Uses S3-compatible object storage for scalable artifact storage
 */

import * as Minio from 'minio';
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
 * MinIO configuration
 */
export interface MinIOConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
}

/**
 * MinIO content-addressable storage
 */
export class MinIOContentAddressableStorage implements IContentAddressableStorage {
  private client: Minio.Client;
  private bucket: string;

  constructor(config: MinIOConfig, bucket: string = 'codegen-artifacts') {
    const clientConfig: Record<string, unknown> = {
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    };

    if (config.region) {
      clientConfig.region = config.region;
    }

    this.client = new Minio.Client(clientConfig as unknown as Minio.ClientOptions);
    this.bucket = bucket;
  }

  async putContent(content: string): Promise<string> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    try {
      // Check if content already exists
      const exists = await this.hasContent(hash);
      if (exists) {
        return hash;
      }

      // Store content with hash as key
      const objectName = `content/${hash}`;
      const buffer = Buffer.from(content, 'utf-8');

      await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
        'Content-Type': 'application/octet-stream',
      });

      return hash;
    } catch (error) {
      throw new Error(
        `Failed to store content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getContent(hash: string): Promise<string | null> {
    try {
      const objectName = `content/${hash}`;

      // Check if object exists
      const exists = await this.hasContent(hash);
      if (!exists) {
        return null;
      }

      // Retrieve content
      const chunks: Buffer[] = [];
      const stream = await this.client.getObject(this.bucket, objectName);

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString('utf-8'));
        });

        stream.on('error', (error: unknown) => {
          reject(error);
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('The specified key does not exist')) {
        return null;
      }
      throw new Error(
        `Failed to retrieve content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async hasContent(hash: string): Promise<boolean> {
    try {
      const objectName = `content/${hash}`;
      await this.client.statObject(this.bucket, objectName);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        return false;
      }
      return false;
    }
  }

  async getSize(hash: string): Promise<number | null> {
    try {
      const objectName = `content/${hash}`;
      const stat = await this.client.statObject(this.bucket, objectName);
      return stat.size;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        return null;
      }
      return null;
    }
  }
}

/**
 * MinIO artifact store
 * Stores artifact metadata in MinIO as JSON
 * Stores files as content-addressable objects
 */
export class MinIOArtifactStore implements IArtifactStore {
  private client: Minio.Client;
  private bucket: string;
  private contentStore: MinIOContentAddressableStorage;

  constructor(config: MinIOConfig, bucket: string = 'codegen-artifacts') {
    const clientConfig: Record<string, unknown> = {
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    };

    if (config.region) {
      clientConfig.region = config.region;
    }

    this.client = new Minio.Client(clientConfig as unknown as Minio.ClientOptions);
    this.bucket = bucket;
    this.contentStore = new MinIOContentAddressableStorage(config, bucket);
  }

  async storeArtifact(
    artifact: Omit<StoredArtifact, 'id' | 'contentHash' | 'createdAt' | 'updatedAt' | 'size'>,
    idempotencyKey: string,
  ): Promise<StoredArtifact> {
    try {
      // Check if idempotency key already exists
      const existingKey = await this.getIdempotencyKeyData(idempotencyKey);

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
      await this.storeIdempotencyKeyData(idempotencyKey, {
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
        const existingVersions = await this.listArtifactVersions(artifactId);
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

        // Store artifact metadata
        await this.storeArtifactData(artifactId, version, stored);

        // Store files
        for (const file of artifact.files) {
          await this.contentStore.putContent(file.content);
        }

        // Update idempotency key as completed
        await this.storeIdempotencyKeyData(idempotencyKey, {
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
        await this.storeIdempotencyKeyData(idempotencyKey, {
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
    } catch (error) {
      throw new Error(
        `Failed to store artifact: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getArtifact(artifactId: string): Promise<StoredArtifact | null> {
    try {
      const versions = await this.listArtifactVersions(artifactId);
      if (versions.length === 0) return null;
      const latest = versions[versions.length - 1];
      return latest ?? null; // Return latest version
    } catch {
      return null;
    }
  }

  async getArtifactVersion(artifactId: string, version: number): Promise<StoredArtifact | null> {
    try {
      const objectName = `artifacts/${artifactId}/v${version}.json`;
      const content = await this.getObjectAsString(objectName);
      if (!content) return null;
      return JSON.parse(content) as StoredArtifact;
    } catch {
      return null;
    }
  }

  async listArtifactVersions(artifactId: string): Promise<StoredArtifact[]> {
    try {
      const versions: StoredArtifact[] = [];
      const objectList = this.client.listObjects(
        this.bucket,
        `artifacts/${artifactId}/`,
        false,
      );

      for await (const obj of objectList) {
        if (obj.name.endsWith('.json')) {
          const content = await this.getObjectAsString(obj.name);
          if (content) {
            versions.push(JSON.parse(content) as StoredArtifact);
          }
        }
      }

      // Sort by version
      return versions.sort((a, b) => a.version - b.version);
    } catch {
      return [];
    }
  }

  async checkIdempotencyKey(key: string): Promise<IdempotencyKey | null> {
    try {
      const idempotencyKey = await this.getIdempotencyKeyData(key);
      if (!idempotencyKey) return null;

      // Check if expired
      if (isIdempotencyKeyExpired(idempotencyKey.expiresAt)) {
        await this.deleteObject(`idempotency/${key}.json`);
        return null;
      }

      return idempotencyKey;
    } catch {
      return null;
    }
  }

  async getArtifactByIdempotencyKey(key: string): Promise<StoredArtifact | null> {
    try {
      const idempotencyKey = await this.checkIdempotencyKey(key);
      if (!idempotencyKey || !idempotencyKey.artifactId) return null;
      return this.getArtifact(idempotencyKey.artifactId);
    } catch {
      return null;
    }
  }

  async deleteArtifact(artifactId: string): Promise<void> {
    try {
      // Delete all versions
      const versions = await this.listArtifactVersions(artifactId);
      for (const version of versions) {
        await this.deleteObject(`artifacts/${artifactId}/v${version.version}.json`);
      }
    } catch (error) {
      throw new Error(
        `Failed to delete artifact: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get content-addressable storage instance
   */
  getContentStore(): IContentAddressableStorage {
    return this.contentStore;
  }

  // Helper methods

  private async storeArtifactData(
    artifactId: string,
    version: number,
    artifact: StoredArtifact,
  ): Promise<void> {
    const objectName = `artifacts/${artifactId}/v${version}.json`;
    const content = JSON.stringify(artifact);
    const buffer = Buffer.from(content, 'utf-8');

    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': 'application/json',
    });
  }

  private async storeIdempotencyKeyData(key: string, data: IdempotencyKey): Promise<void> {
    const objectName = `idempotency/${key}.json`;
    const content = JSON.stringify(data);
    const buffer = Buffer.from(content, 'utf-8');

    await this.client.putObject(this.bucket, objectName, buffer, buffer.length, {
      'Content-Type': 'application/json',
    });
  }

  private async getIdempotencyKeyData(key: string): Promise<IdempotencyKey | null> {
    try {
      const objectName = `idempotency/${key}.json`;
      const content = await this.getObjectAsString(objectName);
      if (!content) return null;
      return JSON.parse(content) as IdempotencyKey;
    } catch {
      return null;
    }
  }

  private async getObjectAsString(objectName: string): Promise<string | null> {
    try {
      const chunks: Buffer[] = [];
      const stream = await this.client.getObject(this.bucket, objectName);

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString('utf-8'));
        });

        stream.on('error', (error: unknown) => {
          reject(error);
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        return null;
      }
      throw error;
    }
  }

  private async deleteObject(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch {
      // Ignore deletion errors
    }
  }

  /**
   * Initialize bucket (create if not exists)
   */
  async initializeBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, '');
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize bucket: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
