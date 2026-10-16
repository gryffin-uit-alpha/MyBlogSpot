'use client';

import { ArticleContent } from '@/components/article/ArticleContent';
import type { Category } from '@/types/category';
import type { Tag } from '@/types/tag';

export type EditorViewMode = 'split' | 'editor' | 'preview';

interface ArticleLivePreviewProps {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category?: Category;
  selectedTags: Tag[];
  status: 'draft' | 'published';
  sticky?: boolean;
}

export default function ArticleLivePreview({
  title,
  slug,
  summary,
  content,
  category,
  selectedTags,
  status,
  sticky = true,
}: ArticleLivePreviewProps) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readTimeMinutes = Math.max(1, Math.ceil((content || '').length / 1000));

  return (
    <div
      className={`w-full bg-[#0B0F19] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-2xl ${
        sticky ? 'xl:sticky xl:top-24 xl:max-h-[calc(100vh-7.5rem)]' : ''
      }`}
    >
      {/* Top Preview Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#111827] border-b border-gray-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono rounded">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            LIVE_PREVIEW
          </span>
          <span className="text-xs font-mono text-gray-500 truncate">
            /articles/{slug || 'your-article-slug'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-gray-500">{readTimeMinutes} min read</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-mono rounded border ${
              status === 'published'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {status === 'published' ? '● PUBLISHED' : '○ DRAFT'}
          </span>
        </div>
      </div>

      {/* Live Rendered Article Body */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        {/* Breadcrumb Simulation */}
        <div className="font-mono text-xs text-gray-500">
          <span className="text-cyan-400">&gt;</span> cd ../log_files
        </div>

        {/* Article Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 break-words">
            {title.trim() ? title : <span className="text-gray-600 italic">Untitled Article...</span>}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">published:</span>
              <span className="text-gray-200">{formattedDate}</span>
            </span>

            <span className="text-gray-700">|</span>

            <span className="flex items-center gap-1.5">
              <span className="text-gray-500">read_time:</span>
              <span className="text-gray-200">{readTimeMinutes} min</span>
            </span>

            {category && (
              <>
                <span className="text-gray-700">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-500">category:</span>
                  <span className="text-purple-300 font-medium">{category.name}</span>
                </span>
              </>
            )}
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 rounded font-mono text-xs"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Summary Callout */}
        {summary.trim() && (
          <div className="p-4 bg-[#111827]/70 border-l-2 border-purple-500/60 rounded-r-lg text-gray-300 text-sm leading-relaxed">
            {summary}
          </div>
        )}

        {/* Main Markdown Terminal Pane */}
        <div className="glass-card p-6 lg:p-8 border-l-4 border-cyan-500 bg-[#0e1628]/80 rounded-lg min-h-[320px]">
          {content.trim() ? (
            <ArticleContent content={content} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-600 font-mono text-sm space-y-2">
              <span className="text-2xl">📝</span>
              <p>Start typing Markdown on the left to see live preview here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
