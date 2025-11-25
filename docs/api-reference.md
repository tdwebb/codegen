# API Reference

## Health Check

### GET /health

Returns the health status of the CodeGen service.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Code:** 200 OK

---

## Generation API

The generation API endpoints are documented in Phase 1 of the implementation plan.

### Generate Code

Generate production code from a YAML specification.

**Endpoint:** `POST /api/v1/generate`

**Status:** To be implemented in Phase 1

### List Generators

List available code generators.

**Endpoint:** `GET /api/v1/generators`

**Status:** To be implemented in Phase 1

---

## Template API

### Compile Template

Compile a Handlebars template with deterministic helpers.

**Endpoint:** `POST /api/v1/templates/compile`

**Status:** To be implemented in Phase 2

---

## Registry API

### Get Specification

Retrieve a specification from the registry.

**Endpoint:** `GET /api/v1/registry/{specId}`

**Status:** To be implemented in Phase 1

---

## MCP Protocol

The Model Context Protocol integration endpoints are documented in the MCP Protocol documentation.

**Status:** To be implemented in Phase 5

---

## Error Responses

All endpoints return structured error responses using the AppGen error taxonomy.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Specification validation failed",
  "details": {
    "field": "name",
    "reason": "Required field missing"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Specification or input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `INTERNAL_ERROR` - Internal server error

---

## Pagination

Endpoints that return lists support pagination via query parameters:

- `limit` (default: 20, max: 100)
- `offset` (default: 0)

Example: `GET /api/v1/generators?limit=50&offset=100`
