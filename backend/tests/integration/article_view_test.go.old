package integration

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// TestTrackArticleView tests the POST /api/v1/articles/:id/view endpoint
func TestTrackArticleView(t *testing.T) {
	cleanupDatabase(t)

	// Create test article
	article := createTestArticle(t, "Test Article", "test-article", true)
	initialViewCount := article.ViewCount

	articleHandler := handler.NewArticleHandler(testService)
	router := chi.NewRouter()
	router.Post("/api/v1/articles/{id}/view", articleHandler.TrackView)

	tests := []struct {
		name           string
		articleID      string
		expectedStatus int
		checkViewCount bool
	}{
		{
			name:           "track view for existing article",
			articleID:      article.ID.String(),
			expectedStatus: http.StatusOK,
			checkViewCount: true,
		},
		{
			name:           "track view for non-existent article",
			articleID:      "00000000-0000-0000-0000-000000000000",
			expectedStatus: http.StatusNotFound,
			checkViewCount: false,
		},
		{
			name:           "track view with invalid UUID",
			articleID:      "invalid-uuid",
			expectedStatus: http.StatusBadRequest,
			checkViewCount: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/v1/articles/"+tt.articleID+"/view", nil)
			w := httptest.NewRecorder()

			// Set URL params for chi router
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("id", tt.articleID)
			req = req.WithContext(chi.NewRouteContext())

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.checkViewCount {
				var response model.Response
				err := json.NewDecoder(w.Body).Decode(&response)
				if err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if !response.Success {
					t.Errorf("Expected success=true")
				}

				// Verify view count was incremented in database
				ctx := context.Background()
				updatedArticle, err := testQueries.GetArticleByID(ctx, article.ID)
				if err != nil {
					t.Fatalf("Failed to get updated article: %v", err)
				}

				expectedViewCount := initialViewCount + 1
				if updatedArticle.ViewCount != expectedViewCount {
					t.Errorf("Expected view count %d, got %d",
						expectedViewCount, updatedArticle.ViewCount)
				}

				// Update for next test
				initialViewCount = updatedArticle.ViewCount
			}
		})
	}
}

// TestTrackArticleViewMultiple tests multiple view increments
func TestTrackArticleViewMultiple(t *testing.T) {
	cleanupDatabase(t)

	article := createTestArticle(t, "Test Article", "test-article", true)
	initialViewCount := article.ViewCount

	articleHandler := handler.NewArticleHandler(testService)
	router := chi.NewRouter()
	router.Post("/api/v1/articles/{id}/view", articleHandler.TrackView)

	// Track 5 views
	for i := 1; i <= 5; i++ {
		req := httptest.NewRequest("POST", "/api/v1/articles/"+article.ID.String()+"/view", nil)
		w := httptest.NewRecorder()

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", article.ID.String())
		req = req.WithContext(chi.NewRouteContext())

		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Request %d: Expected status 200, got %d", i, w.Code)
		}
	}

	// Verify final count
	ctx := context.Background()
	updatedArticle, err := testQueries.GetArticleByID(ctx, article.ID)
	if err != nil {
		t.Fatalf("Failed to get updated article: %v", err)
	}

	expectedViewCount := initialViewCount + 5
	if updatedArticle.ViewCount != expectedViewCount {
		t.Errorf("Expected view count %d, got %d",
			expectedViewCount, updatedArticle.ViewCount)
	}
}
