'use client';

import { ArticleContent } from '@/components/article/ArticleContent';

export interface HomepagePreviewData {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  about_title: string;
  about_content: string;
}

interface HomepageLivePreviewProps {
  data: HomepagePreviewData;
  sticky?: boolean;
}

export default function HomepageLivePreview({
  data,
  sticky = true,
}: HomepageLivePreviewProps) {
  return (
    <div
      className={`bg-[#0B0F19] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-2xl ${
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
            Homepage (/)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 text-[11px] font-mono rounded border bg-purple-500/10 text-purple-300 border-purple-500/30">
            HERO + ABOUT
          </span>
        </div>
      </div>

      {/* Live Rendered Homepage Canvas */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-[#0B0F19] relative">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 left-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* System Online Status */}
        <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span>SYSTEM_ONLINE • UPTIME: {new Date().getFullYear()}</span>
        </div>

        {/* Hero Section Preview */}
        <div className="space-y-4">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            <span className="text-gradient-tech">
              {data.hero_title.trim() ? data.hero_title : 'Welcome to my digital stage'}
            </span>
          </h1>

          <p className="text-gray-300 text-sm lg:text-base leading-relaxed whitespace-pre-line">
            {data.hero_subtitle.trim()
              ? data.hero_subtitle
              : 'Personal stories from a DevOps engineer who codes, plays music, and games.'}
          </p>

          {/* CTA Button Preview */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#111827] border border-cyan-500/40 rounded-lg font-mono text-sm font-semibold text-cyan-400 shadow-md shadow-cyan-950/40">
              <span className="text-gray-500">[</span>
              <span>{data.hero_cta_text || 'Explore'}</span>
              <span className="text-gray-500">]</span>
              <span className="text-cyan-300">→</span>
              <span className="text-[10px] text-gray-500 font-normal ml-1">
                ({data.hero_cta_link || '/articles'})
              </span>
            </div>
          </div>
        </div>

        {/* Identity Cards Mini Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="glass-card p-4 border border-cyan-500/20 rounded-lg">
            <div className="text-xl mb-1 text-cyan-400">▲</div>
            <h4 className="text-xs font-semibold text-cyan-400 font-heading">Platform Engineer</h4>
            <p className="text-[11px] text-gray-500 font-mono">k8s • terraform • docker</p>
          </div>
          <div className="glass-card p-4 border border-purple-500/20 rounded-lg">
            <div className="text-xl mb-1 text-purple-400">♪</div>
            <h4 className="text-xs font-semibold text-purple-400 font-heading">Musician</h4>
            <p className="text-[11px] text-gray-500 font-mono">guitar • piano • lofi</p>
          </div>
          <div className="glass-card p-4 border border-amber-500/20 rounded-lg">
            <div className="text-xl mb-1 text-amber-400">⚔</div>
            <h4 className="text-xs font-semibold text-amber-400 font-heading">Competitive Gamer</h4>
            <p className="text-[11px] text-gray-500 font-mono">Jungler • Solo Q</p>
          </div>
        </div>

        {/* About Section Preview */}
        <div className="pt-6 border-t border-gray-800/80 space-y-4">
          <h2 className="text-xl lg:text-2xl font-bold text-cyan-400 font-heading">
            {data.about_title.trim() ? data.about_title : 'About Me'}
          </h2>

          <div className="glass-card p-6 border-l-4 border-purple-500/60 bg-[#0e1628]/80 rounded-lg min-h-[160px]">
            {data.about_content.trim() ? (
              <ArticleContent content={data.about_content} />
            ) : (
              <div className="text-center py-8 text-gray-600 font-mono text-xs">
                Write markdown in the &quot;About Content&quot; field to see live rendering here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
