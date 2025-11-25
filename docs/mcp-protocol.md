# MCP Protocol Integration

## Overview

The CodeGen platform integrates with the Model Context Protocol (MCP) to enable AI agents to interact with the code generation system.

## MCP Resources

The CodeGen service exposes the following MCP resources:

### Generators

**URI:** `codegen://generators`

List available code generators with their specifications and capabilities.

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "domain": { "type": "string" },
    "version": { "type": "string" },
    "description": { "type": "string" },
    "inputs": { "type": "object" },
    "outputs": { "type": "array" }
  }
}
```

### Specifications

**URI:** `codegen://specs/{specId}`

Access saved specifications and their details.

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "kind": { "type": "string" },
    "name": { "type": "string" },
    "version": { "type": "string" },
    "content": { "type": "string" }
  }
}
```

### Generated Artifacts

**URI:** `codegen://artifacts/{artifactId}`

Access previously generated code artifacts.

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "generatorId": { "type": "string" },
    "specId": { "type": "string" },
    "files": { "type": "array" },
    "createdAt": { "type": "string" },
    "tenantId": { "type": "string" }
  }
}
```

## MCP Tools

The CodeGen service provides the following MCP tools:

### generate

Generate code from a specification.

**Input:**
```json
{
  "generatorId": "string",
  "specification": "object",
  "options": {
    "tenantId": "string",
    "context": "object"
  }
}
```

**Output:**
```json
{
  "artifactId": "string",
  "files": [
    {
      "path": "string",
      "content": "string"
    }
  ],
  "metadata": {
    "generatedAt": "string",
    "executionTime": "number"
  }
}
```

### validate

Validate a specification against a generator's schema.

**Input:**
```json
{
  "generatorId": "string",
  "specification": "object"
}
```

**Output:**
```json
{
  "valid": "boolean",
  "errors": ["string"]
}
```

### list-generators

List available generators with optional filtering.

**Input:**
```json
{
  "domain": "string",
  "tags": ["string"]
}
```

**Output:**
```json
{
  "generators": [
    {
      "id": "string",
      "name": "string",
      "domain": "string"
    }
  ]
}
```

## Authentication

MCP requests are authenticated via:

1. **API Key** - Long-lived API key for service-to-service authentication
2. **Bearer Token** - OAuth 2.0 bearer token for user authentication
3. **Tenant ID** - Required header for multi-tenant isolation

**Header Format:**
```
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

## Error Handling

MCP errors follow a standard structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "value"
  }
}
```

**Common Error Codes:**
- `INVALID_GENERATOR` - Generator not found or invalid
- `VALIDATION_FAILED` - Specification validation error
- `GENERATION_FAILED` - Code generation error
- `UNAUTHORIZED` - Authentication failed
- `RATE_LIMITED` - Rate limit exceeded

## Rate Limiting

MCP endpoints are subject to rate limiting:

- **Default**: 100 requests per minute per API key
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

## Implementation Status

| Feature | Status | Phase |
|---------|--------|-------|
| Resource exposure | Planned | Phase 5 |
| Tool implementation | Planned | Phase 5 |
| Authentication | Planned | Phase 5 |
| Rate limiting | Planned | Phase 5 |

## Example MCP Usage

```typescript
const mcp = new MCPClient('codegen://');

// List generators
const generators = await mcp.listResources('codegen://generators');

// Generate code
const result = await mcp.callTool('generate', {
  generatorId: 'react-component',
  specification: {
    componentName: 'Button',
    useHooks: true,
  },
});

console.log(result.files);
```

## Further Reading

- See `packages/codegen-mcp-protocol` for implementation details
- Visit [Model Context Protocol](https://modelcontextprotocol.io/) for specification
