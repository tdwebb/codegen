# Generator Development Guide

## Overview

This guide covers how to develop custom code generators for the CodeGen platform.

## Generator Structure

A code generator in CodeGen consists of:

1. **Specification** - YAML file defining inputs, outputs, and configuration
2. **Templates** - Handlebars templates for generating code
3. **Validators** - Custom validation logic
4. **Post-processors** - Optional output transformation

## Specification Format

Specifications follow a standardized format:

```yaml
kind: Generator
domain: web
name: react-component
version: 1.0.0

metadata:
  description: Generate React functional components
  author: CodeGen Team
  tags: [react, typescript, components]

inputs:
  properties:
    componentName:
      type: string
      description: Name of the component
    useHooks:
      type: boolean
      default: false

outputs:
  - name: component.tsx
    template: templates/component.hbs
  - name: component.test.tsx
    template: templates/component.test.hbs

configuration:
  strictMode: true
  deterministic: true
```

## Template Development

Templates use Handlebars with deterministic helpers:

```handlebars
import React{{#if useHooks}} { useState }{{/if}} from 'react';

interface {{componentName}}Props {
  // Add props here
}

export const {{componentName}}: React.FC<{{componentName}}Props> = (props) => {
  {{#if useHooks}}
  const [state, setState] = useState(null);
  {{/if}}

  return (
    <div>
      {/* Render component */}
    </div>
  );
};
```

### Available Helpers

- `if` - Conditional blocks
- `each` - Array iteration
- `with` - Context switching
- `eq`, `ne`, `lt`, `gt` - Comparison operators
- `and`, `or` - Logical operators
- `upper`, `lower` - String case conversion
- `kebab`, `snake`, `camel`, `pascal` - Case transformations

## Validation

Implement validation in the spec:

```yaml
validation:
  rules:
    - field: componentName
      type: pattern
      value: '^[A-Z][a-zA-Z0-9]*$'
      message: Component name must be PascalCase
```

## Testing Generators

Create tests in the generator repository:

```typescript
import { describe, it, expect } from 'vitest';
import { generateComponent } from './generator';

describe('React Component Generator', () => {
  it('generates a functional component', async () => {
    const result = await generateComponent({
      componentName: 'Button',
      useHooks: true,
    });

    expect(result).toContainEqual({
      name: 'component.tsx',
      content: expect.stringContaining('const Button'),
    });
  });
});
```

## Publishing Generators

Generators are published to the CodeGen registry:

```bash
pnpm run publish --generator react-component --version 1.0.0
```

## Performance Considerations

- Keep templates simple and deterministic
- Avoid heavy computations in templates
- Use composition for complex scenarios
- Cache compiled templates

## Security

- Validate all user inputs
- Sanitize template variables
- Restrict file system operations
- Use deterministic helpers only

## Examples

See the `packages/codegen-template-engine` for detailed template examples.

## Troubleshooting

### Template Compilation Fails

- Check Handlebars syntax
- Ensure all variables are defined
- Validate JSON/YAML input

### Performance Issues

- Profile template generation
- Split complex templates
- Use composition

### Output Differs Between Runs

- Ensure helpers are deterministic
- Check input values for randomness
- Review template logic
