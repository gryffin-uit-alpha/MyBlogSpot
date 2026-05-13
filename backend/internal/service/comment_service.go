package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
)

// CommentService handles comment business logic
type CommentService struct {
	queries *db.Queries
}

// NewCommentService creates a new comment service
func NewCommentService(queries *db.Queries) *CommentService {
	return &CommentService{queries: queries}
}

// ListByArticle returns comments for a specific article
func (s *CommentService) ListByArticle(ctx context.Context, articleSlug string, limit, offset int32) ([]model.CommentDTO, int64, error) {
	// First get article by slug to get ID
	article, err := s.queries.GetArticleBySlug(ctx, articleSlug)
	if err != nil {
		return nil, 0, fmt.Errorf("article not found: %w", err)
	}

	// Get comments
	comments, err := s.queries.ListCommentsByArticle(ctx, db.ListCommentsByArticleParams{
		ArticleID: article.ID,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list comments: %w", err)
	}

	// Get total count
	total, err := s.queries.CountCommentsByArticle(ctx, article.ID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count comments: %w", err)
	}

	dtos := make([]model.CommentDTO, len(comments))
	for i, comment := range comments {
		dtos[i] = model.CommentDTO{
			ID:        uuid.UUID(comment.ID.Bytes),
			ArticleID: uuid.UUID(comment.ArticleID.Bytes),
			Nickname:  comment.Nickname,
			Content:   comment.Content,
			CreatedAt: pgTimestampToTime(comment.CreatedAt),
		}
	}

	return dtos, total, nil
}

// Create creates a new comment
func (s *CommentService) Create(ctx context.Context, articleSlug, nickname, content, ipAddress string) (*model.CommentDTO, error) {
	// Validate input
	if nickname == "" {
		return nil, fmt.Errorf("nickname is required")
	}
	if len(content) < 1 || len(content) > 1000 {
		return nil, fmt.Errorf("content must be between 1 and 1000 characters")
	}

	// Get article by slug
	article, err := s.queries.GetArticleBySlug(ctx, articleSlug)
	if err != nil {
		return nil, fmt.Errorf("article not found: %w", err)
	}

	// Check rate limit: max 5 comments per 15 minutes from same IP
	if ipAddress != "" {
		fifteenMinutesAgo := time.Now().Add(-15 * time.Minute)
		count, err := s.queries.CountRecentCommentsByIP(ctx, db.CountRecentCommentsByIPParams{
			IpAddress: pgtype.Text{String: ipAddress, Valid: true},
			CreatedAt: pgtype.Timestamp{Time: fifteenMinutesAgo, Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to check rate limit: %w", err)
		}
		if count >= 5 {
			return nil, fmt.Errorf("rate limit exceeded: too many comments in a short time")
		}
	}

	// Create comment
	comment, err := s.queries.CreateComment(ctx, db.CreateCommentParams{
		ArticleID: article.ID,
		Nickname:  nickname,
		Content:   content,
		IpAddress: pgtype.Text{String: ipAddress, Valid: ipAddress != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}

	dto := &model.CommentDTO{
		ID:        uuid.UUID(comment.ID.Bytes),
		ArticleID: uuid.UUID(comment.ArticleID.Bytes),
		Nickname:  comment.Nickname,
		Content:   comment.Content,
		CreatedAt: pgTimestampToTime(comment.CreatedAt),
	}

	return dto, nil
}

// Delete deletes a comment by ID
func (s *CommentService) Delete(ctx context.Context, commentID uuid.UUID) error {
	pgID := uuidToPgUUID(commentID)

	if err := s.queries.DeleteComment(ctx, pgID); err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	return nil
}
