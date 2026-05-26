'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getArticles } from '@/lib/api/articles';
import type { ArticleListItem } from '@/types/article';
import type { PaginationMeta } from '@/types/api';

type MoodFilter = 'all' | 'critical' | 'ambient' | 'overclock';

const moodConfig = {
  critical: { label: 'CRITICAL', color: '#EF4444', desc: 'Heavy thoughts' },
  ambient: { label: 'AMBIENT', color: '#10B981', desc: 'Chill life' },
  overclock: { label: 'OVERCLOCK', color: '#F59E0B', desc: 'High energy' },
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MoodFilter>('all');
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await getArticles({ page: 1, per_page: 50 });
        if (response.success && response.data) {
          setArticles(response.data);
          setMeta(response.meta || null);
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getMoodFromTags = (article: ArticleListItem): keyof typeof moodConfig | null => {
    if (!article.tags) return null;
    const tagNames = article.tags.map(t => t.name.toLowerCase());
    if (tagNames.includes('critical')) return 'critical';
    if (tagNames.includes('ambient')) return 'ambient';
    if (tagNames.includes('overclock')) return 'overclock';
    return null;
  };

  const articleHasMood = (article: ArticleListItem, mood: MoodFilter): boolean => {
    if (!article.tags) return false;
    const tagNames = article.tags.map(t => t.name.toLowerCase());
    return tagNames.includes(mood);
  };

  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter(a => articleHasMood(a, filter));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '.');
  };

  const estimateReadTime = (summary?: string) => {
    if (!summary) return '0ms';
    const words = summary.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return `${minutes * 1000}ms`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      <div className="container-wide mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4 font-mono text-xs text-gray-500">
            <span className="text-cyan-400">&gt;</span>
            <span>DATABASE_QUERY</span>
            <span className="text-gray-700">|</span>
            <span>{filteredArticles.length} RECORDS_FOUND</span>
          </div>

          <h1 className="heading-1 mb-4">
            <span className="text-gradient-tech">Log Files</span>
          </h1>

          <p className="body-large max-w-2xl">
            A chronological database of personal stories, reflections, and journal entries.
            Filter by mood vibe to explore different mental states.
          </p>
        </motion.div>

        {/* Mood Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 flex flex-wrap items-center gap-3"
        >
          <span className="font-mono text-xs text-gray-500">FILTER_BY_VIBE:</span>

          <button
            onClick={() => setFilter('all')}
            className={`
              px-4 py-2 rounded-md font-mono text-xs font-semibold transition-all
              ${filter === 'all'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-gray-800/50 border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }
            `}
          >
            [ ALL ]
          </button>

          {Object.entries(moodConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as MoodFilter)}
              className={`
                px-4 py-2 rounded-md font-mono text-xs font-semibold transition-all
                ${filter === key
                  ? `border`
                  : 'bg-gray-800/50 border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }
              `}
              style={filter === key ? {
                backgroundColor: `${config.color}20`,
                borderColor: `${config.color}80`,
                color: config.color
              } : {}}
            >
              [ {config.label} ]
            </button>
          ))}
        </motion.div>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-mono text-sm text-gray-500">Loading database...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-gray-500">No records found for this filter.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {filteredArticles.map((article, idx) => {
              const mood = getMoodFromTags(article);
              const moodStyle = mood ? moodConfig[mood] : null;

              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Link href={`/articles/${article.slug}`}>
                    <div className="group glass-card p-6 hover:border-cyan-500/30 transition-all">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h2 className="heading-3 text-gray-100 group-hover:text-cyan-400 transition-colors mb-2">
                            {article.title}
                          </h2>
                        </div>

                        {/* Mood Badge */}
                        {moodStyle && (
                          <div
                            className="px-3 py-1 rounded border font-mono text-xs font-semibold"
                            style={{
                              backgroundColor: `${moodStyle.color}20`,
                              borderColor: `${moodStyle.color}50`,
                              color: moodStyle.color
                            }}
                          >
                            [ {moodStyle.label} ]
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="body-base text-gray-400 mb-4 line-clamp-2">
                        {article.summary}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 font-mono text-xs text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-700">date:</span>
                          <span className="text-gray-500">{formatDate(article.published_at || article.created_at)}</span>
                        </span>

                        <span className="text-gray-800">|</span>

                        <span className="flex items-center gap-2">
                          <span className="text-gray-700">duration_ms:</span>
                          <span className="text-gray-500">{estimateReadTime(article.summary)}</span>
                        </span>

                        <span className="text-gray-800">|</span>

                        <span className="flex items-center gap-2">
                          <span className="text-gray-700">views:</span>
                          <span className="text-gray-500">{article.view_count}</span>
                        </span>

                        {article.category && (
                          <>
                            <span className="text-gray-800">|</span>
                            <span className="flex items-center gap-2">
                              <span className="text-gray-700">category:</span>
                              <span className="text-purple-400">{article.category.name}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {article.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-xs font-mono text-gray-500"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Stats Footer */}
        {!loading && filteredArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 pt-8 border-t border-gray-800"
          >
            <div className="flex items-center justify-between font-mono text-xs text-gray-600">
              <span>
                <span className="text-gray-700">total_records:</span> {filteredArticles.length}
              </span>
              <span>
                <span className="text-gray-700">filter:</span> {filter.toUpperCase()}
              </span>
              <span>
                <span className="text-gray-700">status:</span> <span className="text-green-400">ACTIVE</span>
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
