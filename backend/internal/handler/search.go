package handler

import (
	"net/http"

	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

// SearchHandler handles search HTTP requests
type SearchHandler struct {
	searchService *service.SearchService
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(searchService *service.SearchService) *SearchHandler {
	return &SearchHandler{searchService: searchService}
}

// Search handles GET /api/v1/search
// Query parameters:
// - q: search query (required)
// - limit: number of results per page (optional, default 10)
// - offset: number of results to skip (optional, default 0)
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get search query
	query := r.URL.Query().Get("q")
	if query == "" {
		util.RespondError(w, http.StatusBadRequest, "Search query 'q' is required")
		return
	}

	// Parse pagination parameters (default limit 10 for search)
	limit, offset := util.ParsePagination(r)
	if r.URL.Query().Get("limit") == "" && r.URL.Query().Get("per_page") == "" {
		limit = 10
	}

	// Search articles
	articles, total, err := h.searchService.SearchArticles(ctx, query, limit, offset)
	if err != nil {
		util.RespondError(w, http.StatusInternalServerError, "Search failed")
		return
	}

	page := int(offset/limit) + 1
	meta := util.CalculatePagination(page, int(limit), int(total))
	util.RespondSuccess(w, http.StatusOK, articles, meta)
}
