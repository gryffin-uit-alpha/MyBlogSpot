'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface HomepageSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  about_title: string;
  about_content: string;
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/homepage');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch homepage settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 relative overflow-hidden">
      {/* Animated Matrix Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 matrix-grid"></div>
      </div>

      {/* Ambient Glow Particles */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Interactive Waveform Cursor Effect */}
      <motion.div
        className="fixed w-96 h-96 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      />

      <div className="relative container-wide min-h-screen flex flex-col justify-center py-20">
        {/* Status Indicator */}
        <motion.div
          {...fadeInUp}
          className="flex items-center gap-3 font-mono text-xs text-gray-500 mb-8"
        >
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span>SYSTEM_ONLINE • UPTIME: {new Date().getFullYear()}</span>
        </motion.div>

        {/* Main Introduction Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8 mb-16"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Headline */}
              <h1 className="heading-hero">
                <span className="text-gradient-tech">{settings?.hero_title || 'Welcome'}</span>
              </h1>

              {/* Subtitle */}
              <div className="body-large leading-relaxed">
                <p className="text-gray-300 whitespace-pre-line">
                  {settings?.hero_subtitle || 'Your digital space'}
                </p>
              </div>

              {/* About Section */}
              {settings?.about_content && (
                <div className="pt-8 border-t border-gray-800">
                  <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                    {settings?.about_title || 'About'}
                  </h2>
                  <div className="prose prose-invert prose-cyan max-w-none text-gray-300">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkGfm]}
                    >
                      {settings.about_content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Identity Cards - Compact Version */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 clear-both">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 border-cyan-500/20 hover:border-cyan-500/40"
            >
              <div className="text-3xl mb-3 text-cyan-400">▲</div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2 font-heading">Platform Engineer</h3>
              <p className="text-sm text-gray-500 font-mono">k8s • terraform • docker</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 border-purple-500/20 hover:border-purple-500/40"
            >
              <div className="text-3xl mb-3 text-purple-400">♪</div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2 font-heading">Musician</h3>
              <p className="text-sm text-gray-500 font-mono">guitar • piano • lofi</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 border-amber-500/20 hover:border-amber-500/40"
            >
              <div className="text-3xl mb-3 text-amber-400">⚔</div>
              <h3 className="text-lg font-semibold text-amber-400 mb-2 font-heading">Competitive Gamer</h3>
              <p className="text-sm text-gray-500 font-mono">Jungler • Solo Q • Tilted</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Call to Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col items-center gap-5 pt-8"
        >
          {/* Start reading indicator pointing DOWN into Explore button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="text-gray-400 text-xs font-mono tracking-wider uppercase flex items-center gap-1.5">
              <span className="text-cyan-400">{'//'}</span> Start reading
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="text-cyan-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Main CTA Button */}
          {!loading && settings && (
            <Link
              href={settings.hero_cta_link || '/articles'}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative px-10 py-5 bg-[#111827] border-2 border-cyan-500/40 hover:border-cyan-400 rounded-lg font-mono text-lg font-semibold text-cyan-400 transition-all group-hover:scale-105 shadow-lg shadow-cyan-950/40">
                <span className="flex items-center gap-3">
                  <span className="text-gray-500">[</span>
                  <span className="group-hover:text-cyan-300 transition-colors">
                    {settings.hero_cta_text || 'Explore'}
                  </span>
                  <span className="text-gray-500">]</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="text-cyan-300"
                  >
                    →
                  </motion.span>
                </span>
              </div>
            </Link>
          )}

          {/* Hotkey Hint below Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="text-gray-500 text-xs font-mono flex items-center gap-2 pt-2"
          >
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-700/80 rounded text-[11px] text-cyan-400 font-mono">
              /
            </kbd>
            <span>to search</span>
            <span className="text-gray-700">•</span>
            <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-700/80 rounded text-[11px] text-cyan-400 font-mono">
              [&gt;_]
            </kbd>
            <span>for terminal</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Cyber Audio Pill (Now Playing Widget) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group select-none"
      >
        <div className="relative flex items-center gap-3 px-4 py-2.5 bg-[#0B0F19]/85 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/60 rounded-full shadow-lg shadow-purple-950/40 transition-all hover:scale-105">
          {/* Animated Equalizer Waveform Bars */}
          <div className="flex items-end gap-0.5 h-3.5 w-3.5">
            <motion.span
              animate={{ height: ['30%', '100%', '40%', '80%', '30%'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-0.5 bg-purple-400 rounded-full"
            />
            <motion.span
              animate={{ height: ['80%', '30%', '90%', '40%', '80%'] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
              className="w-0.5 bg-cyan-400 rounded-full"
            />
            <motion.span
              animate={{ height: ['40%', '90%', '20%', '100%', '40%'] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="w-0.5 bg-purple-400 rounded-full"
            />
            <motion.span
              animate={{ height: ['100%', '40%', '70%', '30%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
              className="w-0.5 bg-cyan-300 rounded-full"
            />
          </div>

          {/* Pulse LED indicator */}
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </div>

          {/* Track Text */}
          <div className="flex flex-col">
            <span className="font-mono text-[11px] text-purple-300 font-medium tracking-tight">
              ♪ Lofi Hip Hop Radio
            </span>
            <span className="font-mono text-[9px] text-gray-500 group-hover:text-gray-400 transition-colors">
              Ambient Stream • D Minor
            </span>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>

  );
}
