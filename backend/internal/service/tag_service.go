package service

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// TagService handles tag business logic
type TagService struct {
	queries *db.Queries
}

// NewTagService creates a new tag service
func NewTagService(queries *db.Queries) *TagService {
	return &TagService{queries: queries}
}

// List returns all tags
func (s *TagService) List(ctx context.Context) ([]model.TagDTO, error) {
	tags, err := s.queries.ListTags(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list tags: %w", err)
	}

	dtos := make([]model.TagDTO, len(tags))
	for i, tag := range tags {
		dtos[i] = model.TagDTO{
			ID:        uuid.UUID(tag.ID.Bytes),
			Name:      tag.Name,
			Slug:      tag.Slug,
			CreatedAt: pgTimestampToTime(tag.CreatedAt),
		}
	}

	return dtos, nil
}

// GetBySlug returns a tag by slug
func (s *TagService) GetBySlug(ctx context.Context, slug string) (*model.TagDTO, error) {
	tag, err := s.queries.GetTagBySlug(ctx, slug)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("tag not found")
		}
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}

	dto := &model.TagDTO{
		ID:        uuid.UUID(tag.ID.Bytes),
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: pgTimestampToTime(tag.CreatedAt),
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

	return dtos, int64(len(articles)), nil
}
