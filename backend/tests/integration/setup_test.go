package integration

import (
	"context"
	"testing"

	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	testPool    *pgxpool.Pool
	testQueries *db.Queries
)

func setupTestDB(t *testing.T) {
	if testPool != nil {
		return
	}

	ctx := context.Background()
	dsn := "postgres://myblogspot:secret@localhost:5432/myblogspot_dev?sslmode=disable"

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	testPool = pool
	testQueries = db.New(pool)
}

func cleanupDatabase(t *testing.T) {
	if testQueries == nil {
		return
	}

	ctx := context.Background()

	// Clean up in reverse dependency order
	_, err := testPool.Exec(ctx, "DELETE FROM article_tags")
	if err != nil {
		t.Logf("Warning: failed to clean article_tags: %v", err)
	}

	_, err = testPool.Exec(ctx, "DELETE FROM comments")
	if err != nil {
		t.Logf("Warning: failed to clean comments: %v", err)
	}

	_, err = testPool.Exec(ctx, "DELETE FROM articles")
	if err != nil {
		t.Logf("Warning: failed to clean articles: %v", err)
	}

	_, err = testPool.Exec(ctx, "DELETE FROM tags")
	if err != nil {
		t.Logf("Warning: failed to clean tags: %v", err)
	}

	_, err = testPool.Exec(ctx, "DELETE FROM categories")
	if err != nil {
		t.Logf("Warning: failed to clean categories: %v", err)
	}
}
