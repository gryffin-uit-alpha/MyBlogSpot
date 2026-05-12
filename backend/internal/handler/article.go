package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

// ArticleHandler handles article HTTP requests
type ArticleHandler struct {
	service *service.ArticleService
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(service *service.ArticleService) *ArticleHandler {
	return &ArticleHandler{service: service}
}

// ListArticles handles GET /api/v1/articles
func (h *ArticleHandler) ListArticles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse pagination parameters
	page, perPage := util.ParsePaginationParams(r, 20, 50)
	limit := int32(perPage)
	offset := int32((page - 1) * perPage)

	// Get articles
	articles, total, err := h.service.ListPublished(ctx, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch articles")
		return
	}

	// Calculate pagination metadata
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}

	meta := &model.MetaInfo{
		Page:       page,
		PerPage:    perPage,
		Total:      int(total),
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}

	writeSuccess(w, articles, meta)
}

// GetArticle handles GET /api/v1/articles/:slug
func (h *ArticleHandler) GetArticle(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		writeError(w, http.StatusBadRequest, "INVALID_SLUG", "Slug is required")
		return
	}

	article, err := h.service.GetBySlug(ctx, slug)
	if err != nil {
		if err.Error() == "article not found" {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Article not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch article")
		return
	}

	writeSuccess(w, article, nil)
}

// TrackView handles POST /api/v1/articles/:id/view
func (h *ArticleHandler) TrackView(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	idStr := chi.URLParam(r, "id")

	if idStr == "" {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Article ID is required")
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_UUID", "Invalid article ID format")
		return
	}

	err = h.service.IncrementViewCount(ctx, id)
	if err != nil {
		if err.Error() == "article not found" {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Article not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to track view")
		return
	}

	writeSuccess(w, map[string]string{"message": "View tracked successfully"}, nil)
}

// Helper functions
func writeSuccess(w http.ResponseWriter, data interface{}, meta *model.MetaInfo) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := model.SuccessResponseWithMeta(data, meta)
	json.NewEncoder(w).Encode(response)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := model.ErrorResponse(code, message)
	json.NewEncoder(w).Encode(response)
}
