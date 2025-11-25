/**
 * Provenance tracker implementation
 * Records all information needed to reproduce an artifact
 */

import { execSync } from 'child_process';
import type {
  IProvenanceTracker,
  ProvenanceRecord,
  GeneratorVersion,
  HelperVersion,
  TemplateInfo,
  StepRecord,
  EnvironmentInfo,
} from './types';

/**
 * Default provenance tracker
 */
export class ProvenanceTracker implements IProvenanceTracker {
  private artifactId: string | null = null;
  private specHash: string | null = null;
  private generatorVersion: GeneratorVersion | null = null;
  private helperVersions: HelperVersion[] = [];
  private templateInfos: TemplateInfo[] = [];
  private pipelineSteps: StepRecord[] = [];
  private startTime: string;

  constructor() {
    this.startTime = new Date().toISOString();
  }

  startTracking(artifactId: string, specHash: string): void {
    this.artifactId = artifactId;
    this.specHash = specHash;
  }

  recordGeneratorVersion(version: GeneratorVersion): void {
    this.generatorVersion = version;
  }

  recordHelperVersions(helpers: HelperVersion[]): void {
    this.helperVersions = helpers;
  }

  recordTemplateInfo(templates: TemplateInfo[]): void {
    this.templateInfos = templates;
  }

  recordStep(step: StepRecord): void {
    this.pipelineSteps.push(step);
  }

  getCurrent(): ProvenanceRecord | null {
    if (!this.artifactId || !this.specHash || !this.generatorVersion) {
      return null;
    }

    return {
      artifactId: this.artifactId,
      specHash: this.specHash,
      generatorVersion: this.generatorVersion,
      helperVersions: this.helperVersions,
      templateInfos: this.templateInfos,
      pipelineSteps: this.pipelineSteps,
      environment: this.getEnvironmentInfo(),
      createdAt: this.startTime,
    };
  }

  finalize(): ProvenanceRecord {
    const current = this.getCurrent();
    if (!current) {
      throw new Error('Cannot finalize provenance without required tracking data');
    }

    return current;
  }

  /**
   * Get environment information
   */
  private getEnvironmentInfo(): EnvironmentInfo {
    const nodeVersion = process.version;
    let npmVersion = '0.0.0';

    try {
      npmVersion = execSync('npm -v', { encoding: 'utf-8' }).trim();
    } catch {
      // Fallback if npm not available
    }

    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      nodeVersion,
      npmVersion,
      timestamp: now.toISOString(),
      platform: process.platform,
      arch: process.arch,
      timezone,
    };
  }

  /**
   * Reset tracker for new generation
   */
  reset(): void {
    this.artifactId = null;
    this.specHash = null;
    this.generatorVersion = null;
    this.helperVersions = [];
    this.templateInfos = [];
    this.pipelineSteps = [];
    this.startTime = new Date().toISOString();
  }
}

/**
 * Create a step record
 */
export function createStepRecord(
  name: string,
  status: 'success' | 'failed' | 'skipped',
  startTime: string,
  endTime: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>,
  error?: string,
): StepRecord {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const duration = Math.max(0, end - start);

  return {
    name,
    status,
    startTime,
    endTime,
    duration,
    input,
    output,
    error,
  };
}
