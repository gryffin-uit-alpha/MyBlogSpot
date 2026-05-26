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

type CreateTagRequest struct {
	Name string `json:"name" validate:"required,min=1,max=50"`
	Slug string `json:"slug" validate:"required,min=1,max=50"`
}

type UpdateTagRequest struct {
	Name string `json:"name" validate:"required,min=1,max=50"`
	Slug string `json:"slug" validate:"required,min=1,max=50"`
}
