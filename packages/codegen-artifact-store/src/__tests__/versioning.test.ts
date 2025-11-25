import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseVersion,
  compareVersions,
  versionSatisfies,
  getLatestVersion,
  filterByConstraint,
} from '../versioning';

describe('Versioning Utilities', () => {
  describe('parseVersion', () => {
    it('should parse valid semantic version', () => {
      const version = parseVersion('1.2.3');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
    });

    it('should parse version with prerelease', () => {
      const version = parseVersion('1.2.3-alpha.1');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.prerelease).toBe('alpha.1');
    });

    it('should parse version with metadata', () => {
      const version = parseVersion('1.2.3+build.123');
      expect(version.major).toBe(1);
      expect(version.minor).toBe(2);
      expect(version.patch).toBe(3);
      expect(version.metadata).toBe('build.123');
    });

    it('should throw on invalid version', () => {
      expect(() => parseVersion('not-a-version')).toThrow();
      expect(() => parseVersion('1.2')).toThrow();
      expect(() => parseVersion('1.2.3.4')).toThrow();
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });

    it('should return 1 when v1 > v2', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
      expect(compareVersions('1.2.3', '1.2.2')).toBe(1);
    });

    it('should return -1 when v1 < v2', () => {
      expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
      expect(compareVersions('1.1.9', '1.2.0')).toBe(-1);
      expect(compareVersions('1.2.2', '1.2.3')).toBe(-1);
    });

    it('should handle prerelease versions', () => {
      expect(compareVersions('1.2.3-alpha', '1.2.3')).toBe(-1);
      expect(compareVersions('1.2.3', '1.2.3-alpha')).toBe(1);
      expect(compareVersions('1.2.3-alpha', '1.2.3-beta')).toBe(-1);
    });

    it('should handle version lists', () => {
      const versions = ['1.0.0', '2.0.0', '1.5.0', '2.1.0'];
      const sorted = [...versions].sort(compareVersions);
      expect(sorted).toEqual(['1.0.0', '1.5.0', '2.0.0', '2.1.0']);
    });
  });

  describe('versionSatisfies', () => {
    it('should match exact version', () => {
      expect(versionSatisfies('1.2.3', '1.2.3')).toBe(true);
      expect(versionSatisfies('1.2.4', '1.2.3')).toBe(false);
    });

    it('should match >= constraint', () => {
      expect(versionSatisfies('2.0.0', '>=1.0.0')).toBe(true);
      expect(versionSatisfies('1.0.0', '>=1.0.0')).toBe(true);
      expect(versionSatisfies('0.9.0', '>=1.0.0')).toBe(false);
    });

    it('should match > constraint', () => {
      expect(versionSatisfies('2.0.0', '>1.0.0')).toBe(true);
      expect(versionSatisfies('1.0.0', '>1.0.0')).toBe(false);
    });

    it('should match <= constraint', () => {
      expect(versionSatisfies('1.0.0', '<=2.0.0')).toBe(true);
      expect(versionSatisfies('2.0.0', '<=2.0.0')).toBe(true);
      expect(versionSatisfies('2.1.0', '<=2.0.0')).toBe(false);
    });

    it('should match < constraint', () => {
      expect(versionSatisfies('1.0.0', '<2.0.0')).toBe(true);
      expect(versionSatisfies('2.0.0', '<2.0.0')).toBe(false);
    });

    it('should match caret constraint (^)', () => {
      // ^1.2.3 allows 1.x.x but not 2.x.x
      expect(versionSatisfies('1.5.0', '^1.2.3')).toBe(true);
      expect(versionSatisfies('1.2.3', '^1.2.3')).toBe(true);
      expect(versionSatisfies('2.0.0', '^1.2.3')).toBe(false);
      expect(versionSatisfies('1.1.0', '^1.2.3')).toBe(false);

      // ^0.2.3 allows 0.2.x but not 0.3.x
      expect(versionSatisfies('0.2.5', '^0.2.3')).toBe(true);
      expect(versionSatisfies('0.3.0', '^0.2.3')).toBe(false);
    });

    it('should match tilde constraint (~)', () => {
      // ~1.2.3 allows 1.2.x but not 1.3.x
      expect(versionSatisfies('1.2.5', '~1.2.3')).toBe(true);
      expect(versionSatisfies('1.2.3', '~1.2.3')).toBe(true);
      expect(versionSatisfies('1.3.0', '~1.2.3')).toBe(false);
      expect(versionSatisfies('1.1.9', '~1.2.3')).toBe(false);
    });

    it('should match range constraints', () => {
      expect(versionSatisfies('1.5.0', '>=1.0.0 <2.0.0')).toBe(true);
      expect(versionSatisfies('1.0.0', '>=1.0.0 <2.0.0')).toBe(true);
      expect(versionSatisfies('0.9.0', '>=1.0.0 <2.0.0')).toBe(false);
      expect(versionSatisfies('2.0.0', '>=1.0.0 <2.0.0')).toBe(false);
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version', () => {
      const versions = ['1.0.0', '2.0.0', '1.5.0', '2.1.0', '1.2.3'];
      expect(getLatestVersion(versions)).toBe('2.1.0');
    });

    it('should handle single version', () => {
      expect(getLatestVersion(['1.0.0'])).toBe('1.0.0');
    });

    it('should throw on empty array', () => {
      expect(() => getLatestVersion([])).toThrow();
    });

    it('should handle prerelease versions', () => {
      const versions = ['1.0.0', '1.1.0-alpha', '1.0.1'];
      expect(getLatestVersion(versions)).toBe('1.1.0-alpha');
    });
  });

  describe('filterByConstraint', () => {
    it('should filter versions by constraint', () => {
      const versions = ['1.0.0', '1.5.0', '2.0.0', '2.1.0'];
      const filtered = filterByConstraint(versions, '>=1.0.0 <2.0.0');
      expect(filtered).toEqual(['1.0.0', '1.5.0']);
    });

    it('should filter with caret constraint', () => {
      const versions = ['1.0.0', '1.2.0', '1.5.0', '2.0.0'];
      const filtered = filterByConstraint(versions, '^1.2.0');
      expect(filtered).toEqual(['1.2.0', '1.5.0']);
    });

    it('should filter with tilde constraint', () => {
      const versions = ['1.2.0', '1.2.3', '1.2.5', '1.3.0'];
      const filtered = filterByConstraint(versions, '~1.2.3');
      expect(filtered).toEqual(['1.2.3', '1.2.5']);
    });

    it('should return empty array if no versions match', () => {
      const versions = ['1.0.0', '1.5.0'];
      const filtered = filterByConstraint(versions, '>=2.0.0');
      expect(filtered).toEqual([]);
    });
  });
});
