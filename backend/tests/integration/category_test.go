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

// TestListCategories tests GET /api/v1/categories
func TestListCategories(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create test categories
	cat1, err := testQueries.CreateCategory(ctx, db.CreateCategoryParams{
		Name:        "DevOps",
		Slug:        "devops",
		Description: pgtype.Text{String: "DevOps articles", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	cat2, err := testQueries.CreateCategory(ctx, db.CreateCategoryParams{
		Name:        "Backend",
		Slug:        "backend",
		Description: pgtype.Text{String: "Backend engineering", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	// Setup handler
	categoryService := service.NewCategoryService(testQueries)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	// Make request
	req := httptest.NewRequest(http.MethodGet, "/api/v1/categories", nil)
	rec := httptest.NewRecorder()

	categoryHandler.ListCategories(rec, req)

	// Verify response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	var response model.Response
	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Success {
		t.Error("Expected success=true")
	}

	categories, ok := response.Data.([]interface{})
	if !ok {
		t.Fatalf("Expected data to be array, got %T", response.Data)
	}

	if len(categories) != 2 {
		t.Errorf("Expected 2 categories, got %d", len(categories))
	}

	// Verify alphabetical order (Backend before DevOps)
	firstCat := categories[0].(map[string]interface{})
	if firstCat["name"] != "Backend" {
		t.Errorf("Expected first category to be 'Backend', got %s", firstCat["name"])
	}

	_ = cat1
	_ = cat2
}

// TestGetCategoryBySlug tests GET /api/v1/categories/:slug
func TestGetCategoryBySlug(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create test category
	category, err := testQueries.CreateCategory(ctx, db.CreateCategoryParams{
		Name:        "DevOps",
		Slug:        "devops",
		Description: pgtype.Text{String: "DevOps practices", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	// Setup handler
	categoryService := service.NewCategoryService(testQueries)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	// Create router with chi context
	r := chi.NewRouter()
	r.Get("/api/v1/categories/{slug}", categoryHandler.GetCategory)

	// Make request
	req := httptest.NewRequest(http.MethodGet, "/api/v1/categories/devops", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	// Verify response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var response model.Response
	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Success {
		t.Error("Expected success=true")
	}

	catData, ok := response.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("Expected data to be object, got %T", response.Data)
	}

	if catData["slug"] != "devops" {
		t.Errorf("Expected slug 'devops', got %v", catData["slug"])
	}

	if catData["name"] != "DevOps" {
		t.Errorf("Expected name 'DevOps', got %v", catData["name"])
	}

	_ = category
}

// TestGetCategoryArticles tests GET /api/v1/categories/:slug/articles
func TestGetCategoryArticles(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create test category
	category, err := testQueries.CreateCategory(ctx, db.CreateCategoryParams{
		Name:        "DevOps",
		Slug:        "devops",
		Description: pgtype.Text{String: "DevOps practices", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	// Create test articles in the category
	// (Skip for now - articles are optional for this test)
	_ = category

	// Setup handler
	categoryService := service.NewCategoryService(testQueries)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	// Create router
	r := chi.NewRouter()
	r.Get("/api/v1/categories/{slug}/articles", categoryHandler.GetCategoryArticles)

	// Make request
	req := httptest.NewRequest(http.MethodGet, "/api/v1/categories/devops/articles", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	// Verify response
	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var response model.Response
	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Success {
		t.Error("Expected success=true")
	}

	// Verify metadata exists
	if response.Meta == nil {
		t.Error("Expected meta to be present")
	}
}
