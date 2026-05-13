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

// TestListTags tests GET /api/v1/tags
func TestListTags(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create test tags
	tag1, err := testQueries.CreateTag(ctx, db.CreateTagParams{
		Name: "Go",
		Slug: "go",
	})
	if err != nil {
		t.Fatalf("Failed to create tag: %v", err)
	}

	tag2, err := testQueries.CreateTag(ctx, db.CreateTagParams{
		Name: "Docker",
		Slug: "docker",
	})
	if err != nil {
		t.Fatalf("Failed to create tag: %v", err)
	}

	tag3, err := testQueries.CreateTag(ctx, db.CreateTagParams{
		Name: "API",
		Slug: "api",
	})
	if err != nil {
		t.Fatalf("Failed to create tag: %v", err)
	}

	tagService := service.NewTagService(testQueries)
	tagHandler := handler.NewTagHandler(tagService)

	router := chi.NewRouter()
	router.Get("/api/v1/tags", tagHandler.ListTags)

	req := httptest.NewRequest("GET", "/api/v1/tags", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response model.Response
	err = json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if !response.Success {
		t.Errorf("Expected success=true")
	}

	tags, ok := response.Data.([]interface{})
	if !ok {
		t.Fatalf("Expected data to be array")
	}

	if len(tags) != 3 {
		t.Errorf("Expected 3 tags, got %d", len(tags))
	}

	// Verify alphabetical ordering
	firstTag := tags[0].(map[string]interface{})
	if firstTag["slug"] != tag3.Slug { // "api" comes first
		t.Errorf("Expected first tag to be 'api', got %s", firstTag["slug"])
	}

	secondTag := tags[1].(map[string]interface{})
	if secondTag["slug"] != tag2.Slug { // "docker"
		t.Errorf("Expected second tag to be 'docker', got %s", secondTag["slug"])
	}

	thirdTag := tags[2].(map[string]interface{})
	if thirdTag["slug"] != tag1.Slug { // "go"
		t.Errorf("Expected third tag to be 'go', got %s", thirdTag["slug"])
	}
}

// TestGetTagBySlug tests GET /api/v1/tags/:slug
func TestGetTagBySlug(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create test tag
	tag, err := testQueries.CreateTag(ctx, db.CreateTagParams{
		Name: "PostgreSQL",
		Slug: "postgresql",
	})
	if err != nil {
		t.Fatalf("Failed to create tag: %v", err)
	}

	tagService := service.NewTagService(testQueries)
	tagHandler := handler.NewTagHandler(tagService)

	router := chi.NewRouter()
	router.Get("/api/v1/tags/{slug}", tagHandler.GetTag)

	tests := []struct {
		name           string
		slug           string
		expectedStatus int
		checkContent   bool
	}{
		{
			name:           "get existing tag",
			slug:           tag.Slug,
			expectedStatus: http.StatusOK,
			checkContent:   true,
		},
		{
			name:           "get non-existent tag",
			slug:           "non-existent",
			expectedStatus: http.StatusNotFound,
			checkContent:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/tags/"+tt.slug, nil)
			w := httptest.NewRecorder()

			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("slug", tt.slug)
			req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

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

				tagData, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Fatalf("Expected data to be object")
				}

				if tagData["slug"] != tag.Slug {
					t.Errorf("Expected slug %s, got %s", tag.Slug, tagData["slug"])
				}

				if tagData["name"] != tag.Name {
					t.Errorf("Expected name %s, got %s", tag.Name, tagData["name"])
				}
			}
		})
	}
}

// TestGetTagArticles tests GET /api/v1/tags/:slug/articles
func TestGetTagArticles(t *testing.T) {
	setupTestDB(t)
	cleanupDatabase(t)
	ctx := context.Background()

	// Create tag
	tag, err := testQueries.CreateTag(ctx, db.CreateTagParams{
		Name: "Go",
		Slug: "go",
	})
	if err != nil {
		t.Fatalf("Failed to create tag: %v", err)
	}

	// Create articles and tag them
	for i := 1; i <= 3; i++ {
		article, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
			Title:   "Go Article " + string(rune('0'+i)),
			Slug:    "go-article-" + string(rune('0'+i)),
			Summary: pgtype.Text{String: "Summary", Valid: true},
			Content: "Content about Go",
			Status:  "published",
		})
		if err != nil {
			t.Fatalf("Failed to create article: %v", err)
		}

		// Publish and tag
		err = testQueries.PublishArticle(ctx, article.ID)
		if err != nil {
			t.Fatalf("Failed to publish article: %v", err)
		}

		err = testQueries.AddArticleTag(ctx, db.AddArticleTagParams{
			ArticleID: article.ID,
			TagID:     tag.ID,
		})
		if err != nil {
			t.Fatalf("Failed to tag article: %v", err)
		}
	}

	// Create article with different tag (should not appear)
	otherTag, _ := testQueries.CreateTag(ctx, db.CreateTagParams{
		Name: "Python",
		Slug: "python",
	})
	otherArticle, _ := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Python Article",
		Slug:    "python-article",
		Content: "Python content",
		Status:  "published",
	})
	testQueries.PublishArticle(ctx, otherArticle.ID)
	testQueries.AddArticleTag(ctx, db.AddArticleTagParams{
		ArticleID: otherArticle.ID,
		TagID:     otherTag.ID,
	})

	tagService := service.NewTagService(testQueries)
	tagHandler := handler.NewTagHandler(tagService)

	router := chi.NewRouter()
	router.Get("/api/v1/tags/{slug}/articles", tagHandler.GetTagArticles)

	req := httptest.NewRequest("GET", "/api/v1/tags/go/articles", nil)
	w := httptest.NewRecorder()

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("slug", "go")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response model.Response
	err = json.NewDecoder(w.Body).Decode(&response)
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

	if len(articles) != 3 {
		t.Errorf("Expected 3 articles with Go tag, got %d", len(articles))
	}
}
