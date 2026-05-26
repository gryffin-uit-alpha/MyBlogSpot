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
          className="flex flex-col items-center gap-8 pt-8"
        >
          {/* Main CTA Button */}
          {!loading && settings && (
            <Link
              href={settings.hero_cta_link || '/articles'}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative px-10 py-5 bg-[#111827] border-2 border-cyan-500/30 hover:border-cyan-400/60 rounded-lg font-mono text-lg font-semibold text-cyan-400 transition-all group-hover:scale-105">
                <span className="flex items-center gap-3">
                  <span className="text-gray-600">[</span>
                  <span className="group-hover:text-cyan-300 transition-colors">
                    {settings.hero_cta_text || 'Explore'}
                  </span>
                  <span className="text-gray-600">]</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    →
                  </motion.span>
                </span>
              </div>
            </Link>
          )}

          {/* Scroll Indicator - Points to button above */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="text-gray-600 text-xs font-mono flex flex-col items-center gap-2"
            >
              <span>Start reading</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>

            {/* Now Playing Widget - Below scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-4"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/5 border border-purple-500/20 rounded-md font-mono text-xs text-purple-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>♪ Now Playing: Lofi Hip Hop Radio</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

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
