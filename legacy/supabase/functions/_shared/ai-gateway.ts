export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  message: {
    role: string
    content: string
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function chatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const aiGatewayUrl = Deno.env.get('AI_GATEWAY_URL') || 'https://your-app.vercel.app'

  const response = await fetch(`${aiGatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI Gateway error: ${error}`)
  }

  return await response.json()
}

export function stripMarkdownCodeBlock(content: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let stripped = content.trim()

  // Remove opening code fence
  stripped = stripped.replace(/^```(?:json)?\s*/i, '')

  // Remove closing code fence
  stripped = stripped.replace(/\s*```\s*$/i, '')

  return stripped.trim()
}

export function parseJSONResponse(content: string): any {
  try {
    const stripped = stripMarkdownCodeBlock(content)
    return JSON.parse(stripped)
  } catch (error) {
    console.error('Failed to parse JSON response:', content)
    throw new Error(`Invalid JSON response from AI: ${error.message}`)
  }
}
