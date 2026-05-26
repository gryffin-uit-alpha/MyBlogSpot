'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'myblogspot_commenter';

interface NicknamePromptProps {
  onNicknameSet?: (nickname: string) => void;
}

export default function NicknamePrompt({ onNicknameSet }: NicknamePromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setShowPrompt(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (!trimmed) {
      setError('Nickname is required');
      return;
    }

    if (trimmed.length < 2 || trimmed.length > 50) {
      setError('Nickname must be between 2 and 50 characters');
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmed);
    setShowPrompt(false);
    onNicknameSet?.(trimmed);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
      <div className="bg-[#151B2A] rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-800/50 backdrop-blur-md animate-in zoom-in-95 duration-300">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight">Welcome!</h2>
          <p className="text-gray-400 leading-relaxed text-[15px]">
            Before you start exploring, please tell me your nickname.
            You&apos;ll use it when leaving comments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nickname-setup" className="block text-sm font-medium text-gray-300 mb-2.5">
              What should i call you?
            </label>
            <input
              id="nickname-setup"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 outline-none"
              placeholder="Enter your nickname"
              maxLength={50}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400 animate-in slide-in-from-top-1 duration-200">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-[#111827] border-2 border-cyan-500/30 hover:border-cyan-400/60 rounded-xl font-semibold text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export function useNickname() {
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setNickname(saved);
  }, []);

  const updateNickname = (newNickname: string) => {
    localStorage.setItem(STORAGE_KEY, newNickname);
    setNickname(newNickname);
  };

  return { nickname, updateNickname };
}
