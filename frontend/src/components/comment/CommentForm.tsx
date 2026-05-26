'use client'

import { useState, useEffect } from 'react'
import { useNickname } from '@/components/common/NicknamePrompt'

interface CommentFormProps {
  onSubmit: (nickname: string, content: string) => Promise<void>
  disabled?: boolean
}

export default function CommentForm({ onSubmit, disabled }: CommentFormProps) {
  const { nickname } = useNickname()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nickname) {
      setError('Please refresh the page to set your nickname')
      return
    }

    if (!content.trim() || content.length > 1000) {
      setError('Content must be between 1 and 1000 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(nickname, content.trim())
      setContent('')
      setError('✓ Comment submitted! Pending approval.')
      setTimeout(() => setError(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          placeholder={`Share your thoughts as ${nickname || 'loading...'}...`}
          rows={4}
          maxLength={1000}
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-mono text-xs text-gray-600">
            {content.length}/1000
          </span>
          {error && (
            <span className={`text-xs ${error.startsWith('✓') ? 'text-cyan-400' : 'text-red-400'}`}>{error}</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || isSubmitting || !content.trim()}
        className="w-full px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg font-mono text-sm hover:bg-cyan-500/20 hover:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? '[ Posting... ]' : '[ Post Comment ]'}
      </button>
    </form>
  )
}
