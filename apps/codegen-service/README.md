# CodeGen Service

The main Fastify 5 microservice for the CodeGen platform.

## Development

```bash
pnpm -F @appgen/codegen-service dev
```

## Building

```bash
pnpm -F @appgen/codegen-service build
```

## Testing

```bash
pnpm -F @appgen/codegen-service test
pnpm -F @appgen/codegen-service test:watch
pnpm -F @appgen/codegen-service test:coverage
```

## Health Check

```bash
curl http://localhost:3000/health
```
