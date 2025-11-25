import Fastify from 'fastify';
import pino from 'pino';
import { GeneratorManager } from '@codegen/codegen-core';
import {
  InMemoryArtifactStore,
  InMemoryContentAddressableStorage,
  generateIdempotencyKey,
} from '@codegen/codegen-artifact-store';
import { HelloWorldGenerator } from './generators/hello-world';
import type { FastifyRequest, FastifyReply } from 'fastify';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Initialize generator manager
const generatorManager = new GeneratorManager();

// Register hello-world generator
const helloWorldGenerator = new HelloWorldGenerator();
generatorManager.register(helloWorldGenerator);

// Initialize artifact store
const artifactStore = new InMemoryArtifactStore();

async function bootstrap() {
  const fastify = Fastify({
    logger,
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  // GET /api/generators - List all generators
  fastify.get('/api/generators', async (_request: FastifyRequest, _reply: FastifyReply) => {
    const generators = generatorManager.listSummaries();
    return { generators };
  });

  // GET /api/generators/:id - Get specific generator
  fastify.get(
    '/api/generators/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const generator = generatorManager.get(id);

      if (!generator) {
        reply.code(404);
        return { error: `Generator ${id} not found` };
      }

      return { generator: generator.manifest };
    },
  );

  // POST /api/generate - Generate code with artifact storage and idempotency
  fastify.post<{ Body: { generatorId: string; spec: unknown; tenantId?: string; idempotencyKey?: string } }>(
    '/api/generate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { generatorId, spec, tenantId = 'default', idempotencyKey: providedKey } = request.body;

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

        // Generate idempotency key
        const idempotencyKey = providedKey || generateIdempotencyKey(generatorId, spec);

        // Check if already generated
        const existing = await artifactStore.getArtifactByIdempotencyKey(idempotencyKey);
        if (existing) {
          reply.code(200);
          return { artifact: existing, cached: true };
        }

        // Generate code
        const result = await generator.generate(spec, { tenantId });

        // Store artifact with idempotency
        const stored = await artifactStore.storeArtifact(
          {
            version: 1,
            metadata: result.metadata,
            files: result.files,
          },
          idempotencyKey,
        );

        reply.code(201);
        return { artifact: stored, cached: false };
      } catch (err) {
        logger.error(err);
        reply.code(500);
        return { error: err instanceof Error ? err.message : 'Generation failed' };
      }
    },
  );

  // GET /api/artifacts/:id - Retrieve artifact by ID
  fastify.get(
    '/api/artifacts/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const artifact = await artifactStore.getArtifact(id);
        if (!artifact) {
          reply.code(404);
          return { error: `Artifact ${id} not found` };
        }

        return { artifact };
      } catch (err) {
        logger.error(err);
        reply.code(500);
        return { error: err instanceof Error ? err.message : 'Failed to retrieve artifact' };
      }
    },
  );

  // GET /api/artifacts/:id/versions - List all versions of an artifact
  fastify.get(
    '/api/artifacts/:id/versions',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const versions = await artifactStore.listArtifactVersions(id);
        return {
          artifactId: id,
          versions: versions.map((v) => ({
            version: v.version,
            createdAt: v.createdAt,
            contentHash: v.contentHash,
            size: v.size,
          })),
          totalVersions: versions.length,
        };
      } catch (err) {
        logger.error(err);
        reply.code(500);
        return { error: err instanceof Error ? err.message : 'Failed to list versions' };
      }
    },
  );

  // GET /api/artifacts/:id/v/:version - Retrieve specific artifact version
  fastify.get(
    '/api/artifacts/:id/v/:version',
    async (
      request: FastifyRequest<{ Params: { id: string; version: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id, version } = request.params;
        const versionNum = parseInt(version, 10);

        if (isNaN(versionNum)) {
          reply.code(400);
          return { error: 'Invalid version number' };
        }

        const artifact = await artifactStore.getArtifactVersion(id, versionNum);
        if (!artifact) {
          reply.code(404);
          return { error: `Artifact ${id} version ${versionNum} not found` };
        }

        return { artifact };
      } catch (err) {
        logger.error(err);
        reply.code(500);
        return { error: err instanceof Error ? err.message : 'Failed to retrieve artifact version' };
      }
    },
  );

  // DELETE /api/artifacts/:id - Delete artifact
  fastify.delete(
    '/api/artifacts/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        await artifactStore.deleteArtifact(id);
        return { success: true, message: `Artifact ${id} deleted` };
      } catch (err) {
        logger.error(err);
        reply.code(500);
        return { error: err instanceof Error ? err.message : 'Failed to delete artifact' };
      }
    },
  );

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    logger.info(`Server is running at http://${host}:${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});
