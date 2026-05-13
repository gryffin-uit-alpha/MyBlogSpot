package benchmark

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	benchPool    *pgxpool.Pool
	benchQueries *db.Queries
	benchService *service.ArticleService
)

// setupBenchmark initializes the benchmark database
func setupBenchmark(b *testing.B) {
	if benchPool != nil {
		return // Already initialized
	}

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

	benchPool, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		b.Fatalf("Failed to connect to benchmark database: %v", err)
	}

	benchQueries = db.New(benchPool)
	benchService = service.NewArticleService(benchQueries)

	// Seed benchmark data
	seedBenchmarkData(b)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// seedBenchmarkData creates test articles for benchmarking
func seedBenchmarkData(b *testing.B) {
	ctx := context.Background()

	// Check if data already exists
	count, err := benchQueries.CountPublishedArticles(ctx)
	if err != nil {
		b.Fatalf("Failed to count articles: %v", err)
	}

	if count >= 100 {
		b.Logf("Benchmark data already seeded (%d articles)", count)
		return
	}

	b.Log("Seeding benchmark data...")

	// Clean existing data
	_, err = benchPool.Exec(ctx, "DELETE FROM article_tags")
	if err != nil {
		b.Fatalf("Failed to clean article_tags: %v", err)
	}
	_, err = benchPool.Exec(ctx, "DELETE FROM articles")
	if err != nil {
		b.Fatalf("Failed to clean articles: %v", err)
	}

	// Create 100 published articles
	for i := 1; i <= 100; i++ {
		article, err := benchQueries.CreateArticle(ctx, db.CreateArticleParams{
			Title:   fmt.Sprintf("Benchmark Article %d", i),
			Slug:    fmt.Sprintf("benchmark-article-%d", i),
			Summary: pgtype.Text{String: fmt.Sprintf("This is benchmark article number %d", i), Valid: true},
			Content: fmt.Sprintf("# Benchmark Article %d\n\nThis is the content for benchmark testing.\n\n## Section 1\n\nSome content here.\n\n## Section 2\n\nMore content.", i),
			Status:  "published",
		})
		if err != nil {
			b.Fatalf("Failed to create article %d: %v", i, err)
		}

		// Publish the article
		err = benchQueries.PublishArticle(ctx, article.ID)
		if err != nil {
			b.Fatalf("Failed to publish article %d: %v", i, err)
		}

		// Set some view counts for variety
		for j := 0; j < i%50; j++ {
			_ = benchQueries.IncrementViewCount(ctx, article.ID)
		}
	}

	b.Logf("Seeded 100 benchmark articles")
}

// BenchmarkListPublishedArticles benchmarks the article listing query
func BenchmarkListPublishedArticles(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, err := benchService.ListPublished(ctx, 20, 0)
		if err != nil {
			b.Fatalf("ListPublished failed: %v", err)
		}
	}
}

// BenchmarkListPublishedArticlesWithPagination benchmarks pagination scenarios
func BenchmarkListPublishedArticlesWithPagination(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	benchmarks := []struct {
		name   string
		limit  int32
		offset int32
	}{
		{"FirstPage_Limit10", 10, 0},
		{"FirstPage_Limit20", 20, 0},
		{"FirstPage_Limit50", 50, 0},
		{"SecondPage_Limit20", 20, 20},
		{"ThirdPage_Limit20", 20, 40},
		{"LastPage_Limit20", 20, 80},
	}

	for _, bm := range benchmarks {
		b.Run(bm.name, func(b *testing.B) {
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_, _, err := benchService.ListPublished(ctx, bm.limit, bm.offset)
				if err != nil {
					b.Fatalf("ListPublished failed: %v", err)
				}
			}
		})
	}
}

// BenchmarkGetArticleBySlug benchmarks single article retrieval
func BenchmarkGetArticleBySlug(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	// Test with different articles (cache behavior)
	slugs := []string{
		"benchmark-article-1",
		"benchmark-article-25",
		"benchmark-article-50",
		"benchmark-article-75",
		"benchmark-article-100",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		slug := slugs[i%len(slugs)]
		_, err := benchService.GetBySlug(ctx, slug)
		if err != nil {
			b.Fatalf("GetBySlug failed: %v", err)
		}
	}
}

// BenchmarkGetArticleBySlugSingle benchmarks getting the same article repeatedly
func BenchmarkGetArticleBySlugSingle(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := benchService.GetBySlug(ctx, "benchmark-article-50")
		if err != nil {
			b.Fatalf("GetBySlug failed: %v", err)
		}
	}
}

// BenchmarkIncrementViewCount benchmarks view count increments
func BenchmarkIncrementViewCount(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	// Get an article ID
	article, err := benchService.GetBySlug(ctx, "benchmark-article-1")
	if err != nil {
		b.Fatalf("Failed to get article: %v", err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		err := benchService.IncrementViewCount(ctx, article.ID)
		if err != nil {
			b.Fatalf("IncrementViewCount failed: %v", err)
		}
	}
}

// BenchmarkConcurrentReads benchmarks concurrent read operations
func BenchmarkConcurrentReads(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			i++
			// Mix of list and detail queries
			if i%3 == 0 {
				_, _, err := benchService.ListPublished(ctx, 20, 0)
				if err != nil {
					b.Errorf("ListPublished failed: %v", err)
				}
			} else {
				slug := fmt.Sprintf("benchmark-article-%d", (i%100)+1)
				_, err := benchService.GetBySlug(ctx, slug)
				if err != nil {
					b.Errorf("GetBySlug failed: %v", err)
				}
			}
		}
	})
}

// BenchmarkCountPublishedArticles benchmarks the count query
func BenchmarkCountPublishedArticles(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := benchQueries.CountPublishedArticles(ctx)
		if err != nil {
			b.Fatalf("CountPublishedArticles failed: %v", err)
		}
	}
}

// BenchmarkFullArticlePage benchmarks a complete article page load
// This simulates fetching article + incrementing view count
func BenchmarkFullArticlePage(b *testing.B) {
	setupBenchmark(b)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Get article
		article, err := benchService.GetBySlug(ctx, "benchmark-article-50")
		if err != nil {
			b.Fatalf("GetBySlug failed: %v", err)
		}

		// Increment view count
		err = benchService.IncrementViewCount(ctx, article.ID)
		if err != nil {
			b.Fatalf("IncrementViewCount failed: %v", err)
		}
	}
}
