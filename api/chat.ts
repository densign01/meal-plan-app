import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

const openaiProvider = process.env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropicProvider = process.env.ANTHROPIC_API_KEY
  ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model = 'gpt-5-mini', provider = 'openai', messages, maxTokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'messages array is required and must not be empty'
      });
    }

    const coreMessages: CoreMessage[] = messages.map((msg: any) => ({
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

    return res.status(200).json({
      message: {
        role: 'assistant',
        content: result.text,
      },
      finishReason: result.finishReason,
      usage: result.usage,
      id: result.response?.id ?? null,
      providerMetadata: result.providerMetadata ?? null,
    });
  } catch (error) {
    console.error('AI Gateway Error:', error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'provider_error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'provider_error',
      message: 'Unknown error while generating text.',
    });
  }
}
