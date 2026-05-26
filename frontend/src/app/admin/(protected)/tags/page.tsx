'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createTag, updateTag, deleteTag } from '@/lib/api/admin';
import { tagsApi } from '@/lib/api/tags';
import type { Tag } from '@/types/tag';

export default function TagsPage() {
  const { token } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await tagsApi.list();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTag(null);
    setFormData({ name: '', slug: '' });
    setShowForm(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, slug: tag.slug });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!token) return;

    try {
      if (editingTag) {
        await updateTag(editingTag.id, formData, token);
      } else {
        await createTag(formData, token);
      }
      await fetchTags();
      setShowForm(false);
      setFormData({ name: '', slug: '' });
      setEditingTag(null);
    } catch (error) {
      console.error('Failed to save tag:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    try {
      await deleteTag(id, token);
      await fetchTags();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
            <span className="text-green-400">&gt;</span>
            <span>TAG_MANAGEMENT</span>
          </div>
          <h1 className="heading-2 text-gray-100">Tags</h1>
          <p className="text-gray-500 mt-1">Label articles with keywords</p>
        </div>
        <button
          onClick={handleAdd}
          className="group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-mono text-sm font-semibold transition-transform group-hover:scale-105">
            + NEW_TAG
          </div>
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 overflow-hidden"
          >
            <h2 className="heading-3 text-gray-100 mb-4">{editingTag ? 'Edit Tag' : 'New Tag'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  <span className="text-gray-700">&gt;</span> name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      name,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    });
                  }}
                  className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-100 font-mono text-sm"
                  placeholder="Docker"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  <span className="text-gray-700">&gt;</span> slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-100 font-mono text-sm"
                  placeholder="docker"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded font-mono text-sm hover:bg-gray-700 hover:border-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded font-mono text-sm hover:shadow-lg transition-all"
                >
                  {editingTag ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-mono text-sm">Loading tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🏷️</div>
          <p className="text-gray-500 font-mono text-sm">No tags found. Create your first one!</p>
        </div>
      ) : (
        <div className="glass-card p-6">
          <div className="flex flex-wrap gap-3">
            {tags.map((tag, idx) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
                className="group relative"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all">
                  <span className="text-green-400 font-semibold">{tag.name}</span>
                  <span className="text-xs text-gray-600 font-mono">/{tag.slug}</span>
                  <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-gray-600 hover:text-blue-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: tag.id, name: tag.name })}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111827] border border-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-2">Delete Tag</h3>
                <p className="text-gray-400 text-sm mb-1">Delete &quot;{deleteConfirm.name}&quot;?</p>
                <p className="text-gray-500 text-xs mt-2">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded font-mono text-sm hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-mono text-sm hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
