import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config as loadEnv } from 'dotenv';
import { generateText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

loadEnv();

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
});

const openaiProvider = process.env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropicProvider = process.env.ANTHROPIC_API_KEY
  ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const requestSchema = z.object({
  model: z.string().default('gpt-5-mini'),
  provider: z.enum(['openai', 'anthropic']).default('openai'),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

fastify.get('/health', async () => {
  return {
    status: 'ok',
    providerAvailability: {
      openai: Boolean(openaiProvider),
      anthropic: Boolean(anthropicProvider),
    },
  };
});

fastify.post('/v1/chat/completions', async (request, reply) => {
  const parseResult = requestSchema.safeParse(request.body);

  if (!parseResult.success) {
    reply.code(400);
    return {
      error: 'invalid_request',
      message: parseResult.error.message,
    };
  }

    const { model, provider, messages, maxTokens, temperature } = parseResult.data;

  try {
    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const resolvedModel = (() => {
      if (provider === 'openai') {
        if (!openaiProvider) {
          throw new Error('OpenAI provider not configured.');
        }
        return openaiProvider(model);
      }

      if (provider === 'anthropic') {
        if (!anthropicProvider) {
          throw new Error('Anthropic provider not configured.');
        }
        return anthropicProvider(model);
      }

      throw new Error(`Unsupported provider: ${provider}`);
    })();

    // Build the generateText options
    const generateOptions: any = {
      model: resolvedModel,
      messages: coreMessages,
    };

    // Only add maxTokens if provided
    if (maxTokens !== undefined) {
      generateOptions.maxTokens = maxTokens;
    }

    // Only add temperature if provided AND if not using gpt-5
    // gpt-5 models only support default temperature
    const isGpt5Model = model.includes('gpt-5');
    if (temperature !== undefined && !isGpt5Model) {
      generateOptions.temperature = temperature;
    }

    const result = await generateText(generateOptions);

    return {
      message: {
        role: 'assistant',
        content: result.text,
      },
      finishReason: result.finishReason,
      usage: result.usage,
      id: result.response?.id ?? null,
      providerMetadata: result.providerMetadata ?? null,
    };
  } catch (error) {
    request.log.error(error);
    reply.code(500);

    if (error instanceof Error) {
      return {
        error: 'provider_error',
        message: error.message,
      };
    }

    return {
      error: 'provider_error',
      message: 'Unknown error while generating text.',
    };
  }
});

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`AI Gateway listening on port ${PORT}`);
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
