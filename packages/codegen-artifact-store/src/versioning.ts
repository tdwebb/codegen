/**
 * Version management and compatibility utilities
 */

/**
 * Parse semantic version string (e.g., "1.2.3")
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  metadata?: string;
}

/**
 * Parse semantic version
 */
export function parseVersion(versionString: string): SemanticVersion {
  // Match semantic version with optional prerelease and metadata
  const match = versionString.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/,
  );

  if (!match) {
    throw new Error(`Invalid semantic version: ${versionString}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    metadata: match[5],
  };
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (parsed1.major !== parsed2.major) {
    return parsed1.major < parsed2.major ? -1 : 1;
  }

  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor < parsed2.minor ? -1 : 1;
  }

  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch < parsed2.patch ? -1 : 1;
  }

  // Prerelease versions are lower than release versions
  if (parsed1.prerelease && !parsed2.prerelease) return -1;
  if (!parsed1.prerelease && parsed2.prerelease) return 1;

  if (parsed1.prerelease && parsed2.prerelease) {
    return parsed1.prerelease.localeCompare(parsed2.prerelease);
  }

  return 0;
}

/**
 * Check if version satisfies a constraint
 * Supports: "1.2.3", ">=1.0.0", ">=1.0.0 <2.0.0", "^1.2.3", "~1.2.3"
 */
export function versionSatisfies(version: string, constraint: string): boolean {
  // Parse constraint
  const parts = constraint.trim().split(/\s+/);

  for (const part of parts) {
    if (part.startsWith('>=')) {
      if (compareVersions(version, part.substring(2)) < 0) {
        return false;
      }
    } else if (part.startsWith('>')) {
      if (compareVersions(version, part.substring(1)) <= 0) {
        return false;
      }
    } else if (part.startsWith('<=')) {
      if (compareVersions(version, part.substring(2)) > 0) {
        return false;
      }
    } else if (part.startsWith('<')) {
      if (compareVersions(version, part.substring(1)) >= 0) {
        return false;
      }
    } else if (part.startsWith('=') || part.startsWith('==')) {
      const expected = part.replace(/^=+/, '');
      if (compareVersions(version, expected) !== 0) {
        return false;
      }
    } else if (part.startsWith('^')) {
      // Caret: allow changes that do not modify the left-most non-zero digit
      const parsed = parseVersion(part.substring(1));
      const versionParsed = parseVersion(version);

      if (compareVersions(version, part.substring(1)) < 0) {
        return false;
      }

      if (parsed.major === 0) {
        // 0.y.z: allow changes that don't modify the minor
        if (versionParsed.major !== 0 || versionParsed.minor !== parsed.minor) {
          return false;
        }
      } else {
        // x.y.z: allow changes that don't modify the major
        if (versionParsed.major !== parsed.major) {
          return false;
        }
      }
    } else if (part.startsWith('~')) {
      // Tilde: allow patch-level changes
      const parsed = parseVersion(part.substring(1));
      const versionParsed = parseVersion(version);

      if (compareVersions(version, part.substring(1)) < 0) {
        return false;
      }

      if (versionParsed.major !== parsed.major || versionParsed.minor !== parsed.minor) {
        return false;
      }
    } else if (part.match(/^\d+\.\d+\.\d+/)) {
      // Exact version
      if (compareVersions(version, part) !== 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get latest version from list
 */
export function getLatestVersion(versions: string[]): string {
  if (versions.length === 0) {
    throw new Error('No versions available');
  }

  return versions.reduce((latest, current) => {
    return compareVersions(current, latest) > 0 ? current : latest;
  });
}

/**
 * Filter versions by compatibility constraint
 */
export function filterByConstraint(versions: string[], constraint: string): string[] {
  return versions.filter((v) => versionSatisfies(v, constraint));
}
