'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { categoriesApi } from '@/lib/api/categories';
import { tagsApi } from '@/lib/api/tags';
import type { Category } from '@/types/category';
import type { Tag } from '@/types/tag';
import ImageUploader from '@/components/admin/ImageUploader';
import { ArticleContent } from '@/components/article/ArticleContent';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category_id: '',
    tag_ids: [] as string[],
    status: 'draft' as 'draft' | 'published',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [article, categoriesRes, tagsRes] = await Promise.all([
          articlesApi.get(articleId),
          categoriesApi.list(),
          tagsApi.list(),
        ]);

        setCategories(categoriesRes.data);
        setTags(tagsRes.data);

        setFormData({
          title: article.title,
          slug: article.slug,
          summary: article.summary || '',
          content: article.content,
          category_id: article.category?.id || article.category_id || '',
          tag_ids: article.tags ? article.tags.map((t) => t.id) : [],
          status: article.status,
        });
      } catch (error) {
        console.error('Failed to fetch article:', error);
        alert('Failed to load article');
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [articleId]);

  const handleTagToggle = (tagId: string) => {
    setFormData({
      ...formData,
      tag_ids: formData.tag_ids.includes(tagId)
        ? formData.tag_ids.filter((id) => id !== tagId)
        : [...formData.tag_ids, tagId],
    });
  };

  const handleSubmit = async (e: FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await articlesApi.update(articleId, { ...formData, status });
      router.push('/admin/articles');
    } catch (error: any) {
      alert(error.message || 'Failed to update article');
    } finally {
      setIsLoading(false);
    }
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setFormData({
      ...formData,
      content: before + markdown + after,
    });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + markdown.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
          <span className="text-cyan-400">&gt;</span>
          <span>EDIT_ARTICLE</span>
        </div>
        <h1 className="heading-1 text-gray-100 mb-2">Edit Article</h1>
        <p className="text-gray-500">Update your blog post</p>
      </div>

      <form className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-mono text-gray-400 mb-2">
            <span className="text-gray-700">&gt;</span> title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
            placeholder="Enter article title"
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-mono text-gray-400 mb-2">
            <span className="text-gray-700">&gt;</span> slug *
          </label>
          <input
            id="slug"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
            placeholder="article-url-slug"
          />
          <p className="mt-1 text-xs font-mono text-gray-600">URL: /articles/{formData.slug}</p>
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="summary" className="block text-sm font-mono text-gray-400 mb-2">
            <span className="text-gray-700">&gt;</span> summary *
          </label>
          <textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            required
            rows={3}
            className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
            placeholder="Brief summary of the article"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-mono text-gray-400 mb-2">
            <span className="text-gray-700">&gt;</span> category *
          </label>
          <select
            id="category"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            required
            className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            <span className="text-gray-700">&gt;</span> tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className={`px-3 py-1 text-sm rounded font-mono transition-colors ${
                  formData.tag_ids.includes(tag.id)
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="content" className="block text-sm font-mono text-gray-400">
              <span className="text-gray-700">&gt;</span> content * (Markdown)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImageUploader(!showImageUploader)}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {showImageUploader ? 'Hide Images' : '+ Add Images'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {previewMode ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

          {showImageUploader && (
            <div className="mb-4 p-4 bg-[#0B0F19] border border-gray-800 rounded-lg">
              <ImageUploader
                folder="articles"
                onInsertMarkdown={(markdown) => {
                  insertMarkdown(markdown);
                  setShowImageUploader(false);
                }}
              />
            </div>
          )}

          <textarea
            ref={contentRef}
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={20}
            className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
            placeholder="Write your article content in markdown..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-mono text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Updating...' : 'Update & Publish'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-mono text-sm hover:bg-gray-700 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/articles')}
            className="px-6 py-3 bg-transparent border border-gray-800 text-gray-400 rounded-lg font-mono text-sm hover:border-gray-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B0F19] border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded">
                    PREVIEW MODE
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-100">{formData.title || 'Untitled Article'}</h2>
              </div>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-gray-400 hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {formData.summary && (
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  {formData.summary}
                </p>
              )}
              <ArticleContent content={formData.content} />
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setPreviewMode(false)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-mono text-sm transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
