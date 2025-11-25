/**
 * Standard helper functions for code generation templates
 * All helpers are deterministic and safe for use in templates
 */

/**
 * Case conversion helpers
 */
export const caseHelpers = {
  /**
   * Convert string to UPPERCASE
   */
  uppercase: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.toUpperCase();
  },

  /**
   * Convert string to lowercase
   */
  lowercase: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.toLowerCase();
  },

  /**
   * Convert to camelCase (first letter lowercase, then capitals)
   */
  camelcase: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toLowerCase());
  },

  /**
   * Convert to PascalCase (CamelCase with capital first letter)
   */
  pascalcase: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toUpperCase());
  },

  /**
   * Convert to snake_case
   */
  snakecase: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase();
  },

  /**
   * Convert to kebab-case
   */
  kebabcase: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[-_\s]+/g, '-')
      .toLowerCase();
  },

  /**
   * Capitalize first letter
   */
  capitalize: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Decapitalize first letter
   */
  decapitalize: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  },
};

/**
 * String formatting and manipulation helpers
 */
export const stringHelpers = {
  /**
   * Reverse a string
   */
  reverse: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.split('').reverse().join('');
  },

  /**
   * Repeat a string N times
   */
  repeat: (str: string, times: number): string => {
    if (typeof str !== 'string' || typeof times !== 'number') return '';
    return new Array(Math.max(0, Math.floor(times) + 1)).join(str);
  },

  /**
   * Trim whitespace from both ends
   */
  trim: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.trim();
  },

  /**
   * Trim whitespace from left
   */
  trimLeft: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.replace(/^\s+/, '');
  },

  /**
   * Trim whitespace from right
   */
  trimRight: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.replace(/\s+$/, '');
  },

  /**
   * Pad string to length with character
   */
  pad: (str: string, length: number, char: string = ' '): string => {
    if (typeof str !== 'string' || typeof length !== 'number') return '';
    if (str.length >= length) return str;
    const charStr = typeof char === 'string' ? char : ' ';
    const padding = charStr.repeat(Math.ceil((length - str.length) / charStr.length));
    return padding.slice(0, length - str.length) + str;
  },

  /**
   * Truncate string to length and add ellipsis
   */
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (typeof str !== 'string' || typeof length !== 'number') return '';
    if (str.length <= length) return str;
    return str.slice(0, Math.max(0, length - suffix.length)) + suffix;
  },

  /**
   * Split string by delimiter
   */
  split: (str: string, delimiter: string): string[] => {
    if (typeof str !== 'string') return [];
    return str.split(delimiter);
  },

  /**
   * Replace all occurrences
   */
  replace: (str: string, find: string, replace: string): string => {
    if (typeof str !== 'string') return '';
    return str.split(find).join(replace);
  },
};

/**
 * Code formatting helpers for generated code
 */
export const codeHelpers = {
  /**
   * Indent string by N spaces
   */
  indent: (str: string, spaces: number = 2): string => {
    if (typeof str !== 'string' || typeof spaces !== 'number') return '';
    const indent = ' '.repeat(Math.max(0, spaces));
    return str
      .split('\n')
      .map((line) => (line ? indent + line : line))
      .join('\n');
  },

  /**
   * Remove leading/trailing blank lines
   */
  stripLines: (str: string): string => {
    if (typeof str !== 'string') return '';
    return str.replace(/^\s*[\r\n]/, '').replace(/[\r\n]\s*$/, '');
  },

  /**
   * Ensure string ends with newline
   */
  ensureNewline: (str: string): string => {
    if (typeof str !== 'string') return '\n';
    return str.endsWith('\n') ? str : str + '\n';
  },

  /**
   * Join array with separator and proper indentation
   */
  joinIndent: (items: unknown[], separator: string = ',\n', spaces: number = 2): string => {
    if (!Array.isArray(items)) return '';
    const indent = ' '.repeat(Math.max(0, spaces));
    return items
      .map((item) => {
        const str = typeof item === 'string' ? item : JSON.stringify(item);
        return indent + str;
      })
      .join(separator);
  },

  /**
   * Comment out lines in code
   */
  comment: (str: string, prefix: string = '// '): string => {
    if (typeof str !== 'string') return '';
    return str
      .split('\n')
      .map((line) => (line ? prefix + line : line))
      .join('\n');
  },

  /**
   * Create a TypeScript import statement
   */
  importTs: (items: string[], from: string): string => {
    if (!Array.isArray(items) || typeof from !== 'string') return '';
    const itemList = items.map((item) => (typeof item === 'string' ? item : '')).filter(Boolean);
    if (itemList.length === 0) return '';
    return `import { ${itemList.join(', ')} } from '${from}';`;
  },

  /**
   * Create a TypeScript export statement
   */
  exportTs: (name: string, isDefault: boolean = false): string => {
    if (typeof name !== 'string') return '';
    return isDefault ? `export default ${name};` : `export { ${name} };`;
  },

  /**
   * Format TypeScript type annotation
   */
  typeAnnotation: (value: string, type: string): string => {
    if (typeof value !== 'string' || typeof type !== 'string') return '';
    return `${value}: ${type}`;
  },
};

/**
 * Type checking and validation helpers
 */
export const typeHelpers = {
  /**
   * Check if value is array
   */
  isArray: (value: unknown): boolean => {
    return Array.isArray(value);
  },

  /**
   * Check if value is object (not null, not array)
   */
  isObject: (value: unknown): boolean => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  /**
   * Check if value is string
   */
  isString: (value: unknown): boolean => {
    return typeof value === 'string';
  },

  /**
   * Check if value is number
   */
  isNumber: (value: unknown): boolean => {
    return typeof value === 'number' && !Number.isNaN(value);
  },

  /**
   * Check if value is boolean
   */
  isBoolean: (value: unknown): boolean => {
    return typeof value === 'boolean';
  },

  /**
   * Get type of value
   */
  typeof: (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  },

  /**
   * Check if value is empty
   */
  isEmpty: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  /**
   * Get array length or object key count
   */
  length: (value: unknown): number => {
    if (typeof value === 'string' || Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length;
    return 0;
  },
};

/**
 * Math and numeric helpers
 */
export const mathHelpers = {
  /**
   * Add two numbers
   */
  add: (a: number, b: number): number => {
    return (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0);
  },

  /**
   * Subtract two numbers
   */
  subtract: (a: number, b: number): number => {
    return (typeof a === 'number' ? a : 0) - (typeof b === 'number' ? b : 0);
  },

  /**
   * Multiply two numbers
   */
  multiply: (a: number, b: number): number => {
    return (typeof a === 'number' ? a : 0) * (typeof b === 'number' ? b : 0);
  },

  /**
   * Get absolute value
   */
  abs: (n: number): number => {
    return typeof n === 'number' ? Math.abs(n) : 0;
  },

  /**
   * Floor number
   */
  floor: (n: number): number => {
    return typeof n === 'number' ? Math.floor(n) : 0;
  },

  /**
   * Ceiling number
   */
  ceil: (n: number): number => {
    return typeof n === 'number' ? Math.ceil(n) : 0;
  },

  /**
   * Round number to N decimal places
   */
  round: (n: number, decimals: number = 0): number => {
    if (typeof n !== 'number' || typeof decimals !== 'number') return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  },
};

/**
 * JSON and serialization helpers
 */
export const jsonHelpers = {
  /**
   * Stringify object to JSON (sorted keys for determinism)
   */
  stringify: (obj: unknown, pretty: boolean = false): string => {
    try {
      if (pretty) {
        return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort(), 2);
      }
      return JSON.stringify(obj);
    } catch {
      return '';
    }
  },

  /**
   * Get JSON value safely
   */
  jsonValue: (obj: unknown, path: string): unknown => {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (typeof current === 'object' && current !== null && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  },
};

/**
 * All standard helpers grouped together
 */
export const standardHelpers = {
  ...caseHelpers,
  ...stringHelpers,
  ...codeHelpers,
  ...typeHelpers,
  ...mathHelpers,
  ...jsonHelpers,
};
