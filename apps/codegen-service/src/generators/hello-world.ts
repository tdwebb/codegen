/**
 * Hello World Generator - Example generator
 */

import type {
  Generator,
  GeneratorManifest,
  GenerationResult,
  GenerateOptions,
  GeneratedFile,
} from '@codegen/codegen-core';
import { createHash } from 'crypto';

// Inline template - in production this would be loaded from file
const HELLO_TEMPLATE = `/**
 * Generated greeting file
 */

export function greet(name: string): string {
  return \`Hello, {{name}}!\`;
}

export const DEFAULT_GREETING = 'Hello, {{name}}!';
`;

export class HelloWorldGenerator implements Generator {
  id = 'hello-world';
  version = '1.0.0';

  manifest: GeneratorManifest = {
    id: 'hello-world',
    version: '1.0.0',
    displayName: 'Hello World Generator',
    description: 'A simple hello world generator that creates a TypeScript file',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name to greet',
        },
      },
      required: ['name'],
    },
    outputs: [
      {
        name: 'hello.ts',
        path: 'hello.ts',
        template: 'hello.ts.hbs',
        language: 'typescript',
        description: 'A simple hello world TypeScript file',
      },
    ],
    entryTemplate: 'hello.ts.hbs',
    capabilities: ['single-file', 'templating'],
  };

  async generate(
    spec: unknown,
    options: GenerateOptions,
  ): Promise<GenerationResult> {
    // Parse and validate input
    if (typeof spec !== 'object' || !spec) {
      throw new Error('Spec must be an object');
    }

    const specObj = spec as Record<string, unknown>;
    const name = specObj.name;

    if (typeof name !== 'string') {
      throw new Error('Spec must have a name property of type string');
    }

    // Render template (simple string replacement instead of Handlebars for now)
    const content = HELLO_TEMPLATE.replace(/{{name}}/g, name);

    // Calculate hash
    const hash = createHash('sha256').update(content).digest('hex');

    // Create generated file
    const file: GeneratedFile = {
      path: 'hello.ts',
      content,
      hash,
      language: 'typescript',
      size: content.length,
    };

    // Calculate spec hash
    const specHash = createHash('sha256')
      .update(JSON.stringify(spec))
      .digest('hex');

    // Return result
    return {
      artifactId: `${this.id}-${Date.now()}`,
      files: [file],
      diagnostics: [],
      metadata: {
        artifactId: `${this.id}-${Date.now()}`,
        generatorId: this.id,
        generatorVersion: this.version,
        tenantId: options.tenantId,
        createdAt: new Date().toISOString(),
        spec,
        specHash,
      },
    };
  }
}
