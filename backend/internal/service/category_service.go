package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/cache"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var ErrCategoryNotFound = errors.New("category not found")

// CategoryService handles category business logic
type CategoryService struct {
	queries *db.Queries
	cache   cache.Cache
}

// NewCategoryService creates a new category service with optional cache support
func NewCategoryService(queries *db.Queries, c ...cache.Cache) *CategoryService {
	var appCache cache.Cache
	if len(c) > 0 {
		appCache = c[0]
	}
	return &CategoryService{queries: queries, cache: appCache}
}

// List returns all categories (cached in Redis)
func (s *CategoryService) List(ctx context.Context) ([]model.CategoryDTO, error) {
	const cacheKey = "myblogspot:categories:all"
	var cached []model.CategoryDTO
	if s.cache != nil && s.cache.Get(ctx, "categories", cacheKey, &cached) {
		return cached, nil
	}

	categories, err := s.queries.ListCategoriesWithCount(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}

	dtos := make([]model.CategoryDTO, len(categories))
	for i, cat := range categories {
		var articleCount *int64
		if count, ok := cat.ArticleCount.(int64); ok {
			articleCount = &count
		}

		dtos[i] = model.CategoryDTO{
			ID:           uuid.UUID(cat.ID.Bytes),
			Name:         cat.Name,
			Slug:         cat.Slug,
			Description:  pgTextToStringPtr(cat.Description),
			ArticleCount: articleCount,
			CreatedAt:    pgTimestampToTime(cat.CreatedAt),
			UpdatedAt:    pgTimestampToTime(cat.UpdatedAt),
		}
	}

	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, dtos, 10*time.Minute)
	}

	return dtos, nil
}

// GetBySlug returns a category by slug (cached in Redis)
func (s *CategoryService) GetBySlug(ctx context.Context, slug string) (*model.CategoryDTO, error) {
	cacheKey := fmt.Sprintf("myblogspot:category:%s", slug)
	var cached model.CategoryDTO
	if s.cache != nil && s.cache.Get(ctx, "categories", cacheKey, &cached) {
		return &cached, nil
	}

	category, err := s.queries.GetCategoryBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCategoryNotFound
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

	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, *dto, 10*time.Minute)
	}

	return dto, nil
}

// GetArticlesByCategory returns articles in a specific category
func (s *CategoryService) GetArticlesByCategory(ctx context.Context, categoryID uuid.UUID, limit, offset int32) ([]model.ArticleListDTO, int64, error) {
	pgID := uuidToPgUUID(categoryID)

	articles, err := s.queries.ListArticlesByCategory(ctx, db.ListArticlesByCategoryParams{
		CategoryID: pgID,
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list articles by category: %w", err)
	}

	total, err := s.queries.CountArticlesByCategory(ctx, pgID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count articles by category: %w", err)
	}

	// Fetch category details once for all articles
	var catDTO *model.CategoryDTO
	cat, err := s.queries.GetCategoryByID(ctx, pgID)
	if err == nil {
		catDTO = &model.CategoryDTO{
			ID:          uuid.UUID(cat.ID.Bytes),
			Name:        cat.Name,
			Slug:        cat.Slug,
			Description: pgTextToStringPtr(cat.Description),
			CreatedAt:   pgTimestampToTime(cat.CreatedAt),
			UpdatedAt:   pgTimestampToTime(cat.UpdatedAt),
		}
	}

	dtos := make([]model.ArticleListDTO, len(articles))
	for i, article := range articles {
		dto := model.ArticleListDTO{
			ID:          uuid.UUID(article.ID.Bytes),
			Title:       article.Title,
			Slug:        article.Slug,
			Summary:     pgTextToStringPtr(article.Summary),
			CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
			Category:    catDTO,
			ViewCount:   article.ViewCount,
			PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
			CreatedAt:   pgTimestampToTime(article.CreatedAt),
		}

		// Load tags
		articleID := uuidToPgUUID(uuid.UUID(article.ID.Bytes))
		tags, err := s.queries.GetArticleTags(ctx, articleID)
		if err == nil && len(tags) > 0 {
			dto.Tags = make([]model.TagDTO, len(tags))
			for j, tag := range tags {
				dto.Tags[j] = model.TagDTO{
					ID:        uuid.UUID(tag.ID.Bytes),
					Name:      tag.Name,
					Slug:      tag.Slug,
					CreatedAt: pgTimestampToTime(tag.CreatedAt),
				}
			}
		}

		dtos[i] = dto
	}

	return dtos, total, nil
}


func (s *CategoryService) Create(ctx context.Context, req model.CreateCategoryRequest) (*model.CategoryDTO, error) {
	var desc pgtype.Text
	if req.Description != nil {
		desc = pgtype.Text{String: *req.Description, Valid: true}
	}

	category, err := s.queries.CreateCategory(ctx, db.CreateCategoryParams{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: desc,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, "myblogspot:categories:all")
		_ = s.cache.DeletePattern(ctx, "myblogspot:category:*")
	}

	return &model.CategoryDTO{
		ID:          uuid.UUID(category.ID.Bytes),
		Name:        category.Name,
		Slug:        category.Slug,
		Description: pgTextToStringPtr(category.Description),
		CreatedAt:   pgTimestampToTime(category.CreatedAt),
		UpdatedAt:   pgTimestampToTime(category.UpdatedAt),
	}, nil
}

func (s *CategoryService) Update(ctx context.Context, id uuid.UUID, req model.UpdateCategoryRequest) (*model.CategoryDTO, error) {
	var desc pgtype.Text
	if req.Description != nil {
		desc = pgtype.Text{String: *req.Description, Valid: true}
	}

	pgID := uuidToPgUUID(id)
	category, err := s.queries.UpdateCategory(ctx, db.UpdateCategoryParams{
		ID:          pgID,
		Name:        req.Name,
		Slug:        req.Slug,
		Description: desc,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, "myblogspot:categories:all")
		_ = s.cache.DeletePattern(ctx, "myblogspot:category:*")
	}

	return &model.CategoryDTO{
		ID:          uuid.UUID(category.ID.Bytes),
		Name:        category.Name,
		Slug:        category.Slug,
		Description: pgTextToStringPtr(category.Description),
		CreatedAt:   pgTimestampToTime(category.CreatedAt),
		UpdatedAt:   pgTimestampToTime(category.UpdatedAt),
	}, nil
}

func (s *CategoryService) Delete(ctx context.Context, id uuid.UUID) error {
	pgID := uuidToPgUUID(id)
	if err := s.queries.DeleteCategory(ctx, pgID); err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, "myblogspot:categories:all")
		_ = s.cache.DeletePattern(ctx, "myblogspot:category:*")
	}

	return nil
}
