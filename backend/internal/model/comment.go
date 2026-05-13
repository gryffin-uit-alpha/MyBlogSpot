package model

import (
	"time"

	"github.com/google/uuid"
)

// CommentDTO represents a comment data transfer object
type CommentDTO struct {
	ID        uuid.UUID `json:"id"`
	ArticleID uuid.UUID `json:"article_id"`
	Nickname  string    `json:"nickname"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateCommentRequest represents a request to create a comment
type CreateCommentRequest struct {
	Nickname string `json:"nickname"`
	Content  string `json:"content"`
}
