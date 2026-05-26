'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊', color: 'cyan' },
  { href: '/admin/articles', label: 'Articles', icon: '📝', color: 'purple' },
  { href: '/admin/images', label: 'Images', icon: '🖼️', color: 'pink' },
  { href: '/admin/categories', label: 'Categories', icon: '📁', color: 'amber' },
  { href: '/admin/tags', label: 'Tags', icon: '🏷️', color: 'green' },
  { href: '/admin/comments', label: 'Comments', icon: '💬', color: 'blue' },
  { href: '/admin/homepage', label: 'Homepage', icon: '🏡', color: 'indigo' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const getColorClass = (color: string, active: boolean) => {
    if (!active) return 'text-gray-500 hover:text-gray-300';

    switch (color) {
      case 'cyan': return 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/30';
      case 'purple': return 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30';
      case 'amber': return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
      case 'green': return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30';
      case 'blue': return 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30';
      case 'pink': return 'text-[#EC4899] bg-[#EC4899]/10 border-[#EC4899]/30';
      case 'indigo': return 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/30';
      default: return 'text-gray-400';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0B0F19] text-gray-100">
        {/* Top Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-md flex items-center justify-center font-mono font-bold text-white transition-transform group-hover:scale-105">
                  A
                </div>
                <span className="font-mono text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  <span className="text-gray-600">[</span> ADMIN <span className="text-gray-600">]</span>
                </span>
              </Link>
              <span className="text-gray-700">|</span>
              <span className="font-mono text-xs text-gray-600">Control Panel</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-600">user:</span>
                <span className="text-gray-400">{user?.username}</span>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded font-mono text-xs hover:bg-red-500/20 hover:border-red-500/50 transition-all"
              >
                [ LOGOUT ]
              </button>
            </div>
          </div>
        </header>

        <div className="flex pt-16">
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed left-0 w-64 bg-[#111827]/50 backdrop-blur-sm border-r border-gray-800/50 h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <nav className="p-4 space-y-2">
              <div className="mb-6 px-3">
                <p className="font-mono text-xs text-gray-600 uppercase tracking-wider">Navigation</p>
              </div>

              {navItems.map((item, idx) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={`
                        relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-mono text-sm border
                        ${isActive
                          ? getColorClass(item.color, true) + ' font-semibold'
                          : 'text-gray-500 hover:text-gray-300 border-transparent hover:border-gray-800 hover:bg-gray-800/30'
                        }
                      `}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 w-1 h-8 bg-current rounded-r"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="pt-6 mt-6 border-t border-gray-800">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-mono text-sm text-gray-500 hover:text-gray-300 border border-transparent hover:border-gray-800 hover:bg-gray-800/30"
                >
                  <span className="text-lg">🏠</span>
                  <span>View Site</span>
                </Link>
              </div>
            </nav>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 ml-64 p-8 min-h-[calc(100vh-4rem)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-[#111827] border border-gray-800 rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-100 mb-2 font-heading">Confirm Logout</h3>
                  <p className="text-gray-400 text-sm">Are you sure you want to log out?</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded font-mono text-sm hover:bg-gray-700 hover:border-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-mono text-sm hover:bg-red-600 transition-all"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
