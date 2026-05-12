package util

import (
	"net/http"
	"strconv"

	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// ParsePaginationParams extracts and validates pagination parameters from request
func ParsePaginationParams(r *http.Request, defaultPerPage, maxPerPage int) (page, perPage int) {
	page = 1
	perPage = defaultPerPage

	// Parse page
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	// Parse per_page
	if perPageStr := r.URL.Query().Get("per_page"); perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 {
			perPage = pp
			if perPage > maxPerPage {
				perPage = maxPerPage
			}
		}
	}

	// Support limit/offset as alternative
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			perPage = l
			if perPage > maxPerPage {
				perPage = maxPerPage
			}
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			// Convert offset to page
			page = (o / perPage) + 1
		}
	}

	return page, perPage
}

func CalculatePagination(page, perPage, total int) *model.MetaInfo {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 50 {
		perPage = 50
	}

	totalPages := (total + perPage - 1) / perPage
	if totalPages < 1 {
		totalPages = 1
	}

	return &model.MetaInfo{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}
