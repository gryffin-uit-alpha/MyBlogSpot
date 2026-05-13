package util

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
)

// RespondSuccess sends a successful JSON response
func RespondSuccess(w http.ResponseWriter, statusCode int, data interface{}, meta *model.MetaInfo) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := model.Response{
		Success: true,
		Data:    data,
		Meta:    meta,
	}

	json.NewEncoder(w).Encode(response)
}

// RespondError sends an error JSON response
func RespondError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := model.Response{
		Success: false,
		Error:   &model.ErrorInfo{Code: "error", Message: message},
	}

	json.NewEncoder(w).Encode(response)
}

// ParsePagination extracts limit and offset from request query parameters
// Returns limit and offset as int32 for use with database queries
func ParsePagination(r *http.Request) (limit, offset int32) {
	limit = 20 // default
	offset = 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = int32(l)
			if limit > 50 {
				limit = 50 // max limit
			}
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = int32(o)
		}
	}

	// Support page/per_page as alternative
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			perPage := limit
			if perPageStr := r.URL.Query().Get("per_page"); perPageStr != "" {
				if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 {
					perPage = int32(pp)
					if perPage > 50 {
						perPage = 50
					}
				}
			}
			offset = int32(p-1) * perPage
			limit = perPage
		}
	}

	return limit, offset
}
