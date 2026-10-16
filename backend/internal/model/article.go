package model

import (
	"encoding/json"
	"strings"
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
	Status      string       `json:"status"`
	ViewCount   int32        `json:"view_count"`
	PublishedAt *time.Time   `json:"published_at,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
}

// CreateArticleRequest represents the request to create an article
type CreateArticleRequest struct {
	Title      string      `json:"title" validate:"required,min=1,max=255"`
	Slug       string      `json:"slug" validate:"required,min=1,max=255"`
	Summary    *string     `json:"summary" validate:"omitempty,max=500"`
	Content    string      `json:"content" validate:"required,min=1"`
	CategoryID *uuid.UUID  `json:"category_id" validate:"omitempty,uuid"`
	TagIDs     []uuid.UUID `json:"tag_ids" validate:"omitempty,dive,uuid"`
	Status     string      `json:"status" validate:"required,oneof=draft published"`
}

type rawArticleRequest struct {
	Title      string   `json:"title"`
	Slug       string   `json:"slug"`
	Summary    *string  `json:"summary"`
	Content    string   `json:"content"`
	CategoryID *string  `json:"category_id"`
	TagIDs     []string `json:"tag_ids"`
	Status     string   `json:"status"`
}

func parseArticleRequestFields(raw rawArticleRequest) (*uuid.UUID, []uuid.UUID, error) {
	var categoryID *uuid.UUID
	if raw.CategoryID != nil && strings.TrimSpace(*raw.CategoryID) != "" {
		id, err := uuid.Parse(strings.TrimSpace(*raw.CategoryID))
		if err != nil {
			return nil, nil, err
		}
		categoryID = &id
	}

	var tagIDs []uuid.UUID
	for _, t := range raw.TagIDs {
		trimmed := strings.TrimSpace(t)
		if trimmed == "" {
			continue
		}
		id, err := uuid.Parse(trimmed)
		if err != nil {
			return nil, nil, err
		}
		tagIDs = append(tagIDs, id)
	}
	return categoryID, tagIDs, nil
}

func (r *CreateArticleRequest) UnmarshalJSON(data []byte) error {
	var raw rawArticleRequest
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	catID, tagIDs, err := parseArticleRequestFields(raw)
	if err != nil {
		return err
	}
	r.Title = raw.Title
	r.Slug = raw.Slug
	r.Summary = raw.Summary
	r.Content = raw.Content
	r.CategoryID = catID
	r.TagIDs = tagIDs
	r.Status = raw.Status
	return nil
}

// UpdateArticleRequest represents the request to update an article
type UpdateArticleRequest struct {
	Title      string      `json:"title" validate:"required,min=1,max=255"`
	Slug       string      `json:"slug" validate:"required,min=1,max=255"`
	Summary    *string     `json:"summary" validate:"omitempty,max=500"`
	Content    string      `json:"content" validate:"required,min=1"`
	CategoryID *uuid.UUID  `json:"category_id" validate:"omitempty,uuid"`
	TagIDs     []uuid.UUID `json:"tag_ids" validate:"omitempty,dive,uuid"`
	Status     string      `json:"status" validate:"required,oneof=draft published"`
}

func (r *UpdateArticleRequest) UnmarshalJSON(data []byte) error {
	var raw rawArticleRequest
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	catID, tagIDs, err := parseArticleRequestFields(raw)
	if err != nil {
		return err
	}
	r.Title = raw.Title
	r.Slug = raw.Slug
	r.Summary = raw.Summary
	r.Content = raw.Content
	r.CategoryID = catID
	r.TagIDs = tagIDs
	r.Status = raw.Status
	return nil
}
