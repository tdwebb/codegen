/**
 * PostgreSQL implementation of generator version store
 * Tracks generator versions, compatibility, and manifest hashes
 */

import { Client, types } from 'pg';
import type { IGeneratorVersionStore, GeneratorManifest, GeneratorVersion, UpgradeInfo } from './types';
import { calculateManifestHash } from './idempotency';
import { compareVersions, getLatestVersion, versionSatisfies } from './versioning';

/**
 * PostgreSQL version store configuration (reuses artifact store config)
 */
export interface PostgreSQLVersionStoreConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * PostgreSQL generator version store
 */
export class PostgreSQLGeneratorVersionStore implements IGeneratorVersionStore {
  private client: Client;
  private initialized = false;

  constructor(config: PostgreSQLVersionStoreConfig) {
    this.client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
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
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.client.connect();

    // Create generator_versions table
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS generator_versions (
        generator_id TEXT NOT NULL,
        version TEXT NOT NULL,
        manifest JSONB NOT NULL,
        manifest_hash TEXT NOT NULL,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deprecated_at TIMESTAMPTZ,
        PRIMARY KEY (generator_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_generator_versions_hash ON generator_versions(manifest_hash);
      CREATE INDEX IF NOT EXISTS idx_generator_versions_deprecated ON generator_versions(deprecated_at);
      CREATE INDEX IF NOT EXISTS idx_generator_versions_registered ON generator_versions(generator_id, registered_at DESC);
    `);

    this.initialized = true;
  }

  /**
   * Register a new generator version
   */
  async registerVersion(manifest: GeneratorManifest): Promise<GeneratorVersion> {
    await this.ensureInitialized();

    const manifestHash = calculateManifestHash(manifest);
    const now = new Date().toISOString();

    const result = await this.client.query(
      `
      INSERT INTO generator_versions (generator_id, version, manifest, manifest_hash, registered_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (generator_id, version) DO UPDATE
      SET manifest = EXCLUDED.manifest,
          manifest_hash = EXCLUDED.manifest_hash,
          registered_at = EXCLUDED.registered_at
      RETURNING generator_id, version, manifest, manifest_hash, registered_at, deprecated_at;
      `,
      [manifest.generatorId, manifest.version, JSON.stringify(manifest), manifestHash, now],
    );

    const row = result.rows[0];
    return {
      generatorId: row.generator_id,
      version: row.version,
      manifest: row.manifest,
      manifestHash: row.manifest_hash,
      registeredAt: row.registered_at,
      deprecatedAt: row.deprecated_at,
    };
  }

  /**
   * Get latest version for a generator
   */
  async getLatestVersion(generatorId: string): Promise<GeneratorVersion | null> {
    await this.ensureInitialized();

    const result = await this.client.query(
      `
      SELECT generator_id, version, manifest, manifest_hash, registered_at, deprecated_at
      FROM generator_versions
      WHERE generator_id = $1 AND deprecated_at IS NULL
      ORDER BY registered_at DESC
      LIMIT 1;
      `,
      [generatorId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      generatorId: row.generator_id,
      version: row.version,
      manifest: row.manifest,
      manifestHash: row.manifest_hash,
      registeredAt: row.registered_at,
      deprecatedAt: row.deprecated_at,
    };
  }

  /**
   * Get specific version
   */
  async getVersion(generatorId: string, version: string): Promise<GeneratorVersion | null> {
    await this.ensureInitialized();

    const result = await this.client.query(
      `
      SELECT generator_id, version, manifest, manifest_hash, registered_at, deprecated_at
      FROM generator_versions
      WHERE generator_id = $1 AND version = $2;
      `,
      [generatorId, version],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      generatorId: row.generator_id,
      version: row.version,
      manifest: row.manifest,
      manifestHash: row.manifest_hash,
      registeredAt: row.registered_at,
      deprecatedAt: row.deprecated_at,
    };
  }

  /**
   * Get compatible versions for a target runtime
   */
  async getCompatibleVersions(
    generatorId: string,
    targetRuntime: string,
    targetVersion?: string,
  ): Promise<GeneratorVersion[]> {
    await this.ensureInitialized();

    const result = await this.client.query(
      `
      SELECT generator_id, version, manifest, manifest_hash, registered_at, deprecated_at
      FROM generator_versions
      WHERE generator_id = $1 AND deprecated_at IS NULL
      ORDER BY registered_at DESC;
      `,
      [generatorId],
    );

    return result.rows
      .map((row) => ({
        generatorId: row.generator_id,
        version: row.version,
        manifest: row.manifest,
        manifestHash: row.manifest_hash,
        registeredAt: row.registered_at,
        deprecatedAt: row.deprecated_at,
      }))
      .filter((v) => {
        const compatibility = v.manifest.compatibility;
        if (!compatibility || !compatibility[targetRuntime]) {
          return false;
        }

        if (!targetVersion) {
          return true;
        }

        return versionSatisfies(targetVersion, compatibility[targetRuntime]);
      });
  }

  /**
   * Mark version as deprecated
   */
  async deprecateVersion(generatorId: string, version: string): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();

    await this.client.query(
      `
      UPDATE generator_versions
      SET deprecated_at = $1
      WHERE generator_id = $2 AND version = $3;
      `,
      [now, generatorId, version],
    );
  }

  /**
   * Check upgrade availability
   */
  async checkUpgrade(generatorId: string, currentVersion: string): Promise<UpgradeInfo> {
    await this.ensureInitialized();

    const result = await this.client.query(
      `
      SELECT version FROM generator_versions
      WHERE generator_id = $1 AND deprecated_at IS NULL
      ORDER BY registered_at DESC;
      `,
      [generatorId],
    );

    const versions = result.rows.map((row) => row.version);

    if (versions.length === 0) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        isAvailable: false,
        isCompatible: false,
      };
    }

    const latestVersion = getLatestVersion(versions);
    const isAvailable = compareVersions(latestVersion, currentVersion) > 0;

    // For upgrade compatibility, we'd need to check against a manifest
    // For now, assume compatible if available
    const isCompatible = isAvailable;

    return {
      currentVersion,
      latestVersion,
      isAvailable,
      isCompatible,
    };
  }

  /**
   * List all versions for a generator
   */
  async listVersions(generatorId: string): Promise<GeneratorVersion[]> {
    await this.ensureInitialized();

    const result = await this.client.query(
      `
      SELECT generator_id, version, manifest, manifest_hash, registered_at, deprecated_at
      FROM generator_versions
      WHERE generator_id = $1
      ORDER BY registered_at DESC;
      `,
      [generatorId],
    );

    return result.rows.map((row) => ({
      generatorId: row.generator_id,
      version: row.version,
      manifest: row.manifest,
      manifestHash: row.manifest_hash,
      registeredAt: row.registered_at,
      deprecatedAt: row.deprecated_at,
    }));
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.client.end();
      this.initialized = false;
    }
  }
}
