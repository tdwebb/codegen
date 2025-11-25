import { describe, it, expect } from 'vitest';
import { AjvSpecValidator } from '../spec-validator';
import type { JSONSchema7 } from 'json-schema';

describe('AjvSpecValidator', () => {
  let validator: AjvSpecValidator;

  beforeEach(() => {
    validator = new AjvSpecValidator();
  });

  describe('Basic Validation', () => {
    it('should validate correct string data', () => {
      const schema: JSONSchema7 = {
        type: 'string',
      };
      const result = validator.validate('hello', schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.data).toBe('hello');
    });

    it('should validate correct number data', () => {
      const schema: JSONSchema7 = {
        type: 'number',
      };
      const result = validator.validate(42, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate correct boolean data', () => {
      const schema: JSONSchema7 = {
        type: 'boolean',
      };
      const result = validator.validate(true, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate correct array data', () => {
      const schema: JSONSchema7 = {
        type: 'array',
        items: { type: 'string' },
      };
      const result = validator.validate(['a', 'b', 'c'], schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate correct object data', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };
      const result = validator.validate({ name: 'John', age: 30 }, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Invalid Data', () => {
    it('should reject string when number expected', () => {
      const schema: JSONSchema7 = {
        type: 'number',
      };
      const result = validator.validate('hello', schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].keyword).toBe('type');
    });

    it('should reject array item with wrong type', () => {
      const schema: JSONSchema7 = {
        type: 'array',
        items: { type: 'number' },
      };
      const result = validator.validate([1, 'two', 3], schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject object with missing required property', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      };
      const result = validator.validate({ name: 'John' }, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const hasRequiredError = result.errors.some(
        (e) => e.keyword === 'required',
      );
      expect(hasRequiredError).toBe(true);
    });

    it('should reject with appropriate error message', () => {
      const schema: JSONSchema7 = {
        type: 'string',
      };
      const result = validator.validate(123, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBeDefined();
      expect(result.errors[0].message.length).toBeGreaterThan(0);
    });
  });

  describe('Type Validation', () => {
    it('should validate string type with min/max length', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        minLength: 2,
        maxLength: 5,
      };

      expect(validator.validate('abc', schema).isValid).toBe(true);
      expect(validator.validate('a', schema).isValid).toBe(false);
      expect(validator.validate('abcdef', schema).isValid).toBe(false);
    });

    it('should validate number type with min/max', () => {
      const schema: JSONSchema7 = {
        type: 'number',
        minimum: 0,
        maximum: 100,
      };

      expect(validator.validate(50, schema).isValid).toBe(true);
      expect(validator.validate(-1, schema).isValid).toBe(false);
      expect(validator.validate(101, schema).isValid).toBe(false);
    });

    it('should validate enum values', () => {
      const schema: JSONSchema7 = {
        enum: ['red', 'green', 'blue'],
      };

      expect(validator.validate('red', schema).isValid).toBe(true);
      expect(validator.validate('yellow', schema).isValid).toBe(false);
    });

    it('should validate patterns', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        pattern: '^[a-z]+$',
      };

      expect(validator.validate('abc', schema).isValid).toBe(true);
      expect(validator.validate('ABC', schema).isValid).toBe(false);
      expect(validator.validate('a1c', schema).isValid).toBe(false);
    });
  });

  describe('Format Validation', () => {
    it('should validate email format', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'email',
      };

      expect(validator.validate('user@example.com', schema).isValid).toBe(true);
      expect(validator.validate('invalid-email', schema).isValid).toBe(false);
    });

    it('should validate URL format', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'url',
      };

      expect(validator.validate('https://example.com', schema).isValid).toBe(
        true,
      );
      expect(validator.validate('not-a-url', schema).isValid).toBe(false);
    });

    it('should validate UUID format', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'uuid',
      };

      expect(
        validator.validate(
          '550e8400-e29b-41d4-a716-446655440000',
          schema,
        ).isValid,
      ).toBe(true);
      expect(validator.validate('not-a-uuid', schema).isValid).toBe(false);
    });

    it('should validate date format', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'date',
      };

      expect(validator.validate('2023-12-25', schema).isValid).toBe(true);
      expect(validator.validate('25-12-2023', schema).isValid).toBe(false);
    });

    it('should validate semantic version format', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'semver',
      };

      expect(validator.validate('1.2.3', schema).isValid).toBe(true);
      expect(validator.validate('1.2.3-alpha', schema).isValid).toBe(true);
      expect(validator.validate('1.2', schema).isValid).toBe(false);
    });

    it('should validate IPv4 format', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'ipv4',
      };

      expect(validator.validate('192.168.1.1', schema).isValid).toBe(true);
      expect(validator.validate('256.1.1.1', schema).isValid).toBe(false);
    });
  });

  describe('Schema Compilation', () => {
    it('should compile schema and reuse validator', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const compiledValidator = validator.compile(schema);

      // Should work for valid data
      const result1 = compiledValidator({ name: 'John' });
      expect(result1.isValid).toBe(true);

      // Should work for invalid data
      const result2 = compiledValidator({ age: 30 });
      expect(result2.isValid).toBe(false);

      // Should be reusable
      const result3 = compiledValidator({ name: 'Jane' });
      expect(result3.isValid).toBe(true);
    });

    it('should cache compiled schemas', () => {
      const schema: JSONSchema7 = {
        type: 'string',
      };

      const validator1 = validator.compile(schema);
      const validator2 = validator.compile(schema);

      // Both should validate the same way
      expect(validator1('hello').isValid).toBe(validator2('hello').isValid);
      expect(validator1(123).isValid).toBe(validator2(123).isValid);
    });

    it('should handle complex nested schema compilation', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name', 'email'],
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['user'],
      };

      const compiledValidator = validator.compile(schema);

      const validData = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
        tags: ['admin', 'user'],
      };

      const result = compiledValidator(validData);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Custom Formats', () => {
    it('should add custom regex format', () => {
      validator.addFormat('phone', /^\d{3}-\d{3}-\d{4}$/);
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'phone',
      };

      expect(validator.validate('123-456-7890', schema).isValid).toBe(true);
      expect(validator.validate('1234567890', schema).isValid).toBe(false);
    });

    it('should add custom function format', () => {
      validator.addFormat('uppercase', (value: string) => value === value.toUpperCase());
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'uppercase',
      };

      expect(validator.validate('HELLO', schema).isValid).toBe(true);
      expect(validator.validate('Hello', schema).isValid).toBe(false);
    });

    it('should work with multiple custom formats', () => {
      validator.addFormat('lowercase', (value: string) => value === value.toLowerCase());
      validator.addFormat('numeric', /^\d+$/);

      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          code: { type: 'string', format: 'numeric' },
          name: { type: 'string', format: 'lowercase' },
        },
      };

      const result = validator.validate(
        { code: '12345', name: 'john' },
        schema,
      );
      expect(result.isValid).toBe(true);

      const result2 = validator.validate(
        { code: 'abc', name: 'John' },
        schema,
      );
      expect(result2.isValid).toBe(false);
    });
  });

  describe('Error Reporting', () => {
    it('should include error path for nested properties', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
      };

      const result = validator.validate({ user: {} }, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const errorPath = result.errors[0].path;
      expect(errorPath).toBeDefined();
    });

    it('should include error keyword', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
        required: ['age'],
      };

      const result = validator.validate({}, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].keyword).toBe('required');
    });

    it('should include error params', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        minLength: 5,
      };

      const result = validator.validate('hi', schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].params).toBeDefined();
    });

    it('should handle multiple validation errors', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          age: { type: 'number', minimum: 0 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'age', 'email'],
      };

      const result = validator.validate(
        { name: 'x', age: -5, email: 'not-email' },
        schema,
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const schema: JSONSchema7 = {
        type: ['string', 'null'],
      };

      expect(validator.validate(null, schema).isValid).toBe(true);
      expect(validator.validate('hello', schema).isValid).toBe(true);
    });

    it('should handle extra properties in objects', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      };

      const result = validator.validate(
        { name: 'John', extra: 'field' },
        schema,
      );
      // Should fail due to additional property
      expect(result.isValid).toBe(false);
    });

    it('should handle deeply nested objects', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  level3: {
                    type: 'object',
                    properties: {
                      value: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const validData = {
        level1: {
          level2: {
            level3: {
              value: 'hello',
            },
          },
        },
      };

      expect(validator.validate(validData, schema).isValid).toBe(true);
    });

    it('should handle array with mixed types', () => {
      const schema: JSONSchema7 = {
        type: 'array',
        items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      };

      const result = validator.validate(['hello', 42, true], schema);
      expect(result.isValid).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
          },
        },
      };

      expect(validator.validate({ items: [] }, schema).isValid).toBe(true);
      expect(validator.validate({}, schema).isValid).toBe(true);
    });
  });

  describe('Determinism', () => {
    it('should produce same validation result for same invalid data', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      };

      const invalidData = { name: 'John' };

      // Validate same data multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(validator.validate(invalidData, schema));
      }

      // All results should have same error count
      const errorCounts = results.map((r) => r.errors.length);
      expect(
        errorCounts.every((count) => count === errorCounts[0]),
      ).toBe(true);

      // All results should have same error keywords
      const errorKeywords = results.map((r) =>
        r.errors.map((e) => e.keyword).sort(),
      );
      expect(
        errorKeywords.every((keywords) =>
          JSON.stringify(keywords) === JSON.stringify(errorKeywords[0]),
        ),
      ).toBe(true);
    });

    it('should produce same validation result with compiled schema', () => {
      const schema: JSONSchema7 = {
        type: 'string',
        format: 'email',
      };

      const compiledValidator = validator.compile(schema);
      const invalidEmail = 'not-an-email';

      // Validate same data multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(compiledValidator(invalidEmail));
      }

      // All results should be invalid
      expect(results.every((r) => !r.isValid)).toBe(true);

      // All results should have same error count
      const errorCounts = results.map((r) => r.errors.length);
      expect(
        errorCounts.every((count) => count === errorCounts[0]),
      ).toBe(true);
    });

    it('should handle complex specs deterministically', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              version: { type: 'string', format: 'semver' },
              createdAt: { type: 'string', format: 'date-time' },
            },
            required: ['version'],
          },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', minLength: 1 },
              },
              required: ['id', 'name'],
            },
          },
        },
        required: ['metadata'],
      };

      const validData = {
        metadata: {
          version: '1.0.0',
          createdAt: '2023-12-25T10:30:00Z',
        },
        resources: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Resource 1',
          },
        ],
      };

      // Validate multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(validator.validate(validData, schema));
      }

      // All should be valid
      expect(results.every((r) => r.isValid)).toBe(true);
    });
  });

  describe('Data Preservation', () => {
    it('should preserve validated data in result', () => {
      const schema: JSONSchema7 = { type: 'string' };
      const data = 'hello';

      const result = validator.validate(data, schema);
      expect(result.data).toBe(data);
    });

    it('should preserve complex data structures', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };

      const data = {
        name: 'John',
        age: 30,
        tags: ['developer', 'typescript'],
      };

      const result = validator.validate(data, schema);
      expect(result.data).toEqual(data);
    });

    it('should preserve data even when validation fails', () => {
      const schema: JSONSchema7 = { type: 'string' };
      const data = 123;

      const result = validator.validate(data, schema);
      expect(result.isValid).toBe(false);
      expect(result.data).toBe(data);
    });
  });
});
