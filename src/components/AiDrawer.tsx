import { Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

interface AiDrawerProps {
  isOpen: boolean
  schoolName?: string
  outputText?: string
  errorText?: string | null
  isSubmitting?: boolean
  onSubmitPrompt?: (prompt: string) => void
  onClose: () => void
}

type FormSubmitEvent = Parameters<NonNullable<ComponentPropsWithoutRef<'form'>['onSubmit']>>[0]

export default function AiDrawer({
  isOpen,
  schoolName = '',
  outputText = 'Awaiting prompt...',
  errorText = null,
  isSubmitting = false,
  onSubmitPrompt,
  onClose,
}: Readonly<AiDrawerProps>) {
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setPrompt('')
    }
  }, [isOpen])

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
      className={`fixed inset-0 z-40 transition-opacity duration-300 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
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
          className={`flex h-screen w-full max-w-3xl flex-col bg-white p-4 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-950 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ask AI</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Topics must stay strictly about {schoolName || 'the selected school'}.
              </p>
            </div>
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
            <p className="whitespace-pre-wrap">{isSubmitting ? 'Thinking…' : outputText}</p>
            {errorText ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {errorText}
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={isSubmitting || !schoolName}
                placeholder={schoolName ? `Ask about ${schoolName}` : 'Ask about this school...'}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isSubmitting || !schoolName}
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
    </div>
  )
}
