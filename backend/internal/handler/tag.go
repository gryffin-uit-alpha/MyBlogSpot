package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

// TagHandler handles tag HTTP requests
type TagHandler struct {
	tagService *service.TagService
}

// NewTagHandler creates a new tag handler
func NewTagHandler(tagService *service.TagService) *TagHandler {
	return &TagHandler{tagService: tagService}
}

// ListTags handles GET /api/v1/tags
func (h *TagHandler) ListTags(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	tags, err := h.tagService.List(ctx)
	if err != nil {
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch tags")
		return
	}

	util.RespondSuccess(w, http.StatusOK, tags, nil)
}

// GetTag handles GET /api/v1/tags/:slug
func (h *TagHandler) GetTag(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		util.RespondError(w, http.StatusBadRequest, "Tag slug is required")
		return
	}

	tag, err := h.tagService.GetBySlug(ctx, slug)
	if err != nil {
		if err.Error() == "tag not found" {
			util.RespondError(w, http.StatusNotFound, "Tag not found")
			return
		}
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch tag")
		return
	}

	util.RespondSuccess(w, http.StatusOK, tag, nil)
}

// GetTagArticles handles GET /api/v1/tags/:slug/articles
func (h *TagHandler) GetTagArticles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		util.RespondError(w, http.StatusBadRequest, "Tag slug is required")
		return
	}

	// Get tag first to get its ID
	tag, err := h.tagService.GetBySlug(ctx, slug)
	if err != nil {
		if err.Error() == "tag not found" {
			util.RespondError(w, http.StatusNotFound, "Tag not found")
			return
		}
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch tag")
		return
	}

	// Parse pagination parameters
	limit, offset := util.ParsePagination(r)

	// Get articles with this tag
	articles, total, err := h.tagService.GetArticlesByTag(ctx, tag.ID, limit, offset)
	if err != nil {
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch articles")
		return
	}

	// Build pagination metadata
	page := (offset / limit) + 1
	totalPages := (total + int64(limit) - 1) / int64(limit)

	meta := &model.MetaInfo{
		Page:       int(page),
		PerPage:    int(limit),
		Total:      int(total),
		TotalPages: int(totalPages),
	}

	util.RespondSuccess(w, http.StatusOK, articles, meta)
}
