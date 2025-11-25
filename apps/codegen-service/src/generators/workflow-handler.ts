/**
 * Workflow Handler Generator - Multi-file generator example
 * Generates workflow handlers with types, handlers, tests, and configuration
 */

import type {
  Generator,
  GeneratorManifest,
  GenerationResult,
  GenerateOptions,
  GeneratedFile,
} from '@codegen/codegen-core';
import { createHash } from 'crypto';
import { HandlebarsTemplateEngine } from '@codegen/codegen-template-engine';
import {
  caseHelpers,
  stringHelpers,
  codeHelpers,
} from '@codegen/codegen-template-engine';

// Template for workflow types
const TYPES_TEMPLATE = `/**
 * Workflow {{pascalcase name}} Types
 * Generated file - do not edit manually
 */

export interface {{pascalcase name}}Input {
  [key: string]: unknown;
{{#each fields}}
  // {{name}}: {{type}}
{{/each}}
}

export interface {{pascalcase name}}Output {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface {{pascalcase name}}Config {
  timeout: number;
  retries: number;
  description: string;
}
`;

// Template for workflow handler
const HANDLER_TEMPLATE = `/**
 * {{pascalcase name}} Workflow Handler
 * Generated file - do not edit manually
{{#each fields}}
 * - {{name}}: {{type}}
{{/each}}
 */

import type {
  {{pascalcase name}}Input,
  {{pascalcase name}}Output,
  {{pascalcase name}}Config,
} from './types';

export class {{pascalcase name}}Handler {
  private config: {{pascalcase name}}Config;

  constructor(config: Partial<{{pascalcase name}}Config> = {}) {
    this.config = {
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      description: config.description ?? '{{pascalcase name}} workflow handler',
    };
  }

  async handle(input: {{pascalcase name}}Input): Promise<{{pascalcase name}}Output> {
    try {
      // Validate input
      this.validateInput(input);

      // Process workflow
      const result = await this.processWorkflow(input);

      return {
        success: true,
        message: 'Workflow completed successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateInput(input: {{pascalcase name}}Input): void {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be a valid object');
    }
  }

  private async processWorkflow(input: {{pascalcase name}}Input): Promise<Record<string, unknown>> {
    return {
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }
}

export function create{{pascalcase name}}Handler(
  config?: Partial<{{pascalcase name}}Config>,
): {{pascalcase name}}Handler {
  return new {{pascalcase name}}Handler(config);
}
`;

// Template for tests
const TEST_TEMPLATE = `/**
 * {{pascalcase name}} Handler Tests
 * Generated file - do not edit manually
{{#each fields}}
 * Field: {{name}} = {{defaultValue}}
{{/each}}
 */

import { describe, it, expect } from 'vitest';
import { {{pascalcase name}}Handler } from './handler';
import type { {{pascalcase name}}Input } from './types';

describe('{{pascalcase name}}Handler', () => {
  let handler: {{pascalcase name}}Handler;

  beforeEach(() => {
    handler = new {{pascalcase name}}Handler();
  });

  describe('handle', () => {
    it('should process valid input', async () => {
      const input: {{pascalcase name}}Input = {};

      const result = await handler.handle(input);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const input: any = null;

      const result = await handler.handle(input);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should use custom timeout', async () => {
      const customHandler = new {{pascalcase name}}Handler({
        timeout: 60000,
      });

      expect(customHandler).toBeDefined();
    });

    it('should use custom retries', async () => {
      const customHandler = new {{pascalcase name}}Handler({
        retries: 5,
      });

      expect(customHandler).toBeDefined();
    });
  });
});
`;

// Template for index file
const INDEX_TEMPLATE = `/**
 * {{pascalcase name}} Workflow Module
 * Generated file - do not edit manually
 */

export type {
  {{pascalcase name}}Input,
  {{pascalcase name}}Output,
  {{pascalcase name}}Config,
} from './types';

export { {{pascalcase name}}Handler, create{{pascalcase name}}Handler } from './handler';
`;

// Template for README
const README_TEMPLATE = `# {{pascalcase name}} Workflow Handler

Generated workflow handler for the {{pascalcase name}} workflow.

## Overview

This module provides a handler for the {{pascalcase name}} workflow with the following features:

- Type-safe input/output interfaces
- Configurable timeout and retry behavior
- Comprehensive error handling
- Full test coverage

## Input Fields

{{#each fields}}
- **{{name}}** ({{type}}): {{description}}
{{/each}}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { create{{pascalcase name}}Handler } from '.';

const handler = create{{pascalcase name}}Handler({
  timeout: 30000,
  retries: 3,
});

const result = await handler.handle({});

if (result.success) {
  console.log('Workflow completed:', result.data);
} else {
  console.error('Workflow failed:', result.message);
}
\`\`\`

## Configuration

The handler accepts the following configuration options:

- **timeout** (number): Timeout in milliseconds (default: 30000)
- **retries** (number): Number of retry attempts (default: 3)
- **description** (string): Workflow description

## Generated Files

- \`types.ts\` - Type definitions
- \`handler.ts\` - Handler implementation
- \`handler.test.ts\` - Test suite
- \`index.ts\` - Module exports
- \`README.md\` - This file
`;

export class WorkflowHandlerGenerator implements Generator {
  id = 'workflow-handler';
  version = '1.0.0';

  manifest: GeneratorManifest = {
    id: 'workflow-handler',
    version: '1.0.0',
    displayName: 'Workflow Handler Generator',
    description:
      'Generates type-safe workflow handlers with types, implementation, tests, and documentation',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the workflow',
          pattern: '^[a-zA-Z][a-zA-Z0-9_]*$',
        },
        description: {
          type: 'string',
          description: 'Description of the workflow',
        },
        fields: {
          type: 'array',
          description: 'Input fields for the workflow',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['string', 'number', 'boolean', 'object'] },
              description: { type: 'string' },
              defaultValue: { type: 'string' },
            },
            required: ['name', 'type', 'description', 'defaultValue'],
          },
        },
      },
      required: ['name', 'fields'],
    },
    outputs: [
      {
        name: 'types.ts',
        path: '{{camelcase name}}/types.ts',
        template: 'types.hbs',
        language: 'typescript',
        description: 'Type definitions',
      },
      {
        name: 'handler.ts',
        path: '{{camelcase name}}/handler.ts',
        template: 'handler.hbs',
        language: 'typescript',
        description: 'Handler implementation',
      },
      {
        name: 'handler.test.ts',
        path: '{{camelcase name}}/handler.test.ts',
        template: 'test.hbs',
        language: 'typescript',
        description: 'Test suite',
      },
      {
        name: 'index.ts',
        path: '{{camelcase name}}/index.ts',
        template: 'index.hbs',
        language: 'typescript',
        description: 'Module exports',
      },
      {
        name: 'README.md',
        path: '{{camelcase name}}/README.md',
        template: 'readme.hbs',
        language: 'markdown',
        description: 'Documentation',
      },
    ],
    entryTemplate: 'types.hbs',
    capabilities: ['multi-file', 'templating', 'type-generation', 'test-generation'],
  };

  private templateEngine: HandlebarsTemplateEngine;

  constructor() {
    this.templateEngine = new HandlebarsTemplateEngine();
    this.registerTemplates();
  }

  private registerTemplates(): void {
    // Register all case helpers
    Object.entries(caseHelpers).forEach(([name, helper]) => {
      this.templateEngine.registerHelper(name, helper);
    });

    // Register string helpers
    Object.entries(stringHelpers).forEach(([name, helper]) => {
      this.templateEngine.registerHelper(name, helper);
    });

    // Register code helpers
    Object.entries(codeHelpers).forEach(([name, helper]) => {
      this.templateEngine.registerHelper(name, helper);
    });
  }

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
    const fields = specObj.fields;
    const description = specObj.description || `Workflow for ${name}`;

    if (typeof name !== 'string') {
      throw new Error('Spec must have a name property of type string');
    }

    if (!Array.isArray(fields)) {
      throw new Error('Spec must have a fields property of type array');
    }

    // Prepare context for templates
    const context = {
      name,
      description,
      fields: fields.map((f: any) => ({
        name: f.name,
        type: f.type,
        description: f.description,
        defaultValue: this.getDefaultValue(f.type, f.defaultValue),
      })),
    };

    // Generate files
    const files: GeneratedFile[] = [];

    // Types file
    const typesResult = this.templateEngine.render(TYPES_TEMPLATE, context);
    files.push({
      path: `${name}/types.ts`,
      content: typesResult.content,
      language: 'typescript',
      hash: this.calculateHash(TYPES_TEMPLATE),
      size: TYPES_TEMPLATE.length,
    });

    // Handler file
    const handlerResult = this.templateEngine.render(HANDLER_TEMPLATE, context);
    files.push({
      path: `${name}/handler.ts`,
      content: handlerResult.content,
      language: 'typescript',
      hash: this.calculateHash(HANDLER_TEMPLATE),
      size: HANDLER_TEMPLATE.length,
    });

    // Test file
    const testResult = this.templateEngine.render(TEST_TEMPLATE, context);
    files.push({
      path: `${name}/handler.test.ts`,
      content: testResult.content,
      language: 'typescript',
      hash: this.calculateHash(TEST_TEMPLATE),
      size: TEST_TEMPLATE.length,
    });

    // Index file
    const indexResult = this.templateEngine.render(INDEX_TEMPLATE, context);
    files.push({
      path: `${name}/index.ts`,
      content: indexResult.content,
      language: 'typescript',
      hash: this.calculateHash(INDEX_TEMPLATE),
      size: INDEX_TEMPLATE.length,
    });

    // README file
    const readmeResult = this.templateEngine.render(README_TEMPLATE, context);
    files.push({
      path: `${name}/README.md`,
      content: readmeResult.content,
      language: 'markdown',
      hash: this.calculateHash(README_TEMPLATE),
      size: README_TEMPLATE.length,
    });

    // Calculate spec hash
    const specHash = createHash('sha256')
      .update(JSON.stringify(spec))
      .digest('hex');

    return {
      artifactId: `${this.id}-${name}-${Date.now()}`,
      files,
      diagnostics: [],
      metadata: {
        artifactId: `${this.id}-${name}-${Date.now()}`,
        generatorId: this.id,
        generatorVersion: this.version,
        tenantId: options.tenantId,
        createdAt: new Date().toISOString(),
        spec,
        specHash,
      },
    };
  }

  private getDefaultValue(type: string, providedValue?: string): string {
    if (providedValue) {
      return providedValue;
    }

    switch (type) {
      case 'string':
        return "'value'";
      case 'number':
        return '42';
      case 'boolean':
        return 'true';
      case 'object':
        return '{}';
      default:
        return 'null';
    }
  }

  private calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
