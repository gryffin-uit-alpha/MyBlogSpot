package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
)

// SearchService handles search business logic
type SearchService struct {
	queries *db.Queries
}

// NewSearchService creates a new search service
func NewSearchService(queries *db.Queries) *SearchService {
	return &SearchService{queries: queries}
}

// SearchArticles searches for articles using PostgreSQL full-text search
func (s *SearchService) SearchArticles(ctx context.Context, query string, limit, offset int32) ([]model.ArticleListDTO, error) {
	if query == "" {
		return []model.ArticleListDTO{}, nil
	}

	// Simple ILIKE search on title only
	articles, err := s.queries.SearchArticles(ctx, db.SearchArticlesParams{
		Column1: pgtype.Text{String: query, Valid: true},
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search articles: %w", err)
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

	return dtos, nil
}
