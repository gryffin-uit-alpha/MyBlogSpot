'use client';

import { use, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getArticle, trackView } from '@/lib/api/articles';
import { listComments, createComment, type Comment } from '@/lib/api/comments';
import { ArticleContent } from '@/components/article/ArticleContent';
import CommentForm from '@/components/comment/CommentForm';
import CommentList from '@/components/comment/CommentList';
import type { Article } from '@/types/article';

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);

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
            // Silently fail view tracking
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
          setComments(response.data);
          setCommentsTotal(response.meta?.total || response.data.length);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
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
        setComments([...comments, response.data]);
        setCommentsTotal(commentsTotal + 1);
      }
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The article you are looking for does not exist.'}</p>
          <Link
            href="/articles"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Articles
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
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-gray-600 mb-4">
          <time dateTime={article.published_at || article.created_at}>
            {formattedDate}
          </time>

          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {article.view_count} views
          </span>

          {article.category && (
            <Link
              href={`/categories/${article.category.slug}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {article.category.name}
            </Link>
          )}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <ArticleContent content={article.content} />
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Leave a Comment</h3>
          <CommentForm onSubmit={handleCommentSubmit} />
        </div>

        <div>
          {loadingComments ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : (
            <CommentList comments={comments} total={commentsTotal} />
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          href="/articles"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to all articles
        </Link>
      </div>
    </article>
  );
}
