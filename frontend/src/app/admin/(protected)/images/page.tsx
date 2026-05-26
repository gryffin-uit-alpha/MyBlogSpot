'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import { api } from '@/lib/api/client';

interface Image {
  id: string;
  url: string;
  filename: string;
  original_filename: string;
  folder: string;
  alt_text: string;
  created_at: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [showUploader, setShowUploader] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; imageId: string; imageName: string }>({
    show: false,
    imageId: '',
    imageName: ''
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const folders = ['general', 'articles', 'homepage'];

  useEffect(() => {
    fetchImages();
  }, [selectedFolder]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = selectedFolder ? { folder: selectedFolder } : {};
      const response = await api.get('/admin/images', { params });
      setImages(response.data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirm = (image: Image) => {
    setDeleteConfirm({
      show: true,
      imageId: image.id,
      imageName: image.original_filename
    });
  };

  const deleteImage = async () => {
    const { imageId } = deleteConfirm;
    setDeleteConfirm({ show: false, imageId: '', imageName: '' });

    try {
      await api.delete(`/admin/images/${imageId}`);
      setImages(prev => prev.filter(img => img.id !== imageId));

      setToast({ show: true, message: 'Image deleted successfully', type: 'success' });
      setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      console.error('Failed to delete image:', error);

      setToast({ show: true, message: 'Failed to delete image', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const copyMarkdown = (image: Image) => {
    const altText = image.alt_text || image.original_filename;
    const markdown = `![${altText}](${image.url})`;
    navigator.clipboard.writeText(markdown);

    setToast({ show: true, message: 'Markdown copied to clipboard', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
            <span className="text-cyan-400">&gt;</span>
            <span>IMAGE_LIBRARY</span>
          </div>
          <h1 className="heading-1 text-gray-100 mb-1">Image Library</h1>
          <p className="text-gray-500">Manage uploaded images</p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-mono text-sm font-semibold transition-all shadow-lg"
        >
          {showUploader ? '✕ Close' : '+ Upload Images'}
        </button>
      </div>

      {showUploader && (
          <div className="bg-[#151B2A] rounded-xl p-6 border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white font-mono">
                <span className="text-cyan-400">&gt;</span> Upload New Images
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-mono text-gray-400">Folder:</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="px-3 py-2 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500"
                >
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>
            </div>
            <ImageUploader
              folder={selectedFolder || 'general'}
              onUploadComplete={() => {
                fetchImages();
                setShowUploader(false);
              }}
            />
          </div>
      )}

      <div className="bg-[#151B2A] rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white font-mono">
              <span className="text-cyan-400">&gt;</span> Images
            </h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-mono text-gray-400">Filter:</label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-4 py-2 bg-[#0B0F19] border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No images found. Upload some images to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-[#0B0F19] rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.alt_text || image.original_filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                        <button
                          onClick={() => copyMarkdown(image)}
                          className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg font-mono transition-colors"
                        >
                          📋 Copy Markdown
                        </button>
                        <button
                          onClick={() => showDeleteConfirm(image)}
                          className="w-full px-3 py-2 bg-red-600/90 hover:bg-red-700 text-white text-sm rounded-lg font-mono transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#111827]/50 space-y-1">
                    <p className="text-xs text-gray-300 truncate font-mono">{image.original_filename}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cyan-500 font-mono">{image.folder}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{new Date(image.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteConfirm({ show: false, imageId: '', imageName: '' })}
        >
          <div
            className="bg-[#151B2A] rounded-2xl border border-gray-800 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-mono">Delete Image?</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-[#0B0F19] rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 font-mono break-all">
                <span className="text-gray-600">&gt;</span> {deleteConfirm.imageName}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, imageId: '', imageName: '' })}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-mono text-sm hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteImage}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-mono text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
