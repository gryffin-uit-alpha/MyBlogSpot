package middleware

import (
	"net/http"
	"strings"
)

// CacheControl adds cache control headers based on the route
func CacheControl() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path

			// Static content and public routes - cache for 5 minutes
			if isCacheable(path) {
				w.Header().Set("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
			} else if isAdmin(path) {
				// Admin routes - no cache
				w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
				w.Header().Set("Pragma", "no-cache")
				w.Header().Set("Expires", "0")
			} else {
				// API routes - no cache but allow revalidation
				w.Header().Set("Cache-Control", "no-cache")
			}

			next.ServeHTTP(w, r)
		})
	}
}

func isCacheable(path string) bool {
	// Cache public article/category/tag views
	cacheablePaths := []string{
		"/api/v1/articles/",
		"/api/v1/categories/",
		"/api/v1/tags/",
		"/feed.xml",
		"/sitemap.xml",
	}

	for _, prefix := range cacheablePaths {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}

	return false
}

func isAdmin(path string) bool {
	return strings.HasPrefix(path, "/api/v1/admin/")
}
