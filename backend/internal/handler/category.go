package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

// CategoryHandler handles category HTTP requests
type CategoryHandler struct {
	categoryService *service.CategoryService
	ArticleService  *service.ArticleService // For getting articles by category
}

// NewCategoryHandler creates a new category handler
func NewCategoryHandler(categoryService *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categoryService: categoryService}
}

// ListCategories handles GET /api/v1/categories
func (h *CategoryHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	categories, err := h.categoryService.List(ctx)
	if err != nil {
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}

	util.RespondSuccess(w, http.StatusOK, categories, nil)
}

// GetCategory handles GET /api/v1/categories/:slug
func (h *CategoryHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		util.RespondError(w, http.StatusBadRequest, "Category slug is required")
		return
	}

	category, err := h.categoryService.GetBySlug(ctx, slug)
	if err != nil {
		if err.Error() == "category not found" {
			util.RespondError(w, http.StatusNotFound, "Category not found")
			return
		}
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch category")
		return
	}

	util.RespondSuccess(w, http.StatusOK, category, nil)
}

// GetCategoryArticles handles GET /api/v1/categories/:slug/articles
func (h *CategoryHandler) GetCategoryArticles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		util.RespondError(w, http.StatusBadRequest, "Category slug is required")
		return
	}

	// Get category first to get its ID
	category, err := h.categoryService.GetBySlug(ctx, slug)
	if err != nil {
		if err.Error() == "category not found" {
			util.RespondError(w, http.StatusNotFound, "Category not found")
			return
		}
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch category")
		return
	}

	// Parse pagination parameters
	limit, offset := util.ParsePagination(r)

	// Get articles in this category
	articles, total, err := h.categoryService.GetArticlesByCategory(ctx, category.ID, limit, offset)
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
