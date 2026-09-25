package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// SearchService handles search business logic
type SearchService struct {
	queries *db.Queries
}

// NewSearchService creates a new search service
func NewSearchService(queries *db.Queries) *SearchService {
	return &SearchService{queries: queries}
}

// SearchArticles searches for articles using PostgreSQL full-text search with relevance ranking
func (s *SearchService) SearchArticles(ctx context.Context, query string, limit, offset int32) ([]model.ArticleListDTO, int64, error) {
	if query == "" {
		return []model.ArticleListDTO{}, 0, nil
	}

	articles, err := s.queries.SearchArticles(ctx, db.SearchArticlesParams{
		WebsearchToTsquery: query,
		Limit:              limit,
		Offset:             offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to search articles: %w", err)
	}

	total, err := s.queries.CountSearchArticles(ctx, query)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count search articles: %w", err)
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
