package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

// ArticleHandler handles article HTTP requests
type ArticleHandler struct {
	service  *service.ArticleService
	validate *validator.Validate
}

// NewArticleHandler creates a new article handler
func NewArticleHandler(service *service.ArticleService) *ArticleHandler {
	return &ArticleHandler{
		service:  service,
		validate: validator.New(),
	}
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

// CreateArticle handles POST /api/v1/admin/articles
func (h *ArticleHandler) CreateArticle(w http.ResponseWriter, r *http.Request) {
	var req model.CreateArticleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	article, err := h.service.Create(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "CREATE_FAILED", "Failed to create article")
		return
	}

	util.RespondJSON(w, http.StatusCreated, model.SuccessResponse(article))
}

// UpdateArticle handles PUT /api/v1/admin/articles/:id
func (h *ArticleHandler) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_UUID", "Invalid article ID format")
		return
	}

	var req model.UpdateArticleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	article, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		if err.Error() == "article not found" {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Article not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "UPDATE_FAILED", "Failed to update article")
		return
	}

	util.RespondJSON(w, http.StatusOK, model.SuccessResponse(article))
}

// DeleteArticle handles DELETE /api/v1/admin/articles/:id
func (h *ArticleHandler) DeleteArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_UUID", "Invalid article ID format")
		return
	}

	err = h.service.Delete(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DELETE_FAILED", "Failed to delete article")
		return
	}

	util.RespondJSON(w, http.StatusOK, model.SuccessResponse(map[string]string{"message": "Article deleted successfully"}))
}

// ListAllArticles handles GET /api/v1/admin/articles (includes drafts)
func (h *ArticleHandler) ListAllArticles(w http.ResponseWriter, r *http.Request) {
	page, perPage := util.ParsePaginationParams(r, 20, 50)
	limit := int32(perPage)
	offset := int32((page - 1) * perPage)

	articles, err := h.service.ListAll(r.Context(), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch articles")
		return
	}

	util.RespondJSON(w, http.StatusOK, model.SuccessResponse(articles))
}

// GetArticleByID handles GET /api/v1/admin/articles/:id (includes drafts)
func (h *ArticleHandler) GetArticleByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_UUID", "Invalid article ID format")
		return
	}

	article, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if err.Error() == "article not found" {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Article not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to fetch article")
		return
	}

	util.RespondJSON(w, http.StatusOK, model.SuccessResponse(article))
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
