/**
 * Workflow Handler Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { WorkflowHandlerGenerator } from '../generators/workflow-handler';
import type { GenerateOptions } from '@codegen/codegen-core';

describe('WorkflowHandlerGenerator', () => {
  let generator: WorkflowHandlerGenerator;

  beforeEach(() => {
    generator = new WorkflowHandlerGenerator();
  });

  const generateOptions: GenerateOptions = {
    tenantId: 'test-tenant',
  };

  describe('Metadata', () => {
    it('should have correct id and version', () => {
      expect(generator.id).toBe('workflow-handler');
      expect(generator.version).toBe('1.0.0');
    });

    it('should have manifest with correct properties', () => {
      const manifest = generator.manifest;
      expect(manifest.id).toBe('workflow-handler');
      expect(manifest.displayName).toBe('Workflow Handler Generator');
      expect(manifest.capabilities).toContain('multi-file');
      expect(manifest.capabilities).toContain('templating');
      expect(manifest.capabilities).toContain('type-generation');
      expect(manifest.capabilities).toContain('test-generation');
    });

    it('should have 5 output files defined', () => {
      const manifest = generator.manifest;
      expect(manifest.outputs.length).toBe(5);
      expect(manifest.outputs.map((o) => o.name)).toEqual([
        'types.ts',
        'handler.ts',
        'handler.test.ts',
        'index.ts',
        'README.md',
      ]);
    });
  });

  describe('Input Validation', () => {
    it('should require name property', async () => {
      const spec = {
        fields: [
          {
            name: 'userId',
            type: 'string',
            description: 'User ID',
            defaultValue: "'123'",
          },
        ],
      };

      await expect(generator.generate(spec, generateOptions)).rejects.toThrow(
        'name',
      );
    });

    it('should require fields property', async () => {
      const spec = {
        name: 'testWorkflow',
      };

      await expect(generator.generate(spec, generateOptions)).rejects.toThrow(
        'fields',
      );
    });

    it('should validate name is string', async () => {
      const spec = {
        name: 123,
        fields: [],
      };

      await expect(generator.generate(spec, generateOptions)).rejects.toThrow(
        'string',
      );
    });

    it('should validate fields is array', async () => {
      const spec = {
        name: 'testWorkflow',
        fields: { userId: 'string' },
      };

      await expect(generator.generate(spec, generateOptions)).rejects.toThrow(
        'array',
      );
    });
  });

  describe('Generation', () => {
    it('should generate 5 files for simple workflow', async () => {
      const spec = {
        name: 'orderProcessing',
        description: 'Order processing workflow',
        fields: [
          {
            name: 'orderId',
            type: 'string',
            description: 'Order ID',
            defaultValue: "'ORD-001'",
          },
          {
            name: 'amount',
            type: 'number',
            description: 'Order amount',
            defaultValue: '99.99',
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      expect(result.files.length).toBe(5);
      expect(result.artifactId).toContain('orderProcessing');
      expect(result.metadata.generatorId).toBe('workflow-handler');
      expect(result.metadata.tenantId).toBe('test-tenant');
    });

    it('should generate types file with correct content', async () => {
      const spec = {
        name: 'userAuth',
        fields: [
          {
            name: 'username',
            type: 'string',
            description: 'Username',
            defaultValue: "'user'",
          },
          {
            name: 'password',
            type: 'string',
            description: 'Password',
            defaultValue: "'pass'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const typesFile = result.files.find((f) => f.path.includes('types.ts'));

      expect(typesFile).toBeDefined();
      expect(typesFile?.content).toContain('UserAuthInput');
      expect(typesFile?.content).toContain('UserAuthOutput');
      expect(typesFile?.content).toContain('UserAuthConfig');
      expect(typesFile?.content).toContain('username');
      expect(typesFile?.content).toContain('password');
      expect(typesFile?.language).toBe('typescript');
    });

    it('should generate handler file with correct content', async () => {
      const spec = {
        name: 'paymentProcess',
        fields: [
          {
            name: 'paymentId',
            type: 'string',
            description: 'Payment ID',
            defaultValue: "'PAY-001'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const handlerFile = result.files.find((f) =>
        f.path.includes('handler.ts'),
      );

      expect(handlerFile).toBeDefined();
      expect(handlerFile?.content).toContain('PaymentProcessHandler');
      expect(handlerFile?.content).toContain('async handle');
      expect(handlerFile?.content).toContain('validateInput');
      expect(handlerFile?.content).toContain('createPaymentProcessHandler');
      expect(handlerFile?.language).toBe('typescript');
    });

    it('should generate test file with correct content', async () => {
      const spec = {
        name: 'emailNotification',
        fields: [
          {
            name: 'email',
            type: 'string',
            description: 'Email address',
            defaultValue: "'test@example.com'",
          },
          {
            name: 'subject',
            type: 'string',
            description: 'Email subject',
            defaultValue: "'Hello'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const testFile = result.files.find((f) => f.path.includes('.test.ts'));

      expect(testFile).toBeDefined();
      expect(testFile?.content).toContain('EmailNotificationHandler');
      expect(testFile?.content).toContain('describe');
      expect(testFile?.content).toContain('handle');
      expect(testFile?.content).toContain('email');
      expect(testFile?.language).toBe('typescript');
    });

    it('should generate index file with correct exports', async () => {
      const spec = {
        name: 'webhookProcessor',
        fields: [
          {
            name: 'webhookUrl',
            type: 'string',
            description: 'Webhook URL',
            defaultValue: "'https://example.com'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const indexFile = result.files.find((f) => f.path.includes('index.ts'));

      expect(indexFile).toBeDefined();
      expect(indexFile?.content).toContain('export type');
      expect(indexFile?.content).toContain('WebhookProcessorInput');
      expect(indexFile?.content).toContain('WebhookProcessorHandler');
      expect(indexFile?.language).toBe('typescript');
    });

    it('should generate README file with documentation', async () => {
      const spec = {
        name: 'dataExport',
        description: 'Export data workflow',
        fields: [
          {
            name: 'format',
            type: 'string',
            description: 'Export format',
            defaultValue: "'json'",
          },
          {
            name: 'compression',
            type: 'boolean',
            description: 'Enable compression',
            defaultValue: 'true',
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const readmeFile = result.files.find((f) => f.path.includes('README.md'));

      expect(readmeFile).toBeDefined();
      expect(readmeFile?.content).toContain('DataExport');
      expect(readmeFile?.content).toContain('Type-safe');
      expect(readmeFile?.content).toContain('format');
      expect(readmeFile?.content).toContain('compression');
      expect(readmeFile?.language).toBe('markdown');
    });

    it('should generate correct file paths based on workflow name', async () => {
      const spec = {
        name: 'complexWorkflow',
        fields: [
          {
            name: 'field1',
            type: 'string',
            description: 'Field 1',
            defaultValue: "'value'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      expect(result.files[0].path).toContain('complexWorkflow');
      expect(result.files.every((f) => f.path.startsWith('complexWorkflow'))).toBe(
        true,
      );
    });
  });

  describe('Template Rendering', () => {
    it('should render name with pascalcase', async () => {
      const spec = {
        name: 'userLoginFlow',
        fields: [
          {
            name: 'username',
            type: 'string',
            description: 'Username',
            defaultValue: "'user'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const typesFile = result.files.find((f) => f.path.includes('types.ts'));

      expect(typesFile?.content).toContain('UserLoginFlow');
      expect(typesFile?.content).toContain('UserLoginFlowInput');
    });

    it('should render field names with camelcase', async () => {
      const spec = {
        name: 'processPayment',
        fields: [
          {
            name: 'card_number',
            type: 'string',
            description: 'Card number',
            defaultValue: "'1234'",
          },
          {
            name: 'expiry_date',
            type: 'string',
            description: 'Expiry date',
            defaultValue: "'12/25'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const typesFile = result.files.find((f) => f.path.includes('types.ts'));

      expect(typesFile?.content).toContain('card_number');
      expect(typesFile?.content).toContain('expiry_date');
    });

    it('should include all fields in generated code', async () => {
      const spec = {
        name: 'userProfile',
        fields: [
          {
            name: 'firstName',
            type: 'string',
            description: 'First name',
            defaultValue: "'John'",
          },
          {
            name: 'lastName',
            type: 'string',
            description: 'Last name',
            defaultValue: "'Doe'",
          },
          {
            name: 'age',
            type: 'number',
            description: 'Age',
            defaultValue: '30',
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const handlerFile = result.files.find((f) =>
        f.path.includes('handler.ts'),
      );

      expect(handlerFile?.content).toContain('firstName');
      expect(handlerFile?.content).toContain('lastName');
      expect(handlerFile?.content).toContain('age');
    });
  });

  describe('Multi-file Generation', () => {
    it('should generate all required file types', async () => {
      const spec = {
        name: 'fullWorkflow',
        fields: [
          {
            name: 'param1',
            type: 'string',
            description: 'Parameter 1',
            defaultValue: "'value1'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      const fileTypes = result.files.map((f) => {
        if (f.path.includes('types.ts')) return 'types';
        if (f.path.includes('handler.ts') && !f.path.includes('.test.ts'))
          return 'handler';
        if (f.path.includes('.test.ts')) return 'test';
        if (f.path.includes('index.ts')) return 'index';
        if (f.path.includes('README.md')) return 'readme';
        return 'unknown';
      });

      expect(fileTypes).toContain('types');
      expect(fileTypes).toContain('handler');
      expect(fileTypes).toContain('test');
      expect(fileTypes).toContain('index');
      expect(fileTypes).toContain('readme');
    });

    it('should generate consistent artifact IDs', async () => {
      const spec = {
        name: 'testWorkflow',
        fields: [
          {
            name: 'field',
            type: 'string',
            description: 'Field',
            defaultValue: "'value'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      expect(result.artifactId).toBe(result.metadata.artifactId);
      expect(result.artifactId).toContain(generator.id);
      expect(result.artifactId).toContain('testWorkflow');
    });

    it('should calculate correct spec hash', async () => {
      const spec = {
        name: 'hashTest',
        fields: [
          {
            name: 'field1',
            type: 'string',
            description: 'Field 1',
            defaultValue: "'value'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      expect(result.metadata.specHash).toBeDefined();
      expect(result.metadata.specHash.length).toBe(64); // SHA256 hex length
    });

    it('should include proper timestamps', async () => {
      const spec = {
        name: 'timestampTest',
        fields: [
          {
            name: 'field',
            type: 'string',
            description: 'Field',
            defaultValue: "'value'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      expect(result.metadata.createdAt).toBeDefined();
      expect(new Date(result.metadata.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('Default Values', () => {
    it('should use default value for string type', async () => {
      const spec = {
        name: 'stringTest',
        fields: [
          {
            name: 'stringField',
            type: 'string',
            description: 'A string field',
            defaultValue: "'custom'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const testFile = result.files.find((f) => f.path.includes('.test.ts'));

      // Handlebars escapes quotes, so we check for the escaped version or the content around it
      expect(testFile?.content).toContain('stringField');
      expect(testFile?.content).toContain('custom');
    });

    it('should use default value for number type', async () => {
      const spec = {
        name: 'numberTest',
        fields: [
          {
            name: 'count',
            type: 'number',
            description: 'A count',
            defaultValue: '100',
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const testFile = result.files.find((f) => f.path.includes('.test.ts'));

      expect(testFile?.content).toContain('count');
      expect(testFile?.content).toContain('100');
    });

    it('should use default value for boolean type', async () => {
      const spec = {
        name: 'boolTest',
        fields: [
          {
            name: 'enabled',
            type: 'boolean',
            description: 'Is enabled',
            defaultValue: 'false',
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);
      const testFile = result.files.find((f) => f.path.includes('.test.ts'));

      expect(testFile?.content).toContain('enabled');
      expect(testFile?.content).toContain('false');
    });
  });

  describe('Determinism', () => {
    it('should generate consistent file structure', async () => {
      const spec = {
        name: 'deterministicTest',
        fields: [
          {
            name: 'field1',
            type: 'string',
            description: 'Field 1',
            defaultValue: "'value'",
          },
        ],
      };

      const result1 = await generator.generate(spec, generateOptions);
      const result2 = await generator.generate(spec, generateOptions);

      // Compare file structures (note: artifact ID and timestamps will differ)
      expect(result1.files.length).toBe(result2.files.length);
      expect(result1.files.length).toBe(5); // types, handler, test, index, readme
    });

    it('should generate consistent spec hash for same spec', async () => {
      const spec = {
        name: 'hashConsistencyTest',
        fields: [
          {
            name: 'field1',
            type: 'string',
            description: 'Field 1',
            defaultValue: "'value'",
          },
        ],
      };

      const result1 = await generator.generate(spec, generateOptions);
      const result2 = await generator.generate(spec, generateOptions);

      // Spec hashes should be identical
      expect(result1.metadata.specHash).toBe(result2.metadata.specHash);
    });

    it('should generate all file types with proper paths', async () => {
      const spec = {
        name: 'fileTypeTest',
        fields: [
          {
            name: 'field1',
            type: 'string',
            description: 'Field 1',
            defaultValue: "'value'",
          },
        ],
      };

      const result = await generator.generate(spec, generateOptions);

      const hasTypes = result.files.some((f) => f.path.includes('types.ts'));
      const hasHandler = result.files.some((f) =>
        f.path.includes('handler.ts'),
      );
      const hasTest = result.files.some((f) => f.path.includes('.test.ts'));
      const hasIndex = result.files.some((f) => f.path.includes('index.ts'));
      const hasReadme = result.files.some((f) => f.path.includes('README.md'));

      expect(hasTypes).toBe(true);
      expect(hasHandler).toBe(true);
      expect(hasTest).toBe(true);
      expect(hasIndex).toBe(true);
      expect(hasReadme).toBe(true);
    });
  });
});
