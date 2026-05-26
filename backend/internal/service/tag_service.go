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

func (s *TagService) Create(ctx context.Context, req model.CreateTagRequest) (*model.TagDTO, error) {
	tag, err := s.queries.CreateTag(ctx, db.CreateTagParams{
		Name: req.Name,
		Slug: req.Slug,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
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
	return nil
}
