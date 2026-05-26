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

	// Add tags if provided
	for _, tagID := range req.TagIDs {
		err := s.queries.AddArticleTag(ctx, db.AddArticleTagParams{
			ArticleID: article.ID,
			TagID:     uuidToPgUUID(tagID),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to add article tag: %w", err)
		}
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

	// Update tags: remove all then add new
	if err := s.queries.RemoveAllArticleTags(ctx, pgID); err != nil {
		return nil, fmt.Errorf("failed to remove article tags: %w", err)
	}

	for _, tagID := range req.TagIDs {
		err := s.queries.AddArticleTag(ctx, db.AddArticleTagParams{
			ArticleID: pgID,
			TagID:     uuidToPgUUID(tagID),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to add article tag: %w", err)
		}
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

	// Fetch category if exists
	if article.CategoryID.Valid {
		category, err := s.queries.GetCategoryByID(ctx, article.CategoryID)
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

	// Fetch tags
	articleTags, err := s.queries.GetArticleTags(ctx, article.ID)
	if err == nil && len(articleTags) > 0 {
		dto.Tags = make([]model.TagDTO, len(articleTags))
		for i, tag := range articleTags {
			dto.Tags[i] = model.TagDTO{
				ID:        uuid.UUID(tag.ID.Bytes),
				Name:      tag.Name,
				Slug:      tag.Slug,
				CreatedAt: pgTimestampToTime(tag.CreatedAt),
			}
		}
	} else {
		dto.Tags = []model.TagDTO{}
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
		dto := model.ArticleListDTO{
			ID:          uuid.UUID(article.ID.Bytes),
			Title:       article.Title,
			Slug:        article.Slug,
			Summary:     pgTextToStringPtr(article.Summary),
			CategoryID:  pgUUIDToUUIDPtr(article.CategoryID),
			Status:      article.Status,
			ViewCount:   article.ViewCount,
			PublishedAt: pgTimestampToTimePtr(article.PublishedAt),
			CreatedAt:   pgTimestampToTime(article.CreatedAt),
		}

		// Fetch category if exists
		if article.CategoryID.Valid {
			category, err := s.queries.GetCategoryByID(ctx, article.CategoryID)
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

		// Fetch tags
		articleTags, err := s.queries.GetArticleTags(ctx, article.ID)
		if err == nil && len(articleTags) > 0 {
			dto.Tags = make([]model.TagDTO, len(articleTags))
			for j, tag := range articleTags {
				dto.Tags[j] = model.TagDTO{
					ID:        uuid.UUID(tag.ID.Bytes),
					Name:      tag.Name,
					Slug:      tag.Slug,
					CreatedAt: pgTimestampToTime(tag.CreatedAt),
				}
			}
		} else {
			dto.Tags = []model.TagDTO{}
		}

		dtos[i] = dto
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

// GetRelatedArticles finds related articles by tags or category
func (s *ArticleService) GetRelatedArticles(ctx context.Context, slug string, limit int) ([]model.ArticleDTO, error) {
	// Get article by slug to find its ID
	article, err := s.queries.GetArticleBySlug(ctx, slug)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("article not found")
		}
		return nil, fmt.Errorf("failed to get article: %w", err)
	}

	// Get related articles
	relatedArticles, err := s.queries.GetRelatedArticles(ctx, db.GetRelatedArticlesParams{
		ArticleID: article.ID,
		Limit:     int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get related articles: %w", err)
	}

	// Convert to DTOs
	dtos := make([]model.ArticleDTO, len(relatedArticles))
	for i, a := range relatedArticles {
		dtos[i] = model.ArticleDTO{
			ID:          uuid.UUID(a.ID.Bytes),
			Title:       a.Title,
			Slug:        a.Slug,
			Summary:     pgTextToStringPtr(a.Summary),
			Content:     a.Content,
			CategoryID:  pgUUIDToUUIDPtr(a.CategoryID),
			Status:      a.Status,
			ViewCount:   a.ViewCount,
			PublishedAt: pgTimestampToTimePtr(a.PublishedAt),
			CreatedAt:   pgTimestampToTime(a.CreatedAt),
			UpdatedAt:   pgTimestampToTime(a.UpdatedAt),
		}
	}

	return dtos, nil
}
