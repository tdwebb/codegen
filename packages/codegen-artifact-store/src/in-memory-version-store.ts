/**
 * In-memory implementation of generator version store
 * Used for testing and development
 */

import type { IGeneratorVersionStore, GeneratorManifest, GeneratorVersion, UpgradeInfo } from './types';
import { calculateManifestHash } from './idempotency';
import { compareVersions, getLatestVersion, versionSatisfies } from './versioning';

/**
 * In-memory generator version store
 */
export class InMemoryGeneratorVersionStore implements IGeneratorVersionStore {
  private versions: Map<string, GeneratorVersion[]> = new Map();

  /**
   * Register a new generator version
   */
  async registerVersion(manifest: GeneratorManifest): Promise<GeneratorVersion> {
    const manifestHash = calculateManifestHash(manifest);
    const now = new Date().toISOString();

    const version: GeneratorVersion = {
      generatorId: manifest.generatorId,
      version: manifest.version,
      manifest,
      manifestHash,
      registeredAt: now,
    };

    if (!this.versions.has(manifest.generatorId)) {
      this.versions.set(manifest.generatorId, []);
    }

    const generatorVersions = this.versions.get(manifest.generatorId)!;

    // Update if already exists, otherwise add
    const existingIndex = generatorVersions.findIndex((v) => v.version === manifest.version);
    if (existingIndex >= 0) {
      generatorVersions[existingIndex] = version;
    } else {
      generatorVersions.push(version);
    }

    return version;
  }

  /**
   * Get latest version for a generator
   */
  async getLatestVersion(generatorId: string): Promise<GeneratorVersion | null> {
    const generatorVersions = this.versions.get(generatorId);
    if (!generatorVersions || generatorVersions.length === 0) {
      return null;
    }

    const notDeprecated = generatorVersions.filter((v) => !v.deprecatedAt);
    if (notDeprecated.length === 0) {
      return null;
    }

    // Sort by semantic version (descending), not registration time
    notDeprecated.sort((a, b) => compareVersions(b.version, a.version));

    return notDeprecated[0];
  }

  /**
   * Get specific version
   */
  async getVersion(generatorId: string, version: string): Promise<GeneratorVersion | null> {
    const generatorVersions = this.versions.get(generatorId);
    if (!generatorVersions) {
      return null;
    }

    return generatorVersions.find((v) => v.version === version) || null;
  }

  /**
   * Get compatible versions for a target runtime
   */
  async getCompatibleVersions(
    generatorId: string,
    targetRuntime: string,
    targetVersion?: string,
  ): Promise<GeneratorVersion[]> {
    const generatorVersions = this.versions.get(generatorId);
    if (!generatorVersions) {
      return [];
    }

    return generatorVersions
      .filter((v) => !v.deprecatedAt)
      .filter((v) => {
        const compatibility = v.manifest.compatibility;
        if (!compatibility || !compatibility[targetRuntime]) {
          return false;
        }

        if (!targetVersion) {
          return true;
        }

        return versionSatisfies(targetVersion, compatibility[targetRuntime]);
      })
      .sort((a, b) => compareVersions(b.version, a.version));
  }

  /**
   * Mark version as deprecated
   */
  async deprecateVersion(generatorId: string, version: string): Promise<void> {
    const generatorVersions = this.versions.get(generatorId);
    if (!generatorVersions) {
      return;
    }

    const v = generatorVersions.find((gv) => gv.version === version);
    if (v) {
      v.deprecatedAt = new Date().toISOString();
    }
  }

  /**
   * Check upgrade availability
   */
  async checkUpgrade(generatorId: string, currentVersion: string): Promise<UpgradeInfo> {
    const generatorVersions = this.versions.get(generatorId);
    if (!generatorVersions || generatorVersions.length === 0) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        isAvailable: false,
        isCompatible: false,
      };
    }

    const notDeprecated = generatorVersions
      .filter((v) => !v.deprecatedAt)
      .map((v) => v.version);

    if (notDeprecated.length === 0) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        isAvailable: false,
        isCompatible: false,
      };
    }

    const latestVersion = getLatestVersion(notDeprecated);
    const isAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      currentVersion,
      latestVersion,
      isAvailable,
      isCompatible: isAvailable,
    };
  }

  /**
   * List all versions for a generator
   */
  async listVersions(generatorId: string): Promise<GeneratorVersion[]> {
    const generatorVersions = this.versions.get(generatorId);
    if (!generatorVersions) {
      return [];
    }

    // Sort by semantic version (descending)
    return [...generatorVersions].sort((a, b) => compareVersions(b.version, a.version));
  }
}
