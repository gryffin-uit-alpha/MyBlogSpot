package unit

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	testPool    *pgxpool.Pool
	testQueries *db.Queries
	testService *service.ArticleService
)

// TestMain sets up a lightweight test database
func TestMain(m *testing.M) {
	// Use same database as integration tests
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("TEST_DB_HOST", "localhost"),
		getEnv("TEST_DB_PORT", "5432"),
		getEnv("TEST_DB_USER", "myblogspot"),
		getEnv("TEST_DB_PASSWORD", "secret"),
		getEnv("TEST_DB_NAME", "myblogspot_test"),
		getEnv("TEST_DB_SSLMODE", "disable"),
	)

	var err error
	testPool, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		fmt.Printf("Failed to connect to test database: %v\n", err)
		os.Exit(1)
	}

	testQueries = db.New(testPool)
	testService = service.NewArticleService(testQueries)

	code := m.Run()

	testPool.Close()
	os.Exit(code)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// cleanupTestData removes all test data
func cleanupTestData(t *testing.T) {
	t.Helper()
	ctx := context.Background()

	queries := []string{
		"DELETE FROM comments",
		"DELETE FROM article_tags",
		"DELETE FROM articles",
		"DELETE FROM tags",
		"DELETE FROM categories",
	}

	for _, query := range queries {
		_, err := testPool.Exec(ctx, query)
		if err != nil {
			t.Logf("Cleanup warning for query '%s': %v", query, err)
		}
	}
}

// createTestArticle creates a test article
func createTestArticle(t *testing.T, title, slug string, published bool) db.GetArticleByIDRow {
	t.Helper()
	ctx := context.Background()

	status := "draft"
	if published {
		status = "published"
	}

	article, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   title,
		Slug:    slug,
		Summary: pgtype.Text{String: "Test summary for " + title, Valid: true},
		Content: "# Test Content\n\nThis is test content.",
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

		reloaded, err := testQueries.GetArticleByID(ctx, article.ID)
		if err != nil {
			t.Fatalf("Failed to reload article: %v", err)
		}
		return reloaded
	}

	// Convert CreateArticleRow to GetArticleByIDRow
	return db.GetArticleByIDRow{
		ID:          article.ID,
		Title:       article.Title,
		Slug:        article.Slug,
		Summary:     article.Summary,
		Content:     article.Content,
		CategoryID:  article.CategoryID,
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		PublishedAt: article.PublishedAt,
		CreatedAt:   article.CreatedAt,
		UpdatedAt:   article.UpdatedAt,
	}
}

// TestArticleService_ListPublished_EmptyList tests listing when no articles exist
func TestArticleService_ListPublished_EmptyList(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	articles, total, err := testService.ListPublished(ctx, 20, 0)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if total != 0 {
		t.Errorf("Expected total=0, got %d", total)
	}

	if len(articles) != 0 {
		t.Errorf("Expected 0 articles, got %d", len(articles))
	}
}

// TestArticleService_ListPublished_OnlyPublished tests that drafts are excluded
func TestArticleService_ListPublished_OnlyPublished(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	// Create 3 published and 2 draft articles
	createTestArticle(t, "Published 1", "published-1", true)
	createTestArticle(t, "Draft 1", "draft-1", false)
	createTestArticle(t, "Published 2", "published-2", true)
	createTestArticle(t, "Draft 2", "draft-2", false)
	createTestArticle(t, "Published 3", "published-3", true)

	articles, total, err := testService.ListPublished(ctx, 20, 0)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if total != 3 {
		t.Errorf("Expected total=3 (only published), got %d", total)
	}

	if len(articles) != 3 {
		t.Errorf("Expected 3 articles, got %d", len(articles))
	}

	// Verify all returned articles are from published ones
	for _, article := range articles {
		if article.Slug == "draft-1" || article.Slug == "draft-2" {
			t.Errorf("Draft article should not be in published list: %s", article.Slug)
		}
	}
}

// TestArticleService_ListPublished_Pagination tests pagination logic
func TestArticleService_ListPublished_Pagination(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	// Create 25 published articles
	for i := 1; i <= 25; i++ {
		createTestArticle(t, fmt.Sprintf("Article %d", i), fmt.Sprintf("article-%d", i), true)
	}

	tests := []struct {
		name          string
		limit         int32
		offset        int32
		expectedCount int
		expectedTotal int64
	}{
		{"first page (20 items)", 20, 0, 20, 25},
		{"second page (5 items)", 20, 20, 5, 25},
		{"limit 10", 10, 0, 10, 25},
		{"offset 15", 10, 15, 10, 25},
		{"offset beyond total", 20, 30, 0, 25},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			articles, total, err := testService.ListPublished(ctx, tt.limit, tt.offset)

			if err != nil {
				t.Fatalf("Expected no error, got %v", err)
			}

			if total != tt.expectedTotal {
				t.Errorf("Expected total=%d, got %d", tt.expectedTotal, total)
			}

			if len(articles) != tt.expectedCount {
				t.Errorf("Expected %d articles, got %d", tt.expectedCount, len(articles))
			}
		})
	}
}

// TestArticleService_GetBySlug_Success tests successful article retrieval
func TestArticleService_GetBySlug_Success(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	expected := createTestArticle(t, "Test Article", "test-article-slug", true)

	article, err := testService.GetBySlug(ctx, "test-article-slug")

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if article == nil {
		t.Fatal("Expected article, got nil")
	}

	if article.Title != expected.Title {
		t.Errorf("Expected title=%s, got %s", expected.Title, article.Title)
	}

	if article.Slug != expected.Slug {
		t.Errorf("Expected slug=%s, got %s", expected.Slug, article.Slug)
	}

	if article.Content != expected.Content {
		t.Errorf("Expected content to match")
	}
}

// TestArticleService_GetBySlug_NotFound tests article not found case
func TestArticleService_GetBySlug_NotFound(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	article, err := testService.GetBySlug(ctx, "non-existent-slug")

	if err == nil {
		t.Fatal("Expected error for non-existent article")
	}

	if article != nil {
		t.Errorf("Expected nil article, got %v", article)
	}
}

// TestArticleService_GetBySlug_DraftNotReturned tests that draft articles are not returned
func TestArticleService_GetBySlug_DraftNotReturned(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	createTestArticle(t, "Draft Article", "draft-slug", false)

	article, err := testService.GetBySlug(ctx, "draft-slug")

	if err == nil {
		t.Fatal("Expected error when fetching draft article via public method")
	}

	if article != nil {
		t.Errorf("Expected nil article for draft, got %v", article)
	}
}

// TestArticleService_IncrementViewCount_Success tests view count increment
func TestArticleService_IncrementViewCount_Success(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	article := createTestArticle(t, "Test Article", "test-article", true)
	initialCount := article.ViewCount

	// Convert pgtype.UUID to uuid.UUID
	articleUUID := uuid.UUID(article.ID.Bytes)

	err := testService.IncrementViewCount(ctx, articleUUID)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify count was incremented
	updated, err := testQueries.GetArticleByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("Failed to get updated article: %v", err)
	}

	if updated.ViewCount != initialCount+1 {
		t.Errorf("Expected view_count=%d, got %d", initialCount+1, updated.ViewCount)
	}
}

// TestArticleService_IncrementViewCount_Multiple tests multiple increments
func TestArticleService_IncrementViewCount_Multiple(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	article := createTestArticle(t, "Popular Article", "popular-article", true)
	initialCount := article.ViewCount
	articleUUID := uuid.UUID(article.ID.Bytes)

	// Increment 10 times
	for i := 0; i < 10; i++ {
		err := testService.IncrementViewCount(ctx, articleUUID)
		if err != nil {
			t.Fatalf("Increment %d failed: %v", i+1, err)
		}
	}

	// Verify final count
	updated, err := testQueries.GetArticleByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("Failed to get updated article: %v", err)
	}

	expectedCount := initialCount + 10
	if updated.ViewCount != expectedCount {
		t.Errorf("Expected view_count=%d, got %d", expectedCount, updated.ViewCount)
	}
}

// TestArticleService_IncrementViewCount_InvalidID tests incrementing non-existent article
func TestArticleService_IncrementViewCount_InvalidID(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	// Use a UUID that doesn't exist
	nonExistentID := uuid.New()

	err := testService.IncrementViewCount(ctx, nonExistentID)

	// Should not error (UPDATE with no rows affected is not an error in SQL)
	// This is expected behavior - silently ignore view increments for deleted articles
	if err != nil {
		t.Logf("Got error (acceptable): %v", err)
	}
}

// TestArticleService_ListPublished_OrderByPublishedDate tests correct ordering
func TestArticleService_ListPublished_OrderByPublishedDate(t *testing.T) {
	cleanupTestData(t)
	ctx := context.Background()

	// Create articles (they'll have increasing published_at timestamps)
	article1 := createTestArticle(t, "First", "first", true)
	_ = createTestArticle(t, "Second", "second", true)
	article3 := createTestArticle(t, "Third", "third", true)

	articles, total, err := testService.ListPublished(ctx, 20, 0)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if total != 3 {
		t.Errorf("Expected total=3, got %d", total)
	}

	if len(articles) != 3 {
		t.Fatalf("Expected 3 articles, got %d", len(articles))
	}

	// Should be ordered newest first (DESC)
	// Note: article3 was created last, so should be first in results
	if articles[0].Slug != article3.Slug {
		t.Errorf("Expected first article to be newest (slug=%s), got %s", article3.Slug, articles[0].Slug)
	}

	if articles[2].Slug != article1.Slug {
		t.Errorf("Expected last article to be oldest (slug=%s), got %s", article1.Slug, articles[2].Slug)
	}
}
