import Fastify from 'fastify';
import pino from 'pino';
import { GeneratorManager } from '@codegen/codegen-core';
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

  // POST /api/generate - Generate code
  fastify.post<{ Body: { generatorId: string; spec: unknown; tenantId?: string } }>(
    '/api/generate',
    async (request: FastifyRequest, reply: FastifyReply) => {
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

        // Generate code
        const result = await generator.generate(spec, { tenantId });

        return result;
      } catch (err) {
        logger.error(err);
        reply.code(500);
        return { error: err instanceof Error ? err.message : 'Generation failed' };
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
