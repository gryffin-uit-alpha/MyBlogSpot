package integration

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// TestGetArticleBySlug tests the GET /api/v1/articles/:slug endpoint
func TestGetArticleBySlug(t *testing.T) {
	cleanupDatabase(t)

	// Create test article
	article := createTestArticle(t, "Test Article", "test-article", true)
	_ = createTestArticle(t, "Draft Article", "draft-article", false)

	articleHandler := handler.NewArticleHandler(testService)
	router := chi.NewRouter()
	router.Get("/api/v1/articles/{slug}", articleHandler.GetArticle)

	tests := []struct {
		name           string
		slug           string
		expectedStatus int
		checkContent   bool
	}{
		{
			name:           "get existing published article",
			slug:           article.Slug,
			expectedStatus: http.StatusOK,
			checkContent:   true,
		},
		{
			name:           "get non-existent article",
			slug:           "non-existent-slug",
			expectedStatus: http.StatusNotFound,
			checkContent:   false,
		},
		{
			name:           "get draft article (should fail for public)",
			slug:           "draft-article",
			expectedStatus: http.StatusNotFound,
			checkContent:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/articles/"+tt.slug, nil)
			w := httptest.NewRecorder()

			// Set URL params for chi router
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("slug", tt.slug)
			req = req.WithContext(chi.NewRouteContext())

			router.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.checkContent {
				var response model.Response
				err := json.NewDecoder(w.Body).Decode(&response)
				if err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if !response.Success {
					t.Errorf("Expected success=true")
				}

				articleData, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatalf("Expected data to be object, got %T", response.Data)
				}

				if articleData["slug"] != article.Slug {
					t.Errorf("Expected slug %s, got %s", article.Slug, articleData["slug"])
				}

				if articleData["title"] != article.Title {
					t.Errorf("Expected title %s, got %s", article.Title, articleData["title"])
				}

				if articleData["content"] == nil || articleData["content"] == "" {
					t.Errorf("Expected content to be present")
				}

				if articleData["status"] != "published" {
					t.Errorf("Expected status published, got %s", articleData["status"])
				}
			}
		})
	}
}
