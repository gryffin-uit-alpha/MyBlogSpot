import type { Comment } from '@/lib/api/comments'
import CommentItem from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  total: number
}

export default function CommentList({ comments, total }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {total} {total === 1 ? 'comment' : 'comments'}
      </div>
      <div className="space-y-0">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}
