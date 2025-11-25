import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { GeneratorManager } from '@codegen/codegen-core';
import { HelloWorldGenerator } from '../generators/hello-world';
import type { FastifyInstance } from 'fastify';

describe('API Routes', () => {
  let fastify: FastifyInstance;
  const generatorManager = new GeneratorManager();
  const helloWorldGenerator = new HelloWorldGenerator();

  beforeAll(async () => {
    // Register generator
    generatorManager.register(helloWorldGenerator);

    // Create Fastify instance with logger disabled for tests
    fastify = Fastify({
      logger: false,
    });

    // Register routes
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    fastify.get('/api/generators', async () => {
      const generators = generatorManager.listSummaries();
      return { generators };
    });

    fastify.get<{ Params: { id: string } }>(
      '/api/generators/:id',
      async (request, reply) => {
        const { id } = request.params;
        const generator = generatorManager.get(id);

        if (!generator) {
          reply.code(404);
          return { error: `Generator ${id} not found` };
        }

        return { generator: generator.manifest };
      },
    );

    fastify.post<{ Body: { generatorId: string; spec: unknown; tenantId?: string } }>(
      '/api/generate',
      async (request, reply) => {
        try {
          const { generatorId, spec, tenantId = 'default' } = request.body;

          if (!generatorId) {
            reply.code(400);
            return { error: 'generatorId is required' };
          }

          if (!spec) {
            reply.code(400);
            return { error: 'spec is required' };
          }

          const generator = generatorManager.get(generatorId);
          if (!generator) {
            reply.code(404);
            return { error: `Generator ${generatorId} not found` };
          }

          const result = await generator.generate(spec, { tenantId });

          return result;
        } catch (err) {
          reply.code(500);
          return { error: err instanceof Error ? err.message : 'Generation failed' };
        }
      },
    );
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });
  });

  describe('GET /api/generators', () => {
    it('should list all generators', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/generators',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.generators).toBeDefined();
      expect(Array.isArray(body.generators)).toBe(true);
      expect(body.generators.length).toBeGreaterThan(0);
    });

    it('should include hello-world generator', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/generators',
      });

      const body = JSON.parse(response.body);
      const helloWorld = body.generators.find(
        (g: any) => g.id === 'hello-world',
      );
      expect(helloWorld).toBeDefined();
      expect(helloWorld.version).toBe('1.0.0');
      expect(helloWorld.displayName).toBe('Hello World Generator');
    });
  });

  describe('GET /api/generators/:id', () => {
    it('should return generator manifest for valid id', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/generators/hello-world',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.generator).toBeDefined();
      expect(body.generator.id).toBe('hello-world');
      expect(body.generator.version).toBe('1.0.0');
      expect(body.generator.inputSchema).toBeDefined();
      expect(body.generator.outputs).toBeDefined();
    });

    it('should return 404 for non-existent generator', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/generators/non-existent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });
  });

  describe('POST /api/generate', () => {
    it('should generate code for valid request', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          generatorId: 'hello-world',
          spec: { name: 'World' },
          tenantId: 'test-tenant',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.artifactId).toBeDefined();
      expect(body.files).toBeDefined();
      expect(Array.isArray(body.files)).toBe(true);
      expect(body.files.length).toBeGreaterThan(0);
      expect(body.files[0].path).toBe('hello.ts');
      expect(body.files[0].content).toContain('World');
    });

    it('should return 400 when generatorId is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          spec: { name: 'World' },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should return 400 when spec is missing', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          generatorId: 'hello-world',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should return 404 when generator not found', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          generatorId: 'non-existent',
          spec: { name: 'World' },
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should return 500 when generation fails', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          generatorId: 'hello-world',
          spec: { name: 123 }, // Invalid: name should be string
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should use default tenant when not specified', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          generatorId: 'hello-world',
          spec: { name: 'World' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.metadata.tenantId).toBe('default');
    });

    it('should include metadata in response', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          generatorId: 'hello-world',
          spec: { name: 'Alice' },
          tenantId: 'my-tenant',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.metadata).toBeDefined();
      expect(body.metadata.generatorId).toBe('hello-world');
      expect(body.metadata.generatorVersion).toBe('1.0.0');
      expect(body.metadata.tenantId).toBe('my-tenant');
      expect(body.metadata.createdAt).toBeDefined();
      expect(body.metadata.specHash).toBeDefined();
    });
  });
});
