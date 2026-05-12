package service

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"myblogspot/internal/db"
	"myblogspot/internal/model"
)

// ArticleService handles article business logic
type ArticleService struct {
	queries *db.Queries
}

// NewArticleService creates a new article service
func NewArticleService(queries *db.Queries) *ArticleService {
	return &ArticleService{queries: queries}
}

// ListPublished returns a paginated list of published articles
func (s *ArticleService) ListPublished(ctx context.Context, limit, offset int32) ([]model.ArticleListDTO, int64, error) {
	// Get total count
	total, err := s.queries.CountPublishedArticles(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count articles: %w", err)
	}

	// Get articles
	articles, err := s.queries.ListPublishedArticles(ctx, db.ListPublishedArticlesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list articles: %w", err)
	}

	// Convert to DTOs
	dtos := make([]model.ArticleListDTO, len(articles))
	for i, article := range articles {
		dtos[i] = model.ArticleListDTO{
			ID:          article.ID,
			Title:       article.Title,
			Slug:        article.Slug,
			Summary:     article.Summary,
			CategoryID:  article.CategoryID,
			ViewCount:   article.ViewCount,
			PublishedAt: article.PublishedAt,
			CreatedAt:   article.CreatedAt,
		}
	}

	return dtos, total, nil
}

// GetBySlug returns a published article by slug
func (s *ArticleService) GetBySlug(ctx context.Context, slug string) (*model.ArticleDTO, error) {
	article, err := s.queries.GetArticleBySlug(ctx, slug)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("article not found")
		}
		return nil, fmt.Errorf("failed to get article: %w", err)
	}

	dto := &model.ArticleDTO{
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

	return dto, nil
}

// IncrementViewCount increments the view count for an article
func (s *ArticleService) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	err := s.queries.IncrementViewCount(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to increment view count: %w", err)
	}
	return nil
}
