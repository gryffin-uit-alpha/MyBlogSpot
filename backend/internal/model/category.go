package model

import (
	"time"

	"github.com/google/uuid"
)

// CategoryDTO represents a category returned to the client
type CategoryDTO struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	Description  *string    `json:"description,omitempty"`
	ArticleCount *int64     `json:"article_count,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
