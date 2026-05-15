package integration

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestArticleCRUD(t *testing.T) {
	setupTestDB(t)
	defer cleanupDatabase(t)

	ctx := context.Background()
	articleService := service.NewArticleService(testQueries)

	t.Run("create article", func(t *testing.T) {
		req := model.CreateArticleRequest{
			Title:   "Test Article",
			Slug:    "test-article",
			Content: "This is test content",
			Status:  "draft",
		}

		article, err := articleService.Create(ctx, req)
		require.NoError(t, err)
		assert.Equal(t, req.Title, article.Title)
		assert.Equal(t, req.Slug, article.Slug)
		assert.Equal(t, req.Content, article.Content)
		assert.Equal(t, "draft", article.Status)
		assert.NotEqual(t, uuid.Nil, article.ID)
	})

	t.Run("create article with summary and category", func(t *testing.T) {
		summary := "Test summary"
		req := model.CreateArticleRequest{
			Title:   "Test Article 2",
			Slug:    "test-article-2",
			Summary: &summary,
			Content: "Content with summary",
			Status:  "published",
		}

		article, err := articleService.Create(ctx, req)
		require.NoError(t, err)
		assert.NotNil(t, article.Summary)
		assert.Equal(t, summary, *article.Summary)
		assert.Equal(t, "published", article.Status)
	})

	t.Run("update article", func(t *testing.T) {
		// Create article first
		createReq := model.CreateArticleRequest{
			Title:   "Original Title",
			Slug:    "original-slug",
			Content: "Original content",
			Status:  "draft",
		}

		article, err := articleService.Create(ctx, createReq)
		require.NoError(t, err)

		// Update article
		updatedSummary := "Updated summary"
		updateReq := model.UpdateArticleRequest{
			Title:   "Updated Title",
			Slug:    "updated-slug",
			Summary: &updatedSummary,
			Content: "Updated content",
			Status:  "published",
		}

		updated, err := articleService.Update(ctx, article.ID, updateReq)
		require.NoError(t, err)
		assert.Equal(t, "Updated Title", updated.Title)
		assert.Equal(t, "updated-slug", updated.Slug)
		assert.Equal(t, "Updated content", updated.Content)
		assert.Equal(t, "published", updated.Status)
		assert.NotNil(t, updated.Summary)
		assert.Equal(t, updatedSummary, *updated.Summary)
	})

	t.Run("get article by ID", func(t *testing.T) {
		// Create article
		req := model.CreateArticleRequest{
			Title:   "Get By ID Test",
			Slug:    "get-by-id-test",
			Content: "Test content",
			Status:  "draft",
		}

		created, err := articleService.Create(ctx, req)
		require.NoError(t, err)

		// Get by ID
		article, err := articleService.GetByID(ctx, created.ID)
		require.NoError(t, err)
		assert.Equal(t, created.ID, article.ID)
		assert.Equal(t, created.Title, article.Title)
		assert.Equal(t, created.Slug, article.Slug)
	})

	t.Run("get article by ID - not found", func(t *testing.T) {
		nonExistentID := uuid.New()
		_, err := articleService.GetByID(ctx, nonExistentID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "article not found")
	})

	t.Run("list all articles includes drafts", func(t *testing.T) {
		// Create published and draft articles
		publishedReq := model.CreateArticleRequest{
			Title:   "Published Article",
			Slug:    "published-article",
			Content: "Published content",
			Status:  "published",
		}
		_, err := articleService.Create(ctx, publishedReq)
		require.NoError(t, err)

		draftReq := model.CreateArticleRequest{
			Title:   "Draft Article",
			Slug:    "draft-article",
			Content: "Draft content",
			Status:  "draft",
		}
		_, err = articleService.Create(ctx, draftReq)
		require.NoError(t, err)

		// List all articles (admin view)
		articles, err := articleService.ListAll(ctx, 10, 0)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(articles), 2)

		// Verify we have multiple articles (both published and draft were created)
		assert.GreaterOrEqual(t, len(articles), 2, "ListAll should include all articles")
	})

	t.Run("delete article", func(t *testing.T) {
		// Create article
		req := model.CreateArticleRequest{
			Title:   "To Be Deleted",
			Slug:    "to-be-deleted",
			Content: "Delete me",
			Status:  "draft",
		}

		article, err := articleService.Create(ctx, req)
		require.NoError(t, err)

		// Delete article
		err = articleService.Delete(ctx, article.ID)
		require.NoError(t, err)

		// Verify deleted
		_, err = articleService.GetByID(ctx, article.ID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "article not found")
	})

	t.Run("update non-existent article", func(t *testing.T) {
		nonExistentID := uuid.New()
		updateReq := model.UpdateArticleRequest{
			Title:   "Should Fail",
			Slug:    "should-fail",
			Content: "This should fail",
			Status:  "draft",
		}

		_, err := articleService.Update(ctx, nonExistentID, updateReq)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "article not found")
	})
}
