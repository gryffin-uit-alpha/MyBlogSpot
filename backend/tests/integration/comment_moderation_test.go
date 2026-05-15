package integration

import (
	"context"
	"testing"

	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCommentModeration(t *testing.T) {
	setupTestDB(t)
	defer cleanupDatabase(t)

	ctx := context.Background()

	// Create test article
	article, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Test Article",
		Slug:    "test-article",
		Content: "Test content",
		Status:  "published",
	})
	require.NoError(t, err)

	commentService := service.NewCommentService(testQueries)

	t.Run("list all comments with article context", func(t *testing.T) {
		// Create multiple comments
		_, err := testQueries.CreateComment(ctx, db.CreateCommentParams{
			ArticleID: article.ID,
			Nickname:  "User1",
			Content:   "First comment",
			IpAddress: pgtype.Text{String: "127.0.0.1", Valid: true},
		})
		require.NoError(t, err)

		_, err = testQueries.CreateComment(ctx, db.CreateCommentParams{
			ArticleID: article.ID,
			Nickname:  "User2",
			Content:   "Second comment",
			IpAddress: pgtype.Text{String: "127.0.0.2", Valid: true},
		})
		require.NoError(t, err)

		// List all comments (admin view)
		comments, total, err := commentService.ListAll(ctx, 10, 0)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(comments), 2)
		assert.GreaterOrEqual(t, total, int64(2))

		// Verify article context is included
		for _, comment := range comments {
			assert.NotEmpty(t, comment.ArticleTitle)
			assert.NotEmpty(t, comment.ArticleSlug)
			assert.Equal(t, "Test Article", comment.ArticleTitle)
			assert.Equal(t, "test-article", comment.ArticleSlug)
		}
	})

	t.Run("list comments by article ID", func(t *testing.T) {
		articleUUID := article.ID.Bytes
		comments, total, err := commentService.ListByArticleID(ctx, articleUUID, 10, 0)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(comments), 2)
		assert.GreaterOrEqual(t, total, int64(2))

		// Verify all comments belong to the article
		for _, comment := range comments {
			assert.Equal(t, [16]byte(comment.ArticleID), articleUUID)
		}
	})

	t.Run("admin delete comment", func(t *testing.T) {
		// Create comment to delete
		comment, err := testQueries.CreateComment(ctx, db.CreateCommentParams{
			ArticleID: article.ID,
			Nickname:  "ToDelete",
			Content:   "This will be deleted",
			IpAddress: pgtype.Text{String: "127.0.0.3", Valid: true},
		})
		require.NoError(t, err)

		commentID := comment.ID.Bytes

		// Delete comment
		err = commentService.Delete(ctx, commentID)
		require.NoError(t, err)

		// Verify comment is deleted
		_, err = testQueries.GetCommentByID(ctx, comment.ID)
		assert.Error(t, err)
	})

	t.Run("pagination for admin comment list", func(t *testing.T) {
		// Create more comments
		for i := 0; i < 5; i++ {
			_, err := testQueries.CreateComment(ctx, db.CreateCommentParams{
				ArticleID: article.ID,
				Nickname:  "PaginationTest",
				Content:   "Test pagination",
				IpAddress: pgtype.Text{String: "127.0.0.4", Valid: true},
			})
			require.NoError(t, err)
		}

		// Get first page
		page1, total, err := commentService.ListAll(ctx, 3, 0)
		require.NoError(t, err)
		assert.Equal(t, 3, len(page1))
		assert.GreaterOrEqual(t, total, int64(5))

		// Get second page
		page2, _, err := commentService.ListAll(ctx, 3, 3)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(page2), 2)

		// Verify different comments
		assert.NotEqual(t, page1[0].ID, page2[0].ID)
	})

	// Cleanup
	_, err = testPool.Exec(ctx, "DELETE FROM comments WHERE article_id = $1", article.ID)
	require.NoError(t, err)
	_, err = testPool.Exec(ctx, "DELETE FROM articles WHERE id = $1", article.ID)
	require.NoError(t, err)
}

func TestAdminCommentAuth(t *testing.T) {
	setupTestDB(t)
	defer cleanupDatabase(t)

	ctx := context.Background()

	// Create admin
	passwordHash, err := util.HashPassword("testpass")
	require.NoError(t, err)

	admin, err := testQueries.CreateAdmin(ctx, db.CreateAdminParams{
		Username:     "moderator",
		PasswordHash: passwordHash,
		Email:        "mod@test.com",
	})
	require.NoError(t, err)

	// Create article and comment
	article, err := testQueries.CreateArticle(ctx, db.CreateArticleParams{
		Title:   "Auth Test",
		Slug:    "auth-test",
		Content: "Test",
		Status:  "published",
	})
	require.NoError(t, err)

	comment, err := testQueries.CreateComment(ctx, db.CreateCommentParams{
		ArticleID: article.ID,
		Nickname:  "Guest",
		Content:   "Test comment",
		IpAddress: pgtype.Text{String: "127.0.0.1", Valid: true},
	})
	require.NoError(t, err)

	t.Run("admin can delete comments", func(t *testing.T) {
		// Admin service
		commentService := service.NewCommentService(testQueries)

		// Delete comment (admin action)
		err := commentService.Delete(ctx, comment.ID.Bytes)
		require.NoError(t, err)

		// Verify deleted
		_, err = testQueries.GetCommentByID(ctx, comment.ID)
		assert.Error(t, err)
	})

	// Cleanup
	_, err = testPool.Exec(ctx, "DELETE FROM articles WHERE id = $1", article.ID)
	require.NoError(t, err)
	_, err = testPool.Exec(ctx, "DELETE FROM admins WHERE id = $1", admin.ID)
	require.NoError(t, err)
}
