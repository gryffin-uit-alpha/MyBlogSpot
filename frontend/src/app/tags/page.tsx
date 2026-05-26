'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTags } from '@/lib/api/tags';
import type { Tag } from '@/types/tag';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await getTags();
        setTags(data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Sort tags by article count (descending)
  const sortedTags = [...tags].sort((a, b) => (b.article_count || 0) - (a.article_count || 0));

  // Rank badge logic (like LoL ranks)
  const getRankBadge = (count: number) => {
    if (count >= 10) return { rank: 'S+', color: '#FFD700' }; // Gold
    if (count >= 7) return { rank: 'S', color: '#8B5CF6' }; // Purple
    if (count >= 5) return { rank: 'A', color: '#22D3EE' }; // Cyan
    if (count >= 3) return { rank: 'B', color: '#10B981' }; // Green
    return { rank: 'C', color: '#6B7280' }; // Gray
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      <div className="container-wide mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4 font-mono text-xs text-gray-500">
            <span className="text-amber-400">&gt;</span>
            <span>cat /match_history/tags.json</span>
          </div>

          <h1 className="heading-1 mb-4">
            <span className="text-gradient-music">Match History</span>
          </h1>

          <p className="body-large max-w-2xl">
            All story tags ranked by frequency. Think of them as achievements —
            the more stories tagged, the higher the rank.
          </p>
        </motion.div>

        {/* Tags Cloud */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-mono text-sm text-gray-500">Loading tags...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-20">
            <div className="glass-card p-12 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="heading-3 text-gray-300 mb-2">No Tags Yet</h3>
              <p className="body-small text-gray-500">
                Tags will appear here once articles are labeled with keywords.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {sortedTags.map((tag, idx) => {
              const { rank, color } = getRankBadge(tag.article_count || 0);

              return (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.02 }}
                >
                  <Link href={`/tags/${tag.slug}`}>
                    <div className="group glass-card px-4 py-2.5 hover:border-amber-500/40 transition-all inline-flex items-center gap-2.5">
                      {/* Rank Badge (LoL style) */}
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs border-2 flex-shrink-0"
                        style={{
                          backgroundColor: `${color}20`,
                          borderColor: `${color}50`,
                          color: color
                        }}
                      >
                        {rank}
                      </div>

                      {/* Tag Name */}
                      <span className="font-mono text-sm text-gray-300 group-hover:text-amber-400 transition-colors">
                        #{tag.name}
                      </span>

                      {/* Article Count */}
                      <span className="font-mono text-xs text-gray-600">
                        ({tag.article_count || 0})
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Rank Legend */}
        {!loading && tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 pt-6 border-t border-gray-800"
          >
            <div className="flex items-center gap-2 mb-3 font-mono text-xs text-gray-600">
              <span className="text-gray-700">&gt;</span>
              <span>RANK_SYSTEM</span>
            </div>

            <div className="flex flex-wrap gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#FFD700] bg-opacity-20 border-2 border-[#FFD700] border-opacity-50 flex items-center justify-center text-[#FFD700] font-bold text-xs">S+</div>
                <span className="text-gray-500">10+ stories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#8B5CF6] bg-opacity-20 border-2 border-[#8B5CF6] border-opacity-50 flex items-center justify-center text-[#8B5CF6] font-bold text-xs">S</div>
                <span className="text-gray-500">7-9 stories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#22D3EE] bg-opacity-20 border-2 border-[#22D3EE] border-opacity-50 flex items-center justify-center text-[#22D3EE] font-bold text-xs">A</div>
                <span className="text-gray-500">5-6 stories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#10B981] bg-opacity-20 border-2 border-[#10B981] border-opacity-50 flex items-center justify-center text-[#10B981] font-bold text-xs">B</div>
                <span className="text-gray-500">3-4 stories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#6B7280] bg-opacity-20 border-2 border-[#6B7280] border-opacity-50 flex items-center justify-center text-[#6B7280] font-bold text-xs">C</div>
                <span className="text-gray-500">1-2 stories</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
