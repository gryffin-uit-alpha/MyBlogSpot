package integration

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

var (
	testDB      *sql.DB
	testQueries *db.Queries
	testService *service.ArticleService
)

// TestMain sets up and tears down the test database
func TestMain(m *testing.M) {
	var err error

	// Connect to test database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("TEST_DB_HOST", "localhost"),
		getEnv("TEST_DB_PORT", "5432"),
		getEnv("TEST_DB_USER", "myblogspot"),
		getEnv("TEST_DB_PASSWORD", "secret"),
		getEnv("TEST_DB_NAME", "myblogspot_test"),
		getEnv("TEST_DB_SSLMODE", "disable"),
	)

	testDB, err = sql.Open("postgres", dsn)
	if err != nil {
		fmt.Printf("Failed to connect to test database: %v\n", err)
		os.Exit(1)
	}

	// Run migrations
	if err := goose.Up(testDB, "../../internal/db/migrations"); err != nil {
		fmt.Printf("Failed to run migrations: %v\n", err)
		testDB.Close()
		os.Exit(1)
	}

	testQueries = db.New(testDB)
	testService = service.NewArticleService(testQueries)

	// Run tests
	code := m.Run()

	// Cleanup
	testDB.Close()

	os.Exit(code)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// cleanupDatabase removes all test data
func cleanupDatabase(t *testing.T) {
	t.Helper()
	ctx := context.Background()

	// Delete in order to respect foreign keys
	_, err := testDB.ExecContext(ctx, "DELETE FROM comments")
	if err != nil {
		t.Fatalf("Failed to clean comments: %v", err)
	}

	_, err = testDB.ExecContext(ctx, "DELETE FROM article_tags")
	if err != nil {
		t.Fatalf("Failed to clean article_tags: %v", err)
	}

	_, err = testDB.ExecContext(ctx, "DELETE FROM articles")
	if err != nil {
		t.Fatalf("Failed to clean articles: %v", err)
	}

	_, err = testDB.ExecContext(ctx, "DELETE FROM tags")
	if err != nil {
		t.Fatalf("Failed to clean tags: %v", err)
	}

	_, err = testDB.ExecContext(ctx, "DELETE FROM categories")
	if err != nil {
		t.Fatalf("Failed to clean categories: %v", err)
	}

	_, err = testDB.ExecContext(ctx, "DELETE FROM admins")
	if err != nil {
		t.Fatalf("Failed to clean admins: %v", err)
	}
}

// createTestArticle creates a published article for testing
func createTestArticle(t *testing.T, title, slug string, published bool) db.Article {
	t.Helper()
	ctx := context.Background()

	status := "draft"
	if published {
		status = "published"
	}

	article, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   title,
		Slug:    slug,
		Summary: strPtr("Test summary for " + title),
		Content: "# Test Content\n\nThis is test content for " + title,
		Status:  status,
	})
	if err != nil {
		t.Fatalf("Failed to create test article: %v", err)
	}

	if published {
		err = testQueries.PublishArticle(ctx, article.ID)
		if err != nil {
			t.Fatalf("Failed to publish article: %v", err)
		}

		// Reload to get published_at
		article, err = testQueries.GetArticleByID(ctx, article.ID)
		if err != nil {
			t.Fatalf("Failed to reload article: %v", err)
		}
	}

	return article
}

func strPtr(s string) *string {
	return &s
}

// TestListPublishedArticles tests the GET /api/v1/articles endpoint
func TestListPublishedArticles(t *testing.T) {
	cleanupDatabase(t)

	// Create test articles
	article1 := createTestArticle(t, "First Article", "first-article", true)
	article2 := createTestArticle(t, "Second Article", "second-article", true)
	_ = createTestArticle(t, "Draft Article", "draft-article", false) // Should not appear

	// Wait a bit to ensure different timestamps
	time.Sleep(10 * time.Millisecond)
	article3 := createTestArticle(t, "Third Article", "third-article", true)

	// Create handler
	articleHandler := handler.NewArticleHandler(testService)
	router := chi.NewRouter()
	router.Get("/api/v1/articles", articleHandler.ListArticles)

	tests := []struct {
		name               string
		query              string
		expectedStatus     int
		expectedCount      int
		checkOrder         bool
		expectedFirstSlug  string
	}{
		{
			name:              "list all published articles (default pagination)",
			query:             "",
			expectedStatus:    http.StatusOK,
			expectedCount:     3,
			checkOrder:        true,
			expectedFirstSlug: article3.Slug, // Most recent first
		},
		{
			name:           "list with limit",
			query:          "?limit=2",
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
		{
			name:           "list with offset",
			query:          "?limit=2&offset=2",
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:              "list second page",
			query:             "?page=2&per_page=2",
			expectedStatus:    http.StatusOK,
			expectedCount:     1,
			checkOrder:        true,
			expectedFirstSlug: article1.Slug,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/articles"+tt.query, nil)
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
					t.Errorf("Expected success=true, got success=false")
				}

				articles, ok := response.Data.([]interface{})
				if !ok {
					t.Fatalf("Expected data to be array, got %T", response.Data)
				}

				if len(articles) != tt.expectedCount {
					t.Errorf("Expected %d articles, got %d", tt.expectedCount, len(articles))
				}

				// Check order if specified
				if tt.checkOrder && len(articles) > 0 && tt.expectedFirstSlug != "" {
					firstArticle := articles[0].(map[string]interface{})
					if firstArticle["slug"] != tt.expectedFirstSlug {
						t.Errorf("Expected first article slug %s, got %s",
							tt.expectedFirstSlug, firstArticle["slug"])
					}
				}

				// Check pagination metadata
				if response.Meta != nil {
					if response.Meta.Total != 3 {
						t.Errorf("Expected total=3, got total=%d", response.Meta.Total)
					}
				}
			}
		})
	}
}

// TestListPublishedArticlesEmpty tests listing when no articles exist
func TestListPublishedArticlesEmpty(t *testing.T) {
	cleanupDatabase(t)

	articleHandler := handler.NewArticleHandler(testService)
	router := chi.NewRouter()
	router.Get("/api/v1/articles", articleHandler.ListArticles)

	req := httptest.NewRequest("GET", "/api/v1/articles", nil)
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

	if !response.Success {
		t.Errorf("Expected success=true")
	}

	articles, ok := response.Data.([]interface{})
	if !ok {
		t.Fatalf("Expected data to be array")
	}

	if len(articles) != 0 {
		t.Errorf("Expected 0 articles, got %d", len(articles))
	}
}
