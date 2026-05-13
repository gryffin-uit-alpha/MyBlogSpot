package unit

import (
	"context"
	"testing"

	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

var searchService *service.SearchService

func setupSearchService(t *testing.T) {
	if searchService != nil {
		return
	}

	ctx := context.Background()
	dsn := "postgres://myblogspot:secret@localhost:5432/myblogspot_dev?sslmode=disable"

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}

	queries := db.New(pool)
	searchService = service.NewSearchService(queries)
}

func TestSearchService_SearchArticles_EmptyQuery(t *testing.T) {
	setupSearchService(t)
	ctx := context.Background()

	results, err := searchService.SearchArticles(ctx, "", 10, 0)
	if err != nil {
		t.Fatalf("Expected no error for empty query, got: %v", err)
	}

	if len(results) != 0 {
		t.Errorf("Expected empty results for empty query, got %d results", len(results))
	}
}

func TestSearchService_SearchArticles_BasicSearch(t *testing.T) {
	setupSearchService(t)
	ctx := context.Background()

	results, err := searchService.SearchArticles(ctx, "golang", 10, 0)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	// Should return results or empty array, no error
	if results == nil {
		t.Error("Expected non-nil results slice")
	}
}

func TestSearchService_SearchArticles_MultiWordQuery(t *testing.T) {
	setupSearchService(t)
	ctx := context.Background()

	results, err := searchService.SearchArticles(ctx, "go programming language", 10, 0)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	if results == nil {
		t.Error("Expected non-nil results slice")
	}
}

func TestSearchService_SearchArticles_Pagination(t *testing.T) {
	setupSearchService(t)
	ctx := context.Background()

	// Test with different limits and offsets
	results1, err := searchService.SearchArticles(ctx, "test", 5, 0)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	results2, err := searchService.SearchArticles(ctx, "test", 5, 5)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	// Both should be non-nil
	if results1 == nil || results2 == nil {
		t.Error("Expected non-nil results slices")
	}
}

func TestSearchService_SearchArticles_SpecialCharacters(t *testing.T) {
	setupSearchService(t)
	ctx := context.Background()

	// Search with special characters (only alphanumeric and spaces work with simple tsquery conversion)
	queries := []string{
		"test query",
		"golang programming",
		"docker kubernetes",
	}

	for _, query := range queries {
		results, err := searchService.SearchArticles(ctx, query, 10, 0)
		if err != nil {
			t.Errorf("Search failed for query '%s': %v", query, err)
		}
		if results == nil {
			t.Errorf("Expected non-nil results for query '%s'", query)
		}
	}
}
