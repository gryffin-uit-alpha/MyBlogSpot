package model

import (
	"time"

	"github.com/google/uuid"
)

// TagDTO represents a tag returned to the client
type TagDTO struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	ArticleCount *int64    `json:"article_count,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
