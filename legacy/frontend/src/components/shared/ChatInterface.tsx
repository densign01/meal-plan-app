import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../../types'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Ask about recipes, ingredients, or dietary preferences...",
  disabled = false
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}-${message.content.substring(0, 20)}`}>
            {message.role === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-[70%]">
                  <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl rounded-tr-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            )}

            {message.role === 'assistant' && (
              <div className="flex justify-start">
                <div className="max-w-[70%]">
                  <div className="bg-gray-100 text-gray-900 px-5 py-3 rounded-2xl rounded-tl-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%]">
              <div className="bg-gray-100 text-gray-900 px-5 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 pt-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading || disabled}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium">Send</span>
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</div>
          <div className="text-xs text-gray-400">{input.length}/2000</div>
        </div>
      </div>
    </div>
  )
}
