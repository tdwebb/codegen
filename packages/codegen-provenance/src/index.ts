/**
 * @codegen/codegen-provenance
 * Generator provenance and reproducibility tracking
 */

export const version = '0.1.0';

// Types
export type {
  StepRecord,
  GeneratorVersion,
  HelperVersion,
  TemplateInfo,
  EnvironmentInfo,
  ProvenanceRecord,
  IProvenanceTracker,
} from './types';

// Tracker
export { ProvenanceTracker, createStepRecord } from './tracker';
