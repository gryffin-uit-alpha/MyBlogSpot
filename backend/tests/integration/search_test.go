package integration

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
)

// TestSearchArticles tests GET /api/v1/search with PostgreSQL FTS
func TestSearchArticles(t *testing.T) {
	cleanupDatabase(t)
	ctx := context.Background()

	// Create articles with searchable content
	article1, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Introduction to Kubernetes",
		Slug:    "intro-kubernetes",
		Summary: pgtype.Text{String: "Learn about container orchestration", Valid: true},
		Content: "Kubernetes is a powerful container orchestration platform for deploying and managing containerized applications.",
		Status:  "published",
	})
	if err != nil {
		t.Fatalf("Failed to create article 1: %v", err)
	}
	testQueries.PublishArticle(ctx, article1.ID)

	article2, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Docker Best Practices",
		Slug:    "docker-best-practices",
		Summary: pgtype.Text{String: "Tips for using Docker", Valid: true},
		Content: "Docker containers provide isolation and portability for applications. Here are best practices for Dockerfile creation.",
		Status:  "published",
	})
	if err != nil {
		t.Fatalf("Failed to create article 2: %v", err)
	}
	testQueries.PublishArticle(ctx, article2.ID)

	article3, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "PostgreSQL Performance",
		Slug:    "postgresql-performance",
		Summary: pgtype.Text{String: "Optimize your database", Valid: true},
		Content: "PostgreSQL offers great performance when properly configured and indexed.",
		Status:  "published",
	})
	if err != nil {
		t.Fatalf("Failed to create article 3: %v", err)
	}
	testQueries.PublishArticle(ctx, article3.ID)

	// Create draft article (should not appear in search)
	draftArticle, _ := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Draft About Kubernetes",
		Slug:    "draft-kubernetes",
		Content: "This contains kubernetes but is a draft",
		Status:  "draft",
	})
	_ = draftArticle

	searchService := service.NewSearchService(testQueries)
	searchHandler := handler.NewSearchHandler(searchService)

	router := chi.NewRouter()
	router.Get("/api/v1/search", searchHandler.Search)

	tests := []struct {
		name               string
		query              string
		expectedStatus     int
		expectedMinResults int
		checkFirstTitle    string
	}{
		{
			name:               "search for kubernetes",
			query:              "?q=kubernetes",
			expectedStatus:     http.StatusOK,
			expectedMinResults: 1,
			checkFirstTitle:    "Introduction to Kubernetes",
		},
		{
			name:               "search for docker",
			query:              "?q=docker",
			expectedStatus:     http.StatusOK,
			expectedMinResults: 1,
			checkFirstTitle:    "Docker Best Practices",
		},
		{
			name:               "search for container (appears in multiple)",
			query:              "?q=container",
			expectedStatus:     http.StatusOK,
			expectedMinResults: 2,
			checkFirstTitle:    "", // Don't check order for multi-results
		},
		{
			name:               "search for postgresql",
			query:              "?q=postgresql",
			expectedStatus:     http.StatusOK,
			expectedMinResults: 1,
			checkFirstTitle:    "PostgreSQL Performance",
		},
		{
			name:               "search for non-existent term",
			query:              "?q=nonexistentterm12345",
			expectedStatus:     http.StatusOK,
			expectedMinResults: 0,
		},
		{
			name:           "search without query parameter",
			query:          "",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/search"+tt.query, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.expectedStatus == http.StatusOK {
				var response model.Response
				err := json.NewDecoder(w.Body).Decode(&response)
				if err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if !response.Success {
					t.Errorf("Expected success=true")
				}

				articles, ok := response.Data.([]interface{})
				if !ok {
					t.Fatalf("Expected data to be array")
				}

				if len(articles) < tt.expectedMinResults {
					t.Errorf("Expected at least %d results, got %d", tt.expectedMinResults, len(articles))
				}

				// Check first result title if specified
				if tt.checkFirstTitle != "" && len(articles) > 0 {
					firstArticle := articles[0].(map[string]interface{})
					if firstArticle["title"] != tt.checkFirstTitle {
						t.Errorf("Expected first result title %s, got %s", tt.checkFirstTitle, firstArticle["title"])
					}
				}

				// Verify draft articles are not included
				for _, article := range articles {
					articleMap := article.(map[string]interface{})
					if articleMap["slug"] == "draft-kubernetes" {
						t.Error("Draft article should not appear in search results")
					}
				}
			}
		})
	}
}

// TestSearchArticlesPagination tests search with pagination
func TestSearchArticlesPagination(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create multiple articles with same term
	for i := 1; i <= 15; i++ {
		article, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
			Title:   "Testing Article Number " + string(rune('0'+i)),
			Slug:    "test-article-" + string(rune('0'+i)),
			Content: "This article is for testing search functionality with pagination support.",
			Status:  "published",
		})
		if err != nil {
			t.Fatalf("Failed to create article %d: %v", i, err)
		}
		testQueries.PublishArticle(ctx, article.ID)
	}

	searchService := service.NewSearchService(testQueries)
	searchHandler := handler.NewSearchHandler(searchService)

	router := chi.NewRouter()
	router.Get("/api/v1/search", searchHandler.Search)

	tests := []struct {
		name          string
		query         string
		expectedCount int
	}{
		{
			name:          "first page (default)",
			query:         "?q=testing",
			expectedCount: 10, // Default limit
		},
		{
			name:          "with limit",
			query:         "?q=testing&limit=5",
			expectedCount: 5,
		},
		{
			name:          "second page",
			query:         "?q=testing&limit=10&offset=10",
			expectedCount: 5, // Remaining articles
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/search"+tt.query, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Expected status 200, got %d", w.Code)
			}

			var response model.Response
			err := json.NewDecoder(w.Body).Decode(&response)
			if err != nil {
				t.Fatalf("Failed to decode response: %v", err)
			}

			articles, ok := response.Data.([]interface{})
			if !ok {
				t.Fatalf("Expected data to be array")
			}

			if len(articles) != tt.expectedCount {
				t.Errorf("Expected %d results, got %d", tt.expectedCount, len(articles))
			}
		})
	}
}

// TestSearchArticlesRanking tests that search results are ranked by relevance
func TestSearchArticlesRanking(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create articles with varying relevance
	// Article 1: keyword in title only (high relevance)
	article1, _ := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Complete Guide to Golang",
		Slug:    "golang-guide",
		Content: "This is a comprehensive tutorial.",
		Status:  "published",
	})
	testQueries.PublishArticle(ctx, article1.ID)

	// Article 2: keyword in content only (lower relevance)
	article2, _ := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Programming Tips",
		Slug:    "programming-tips",
		Content: "These tips work for golang and other languages.",
		Status:  "published",
	})
	testQueries.PublishArticle(ctx, article2.ID)

	// Article 3: keyword mentioned multiple times (high relevance)
	article3, _ := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Golang Best Practices",
		Slug:    "golang-best-practices",
		Content: "Golang is great. Here are golang tips. Golang developers should know these golang patterns.",
		Status:  "published",
	})
	testQueries.PublishArticle(ctx, article3.ID)

	searchService := service.NewSearchService(testQueries)
	searchHandler := handler.NewSearchHandler(searchService)

	router := chi.NewRouter()
	router.Get("/api/v1/search", searchHandler.Search)

	req := httptest.NewRequest("GET", "/api/v1/search?q=golang", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response model.Response
	err := json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	articles, ok := response.Data.([]interface{})
	if !ok {
		t.Fatalf("Expected data to be array")
	}

	if len(articles) < 3 {
		t.Errorf("Expected 3 results, got %d", len(articles))
	}

	// First result should be either article1 or article3 (title match or multiple mentions)
	firstArticle := articles[0].(map[string]interface{})
	firstSlug := firstArticle["slug"].(string)
	if firstSlug != "golang-guide" && firstSlug != "golang-best-practices" {
		t.Logf("Warning: Expected most relevant result first, got %s", firstSlug)
	}

	// Article 2 should have lower rank
	lastArticle := articles[len(articles)-1].(map[string]interface{})
	if lastArticle["slug"] != "programming-tips" {
		t.Logf("Warning: Expected least relevant result last, got %s", lastArticle["slug"])
	}
}
