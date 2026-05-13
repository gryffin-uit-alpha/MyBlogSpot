package service

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// CategoryService handles category business logic
type CategoryService struct {
	queries *db.Queries
}

// NewCategoryService creates a new category service
func NewCategoryService(queries *db.Queries) *CategoryService {
	return &CategoryService{queries: queries}
}

// List returns all categories
func (s *CategoryService) List(ctx context.Context) ([]model.CategoryDTO, error) {
	categories, err := s.queries.ListCategories(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}

	dtos := make([]model.CategoryDTO, len(categories))
	for i, cat := range categories {
		dtos[i] = model.CategoryDTO{
			ID:          uuid.UUID(cat.ID.Bytes),
			Name:        cat.Name,
			Slug:        cat.Slug,
			Description: pgTextToStringPtr(cat.Description),
			CreatedAt:   pgTimestampToTime(cat.CreatedAt),
			UpdatedAt:   pgTimestampToTime(cat.UpdatedAt),
		}
	}

	return dtos, nil
}

// GetBySlug returns a category by slug
func (s *CategoryService) GetBySlug(ctx context.Context, slug string) (*model.CategoryDTO, error) {
	category, err := s.queries.GetCategoryBySlug(ctx, slug)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("category not found")
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	dto := &model.CategoryDTO{
		ID:          uuid.UUID(category.ID.Bytes),
		Name:        category.Name,
		Slug:        category.Slug,
		Description: pgTextToStringPtr(category.Description),
		CreatedAt:   pgTimestampToTime(category.CreatedAt),
		UpdatedAt:   pgTimestampToTime(category.UpdatedAt),
	}

	return dto, nil
}

// GetArticlesByCategory returns articles in a specific category
func (s *CategoryService) GetArticlesByCategory(ctx context.Context, categoryID uuid.UUID, limit, offset int32) ([]model.ArticleListDTO, int64, error) {
	pgID := uuidToPgUUID(categoryID)

	// Get total count - would need a query for this, for now return articles directly
	articles, err := s.queries.ListArticlesByCategory(ctx, db.ListArticlesByCategoryParams{
		CategoryID: pgID,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list articles by category: %w", err)
	}

	dtos := make([]model.ArticleListDTO, len(articles))
	for i, article := range articles {
		dtos[i] = model.ArticleListDTO{
			ID:          uuid.UUID(article.ID.Bytes),
			Title:       article.Title,
			Slug:        article.Slug,
			Summary:     pgTextToStringPtr(article.Summary),
			CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
			ViewCount:   article.ViewCount,
			PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
			CreatedAt:   pgTimestampToTime(article.CreatedAt),
		}
	}

	// Return count as len for now (would need separate count query for accurate pagination)
	return dtos, int64(len(articles)), nil
}
