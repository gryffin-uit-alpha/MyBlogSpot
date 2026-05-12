package model

import (
	"time"

	"github.com/google/uuid"
)

// ArticleDTO represents an article returned to the client
type ArticleDTO struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Slug        string       `json:"slug"`
	Summary     *string      `json:"summary,omitempty"`
	Content     string       `json:"content"`
	CategoryID  *uuid.UUID   `json:"category_id,omitempty"`
	Category    *CategoryDTO `json:"category,omitempty"`
	Tags        []TagDTO     `json:"tags,omitempty"`
	Status      string       `json:"status"`
	ViewCount   int32        `json:"view_count"`
	PublishedAt *time.Time   `json:"published_at,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// ArticleListDTO represents a simplified article for listing
type ArticleListDTO struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Slug        string       `json:"slug"`
	Summary     *string      `json:"summary,omitempty"`
	CategoryID  *uuid.UUID   `json:"category_id,omitempty"`
	Category    *CategoryDTO `json:"category,omitempty"`
	Tags        []TagDTO     `json:"tags,omitempty"`
	ViewCount   int32        `json:"view_count"`
	PublishedAt *time.Time   `json:"published_at,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
}

// CreateArticleRequest represents the request to create an article
type CreateArticleRequest struct {
	Title      string     `json:"title" validate:"required,min=1,max=255"`
	Slug       string     `json:"slug" validate:"required,min=1,max=255"`
	Summary    *string    `json:"summary" validate:"omitempty,max=500"`
	Content    string     `json:"content" validate:"required,min=1"`
	CategoryID *uuid.UUID `json:"category_id" validate:"omitempty,uuid"`
	Tags       []string   `json:"tags" validate:"omitempty,dive,min=1,max=50"`
	Status     string     `json:"status" validate:"required,oneof=draft published"`
}

// UpdateArticleRequest represents the request to update an article
type UpdateArticleRequest struct {
	Title      string     `json:"title" validate:"required,min=1,max=255"`
	Slug       string     `json:"slug" validate:"required,min=1,max=255"`
	Summary    *string    `json:"summary" validate:"omitempty,max=500"`
	Content    string     `json:"content" validate:"required,min=1"`
	CategoryID *uuid.UUID `json:"category_id" validate:"omitempty,uuid"`
	Tags       []string   `json:"tags" validate:"omitempty,dive,min=1,max=50"`
	Status     string     `json:"status" validate:"required,oneof=draft published"`
}
