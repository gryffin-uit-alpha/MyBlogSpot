'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { api } from '@/lib/api/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HomepageLivePreview, { type HomepagePreviewData } from '@/components/admin/HomepageLivePreview';

type ViewMode = 'split' | 'editor' | 'preview';

export default function HomepageEditorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const aboutContentRef = useRef<HTMLTextAreaElement>(null);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState<HomepagePreviewData>({
    hero_title: '',
    hero_subtitle: '',
    hero_cta_text: '',
    hero_cta_link: '',
    about_title: '',
    about_content: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsFetching(true);
      const response = await api.get('/homepage');
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put('/admin/homepage', formData);
      setToast({ show: true, message: 'Homepage settings updated successfully!', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error: any) {
      setToast({ show: true, message: error.message || 'Failed to update settings', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = aboutContentRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        about_content: prev.about_content ? `${prev.about_content}\n\n${markdown}` : markdown,
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setFormData((prev) => {
      const text = prev.about_content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      return {
        ...prev,
        about_content: before + markdown + after,
      };
    });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + markdown.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Header + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
            <span className="text-cyan-400">&gt;</span>
            <span>HOMEPAGE_EDITOR</span>
          </div>
          <h1 className="heading-1 text-gray-100 mb-1">Homepage Settings</h1>
          <p className="text-gray-500 text-sm">Customize your homepage content with real-time live preview</p>
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

      {/* Main Grid: Form Left + Live Preview Right */}
      <div
        className={
          viewMode === 'split'
            ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 items-start'
            : 'max-w-4xl'
        }
      >
        {/* Left Pane: Editor Form */}
        {viewMode !== 'preview' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hero Section */}
            <div className="bg-[#151B2A] rounded-xl p-6 border border-gray-800 shadow-lg space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🚀</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-mono">Hero Section</h2>
                  <p className="text-xs text-gray-500 font-mono">Main landing area</p>
                </div>
              </div>

              <div>
                <label htmlFor="hero_title" className="block text-xs font-mono text-gray-400 mb-1.5">
                  Title *
                </label>
                <input
                  id="hero_title"
                  type="text"
                  value={formData.hero_title}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Welcome to my blog"
                />
              </div>

              <div>
                <label htmlFor="hero_subtitle" className="block text-xs font-mono text-gray-400 mb-1.5">
                  Subtitle *
                </label>
                <textarea
                  id="hero_subtitle"
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent leading-relaxed"
                  placeholder="Your tagline or description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="hero_cta_text" className="block text-xs font-mono text-gray-400 mb-1.5">
                    Button Text *
                  </label>
                  <input
                    id="hero_cta_text"
                    type="text"
                    value={formData.hero_cta_text}
                    onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Explore"
                  />
                </div>

                <div>
                  <label htmlFor="hero_cta_link" className="block text-xs font-mono text-gray-400 mb-1.5">
                    Button Link *
                  </label>
                  <input
                    id="hero_cta_link"
                    type="text"
                    value={formData.hero_cta_link}
                    onChange={(e) => setFormData({ ...formData, hero_cta_link: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="/articles"
                  />
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-[#151B2A] rounded-xl p-6 border border-gray-800 shadow-lg space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-mono">About Section</h2>
                  <p className="text-xs text-gray-500 font-mono">Personal introduction &amp; markdown content</p>
                </div>
              </div>

              <div>
                <label htmlFor="about_title" className="block text-xs font-mono text-gray-400 mb-1.5">
                  Title *
                </label>
                <input
                  id="about_title"
                  type="text"
                  value={formData.about_title}
                  onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="About Me"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="about_content" className="block text-xs font-mono text-gray-400">
                    Content * (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowImageUploader(!showImageUploader)}
                    className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/20 font-mono transition-colors"
                  >
                    {showImageUploader ? '✕ Hide Images' : '🖼️ + Add Images'}
                  </button>
                </div>

                {showImageUploader && (
                  <div className="mb-4 p-4 bg-[#0B0F19] border border-gray-800 rounded-lg">
                    <ImageUploader
                      folder="homepage"
                      onInsertMarkdown={(markdown) => {
                        insertMarkdown(markdown);
                      }}
                    />
                  </div>
                )}

                <textarea
                  ref={aboutContentRef}
                  id="about_content"
                  value={formData.about_content}
                  onChange={(e) => setFormData({ ...formData, about_content: e.target.value })}
                  required
                  rows={14}
                  className="w-full px-4 py-2.5 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent leading-relaxed"
                  placeholder="Write about yourself in markdown..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-mono text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={fetchSettings}
                className="px-6 py-3 bg-transparent border border-gray-800 text-gray-400 rounded-lg font-mono text-sm hover:border-gray-700 transition-all"
              >
                Reset
              </button>
            </div>
          </form>
        )}

        {/* Right Pane: Real-Time Live Preview */}
        {viewMode !== 'editor' && (
          <HomepageLivePreview
            data={formData}
            sticky={viewMode === 'split'}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300 ${
            toast.type === 'success'
              ? 'bg-[#111827] border-2 border-cyan-500/50'
              : 'bg-[#111827] border-2 border-red-500/50'
          } text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                toast.type === 'success'
                  ? 'bg-cyan-500/20 border border-cyan-500/50'
                  : 'bg-red-500/20 border border-red-500/50'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p
                className={`font-mono font-semibold ${
                  toast.type === 'success' ? 'text-cyan-400' : 'text-red-400'
                }`}
              >
                {toast.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="text-gray-300 text-sm font-mono">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
