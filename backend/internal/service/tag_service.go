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
)

var ErrTagNotFound = errors.New("tag not found")

// TagService handles tag business logic
type TagService struct {
	queries *db.Queries
	cache   cache.Cache
}

// NewTagService creates a new tag service with optional cache support
func NewTagService(queries *db.Queries, c ...cache.Cache) *TagService {
	var appCache cache.Cache
	if len(c) > 0 {
		appCache = c[0]
	}
	return &TagService{queries: queries, cache: appCache}
}

// List returns all tags (cached in Redis)
func (s *TagService) List(ctx context.Context) ([]model.TagDTO, error) {
	const cacheKey = "myblogspot:tags:all"
	var cached []model.TagDTO
	if s.cache != nil && s.cache.Get(ctx, "tags", cacheKey, &cached) {
		return cached, nil
	}

	tags, err := s.queries.ListTagsWithCount(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list tags: %w", err)
	}

	dtos := make([]model.TagDTO, len(tags))
	for i, tag := range tags {
		var articleCount *int64
		if count, ok := tag.ArticleCount.(int64); ok {
			articleCount = &count
		}

		dtos[i] = model.TagDTO{
			ID:           uuid.UUID(tag.ID.Bytes),
			Name:         tag.Name,
			Slug:         tag.Slug,
			ArticleCount: articleCount,
			CreatedAt:    pgTimestampToTime(tag.CreatedAt),
		}
	}

	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, dtos, 10*time.Minute)
	}

	return dtos, nil
}

// GetBySlug returns a tag by slug (cached in Redis)
func (s *TagService) GetBySlug(ctx context.Context, slug string) (*model.TagDTO, error) {
	cacheKey := fmt.Sprintf("myblogspot:tag:%s", slug)
	var cached model.TagDTO
	if s.cache != nil && s.cache.Get(ctx, "tags", cacheKey, &cached) {
		return &cached, nil
	}

	tag, err := s.queries.GetTagBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, sql.ErrNoRows) {
			return nil, ErrTagNotFound
		}
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}

	dto := &model.TagDTO{
		ID:        uuid.UUID(tag.ID.Bytes),
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: pgTimestampToTime(tag.CreatedAt),
	}

	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, *dto, 10*time.Minute)
	}

	return dto, nil
}

// GetArticlesByTag returns articles with a specific tag
func (s *TagService) GetArticlesByTag(ctx context.Context, tagID uuid.UUID, limit, offset int32) ([]model.ArticleListDTO, int64, error) {
	pgID := uuidToPgUUID(tagID)

	articles, err := s.queries.GetTagArticles(ctx, db.GetTagArticlesParams{
		TagID:  pgID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list articles by tag: %w", err)
	}

	total, err := s.queries.CountTagArticles(ctx, pgID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count articles by tag: %w", err)
	}

	dtos := make([]model.ArticleListDTO, len(articles))
	for i, article := range articles {
		dto := model.ArticleListDTO{
			ID:          uuid.UUID(article.ID.Bytes),
			Title:       article.Title,
			Slug:        article.Slug,
			Summary:     pgTextToStringPtr(article.Summary),
			CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
			ViewCount:   article.ViewCount,
			PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
			CreatedAt:   pgTimestampToTime(article.CreatedAt),
		}

		// Load category if present
		if article.CategoryID.Valid {
			catID := uuidToPgUUID(uuid.UUID(article.CategoryID.Bytes))
			category, err := s.queries.GetCategoryByID(ctx, catID)
			if err == nil {
				dto.Category = &model.CategoryDTO{
					ID:          uuid.UUID(category.ID.Bytes),
					Name:        category.Name,
					Slug:        category.Slug,
					Description: pgTextToStringPtr(category.Description),
					CreatedAt:   pgTimestampToTime(category.CreatedAt),
					UpdatedAt:   pgTimestampToTime(category.UpdatedAt),
				}
			}
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

func (s *TagService) Create(ctx context.Context, req model.CreateTagRequest) (*model.TagDTO, error) {
	tag, err := s.queries.CreateTag(ctx, db.CreateTagParams{
		Name: req.Name,
		Slug: req.Slug,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, "myblogspot:tags:all")
		_ = s.cache.DeletePattern(ctx, "myblogspot:tag:*")
	}

	return &model.TagDTO{
		ID:        uuid.UUID(tag.ID.Bytes),
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: pgTimestampToTime(tag.CreatedAt),
	}, nil
}

func (s *TagService) Update(ctx context.Context, id uuid.UUID, req model.UpdateTagRequest) (*model.TagDTO, error) {
	pgID := uuidToPgUUID(id)
	tag, err := s.queries.UpdateTag(ctx, db.UpdateTagParams{
		ID:   pgID,
		Name: req.Name,
		Slug: req.Slug,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update tag: %w", err)
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, "myblogspot:tags:all")
		_ = s.cache.DeletePattern(ctx, "myblogspot:tag:*")
	}

	return &model.TagDTO{
		ID:        uuid.UUID(tag.ID.Bytes),
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: pgTimestampToTime(tag.CreatedAt),
	}, nil
}

func (s *TagService) Delete(ctx context.Context, id uuid.UUID) error {
	pgID := uuidToPgUUID(id)
	if err := s.queries.DeleteTag(ctx, pgID); err != nil {
		return fmt.Errorf("failed to delete tag: %w", err)
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, "myblogspot:tags:all")
		_ = s.cache.DeletePattern(ctx, "myblogspot:tag:*")
	}

	return nil
}
