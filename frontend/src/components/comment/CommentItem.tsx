'use client';

import { useState } from 'react';
import type { Comment } from '@/lib/api/comments';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, nickname: string, content: string) => Promise<void>;
  depth?: number;
  rootCommentId?: string;
}

export default function CommentItem({ comment, onReply, depth = 0, rootCommentId }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  };

  const handleReplySubmit = async (nickname: string, content: string) => {
    const finalContent = depth > 0
      ? `@replyto:${comment.nickname} ${content}`
      : content;

    const targetParentId = rootCommentId || comment.id;
    await onReply(targetParentId, nickname, finalContent);
    setShowReplyForm(false);
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <div className={`${depth > 0 ? 'ml-5 mt-2.5' : 'mb-3'}`}>
      <div className="bg-gray-800/20 border border-gray-800/60 rounded-lg p-3 hover:border-gray-700/60 transition-all">
        {/* Header: Avatar + Username + Timestamp */}
        <div className="flex items-start gap-2.5 mb-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {comment.nickname.charAt(0).toUpperCase()}
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-medium text-gray-200 text-sm">{comment.nickname}</span>
              {!comment.approved && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  PENDING
                </span>
              )}
              <span className="font-mono text-[10px] text-gray-600">{formatDate(comment.created_at)}</span>
            </div>

            {/* Content */}
            <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-[42px] mt-1.5">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="font-mono text-xs text-gray-600 hover:text-cyan-400 transition-colors"
          >
            {showReplyForm ? '[ cancel ]' : '[ reply ]'}
          </button>

          {depth === 0 && replyCount > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="font-mono text-xs text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <span>{showReplies ? '▼' : '▶'}</span>
              <span>View {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-2.5 ml-[42px] p-2.5 bg-gray-900/40 border border-gray-800/60 rounded">
            <p className="text-[10px] text-gray-500 mb-2 font-mono">Replying to @{comment.nickname}</p>
            <CommentForm onSubmit={handleReplySubmit} />
          </div>
        )}
      </div>

      {/* Nested Replies - Collapsible */}
      {depth === 0 && showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-2.5 space-y-0 border-l border-gray-800/50 pl-2.5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={1}
              rootCommentId={comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
