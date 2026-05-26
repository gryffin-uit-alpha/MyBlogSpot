'use client';

import { useState } from 'react';
import type { Comment } from '@/lib/api/comments';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  total: number;
  onReply: (parentId: string, nickname: string, content: string) => Promise<void>;
}

const INITIAL_DISPLAY_COUNT = 5;

export default function CommentList({ comments, total, onReply }: CommentListProps) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 font-mono text-sm">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  const displayedComments = comments.slice(0, displayCount);
  const remainingCount = comments.length - displayCount;
  const hasMore = remainingCount > 0;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + INITIAL_DISPLAY_COUNT, comments.length));
  };

  return (
    <div>
      <div className="space-y-2.5">
        {displayedComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onReply={onReply} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-5 py-2.5 bg-gray-800/50 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 rounded-lg font-mono text-xs transition-all flex items-center gap-2"
          >
            <span>[ See {remainingCount} more {remainingCount === 1 ? 'comment' : 'comments'} ]</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
