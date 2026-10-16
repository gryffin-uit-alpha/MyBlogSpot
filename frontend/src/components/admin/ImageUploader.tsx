'use client';

import { useState, useRef, useEffect, useCallback, DragEvent } from 'react';
import { api } from '@/lib/api/client';

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  original_filename?: string;
  folder: string;
  alt_text?: string | null;
  created_at?: string;
  markdown?: string;
}

interface ImageUploaderProps {
  folder?: string;
  showLibraryTabs?: boolean;
  onUploadComplete?: (images: UploadedImage[]) => void;
  onInsertMarkdown?: (markdown: string) => void;
}

const FOLDERS = ['articles', 'general', 'homepage'] as const;

const imageTemplates = [
  { label: 'Default Markdown', value: (url: string, alt: string) => `![${alt}](${url})` },
  { label: 'Medium Center', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-medium img-center img-rounded" />` },
  { label: 'Full Width', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-full img-rounded" />` },
  { label: 'Small Left', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-small img-left img-rounded" />` },
  { label: 'Small Right', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-small img-right img-rounded" />` },
  { label: 'With Caption', value: (url: string, alt: string) => `<div class="img-with-caption">\n  <img src="${url}" alt="${alt}" class="img-medium img-rounded img-shadow" />\n  <span class="img-caption">${alt}</span>\n</div>` },
];

export function getImageAltText(image: UploadedImage): string {
  const rawAlt = typeof image.alt_text === 'string' ? image.alt_text.trim() : '';
  if (rawAlt) return rawAlt;
  if (image.original_filename && image.original_filename.trim()) {
    return image.original_filename.trim();
  }
  return image.filename;
}

export function buildImageMarkdown(image: UploadedImage): string {
  const altText = getImageAltText(image);
  return `![${altText}](${image.url})`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}

export default function ImageUploader({
  folder = 'general',
  showLibraryTabs,
  onUploadComplete,
  onInsertMarkdown,
}: ImageUploaderProps) {
  // Enable 2-option tabs (Library + Upload) automatically when used in Article/Homepage editor
  const enableTabs = showLibraryTabs ?? Boolean(onInsertMarkdown);

  const [activeTab, setActiveTab] = useState<'library' | 'upload'>(enableTabs ? 'library' : 'upload');
  const [uploadFolder, setUploadFolder] = useState<string>(folder || 'general');
  const [customAltText, setCustomAltText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState('');

  // Library state
  const [libraryImages, setLibraryImages] = useState<UploadedImage[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryFolderFilter, setLibraryFolderFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Visual feedback state for Copy / Insert actions
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folder) {
      setUploadFolder(folder);
    }
  }, [folder]);

  const fetchLibraryImages = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (libraryFolderFilter) {
        params.folder = libraryFolderFilter;
      }
      const response = await api.get('/admin/images', { params });
      setLibraryImages(response.data?.images || []);
    } catch (err) {
      console.error('Failed to load image library:', err);
    } finally {
      setLibraryLoading(false);
    }
  }, [libraryFolderFilter]);

  useEffect(() => {
    if (enableTabs && activeTab === 'library') {
      fetchLibraryImages();
    }
  }, [enableTabs, activeTab, fetchLibraryImages]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      uploadFiles(files);
      e.target.value = '';
    }
  };

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }

    if (imageFiles.length > 10) {
      setError('Maximum 10 images at once');
      return;
    }

    setUploading(true);
    setError('');
    const uploaded: UploadedImage[] = [];

    for (const file of imageFiles) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', uploadFolder || folder || 'general');
        formData.append('alt_text', customAltText.trim());

        const response = await api.post('/admin/images', formData);
        const item: UploadedImage = {
          ...response.data,
          original_filename: response.data?.original_filename || file.name,
        };
        uploaded.push(item);
      } catch (err: any) {
        console.error('Upload failed:', err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploadedImages((prev) => [...uploaded, ...prev]);
    setLibraryImages((prev) => [...uploaded, ...prev]);
    setUploading(false);

    if (uploaded.length > 0 && onUploadComplete) {
      onUploadComplete(uploaded);
    }
  };

  const handleCopyMarkdown = async (image: UploadedImage) => {
    const markdown = buildImageMarkdown(image);
    const ok = await copyTextToClipboard(markdown);
    if (ok) {
      setCopiedId(image.id);
      setTimeout(() => setCopiedId((prev) => (prev === image.id ? null : prev)), 2000);
    }
  };

  const handleInsertMarkdown = (image: UploadedImage, customOutput?: string) => {
    const output = customOutput || buildImageMarkdown(image);
    if (onInsertMarkdown) {
      onInsertMarkdown(output);
      setInsertedId(image.id);
      setTimeout(() => setInsertedId((prev) => (prev === image.id ? null : prev)), 2000);
    } else {
      handleCopyMarkdown(image);
    }
  };

  const handleInsertTemplate = (image: UploadedImage, templateLabel: string) => {
    const template = imageTemplates.find((t) => t.label === templateLabel);
    if (!template) return;
    const altText = getImageAltText(image);
    const formatted = template.value(image.url, altText);
    handleInsertMarkdown(image, formatted);
  };

  const filteredLibraryImages = libraryImages.filter((img) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orig = (img.original_filename || '').toLowerCase();
    const fname = (img.filename || '').toLowerCase();
    const alt = (typeof img.alt_text === 'string' ? img.alt_text : '').toLowerCase();
    return orig.includes(q) || fname.includes(q) || alt.includes(q);
  });

  const renderImageCard = (image: UploadedImage) => {
    const displayName = image.original_filename || image.filename;
    const isCopied = copiedId === image.id;
    const isInserted = insertedId === image.id;

    return (
      <div
        key={image.id}
        className="group bg-[#111827] rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all flex flex-col"
      >
        <div className="relative h-32 bg-[#0B0F19] overflow-hidden">
          <img
            src={image.url}
            alt={getImageAltText(image)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 border border-gray-700 text-cyan-400 text-[10px] font-mono rounded">
            {image.folder}
          </span>
        </div>

        <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
          <p className="text-xs text-gray-300 font-mono truncate" title={displayName}>
            {displayName}
          </p>

          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              {onInsertMarkdown && (
                <button
                  type="button"
                  onClick={() => handleInsertMarkdown(image)}
                  className={`flex-1 px-2 py-1.5 text-xs font-mono rounded transition-colors ${
                    isInserted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isInserted ? '✓ Inserted' : '+ Insert'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCopyMarkdown(image)}
                className={`flex-1 px-2 py-1.5 text-xs font-mono rounded border transition-colors ${
                  isCopied
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#0B0F19] hover:bg-gray-800 border-gray-700 text-gray-300'
                }`}
                title="Copy Markdown ![alt](url)"
              >
                {isCopied ? '✓ Copied!' : '📋 Copy MD'}
              </button>
            </div>

            {onInsertMarkdown && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleInsertTemplate(image, e.target.value);
                  }
                }}
                aria-label={`Insert ${displayName} with layout style`}
                className="w-full px-2 py-1 bg-[#0B0F19] border border-gray-700 text-gray-300 text-xs font-mono rounded focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">🎨 Insert with style...</option>
                {imageTemplates.map((template) => (
                  <option key={template.label} value={template.label}>
                    {template.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher Tabs (Library vs Direct Upload) */}
      {enableTabs && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all border ${
                activeTab === 'library'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-[#111827] border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              📚 Image Library ({libraryImages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all border ${
                activeTab === 'upload'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-[#111827] border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              ☁️ Upload New Image
            </button>
          </div>
          <span className="text-xs font-mono text-gray-500">
            Synced with Admin Image Library &amp; S3
          </span>
        </div>
      )}

      {/* TAB 1: EXISTING IMAGE LIBRARY */}
      {enableTabs && activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename or alt text..."
              className="flex-1 min-w-[200px] px-3 py-2 bg-[#111827] border border-gray-800 rounded-lg text-gray-200 font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-gray-400">Folder:</label>
              <select
                value={libraryFolderFilter}
                onChange={(e) => setLibraryFolderFilter(e.target.value)}
                className="px-3 py-2 bg-[#111827] border border-gray-800 rounded-lg text-gray-200 font-mono text-xs focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All folders</option>
                {FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={fetchLibraryImages}
              className="px-3 py-2 bg-[#111827] hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-lg font-mono text-xs transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {libraryLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 bg-[#111827] rounded-lg border border-gray-800">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 font-mono text-xs">Loading images from library...</span>
            </div>
          ) : filteredLibraryImages.length === 0 ? (
            <div className="text-center py-10 bg-[#111827] rounded-lg border border-gray-800 space-y-3">
              <p className="text-gray-400 font-mono text-sm">No uploaded images found.</p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs transition-colors"
              >
                + Upload New Image Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredLibraryImages.map((image) => renderImageCard(image))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 (or default in Upload-Only mode): DIRECT IMAGE UPLOAD */}
      {(!enableTabs || activeTab === 'upload') && (
        <div className="space-y-4">
          {/* Synchronized Upload Options (Folder + Alt Text) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">
                Target Folder (synced with Image Library)
              </label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
              >
                {FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">
                Default Alt Text (optional, falls back to filename)
              </label>
              <input
                type="text"
                value={customAltText}
                onChange={(e) => setCustomAltText(e.target.value)}
                placeholder="e.g. Kubernetes Architecture Diagram"
                className="w-full px-3 py-2 bg-[#111827] border border-gray-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-700 hover:border-cyan-500/50 bg-[#111827]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-300 font-medium font-mono text-sm">
                Drop images here or click to browse
              </p>
              <p className="text-gray-500 text-xs font-mono">
                PNG, JPG, GIF, WebP up to 10MB (uploads to /{uploadFolder})
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          {uploading && (
            <div className="flex items-center justify-center gap-2 p-4 bg-[#111827] rounded-lg border border-gray-800">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-300 font-mono text-xs">Uploading to S3 &amp; Image Library...</span>
            </div>
          )}

          {uploadedImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-300 font-mono text-xs font-semibold">
                  Recently Uploaded ({uploadedImages.length})
                </h3>
                {enableTabs && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
                  >
                    View all in Library →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {uploadedImages.map((image) => renderImageCard(image))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
