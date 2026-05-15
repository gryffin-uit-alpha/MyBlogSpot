package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
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

	return dtos, total, nil
}

// GetBySlug returns a published article by slug
func (s *ArticleService) GetBySlug(ctx context.Context, slug string) (*model.ArticleDTO, error) {
	article, err := s.queries.GetArticleBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("article not found")
		}
		return nil, fmt.Errorf("failed to get article: %w", err)
	}

	dto := &model.ArticleDTO{
		ID:          uuid.UUID(article.ID.Bytes),
		Title:       article.Title,
		Slug:        article.Slug,
		Summary:     pgTextToStringPtr(article.Summary),
		Content:     article.Content,
		CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
		CreatedAt:   pgTimestampToTime(article.CreatedAt),
		UpdatedAt:   pgTimestampToTime(article.UpdatedAt),
	}

	return dto, nil
}

// IncrementViewCount increments the view count for an article
func (s *ArticleService) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	pgID := uuidToPgUUID(id)
	err := s.queries.IncrementViewCount(ctx, pgID)
	if err != nil {
		return fmt.Errorf("failed to increment view count: %w", err)
	}
	return nil
}

// Create creates a new article
func (s *ArticleService) Create(ctx context.Context, req model.CreateArticleRequest) (*model.ArticleDTO, error) {
	var categoryID pgtype.UUID
	if req.CategoryID != nil {
		categoryID = uuidToPgUUID(*req.CategoryID)
	}

	var summary pgtype.Text
	if req.Summary != nil {
		summary = pgtype.Text{String: *req.Summary, Valid: true}
	}

	article, err := s.queries.CreateArticle(ctx, db.CreateArticleParams{
		Title:      req.Title,
		Slug:       req.Slug,
		Summary:    summary,
		Content:    req.Content,
		CategoryID: categoryID,
		Status:     req.Status,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create article: %w", err)
	}

	dto := &model.ArticleDTO{
		ID:          uuid.UUID(article.ID.Bytes),
		Title:       article.Title,
		Slug:        article.Slug,
		Summary:     pgTextToStringPtr(article.Summary),
		Content:     article.Content,
		CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
		CreatedAt:   pgTimestampToTime(article.CreatedAt),
		UpdatedAt:   pgTimestampToTime(article.UpdatedAt),
	}

	return dto, nil
}

// Update updates an existing article
func (s *ArticleService) Update(ctx context.Context, id uuid.UUID, req model.UpdateArticleRequest) (*model.ArticleDTO, error) {
	var categoryID pgtype.UUID
	if req.CategoryID != nil {
		categoryID = uuidToPgUUID(*req.CategoryID)
	}

	var summary pgtype.Text
	if req.Summary != nil {
		summary = pgtype.Text{String: *req.Summary, Valid: true}
	}

	pgID := uuidToPgUUID(id)
	article, err := s.queries.UpdateArticle(ctx, db.UpdateArticleParams{
		ID:         pgID,
		Title:      req.Title,
		Slug:       req.Slug,
		Summary:    summary,
		Content:    req.Content,
		CategoryID: categoryID,
		Status:     req.Status,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("article not found")
		}
		return nil, fmt.Errorf("failed to update article: %w", err)
	}

	dto := &model.ArticleDTO{
		ID:          uuid.UUID(article.ID.Bytes),
		Title:       article.Title,
		Slug:        article.Slug,
		Summary:     pgTextToStringPtr(article.Summary),
		Content:     article.Content,
		CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
		CreatedAt:   pgTimestampToTime(article.CreatedAt),
		UpdatedAt:   pgTimestampToTime(article.UpdatedAt),
	}

	return dto, nil
}

// Delete deletes an article by ID
func (s *ArticleService) Delete(ctx context.Context, id uuid.UUID) error {
	pgID := uuidToPgUUID(id)
	err := s.queries.DeleteArticle(ctx, pgID)
	if err != nil {
		return fmt.Errorf("failed to delete article: %w", err)
	}
	return nil
}

// GetByID returns an article by ID (for admin use, includes drafts)
func (s *ArticleService) GetByID(ctx context.Context, id uuid.UUID) (*model.ArticleDTO, error) {
	pgID := uuidToPgUUID(id)
	article, err := s.queries.GetArticleByID(ctx, pgID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("article not found")
		}
		return nil, fmt.Errorf("failed to get article: %w", err)
	}

	dto := &model.ArticleDTO{
		ID:          uuid.UUID(article.ID.Bytes),
		Title:       article.Title,
		Slug:        article.Slug,
		Summary:     pgTextToStringPtr(article.Summary),
		Content:     article.Content,
		CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
		CreatedAt:   pgTimestampToTime(article.CreatedAt),
		UpdatedAt:   pgTimestampToTime(article.UpdatedAt),
	}

	return dto, nil
}

// ListAll returns all articles (for admin use, includes drafts)
func (s *ArticleService) ListAll(ctx context.Context, limit, offset int32) ([]model.ArticleListDTO, error) {
	articles, err := s.queries.ListAllArticles(ctx, db.ListAllArticlesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list articles: %w", err)
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

// Helper functions to convert between pgtype and standard Go types

func pgTextToStringPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func pgUUIDToUUIDPtr(u pgtype.UUID) *uuid.UUID {
	if !u.Valid {
		return nil
	}
	id := uuid.UUID(u.Bytes)
	return &id
}

func pgTimestampToTimePtr(t pgtype.Timestamp) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

func pgTimestampToTime(t pgtype.Timestamp) time.Time {
	if !t.Valid {
		return time.Time{}
	}
	return t.Time
}

func uuidToPgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: [16]byte(id),
		Valid: true,
	}
}
