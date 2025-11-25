/**
 * PostgreSQL implementation of artifact store metadata
 * Stores artifact metadata and idempotency keys in PostgreSQL
 */

import { Client, types } from 'pg';
import type { IArtifactStore, StoredArtifact, IdempotencyKey } from './types';
import {
  calculateContentHash,
  calculateArtifactSize,
  getIdempotencyKeyExpiration,
  isIdempotencyKeyExpired,
} from './idempotency';
import type { IContentAddressableStorage } from './types';

/**
 * PostgreSQL configuration
 */
export interface PostgreSQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * PostgreSQL artifact store
 * Uses PostgreSQL for transactional metadata and idempotency tracking
 */
export class PostgreSQLArtifactStore implements IArtifactStore {
  private client: Client;
  private contentStore: IContentAddressableStorage;
  private initialized = false;

  constructor(config: PostgreSQLConfig, contentStore: IContentAddressableStorage) {
    this.client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      // Parse JSON values as objects
      types: {
        getTypeParser(oid: number) {
          if (oid === 114 || oid === 3802) {
            // JSON/JSONB
            return (value: string) => JSON.parse(value);
          }
          return types.getTypeParser(oid);
        },
      },
    });
    this.contentStore = contentStore;
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    try {
      await this.client.connect();

      // Create artifacts table
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS artifacts (
          id TEXT PRIMARY KEY,
          version INTEGER NOT NULL,
          metadata JSONB NOT NULL,
          files JSONB NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          size INTEGER NOT NULL,
          tenant_id TEXT NOT NULL,
          generator_id TEXT NOT NULL,
          UNIQUE(id, version)
        );

        CREATE INDEX IF NOT EXISTS idx_artifacts_tenant ON artifacts(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_artifacts_generator ON artifacts(generator_id);
        CREATE INDEX IF NOT EXISTS idx_artifacts_created ON artifacts(created_at);
      `);

      // Create idempotency keys table
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
          id TEXT PRIMARY KEY,
          key VARCHAR(64) NOT NULL UNIQUE,
          generator_id TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          status VARCHAR(20) NOT NULL,
          artifact_id TEXT,
          error TEXT,
          created_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
        CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at);
        CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status ON idempotency_keys(status);
      `);

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize PostgreSQL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async storeArtifact(
    artifact: Omit<StoredArtifact, 'id' | 'contentHash' | 'createdAt' | 'updatedAt' | 'size'>,
    idempotencyKey: string,
  ): Promise<StoredArtifact> {
    if (!this.initialized) {
      throw new Error('PostgreSQL store not initialized. Call initialize() first.');
    }

    const connection = await this.client.connect().catch(() => {
      /* Already connected */
    });

    try {
      // Begin transaction
      await this.client.query('BEGIN');

      try {
        // Check if idempotency key already exists
        const existingKey = await this.getIdempotencyKeyData(idempotencyKey);

        if (existingKey) {
          await this.client.query('ROLLBACK');

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
        const keyId = artifact.metadata.artifactId || generateUUID();
        await this.client.query(
          `INSERT INTO idempotency_keys
          (id, key, generator_id, tenant_id, status, created_at, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            keyId,
            idempotencyKey,
            artifact.metadata.generatorId,
            artifact.metadata.tenantId,
            'pending',
            new Date().toISOString(),
            getIdempotencyKeyExpiration(),
          ],
        );

        try {
          // Generate artifact ID and version
          const artifactId = artifact.metadata.artifactId || generateUUID();
          const versionResult = await this.client.query(
            'SELECT MAX(version) as max_version FROM artifacts WHERE id = $1',
            [artifactId],
          );
          const version = ((versionResult.rows[0]?.max_version as number) ?? 0) + 1;

          // Calculate content hash and size
          const contentHash = calculateContentHash(artifact.files);
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
          await this.client.query(
            `INSERT INTO artifacts
            (id, version, metadata, files, content_hash, created_at, updated_at, size, tenant_id, generator_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              artifactId,
              version,
              JSON.stringify(artifact.metadata),
              JSON.stringify(artifact.files),
              contentHash,
              now,
              now,
              size,
              artifact.metadata.tenantId,
              artifact.metadata.generatorId,
            ],
          );

          // Update idempotency key as completed
          await this.client.query(
            `UPDATE idempotency_keys
            SET status = $1, artifact_id = $2
            WHERE key = $3`,
            ['completed', artifactId, idempotencyKey],
          );

          // Commit transaction
          await this.client.query('COMMIT');

          return stored;
        } catch (error) {
          // Update idempotency key as failed
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          await this.client.query(
            `UPDATE idempotency_keys
            SET status = $1, error = $2
            WHERE key = $3`,
            ['failed', errorMsg, idempotencyKey],
          );

          await this.client.query('ROLLBACK');
          throw error;
        }
      } catch (error) {
        await this.client.query('ROLLBACK').catch(() => {
          /* Ignore */
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
    if (!this.initialized) {
      throw new Error('PostgreSQL store not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.query(
        `SELECT * FROM artifacts WHERE id = $1 ORDER BY version DESC LIMIT 1`,
        [artifactId],
      );

      if (result.rows.length === 0) return null;

      return this.rowToArtifact(result.rows[0]);
    } catch (error) {
      return null;
    }
  }

  async getArtifactVersion(artifactId: string, version: number): Promise<StoredArtifact | null> {
    if (!this.initialized) {
      throw new Error('PostgreSQL store not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.query(
        `SELECT * FROM artifacts WHERE id = $1 AND version = $2`,
        [artifactId, version],
      );

      if (result.rows.length === 0) return null;

      return this.rowToArtifact(result.rows[0]);
    } catch {
      return null;
    }
  }

  async listArtifactVersions(artifactId: string): Promise<StoredArtifact[]> {
    if (!this.initialized) {
      throw new Error('PostgreSQL store not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.query(
        `SELECT * FROM artifacts WHERE id = $1 ORDER BY version ASC`,
        [artifactId],
      );

      return result.rows.map((row) => this.rowToArtifact(row));
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
        await this.client.query(`DELETE FROM idempotency_keys WHERE key = $1`, [key]);
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
    if (!this.initialized) {
      throw new Error('PostgreSQL store not initialized. Call initialize() first.');
    }

    try {
      await this.client.query(`DELETE FROM artifacts WHERE id = $1`, [artifactId]);
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

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    try {
      await this.client.end();
    } catch (error) {
      console.error('Error closing PostgreSQL connection:', error);
    }
  }

  // Helper methods

  private async getIdempotencyKeyData(key: string): Promise<IdempotencyKey | null> {
    try {
      const result = await this.client.query(
        `SELECT * FROM idempotency_keys WHERE key = $1`,
        [key],
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        key: row.key,
        generatorId: row.generator_id,
        tenantId: row.tenant_id,
        status: row.status,
        artifactId: row.artifact_id,
        error: row.error,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      };
    } catch {
      return null;
    }
  }

  private rowToArtifact(row: Record<string, any>): StoredArtifact {
    return {
      id: row.id as string,
      version: row.version as number,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : (row.metadata as unknown),
      files: typeof row.files === 'string' ? JSON.parse(row.files as string) : (row.files as unknown),
      contentHash: row.content_hash as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      size: row.size as number,
    };
  }
}

/**
 * Generate UUID (simplified)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
