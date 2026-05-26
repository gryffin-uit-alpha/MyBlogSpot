'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { listAllComments, deleteComment } from '@/lib/api/admin';
import { api } from '@/lib/api/client';
import Link from 'next/link';

interface Comment {
  id: string;
  article_id: string;
  article_title: string;
  article_slug: string;
  nickname: string;
  content: string;
  approved: boolean;
  created_at: string;
}

export default function CommentsPage() {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchComments = async () => {
    if (!token) return;

    try {
      const response = await listAllComments(1, 100, token);
      setComments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [token]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (commentId: string) => {
    if (!token) return;

    try {
      await api.put(`/admin/comments/${commentId}/approve`, {});
      showToast('Comment approved', 'success');
      fetchComments();
    } catch (error) {
      console.error('Failed to approve comment:', error);
      showToast('Failed to approve comment', 'error');
    }
  };

  const handleReject = async (commentId: string) => {
    if (!confirm('Delete this comment permanently?')) return;
    if (!token) return;

    try {
      await deleteComment(commentId, token);
      showToast('Comment deleted', 'success');
      fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('Failed to delete comment', 'error');
    }
  };

  const pendingCount = comments.filter(c => !c.approved).length;
  const approvedCount = comments.filter(c => c.approved).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className={`px-6 py-3 rounded-lg border ${
            toast.type === 'success'
              ? 'bg-[#111827] border-cyan-500/50 text-cyan-400'
              : 'bg-[#111827] border-red-500/50 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              <span>{toast.type === 'success' ? '✓' : '✕'}</span>
              <span className="font-mono text-sm">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
          <span className="text-blue-400">&gt;</span>
          <span>MODERATION_PANEL</span>
        </div>
        <h1 className="heading-2 text-gray-100">Comments</h1>
        <p className="text-gray-500 mt-1">Moderate article comments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-amber-400 mb-1">{pendingCount}</div>
          <div className="text-xs text-gray-500 font-mono">PENDING APPROVAL</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-2xl font-bold text-cyan-400 mb-1">{approvedCount}</div>
          <div className="text-xs text-gray-500 font-mono">APPROVED</div>
        </div>
      </div>

      {/* Comments List */}
      <div className="glass-card p-6">
        <h2 className="heading-3 text-gray-100 mb-4">All Comments</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono text-sm">
            No comments yet
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`p-4 rounded-lg border ${
                  comment.approved
                    ? 'bg-gray-800/30 border-gray-800'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                        comment.approved
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {comment.approved ? 'APPROVED' : 'PENDING'}
                      </span>
                      <span className="text-gray-400 text-sm font-semibold">{comment.nickname}</span>
                      <span className="text-gray-600 text-xs">•</span>
                      <Link
                        href={`/articles/${comment.article_slug}`}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        {comment.article_title}
                      </Link>
                      <span className="text-gray-600 text-xs">•</span>
                      <span className="text-gray-600 text-xs font-mono">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{comment.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!comment.approved && (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 rounded text-xs font-mono transition-all"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(comment.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded text-xs font-mono transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
