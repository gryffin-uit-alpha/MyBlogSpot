import type { Comment } from '@/lib/api/comments'

interface CommentItemProps {
  comment: Comment
}

export default function CommentItem({ comment }: CommentItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-900">{comment.nickname}</div>
        <div className="text-sm text-gray-500">
          {formatDate(comment.created_at)}
        </div>
      </div>
      <div className="text-gray-700 whitespace-pre-wrap">{comment.content}</div>
    </div>
  )
}
