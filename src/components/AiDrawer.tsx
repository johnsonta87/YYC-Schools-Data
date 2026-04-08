import { Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiDrawerProps {
  isOpen: boolean
  schoolName?: string
  messages?: Array<Message>
  errorText?: string | null
  isSubmitting?: boolean
  onSubmitPrompt?: (prompt: string) => void
  onClose: () => void
}

type FormSubmitEvent = Parameters<NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>>[0]

export default function AiDrawer({
  isOpen,
  schoolName = '',
  messages = [],
  errorText = null,
  isSubmitting = false,
  onSubmitPrompt,
  onClose,
}: Readonly<AiDrawerProps>) {
  const [prompt, setPrompt] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setPrompt('')
    }
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isSubmitting) {
      return
    }
    onSubmitPrompt?.(trimmedPrompt)
    setPrompt('')
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Close Ask AI panel"
      />

      <div className="fixed inset-0 flex justify-end">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Ask AI"
          className={`flex h-screen p-6 w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 border-l-2 border-gray-400 dark:border-gray-800 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Ask AI
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Close Ask AI panel"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 space-y-3">
            {messages.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">
                Ask a question about {schoolName || 'this school'} to get
                started...
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg whitespace-pre-wrap overflow-wrap-break-word ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isSubmitting && (
              <div className="flex justify-start">
                <div className="bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 rounded-lg">
                  <span className="inline-block">Thinking</span>
                  <span className="ml-1 inline-block animate-pulse">…</span>
                </div>
              </div>
            )}
            {errorText && (
              <div className="border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 rounded">
                {errorText}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={isSubmitting || !schoolName}
                placeholder="Type your question here..."
                className="w-full border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 line-clamp-1"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isSubmitting || !schoolName}
                className="bg-blue-700 hover:bg-blue-600 p-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send question"
                title="Send"
              >
                <Send size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
              This is an AI-generated response and may not be completely accurate. Please verify important
              information independently.
            </p>
          </form>
        </aside>
      </div>
    </div>
  )
}
