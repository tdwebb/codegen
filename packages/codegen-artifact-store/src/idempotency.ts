/**
 * Idempotency key management
 * Ensures safe retries and request deduplication
 */

import { createHash } from 'crypto';

/**
 * Generate idempotency key from generator context
 * Combines generatorId, spec, and options for deterministic key generation
 */
export function generateIdempotencyKey(
  generatorId: string,
  spec: unknown,
  options?: Record<string, unknown>,
): string {
  const data = {
    generatorId,
    spec,
    options: options || {},
  };

  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Generate expiration timestamp (24 hours from now)
 */
export function getIdempotencyKeyExpiration(hours: number = 24): string {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt.toISOString();
}

/**
 * Check if idempotency key has expired
 */
export function isIdempotencyKeyExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Calculate content hash (SHA-256) for artifact
 */
export function calculateContentHash(files: Array<{ path: string; content: string }>): string {
  const sortedFiles = files
    .map((f) => ({
      path: f.path,
      content: f.content,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return createHash('sha256').update(JSON.stringify(sortedFiles)).digest('hex');
}

/**
 * Calculate artifact size in bytes
 */
export function calculateArtifactSize(files: Array<{ content: string }>): number {
  return files.reduce((sum, f) => sum + Buffer.byteLength(f.content, 'utf-8'), 0);
}

/**
 * Calculate manifest hash for generator versions
 */
export function calculateManifestHash(manifest: unknown): string {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}
