import { Send, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

interface AiDrawerProps {
  isOpen: boolean
  schoolName?: string
  outputText?: string
  onSubmitPrompt?: (prompt: string) => void
  onClose: () => void
}

export default function AiDrawer({
  isOpen,
  schoolName = '',
  outputText = 'Awaiting prompt...',
  onSubmitPrompt,
  onClose,
}: AiDrawerProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      return
    }
    onSubmitPrompt?.(trimmedPrompt)
    setPrompt('')
  }

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
        aria-label="Close Ask AI panel"
      />

      <aside
        className={`absolute right-0 top-0 flex h-screen w-full max-w-3xl flex-col bg-white p-4 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Ask AI"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ask AI</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Close Ask AI panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
          {outputText}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={schoolName ? `Ask about ${schoolName}` : 'Ask about this school...'}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Submit prompt"
              title="Submit"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

