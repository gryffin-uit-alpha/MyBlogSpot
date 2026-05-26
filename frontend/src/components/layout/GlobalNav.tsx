'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import SearchBar from '@/components/search/SearchBar';

const navItems = [
  { label: 'Log_Files', href: '/articles', color: 'cyan' },
  { label: 'Synthesizer', href: '/categories', color: 'purple' },
  { label: 'Match_History', href: '/tags', color: 'amber' },
  { label: 'Environment', href: '/about', color: 'cyan' },
];

export function GlobalNav() {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> System initialized. Type "help" for commands.'
  ]);

  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setHidden(true);
        } else {
          setHidden(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [lastScrollY]);

  const handleTerminalCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    let output = '';

    switch (command) {
      case 'help':
        output = 'Available: help, about, mood, stats, socials, clear';
        break;
      case 'about':
        output = 'Personal stories from a DevOps engineer who codes, plays music, and games.';
        break;
      case 'mood':
        output = 'Current vibe: Building systems, composing melodies, grinding ranked.';
        break;
      case 'stats':
        output = 'Stories written: counting... | Reading time: varies | Mood: ambient';
        break;
      case 'socials':
        output = 'GitHub • LinkedIn • Spotify • Discord - Find me in /environment';
        break;
      case 'clear':
        setTerminalOutput([]);
        return;
      default:
        output = `Command not found: ${cmd}. Type "help" for available commands.`;
    }

    setTerminalOutput([...terminalOutput, `> ${cmd}`, output]);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'cyan': return 'text-[#22D3EE] hover:text-[#22D3EE]/80';
      case 'purple': return 'text-[#8B5CF6] hover:text-[#8B5CF6]/80';
      case 'amber': return 'text-[#F59E0B] hover:text-[#F59E0B]/80';
      default: return 'text-gray-400 hover:text-gray-300';
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: hidden ? '-100%' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/70 backdrop-blur-xl border-b border-white/5"
      >
        <div className="container-wide mx-auto">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#22D3EE] to-[#8B5CF6] rounded-md flex items-center justify-center font-mono font-bold text-[#0B0F19] transition-transform group-hover:scale-105">
                G
              </div>
              <span className="font-mono text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                <span className="text-gray-600">[</span> GRYFFIN <span className="text-gray-600">]</span>
              </span>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-4 py-2 font-mono text-xs transition-colors
                      ${isActive ? getColorClass(item.color) : 'text-gray-500 hover:text-gray-300'}
                    `}
                  >
                    <span className="text-gray-600">[</span> {item.label} <span className="text-gray-600">]</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6]"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="text-gray-500 hover:text-[#22D3EE] transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className="px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-[#22D3EE] border border-gray-800 hover:border-[#22D3EE]/30 rounded transition-all"
              >
                <span className="text-gray-600">[</span> &gt;_ <span className="text-gray-600">]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <motion.div
          style={{ width: progressWidth }}
          className="h-0.5 bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#F59E0B]"
        />

        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/5 bg-[#0B0F19]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="container-wide mx-auto px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <SearchBar />
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 text-gray-500 hover:text-gray-300 text-xs font-mono rounded transition-all"
                  >
                    [ ESC ]
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Terminal Overlay */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowTerminal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#0B0F19] border border-[#22D3EE]/30 rounded-lg w-full max-w-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                  </div>
                  <span className="font-mono text-xs text-gray-500">zsh — gryffin@terminal:~</span>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Terminal Output */}
              <div className="p-5 h-[500px] overflow-y-auto font-mono text-sm space-y-2">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={line.startsWith('>') ? 'text-[#22D3EE]' : 'text-gray-400'}>
                    {line}
                  </div>
                ))}

                {/* Input Line */}
                <div className="flex items-center gap-2 text-[#22D3EE] pt-2">
                  <span>&gt;</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTerminalCommand(terminalInput);
                        setTerminalInput('');
                      } else if (e.key === 'Escape') {
                        setShowTerminal(false);
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-gray-300"
                    placeholder="Type a command..."
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}
