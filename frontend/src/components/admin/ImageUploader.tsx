'use client';

import { useState, useRef, DragEvent } from 'react';
import { api } from '@/lib/api/client';

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  folder: string;
  alt_text: string;
  markdown: string;
}

interface ImageUploaderProps {
  folder?: string;
  onUploadComplete?: (images: UploadedImage[]) => void;
  onInsertMarkdown?: (markdown: string) => void;
}

const imageTemplates = [
  { label: 'Default', value: (url: string, alt: string) => `![${alt}](${url})` },
  { label: 'Medium Center', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-medium img-center img-rounded" />` },
  { label: 'Full Width', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-full img-rounded" />` },
  { label: 'Small Left', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-small img-left img-rounded" />` },
  { label: 'Small Right', value: (url: string, alt: string) => `<img src="${url}" alt="${alt}" class="img-small img-right img-rounded" />` },
  { label: 'With Caption', value: (url: string, alt: string) => `<div class="img-with-caption">\n  <img src="${url}" alt="${alt}" class="img-medium img-rounded img-shadow" />\n  <span class="img-caption">${alt}</span>\n</div>` },
];

export default function ImageUploader({
  folder = 'general',
  onUploadComplete,
  onInsertMarkdown
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

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
        formData.append('folder', folder);
        formData.append('alt_text', '');

        const response = await api.post('/admin/images', formData);

        uploaded.push(response.data);
      } catch (err: any) {
        console.error('Upload failed:', err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploadedImages(prev => [...prev, ...uploaded]);
    setUploading(false);

    if (onUploadComplete) {
      onUploadComplete(uploaded);
    }
  };

  const copyMarkdown = (markdown: string) => {
    navigator.clipboard.writeText(markdown);
    if (onInsertMarkdown) {
      onInsertMarkdown(markdown);
    }
  };

  const insertTemplate = (image: UploadedImage, template: typeof imageTemplates[0]) => {
    const html = template.value(image.url, image.alt_text || image.filename);
    if (onInsertMarkdown) {
      onInsertMarkdown(html);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
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
          <p className="text-gray-300 font-medium">
            Drop images here or click to browse
          </p>
          <p className="text-gray-500 text-sm">
            PNG, JPG, GIF, WebP up to 10MB (max 10 files)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 p-4 bg-[#111827] rounded-lg">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-300">Uploading...</span>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-gray-300 font-medium">Uploaded Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="relative group bg-[#111827] rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-colors"
              >
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 space-y-2">
                  <p className="text-xs text-gray-400 truncate">{image.filename}</p>
                  <select
                    onChange={(e) => {
                      const template = imageTemplates.find(t => t.label === e.target.value);
                      if (template) insertTemplate(image, template);
                    }}
                    className="w-full px-2 py-1 bg-[#0B0F19] border border-gray-700 text-white text-xs rounded"
                  >
                    <option value="">Insert as...</option>
                    {imageTemplates.map(template => (
                      <option key={template.label} value={template.label}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
