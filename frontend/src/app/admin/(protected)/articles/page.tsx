'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { articlesApi } from '@/lib/api/articles';
import type { ArticleListItem } from '@/types/article';

export default function ArticlesListPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      const response = await articlesApi.list({ page: 1, per_page: 50 });
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await articlesApi.delete(id);
      setArticles(articles.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      alert('Failed to delete article');
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (filter === 'all') return true;
    return article.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
            <span className="text-purple-400">&gt;</span>
            <span>CONTENT_MANAGEMENT</span>
          </div>
          <h1 className="heading-2 text-gray-100">Articles</h1>
          <p className="text-gray-500 mt-1">Manage your blog posts</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-mono text-sm font-semibold transition-transform group-hover:scale-105">
            + NEW_ARTICLE
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'published', 'draft'] as const).map((status) => {
          const count = status === 'all' ? articles.length : articles.filter((a) => a.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all border
                ${filter === status
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-gray-800/30 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }
              `}
            >
              [ {status.toUpperCase()} ]
              <span className="ml-2 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Articles Table */}
      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-mono text-sm">Loading articles...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500 font-mono text-sm">No articles found. Create your first one!</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    TITLE
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    CATEGORY
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    VIEWS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    PUBLISHED
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredArticles.map((article, idx) => (
                  <motion.tr
                    key={article.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="group hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-cyan-500"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{article.title}</div>
                      <div className="text-sm text-cyan-500/70 font-mono">/{article.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {article.category?.name || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-mono font-semibold border
                          ${article.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }
                        `}
                      >
                        {article.status === 'published' ? '● LIVE' : '○ DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{article.view_count}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono space-x-4">
                      {article.status === 'published' && (
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="text-slate-600 hover:text-purple-400 transition-colors"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-slate-600 hover:text-cyan-400 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ id: article.id, title: article.title })}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#111827] border border-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-2 font-heading">Delete Article</h3>
                <p className="text-gray-400 text-sm mb-1">Are you sure you want to delete</p>
                <p className="text-cyan-400 font-semibold">&quot;{deleteConfirm.title}&quot;?</p>
                <p className="text-gray-500 text-xs mt-2">This action cannot be undone.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded font-mono text-sm hover:bg-gray-700 hover:border-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-mono text-sm hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
