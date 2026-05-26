package model

import (
	"time"

	"github.com/google/uuid"
)

// CommentDTO represents a comment data transfer object
type CommentDTO struct {
	ID        uuid.UUID      `json:"id"`
	ArticleID uuid.UUID      `json:"article_id"`
	Nickname  string         `json:"nickname"`
	Content   string         `json:"content"`
	ParentID  *uuid.UUID     `json:"parent_id,omitempty"`
	Approved  bool           `json:"approved"`
	Replies   []CommentDTO   `json:"replies,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}

// CreateCommentRequest represents a request to create a comment
type CreateCommentRequest struct {
	Nickname string      `json:"nickname"`
	Content  string      `json:"content"`
	ParentID *uuid.UUID  `json:"parent_id,omitempty"`
}

// CommentWithArticleDTO represents a comment with article context (for admin)
type CommentWithArticleDTO struct {
	ID           uuid.UUID `json:"id"`
	ArticleID    uuid.UUID `json:"article_id"`
	ArticleTitle string    `json:"article_title"`
	ArticleSlug  string    `json:"article_slug"`
	Nickname     string    `json:"nickname"`
	Content      string    `json:"content"`
	Approved     bool      `json:"approved"`
	CreatedAt    time.Time `json:"created_at"`
}
