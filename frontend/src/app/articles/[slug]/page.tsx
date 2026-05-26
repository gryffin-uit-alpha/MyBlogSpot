'use client';

import { use, useEffect, useState, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { getArticle, trackView } from '@/lib/api/articles';
import { listComments, createComment, type Comment } from '@/lib/api/comments';
import { ArticleContent } from '@/components/article/ArticleContent';
import { RelatedArticles } from '@/components/article/RelatedArticles';
import { ShareButtons } from '@/components/article/ShareButtons';
import type { Article } from '@/types/article';

// Lazy load comment components
const CommentForm = lazy(() => import('@/components/comment/CommentForm'));
const CommentList = lazy(() => import('@/components/comment/CommentList'));

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Scroll progress for waveform
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await getArticle(slug);

        if (response.success && response.data) {
          setArticle(response.data);

          // Track view after article loads
          try {
            await trackView(response.data.id);
          } catch (err) {
            console.error('Failed to track view:', err);
          }
        } else {
          setError(response.error?.message || 'Article not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!slug) return;

      try {
        setLoadingComments(true);
        const response = await listComments(slug);

        if (response.success && response.data) {
          const countWithReplies = (comments: Comment[]): number => {
            return comments.reduce((total, comment) => {
              return total + 1 + (comment.replies?.length || 0);
            }, 0);
          };

          setComments(response.data);
          setCommentsTotal(countWithReplies(response.data));
        } else {
          setComments([]);
          setCommentsTotal(0);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
        setComments([]);
        setCommentsTotal(0);
      } finally {
        setLoadingComments(false);
      }
    };

    if (slug && article) {
      fetchComments();
    }
  }, [slug, article]);

  const handleCommentSubmit = async (nickname: string, content: string) => {
    try {
      const response = await createComment(slug, { nickname, content });
      if (response.success && response.data) {
        setComments([response.data, ...comments]);
        setCommentsTotal(commentsTotal + 1);
        setShowCommentForm(false);
      } else {
        throw new Error('Failed to create comment');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleReply = async (parentId: string, nickname: string, content: string) => {
    try {
      const response = await createComment(slug, { nickname, content, parent_id: parentId });
      if (response.success && response.data) {
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data!]
            };
          }
          return comment;
        }));
        setCommentsTotal(commentsTotal + 1);
      }
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 font-mono text-sm text-gray-500">Booting article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center container-narrow px-6">
          <h1 className="heading-2 text-gray-100 mb-4">404: Record Not Found</h1>
          <p className="body-base text-gray-500 mb-8">{error || 'The article you are looking for does not exist in the database.'}</p>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg font-mono text-sm hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
          >
            <span>←</span>
            <span>[ Back_to_Database ]</span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(article.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 relative">
      {/* Waveform Progress Bar - Left Sidebar */}
      <motion.div
        className="fixed left-8 top-1/2 -translate-y-1/2 w-1 h-64 bg-gray-800 rounded-full overflow-hidden z-20 hidden lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          style={{ scaleY }}
          className="w-full h-full bg-gradient-to-b from-[#22D3EE] via-[#8B5CF6] to-[#F59E0B] origin-top"
        />
      </motion.div>

      {/* Main Content - Balanced Layout */}
      <article className="max-w-[1440px] mx-auto px-6 py-12 relative">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
          {/* Main Article Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="min-w-0"
          >
            {/* Breadcrumb */}
            <div className="mb-5">
              <Link href="/articles" className="font-mono text-xs text-gray-600 hover:text-cyan-400 transition-colors">
                <span className="text-gray-700">&gt;</span> cd ../log_files
              </Link>
            </div>

            {/* Header */}
            <div className="mb-7">
              <h1 className="heading-1 mb-3">{article.title}</h1>

              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-gray-700">published:</span>
                  <time dateTime={article.published_at || article.created_at} className="text-gray-500">
                    {formattedDate}
                  </time>
                </span>

                <span className="text-gray-800">|</span>

                <span className="flex items-center gap-2">
                  <span className="text-gray-700">views:</span>
                  <span className="text-gray-500">{article.view_count}</span>
                </span>

                {article.category && (
                  <>
                    <span className="text-gray-800">|</span>
                    <Link
                      href={`/categories/${article.category.slug}`}
                      className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                    >
                      <span className="text-gray-700">category:</span>
                      <span className="text-purple-400">{article.category.name}</span>
                    </Link>
                  </>
                )}
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="px-2.5 py-1 bg-gray-800/50 border border-gray-700 hover:border-gray-600 text-gray-500 hover:text-gray-400 rounded font-mono text-xs transition-all"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Content - Terminal Pane Style */}
            <div className="glass-card p-6 lg:p-9 mb-8 border-l-4 border-cyan-500/50">
              <ArticleContent content={article.content} />

              {/* Share Buttons */}
              <ShareButtons title={article.title} slug={article.slug} />
            </div>

            {/* Related Articles */}
            <RelatedArticles currentSlug={article.slug} />

            {/* Comments Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-gray-100 font-heading">
                  <span className="text-gray-700">&gt;</span> Comments <span className="text-gray-500 font-mono text-sm ml-2">({commentsTotal})</span>
                </h2>
                {!showCommentForm && (
                  <button
                    onClick={() => setShowCommentForm(true)}
                    className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded font-mono text-xs hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
                  >
                    [ + Add_Comment ]
                  </button>
                )}
              </div>

              {showCommentForm && (
                <div className="mb-5 p-3.5 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-xs text-gray-400">Write a comment:</h3>
                    <button
                      onClick={() => setShowCommentForm(false)}
                      className="text-gray-600 hover:text-gray-400 font-mono text-xs transition-colors"
                    >
                      [ ESC ]
                    </button>
                  </div>
                  <Suspense fallback={<div className="text-gray-500 font-mono text-sm">Loading form...</div>}>
                    <CommentForm onSubmit={handleCommentSubmit} />
                  </Suspense>
                </div>
              )}

              <div className="space-y-0">
                {loadingComments ? (
                  <div className="text-center py-8 text-gray-600 font-mono text-sm">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 font-mono text-sm">
                    No comments yet. Be the first to comment.
                  </div>
                ) : (
                  <Suspense fallback={<div className="text-center py-8 text-gray-600 font-mono text-sm">Loading comments...</div>}>
                    <CommentList comments={comments} total={commentsTotal} onReply={handleReply} />
                  </Suspense>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 rounded-lg font-mono text-sm transition-all"
              >
                <span>←</span>
                <span>[ Back_to_Database ]</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Sidebar - Utility Rail */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden xl:block"
          >
            <div className="sticky top-24 space-y-3">
              {/* System Status */}
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wide">System</span>
                </div>
                <div className="space-y-1 text-[10px] font-mono text-gray-600">
                  <div className="flex justify-between">
                    <span>CPU</span>
                    <span className="text-green-400">12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory</span>
                    <span className="text-cyan-400">2.1GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="text-gray-500">24d</span>
                  </div>
                </div>
              </div>

              {/* Reading Progress */}
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wide">Progress</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    style={{ scaleX: scrollYProgress }}
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 origin-left"
                  />
                </div>
              </div>

              {/* Reading Stats */}
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wide">Stats</span>
                </div>
                <div className="space-y-1 text-[10px] font-mono text-gray-600">
                  <div className="flex justify-between">
                    <span>Views</span>
                    <span className="text-gray-400">{article.view_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comments</span>
                    <span className="text-gray-400">{commentsTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Read Time</span>
                    <span className="text-gray-400">{Math.ceil(article.content.length / 1000)} min</span>
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wide">Stack</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags?.slice(0, 3).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="px-2 py-0.5 bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 text-gray-400 hover:text-purple-400 rounded text-[10px] font-mono transition-all"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Now Playing */}
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wide">Playing</span>
                </div>
                <div className="text-xs font-medium text-gray-300 mb-1">Lofi Hip Hop</div>
                <div className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Spotify</span>
                </div>
              </div>

              {/* Category */}
              {article.category && (
                <div className="glass-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wide">Category</span>
                  </div>
                  <Link
                    href={`/categories/${article.category.slug}`}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                      {article.category.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
                      {article.category.name}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      </article>
    </div>
  );
}
