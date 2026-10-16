'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { articlesApi } from '@/lib/api/articles';
import { categoriesApi } from '@/lib/api/categories';
import { tagsApi } from '@/lib/api/tags';
import type { Category } from '@/types/category';
import type { Tag } from '@/types/tag';
import ImageUploader from '@/components/admin/ImageUploader';
import ArticleLivePreview, { type EditorViewMode } from '@/components/admin/ArticleLivePreview';

export default function NewArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
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
    const fetchOptions = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          categoriesApi.list(),
          tagsApi.list(),
        ]);
        setCategories(categoriesRes.data);
        setTags(tagsRes.data);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, []);

  // Auto-generate slug from title (with Vietnamese diacritics support)
  const handleTitleChange = (title: string) => {
    const slug = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug,
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleSubmit = async (e: FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await articlesApi.create({ ...formData, status });
      router.push('/admin/articles');
    } catch (error: any) {
      alert(error.message || 'Failed to create article');
    } finally {
      setIsLoading(false);
    }
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n${markdown}` : markdown,
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setFormData((prev) => {
      const text = prev.content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      return {
        ...prev,
        content: before + markdown + after,
      };
    });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + markdown.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const selectedCategory = categories.find((cat) => cat.id === formData.category_id);
  const selectedTags = tags.filter((tag) => formData.tag_ids.includes(tag.id));

  return (
    <div className="w-full">
      {/* Top Header + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
            <span className="text-cyan-400">&gt;</span>
            <span>NEW_ARTICLE</span>
          </div>
          <h1 className="heading-1 text-gray-100 mb-1">New Article</h1>
          <p className="text-gray-500 text-sm">Create a new blog post with real-time live preview</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111827] border border-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ◫ Split (Live)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all ${
              viewMode === 'editor'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ✎ Editor Only
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all ${
              viewMode === 'preview'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            👁 Full Preview
          </button>
        </div>
      </div>

      {/* Main Grid: Editor Left + Live Preview Right */}
      <div
        className={
          viewMode === 'split'
            ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 items-start'
            : 'w-full'
        }
      >
        {/* Left Pane: Article Editor Form */}
        {viewMode !== 'preview' && (
          <form className="space-y-6 bg-[#111827]/40 border border-gray-800/80 rounded-xl p-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-mono text-gray-400 mb-2">
                <span className="text-gray-700">&gt;</span> title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
                placeholder="Enter article title"
              />
            </div>

            {/* Slug & Category in 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label htmlFor="category" className="block text-sm font-mono text-gray-400 mb-2">
                  <span className="text-gray-700">&gt;</span> category
                </label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-sm font-mono text-gray-400 mb-2">
                <span className="text-gray-700">&gt;</span> summary
              </label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm"
                placeholder="Brief summary of the article"
              />
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
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowImageUploader(!showImageUploader)}
                    className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/20 font-mono transition-colors"
                  >
                    {showImageUploader ? '✕ Hide Images' : '🖼️ + Add Images'}
                  </button>
                </div>
              </div>

              {showImageUploader && (
                <div className="mb-4 p-4 bg-[#0B0F19] border border-gray-800 rounded-lg">
                  <ImageUploader
                    folder="articles"
                    onInsertMarkdown={(markdown) => {
                      insertMarkdown(markdown);
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
                rows={22}
                className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-100 font-mono text-sm leading-relaxed"
                placeholder="Write your article content in markdown..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-mono text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Publishing...' : 'Publish'}
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
        )}

        {/* Right Pane: Real-Time Live Preview */}
        {viewMode !== 'editor' && (
          <ArticleLivePreview
            title={formData.title}
            slug={formData.slug}
            summary={formData.summary}
            content={formData.content}
            category={selectedCategory}
            selectedTags={selectedTags}
            status={formData.status}
            sticky={viewMode === 'split'}
          />
        )}
      </div>
    </div>
  );
}
