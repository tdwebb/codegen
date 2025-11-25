import { describe, it, expect } from 'vitest';
import {
  caseHelpers,
  stringHelpers,
  codeHelpers,
  typeHelpers,
  mathHelpers,
  jsonHelpers,
  standardHelpers,
} from '../helpers';
import { HandlebarsTemplateEngine } from '../handlebars-engine';

describe('Case Conversion Helpers', () => {
  describe('uppercase', () => {
    it('should convert to uppercase', () => {
      expect(caseHelpers.uppercase('hello')).toBe('HELLO');
      expect(caseHelpers.uppercase('Hello World')).toBe('HELLO WORLD');
    });

    it('should handle empty string', () => {
      expect(caseHelpers.uppercase('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(caseHelpers.uppercase(123 as any)).toBe('');
    });
  });

  describe('lowercase', () => {
    it('should convert to lowercase', () => {
      expect(caseHelpers.lowercase('HELLO')).toBe('hello');
      expect(caseHelpers.lowercase('Hello World')).toBe('hello world');
    });
  });

  describe('camelcase', () => {
    it('should convert to camelCase', () => {
      expect(caseHelpers.camelcase('hello_world')).toBe('helloWorld');
      expect(caseHelpers.camelcase('hello-world')).toBe('helloWorld');
      expect(caseHelpers.camelcase('hello world')).toBe('helloWorld');
      expect(caseHelpers.camelcase('HelloWorld')).toBe('helloWorld');
    });
  });

  describe('pascalcase', () => {
    it('should convert to PascalCase', () => {
      expect(caseHelpers.pascalcase('hello_world')).toBe('HelloWorld');
      expect(caseHelpers.pascalcase('hello-world')).toBe('HelloWorld');
      expect(caseHelpers.pascalcase('hello world')).toBe('HelloWorld');
    });
  });

  describe('snakecase', () => {
    it('should convert to snake_case', () => {
      expect(caseHelpers.snakecase('helloWorld')).toBe('hello_world');
      expect(caseHelpers.snakecase('HelloWorld')).toBe('hello_world');
      expect(caseHelpers.snakecase('hello-world')).toBe('hello_world');
    });
  });

  describe('kebabcase', () => {
    it('should convert to kebab-case', () => {
      expect(caseHelpers.kebabcase('helloWorld')).toBe('hello-world');
      expect(caseHelpers.kebabcase('HelloWorld')).toBe('hello-world');
      expect(caseHelpers.kebabcase('hello_world')).toBe('hello-world');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(caseHelpers.capitalize('hello')).toBe('Hello');
      expect(caseHelpers.capitalize('HELLO')).toBe('HELLO');
    });
  });

  describe('decapitalize', () => {
    it('should decapitalize first letter', () => {
      expect(caseHelpers.decapitalize('Hello')).toBe('hello');
      expect(caseHelpers.decapitalize('HELLO')).toBe('hELLO');
    });
  });
});

describe('String Manipulation Helpers', () => {
  describe('reverse', () => {
    it('should reverse string', () => {
      expect(stringHelpers.reverse('hello')).toBe('olleh');
      expect(stringHelpers.reverse('abc')).toBe('cba');
    });
  });

  describe('repeat', () => {
    it('should repeat string N times', () => {
      expect(stringHelpers.repeat('ab', 3)).toBe('ababab');
      expect(stringHelpers.repeat('x', 5)).toBe('xxxxx');
    });

    it('should handle zero times', () => {
      expect(stringHelpers.repeat('ab', 0)).toBe('');
    });
  });

  describe('trim/trimLeft/trimRight', () => {
    it('should trim whitespace', () => {
      expect(stringHelpers.trim('  hello  ')).toBe('hello');
      expect(stringHelpers.trimLeft('  hello')).toBe('hello');
      expect(stringHelpers.trimRight('hello  ')).toBe('hello');
    });
  });

  describe('pad', () => {
    it('should pad string to length', () => {
      expect(stringHelpers.pad('hello', 10)).toBe('     hello');
      expect(stringHelpers.pad('hi', 5, '.')).toBe('...hi');
    });
  });

  describe('truncate', () => {
    it('should truncate to length with ellipsis', () => {
      expect(stringHelpers.truncate('hello world', 8)).toBe('hello...');
      expect(stringHelpers.truncate('hi', 10)).toBe('hi');
    });
  });

  describe('split', () => {
    it('should split string by delimiter', () => {
      expect(stringHelpers.split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
      expect(stringHelpers.split('hello', '')).toEqual(['h', 'e', 'l', 'l', 'o']);
    });
  });

  describe('replace', () => {
    it('should replace all occurrences', () => {
      expect(stringHelpers.replace('hello hello', 'hello', 'hi')).toBe('hi hi');
    });
  });
});

describe('Code Formatting Helpers', () => {
  describe('indent', () => {
    it('should indent lines', () => {
      const input = 'line1\nline2';
      const expected = '  line1\n  line2';
      expect(codeHelpers.indent(input, 2)).toBe(expected);
    });

    it('should handle empty lines', () => {
      const input = 'line1\n\nline2';
      const expected = '  line1\n\n  line2';
      expect(codeHelpers.indent(input, 2)).toBe(expected);
    });
  });

  describe('stripLines', () => {
    it('should remove leading/trailing blank lines', () => {
      const input = '\n\nhello\nworld\n\n';
      expect(codeHelpers.stripLines(input)).toBe('hello\nworld');
    });
  });

  describe('ensureNewline', () => {
    it('should ensure string ends with newline', () => {
      expect(codeHelpers.ensureNewline('hello')).toBe('hello\n');
      expect(codeHelpers.ensureNewline('hello\n')).toBe('hello\n');
    });
  });

  describe('joinIndent', () => {
    it('should join array with indentation', () => {
      const items = ['item1', 'item2', 'item3'];
      const result = codeHelpers.joinIndent(items);
      expect(result).toContain('item1');
      expect(result).toContain('item2');
      expect(result).toContain('item3');
    });
  });

  describe('comment', () => {
    it('should comment out lines', () => {
      const input = 'line1\nline2';
      const expected = '// line1\n// line2';
      expect(codeHelpers.comment(input)).toBe(expected);
    });
  });

  describe('importTs', () => {
    it('should create TypeScript import statement', () => {
      const result = codeHelpers.importTs(['Component', 'useState'], 'react');
      expect(result).toBe("import { Component, useState } from 'react';");
    });
  });

  describe('exportTs', () => {
    it('should create TypeScript export statement', () => {
      expect(codeHelpers.exportTs('MyClass')).toBe('export { MyClass };');
      expect(codeHelpers.exportTs('default', true)).toBe('export default default;');
    });
  });

  describe('typeAnnotation', () => {
    it('should format TypeScript type annotation', () => {
      expect(codeHelpers.typeAnnotation('value', 'string')).toBe('value: string');
      expect(codeHelpers.typeAnnotation('name', 'string | undefined')).toBe(
        'name: string | undefined',
      );
    });
  });
});

describe('Type Checking Helpers', () => {
  describe('isArray/isObject/isString/isNumber/isBoolean', () => {
    it('should correctly identify types', () => {
      expect(typeHelpers.isArray([])).toBe(true);
      expect(typeHelpers.isArray({})).toBe(false);
      expect(typeHelpers.isObject({})).toBe(true);
      expect(typeHelpers.isObject([])).toBe(false);
      expect(typeHelpers.isString('hello')).toBe(true);
      expect(typeHelpers.isNumber(42)).toBe(true);
      expect(typeHelpers.isBoolean(true)).toBe(true);
    });
  });

  describe('typeof', () => {
    it('should return type name', () => {
      expect(typeHelpers.typeof([])).toBe('array');
      expect(typeHelpers.typeof({})).toBe('object');
      expect(typeHelpers.typeof('hello')).toBe('string');
      expect(typeHelpers.typeof(null)).toBe('null');
    });
  });

  describe('isEmpty', () => {
    it('should check if value is empty', () => {
      expect(typeHelpers.isEmpty('')).toBe(true);
      expect(typeHelpers.isEmpty([])).toBe(true);
      expect(typeHelpers.isEmpty({})).toBe(true);
      expect(typeHelpers.isEmpty('hello')).toBe(false);
      expect(typeHelpers.isEmpty([1, 2])).toBe(false);
    });
  });

  describe('length', () => {
    it('should get length of string/array/object', () => {
      expect(typeHelpers.length('hello')).toBe(5);
      expect(typeHelpers.length([1, 2, 3])).toBe(3);
      expect(typeHelpers.length({ a: 1, b: 2 })).toBe(2);
    });
  });
});

describe('Math Helpers', () => {
  describe('add/subtract/multiply', () => {
    it('should perform arithmetic operations', () => {
      expect(mathHelpers.add(5, 3)).toBe(8);
      expect(mathHelpers.subtract(5, 3)).toBe(2);
      expect(mathHelpers.multiply(5, 3)).toBe(15);
    });
  });

  describe('abs/floor/ceil/round', () => {
    it('should perform rounding operations', () => {
      expect(mathHelpers.abs(-5)).toBe(5);
      expect(mathHelpers.floor(5.9)).toBe(5);
      expect(mathHelpers.ceil(5.1)).toBe(6);
      expect(mathHelpers.round(5.5)).toBe(6);
      expect(mathHelpers.round(5.123, 2)).toBe(5.12);
    });
  });
});

describe('JSON Helpers', () => {
  describe('stringify', () => {
    it('should stringify objects', () => {
      const obj = { a: 1, b: 'hello' };
      const result = jsonHelpers.stringify(obj);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should pretty print when requested', () => {
      const obj = { a: 1 };
      const result = jsonHelpers.stringify(obj, true);
      expect(result).toContain('\n');
    });
  });

  describe('jsonValue', () => {
    it('should get JSON value by path', () => {
      const obj = { user: { name: 'Alice', email: 'alice@example.com' } };
      expect(jsonHelpers.jsonValue(obj, 'user.name')).toBe('Alice');
      expect(jsonHelpers.jsonValue(obj, 'user.email')).toBe('alice@example.com');
    });
  });
});

describe('Standard Helpers Collection', () => {
  it('should include all helper categories', () => {
    // Case helpers
    expect(typeof standardHelpers.uppercase).toBe('function');
    expect(typeof standardHelpers.camelcase).toBe('function');

    // String helpers
    expect(typeof standardHelpers.reverse).toBe('function');
    expect(typeof standardHelpers.trim).toBe('function');

    // Code helpers
    expect(typeof standardHelpers.indent).toBe('function');
    expect(typeof standardHelpers.importTs).toBe('function');

    // Type helpers
    expect(typeof standardHelpers.isArray).toBe('function');
    expect(typeof standardHelpers.typeof).toBe('function');

    // Math helpers
    expect(typeof standardHelpers.add).toBe('function');
    expect(typeof standardHelpers.round).toBe('function');

    // JSON helpers
    expect(typeof standardHelpers.stringify).toBe('function');
    expect(typeof standardHelpers.jsonValue).toBe('function');
  });

  it('should have 40+ helper functions', () => {
    const helperCount = Object.keys(standardHelpers).length;
    expect(helperCount).toBeGreaterThanOrEqual(40);
  });
});

describe('Helper Determinism', () => {
  it('should produce deterministic output for all helpers', () => {
    const testCases = [
      () => caseHelpers.camelcase('hello_world'),
      () => caseHelpers.pascalcase('hello-world'),
      () => caseHelpers.snakecase('HelloWorld'),
      () => stringHelpers.repeat('ab', 5),
      () => stringHelpers.truncate('hello world', 8),
      () => codeHelpers.indent('line1\nline2', 2),
      () => codeHelpers.importTs(['A', 'B'], 'react'),
      () => mathHelpers.round(3.14159, 2),
      () => typeHelpers.length('hello'),
      () => jsonHelpers.stringify({ b: 2, a: 1 }),
    ];

    // Run each test case 10 times and verify identical output
    for (const testFn of testCases) {
      const outputs = Array(10).fill(0).map(() => testFn());
      const firstOutput = outputs[0];
      expect(outputs.every((o) => o === firstOutput)).toBe(true);
    }
  });
});

describe('Helper Error Handling', () => {
  it('should gracefully handle invalid inputs', () => {
    // Should not throw, just return safe default
    expect(() => {
      caseHelpers.uppercase(null as any);
      stringHelpers.repeat(123 as any, 5);
      typeHelpers.length(null);
      mathHelpers.add('not a number' as any, 5);
    }).not.toThrow();
  });
});

describe('Integration Tests with Engine', () => {
  it('should use helpers with template engine', () => {
    const engine = new HandlebarsTemplateEngine();

    // Register all standard helpers
    engine.registerHelpers(standardHelpers);

    // Test various helper combinations
    const tests = [
      { template: '{{uppercase name}}', context: { name: 'alice' }, expected: 'ALICE' },
      { template: '{{camelcase text}}', context: { text: 'hello_world' }, expected: 'helloWorld' },
      { template: '{{indent code 2}}', context: { code: 'line' }, expected: '  line' },
    ];

    for (const test of tests) {
      const result = engine.render(test.template, test.context);
      expect(result.content).toBe(test.expected);
    }

    // Test importTs separately (handles HTML escaping)
    const importResult = engine.render('{{importTs items from}}', {
      items: ['A', 'B'],
      from: 'react',
    });
    expect(importResult.content).toContain('import');
    expect(importResult.content).toContain('A, B');
  });
});
