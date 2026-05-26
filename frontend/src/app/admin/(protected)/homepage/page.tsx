'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api/client';
import ImageUploader from '@/components/admin/ImageUploader';

interface HomepageSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  hero_cta_link: string;
  about_title: string;
  about_content: string;
}

export default function HomepageEditorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [formData, setFormData] = useState<HomepageSettings>({
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
    setFormData({
      ...formData,
      about_content: formData.about_content + '\n\n' + markdown,
    });
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
          <span className="text-cyan-400">&gt;</span>
          <span>HOMEPAGE_EDITOR</span>
        </div>
        <h1 className="heading-1 text-gray-100 mb-2">Homepage Settings</h1>
        <p className="text-gray-500">Customize your homepage content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Hero Section */}
        <div className="bg-[#151B2A] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white font-mono">Hero Section</h2>
              <p className="text-xs text-gray-500 font-mono">Main landing area</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="hero_title" className="block text-sm font-mono text-gray-400 mb-2">
                Title *
              </label>
              <input
                id="hero_title"
                type="text"
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Welcome to my blog"
              />
            </div>

            <div>
              <label htmlFor="hero_subtitle" className="block text-sm font-mono text-gray-400 mb-2">
                Subtitle *
              </label>
              <textarea
                id="hero_subtitle"
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Your tagline or description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hero_cta_text" className="block text-sm font-mono text-gray-400 mb-2">
                  Button Text *
                </label>
                <input
                  id="hero_cta_text"
                  type="text"
                  value={formData.hero_cta_text}
                  onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Explore"
                />
              </div>

              <div>
                <label htmlFor="hero_cta_link" className="block text-sm font-mono text-gray-400 mb-2">
                  Button Link *
                </label>
                <input
                  id="hero_cta_link"
                  type="text"
                  value={formData.hero_cta_link}
                  onChange={(e) => setFormData({ ...formData, hero_cta_link: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="/articles"
                />
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-[#151B2A] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white font-mono">About Section</h2>
              <p className="text-xs text-gray-500 font-mono">Personal introduction</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="about_title" className="block text-sm font-mono text-gray-400 mb-2">
                Title *
              </label>
              <input
                id="about_title"
                type="text"
                value={formData.about_title}
                onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                required
                className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="About Me"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="about_content" className="block text-sm font-mono text-gray-400">
                  Content * (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => setShowImageUploader(!showImageUploader)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                >
                  {showImageUploader ? 'Hide Images' : '+ Add Images'}
                </button>
              </div>

              {showImageUploader && (
                <div className="mb-4 p-4 bg-[#0B0F19] border border-gray-800 rounded-lg">
                  <ImageUploader
                    folder="homepage"
                    onInsertMarkdown={(markdown) => {
                      insertMarkdown(markdown);
                      setShowImageUploader(false);
                    }}
                  />
                </div>
              )}

              <textarea
                id="about_content"
                value={formData.about_content}
                onChange={(e) => setFormData({ ...formData, about_content: e.target.value })}
                required
                rows={12}
                className="w-full px-4 py-3 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Write about yourself in markdown..."
              />
              <p className="mt-2 text-xs text-gray-500 font-mono">
                Supports Markdown formatting
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
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

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300 ${
          toast.type === 'success'
            ? 'bg-[#111827] border-2 border-cyan-500/50'
            : 'bg-[#111827] border-2 border-red-500/50'
        } text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              toast.type === 'success'
                ? 'bg-cyan-500/20 border border-cyan-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
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
              <p className={`font-mono font-semibold ${
                toast.type === 'success' ? 'text-cyan-400' : 'text-red-400'
              }`}>
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
