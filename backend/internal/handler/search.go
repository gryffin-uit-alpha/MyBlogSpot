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

	// Parse pagination parameters
	limit, offset := util.ParsePagination(r)

	// Search articles
	articles, err := h.searchService.SearchArticles(ctx, query, limit, offset)
	if err != nil {
		util.RespondError(w, http.StatusInternalServerError, "Search failed")
		return
	}

	util.RespondSuccess(w, http.StatusOK, articles, nil)
}
