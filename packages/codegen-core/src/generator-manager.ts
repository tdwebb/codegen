/**
 * Generator Manager - Central registry for managing generators
 */

import type {
  Generator,
  GeneratorRegistry,
  GeneratorSummary,
  GeneratorFilters,
  GeneratorEvent,
  GeneratorRegisteredEvent,
  GeneratorUnregisteredEvent,
} from './types';

export class GeneratorManager implements GeneratorRegistry {
  private generators: Map<string, Generator[]> = new Map();
  private eventListeners: Array<(event: GeneratorEvent) => void> = [];

  /**
   * Register a new generator
   */
  register(generator: Generator): void {
    const key = generator.id;
    const existing = this.generators.get(key) ?? [];

    // Check if this version already exists
    const versionExists = existing.some((g) => g.version === generator.version);
    if (versionExists) {
      throw new Error(
        `Generator ${key}@${generator.version} is already registered`,
      );
    }

    // Add the new generator
    existing.push(generator);
    this.generators.set(key, existing);

    // Emit event
    const event: GeneratorRegisteredEvent = {
      type: 'generator-registered',
      generatorId: generator.id,
      generatorVersion: generator.version,
      timestamp: new Date().toISOString(),
      manifest: generator.manifest,
    };
    this.emitEvent(event);
  }

  /**
   * Unregister a generator
   */
  unregister(id: string, version?: string): void {
    const existing = this.generators.get(id);
    if (!existing) {
      return;
    }

    if (version) {
      // Remove specific version
      const filtered = existing.filter((g) => g.version !== version);
      if (filtered.length === 0) {
        this.generators.delete(id);
      } else {
        this.generators.set(id, filtered);
      }
    } else {
      // Remove all versions
      this.generators.delete(id);
    }

    // Emit event
    const event: GeneratorUnregisteredEvent = {
      type: 'generator-unregistered',
      generatorId: id,
      generatorVersion: version ?? 'all',
      timestamp: new Date().toISOString(),
    };
    this.emitEvent(event);
  }

  /**
   * Get a specific generator
   * If version is not specified, returns the latest version
   */
  get(id: string, version?: string): Generator | undefined {
    const generators = this.generators.get(id);
    if (!generators || generators.length === 0) {
      return undefined;
    }

    if (version) {
      return generators.find((g) => g.version === version);
    }

    // Return latest version (last one added, or we could implement semantic versioning)
    return generators[generators.length - 1];
  }

  /**
   * List all generators, optionally filtered
   */
  list(filters?: GeneratorFilters): Generator[] {
    const allGenerators: Generator[] = [];

    for (const generators of this.generators.values()) {
      allGenerators.push(...generators);
    }

    if (!filters) {
      return allGenerators;
    }

    return allGenerators.filter((g) => {
      if (
        filters.capabilities &&
        !filters.capabilities.every((cap) =>
          g.manifest.capabilities.includes(cap),
        )
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * List generator summaries
   */
  listSummaries(filters?: GeneratorFilters): GeneratorSummary[] {
    return this.list(filters).map((g) => ({
      id: g.id,
      version: g.version,
      displayName: g.manifest.displayName,
      description: g.manifest.description,
      capabilities: g.manifest.capabilities,
    }));
  }

  /**
   * Subscribe to generator events
   */
  on(listener: (event: GeneratorEvent) => void): () => void {
    this.eventListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const idx = this.eventListeners.indexOf(listener);
      if (idx >= 0) {
        this.eventListeners.splice(idx, 1);
      }
    };
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: GeneratorEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        // Log error but don't stop other listeners
        console.error('Error in event listener:', err);
      }
    }
  }
}
