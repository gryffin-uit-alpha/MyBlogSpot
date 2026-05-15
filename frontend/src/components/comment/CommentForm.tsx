'use client'

import { useState } from 'react'

interface CommentFormProps {
  onSubmit: (nickname: string, content: string) => Promise<void>
  disabled?: boolean
}

export default function CommentForm({ onSubmit, disabled }: CommentFormProps) {
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError('Nickname is required')
      return
    }

    if (!content.trim() || content.length > 1000) {
      setError('Content must be between 1 and 1000 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(nickname, content)
      setNickname('')
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium mb-1">
          Nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="Your nickname"
          maxLength={50}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Comment
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="Share your thoughts..."
          rows={4}
          maxLength={1000}
        />
        <div className="text-sm text-gray-500 mt-1">
          {content.length}/1000 characters
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {isSubmitting ? 'Submitting...' : 'Post Comment'}
      </button>
    </form>
  )
}
