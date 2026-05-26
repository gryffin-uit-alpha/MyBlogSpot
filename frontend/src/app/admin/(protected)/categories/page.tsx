'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoriesApi } from '@/lib/api/categories';
import type { Category } from '@/types/category';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', slug: '', description: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await categoriesApi.update(editingId, formData);
      } else {
        await categoriesApi.create(formData);
      }
      await fetchCategories();
      handleCancel();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesApi.delete(id);
      await fetchCategories();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
            <span className="text-amber-400">&gt;</span>
            <span>TAXONOMY_MANAGEMENT</span>
          </div>
          <h1 className="heading-2 text-gray-100">Categories</h1>
          <p className="text-gray-500 mt-1">Organize articles by topic</p>
        </div>
        <button
          onClick={handleAdd}
          className="group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-mono text-sm font-semibold transition-transform group-hover:scale-105">
            + NEW_CATEGORY
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
            <h2 className="heading-3 text-gray-100 mb-4">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
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
                      ...formData,
                      name,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    });
                  }}
                  className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-100 font-mono text-sm"
                  placeholder="DevOps"
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
                  className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-100 font-mono text-sm"
                  placeholder="devops"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  <span className="text-gray-700">&gt;</span> description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-100 text-sm resize-none"
                  placeholder="Category description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded font-mono text-sm hover:bg-gray-700 hover:border-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded font-mono text-sm hover:shadow-lg transition-all"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {isLoading ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-mono text-sm">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <p className="text-gray-500 font-mono text-sm">No categories found. Create your first one!</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase">NAME</th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase">SLUG</th>
                  <th className="px-6 py-4 text-left text-xs font-mono font-semibold text-slate-500 uppercase">DESCRIPTION</th>
                  <th className="px-6 py-4 text-right text-xs font-mono font-semibold text-slate-500 uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((category, idx) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="group hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-amber-500"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-200">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-cyan-500/70 font-mono">/{category.slug}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{category.description || '—'}</td>
                    <td className="px-6 py-4 text-right text-sm font-mono space-x-4">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-slate-600 hover:text-cyan-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: category.id, name: category.name })}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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
                <h3 className="text-xl font-bold text-gray-100 mb-2">Delete Category</h3>
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
