import { NextRequest, NextResponse } from 'next/server'
import { generateText, CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

const openaiProvider = process.env.OPENAI_API_KEY
  ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const anthropicProvider = process.env.ANTHROPIC_API_KEY
  ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function POST(req: NextRequest) {
  try {
    const { model = 'gpt-4o-mini', provider = 'openai', messages, maxTokens, temperature } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'messages array is required and must not be empty'
        },
        { status: 400 }
      )
    }

    const coreMessages: CoreMessage[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    const resolvedModel = (() => {
      if (provider === 'openai') {
        if (!openaiProvider) {
          throw new Error('OpenAI provider not configured.')
        }
        return openaiProvider(model)
      }

      if (provider === 'anthropic') {
        if (!anthropicProvider) {
          throw new Error('Anthropic provider not configured.')
        }
        return anthropicProvider(model)
      }

      throw new Error(`Unsupported provider: ${provider}`)
    })()

    // Build the generateText options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateOptions: any = {
      model: resolvedModel,
      messages: coreMessages,
    }

    // Only add maxTokens if provided
    if (maxTokens !== undefined) {
      generateOptions.maxTokens = maxTokens
    }

    // Only add temperature if provided AND if not using gpt-5
    // gpt-5 models only support default temperature
    const isGpt5Model = model.includes('gpt-5')
    if (temperature !== undefined && !isGpt5Model) {
      generateOptions.temperature = temperature
    }

    const result = await generateText(generateOptions)

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: result.text,
      },
      finishReason: result.finishReason,
      usage: result.usage,
      id: result.response?.id ?? null,
      providerMetadata: result.providerMetadata ?? null,
    })
  } catch (error) {
    console.error('AI Gateway Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'provider_error',
          message: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'provider_error',
        message: 'Unknown error while generating text.',
      },
      { status: 500 }
    )
  }
}
