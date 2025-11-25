import { describe, it, expect } from 'vitest';
import { version } from '../index';

describe('@codegen/codegen-mcp-protocol', () => {
  it('exports version', () => {
    expect(version).toBeDefined();
    expect(version).toBe('0.1.0');
  });
});
