'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  expandable?: boolean;
  className?: string;
  onClose?: () => void;
}

export default function SearchBar({
  placeholder = 'Search articles...',
  autoFocus = false,
  expandable = true,
  className = '',
  onClose,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(!expandable);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync with URL query on mount in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        setQuery(q);
      }
    }
  }, []);

  const handleClose = useCallback(() => {
    if (expandable) {
      setIsOpen(false);
      onClose?.();
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [expandable, onClose]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Keyboard navigation: Escape to close, Cmd+K / Ctrl+K and '/' to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes search when expanded
      if (e.key === 'Escape' && isOpen && expandable) {
        e.preventDefault();
        handleClose();
        return;
      }

      // Hotkeys: Cmd+K / Ctrl+K or '/'
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
      } else if (e.key === '/' && !isInputFocused && !isOpen && expandable) {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, expandable, handleClose, handleOpen]);

  // Click outside to collapse
  useEffect(() => {
    if (!isOpen || !expandable) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, expandable, handleClose]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen && expandable) {
      inputRef.current?.focus({ preventScroll: true });
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, expandable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      if (expandable) {
        setIsOpen(false);
        onClose?.();
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus({ preventScroll: true });
  };

  // If not expandable, render static search bar
  if (!expandable) {
    return (
      <form onSubmit={handleSubmit} className={`w-full max-w-2xl ${className}`}>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-mono"
          />
        </div>
      </form>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center h-8 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 overflow-hidden rounded-md ${
        isOpen
          ? 'w-[190px] sm:w-[230px] md:w-[270px] bg-[#0e1628] border border-[#22D3EE]/70 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
          : 'w-[42px] bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/40 hover:border-[#22D3EE]/30'
      } ${className}`}
    >
      {/* Search Icon (Pinned to left edge, clickable when closed to open) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            handleOpen();
          } else {
            inputRef.current?.focus({ preventScroll: true });
          }
        }}
        className={`absolute left-0 top-0 bottom-0 w-[42px] flex items-center justify-center transition-colors z-10 shrink-0 ${
          isOpen ? 'text-[#22D3EE] cursor-default' : 'text-gray-400 hover:text-[#22D3EE] cursor-pointer'
        }`}
        aria-label="Search articles (Press / or Ctrl+K)"
        title={isOpen ? undefined : 'Search (Press / or Ctrl+K)'}
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* When closed: "/" shortcut badge */}
      {!isOpen && (
        <span
          onClick={handleOpen}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-[#22D3EE]/80 font-mono cursor-pointer select-none"
        >
          /
        </span>
      )}

      {/* When open: full input with clear & ESC button */}
      <form onSubmit={handleSubmit} className={`w-full h-full flex items-center ${!isOpen ? 'pointer-events-none' : ''}`}>
        <input
          ref={(el) => {
            inputRef.current = el;
            if (el && isOpen) {
              el.focus({ preventScroll: true });
            }
          }}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          tabIndex={isOpen ? 0 : -1}
          className={`w-full h-full pl-8 pr-14 bg-transparent text-gray-200 text-xs font-mono rounded-md focus:outline-none placeholder:text-gray-500 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Search query"
        />

        {isOpen && (
          <div className="absolute right-1.5 flex items-center gap-1 z-10">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
                aria-label="Clear query"
                title="Clear"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="px-1.5 py-0.5 font-mono text-[9px] text-gray-400 hover:text-[#22D3EE] bg-gray-800/90 hover:bg-gray-700 border border-gray-700/60 rounded transition-colors cursor-pointer"
              aria-label="Close search (Esc)"
              title="Close (Esc)"
            >
              ESC
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
