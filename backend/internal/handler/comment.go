package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

// CommentHandler handles comment HTTP requests
type CommentHandler struct {
	commentService *service.CommentService
}

// NewCommentHandler creates a new comment handler
func NewCommentHandler(commentService *service.CommentService) *CommentHandler {
	return &CommentHandler{commentService: commentService}
}

// ListComments handles GET /api/v1/articles/:slug/comments
func (h *CommentHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		util.RespondError(w, http.StatusBadRequest, "Article slug is required")
		return
	}

	// Parse pagination
	limit, offset := util.ParsePagination(r)

	// Get comments
	comments, total, err := h.commentService.ListByArticle(ctx, slug, limit, offset)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			util.RespondError(w, http.StatusNotFound, "Article not found")
			return
		}
		util.RespondError(w, http.StatusInternalServerError, "Failed to fetch comments")
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

	util.RespondSuccess(w, http.StatusOK, comments, meta)
}

// CreateComment handles POST /api/v1/articles/:slug/comments
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	slug := chi.URLParam(r, "slug")

	if slug == "" {
		util.RespondError(w, http.StatusBadRequest, "Article slug is required")
		return
	}

	// Parse request body
	var req model.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		util.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Extract IP address
	ipAddress := extractIPAddress(r)

	// Create comment
	comment, err := h.commentService.Create(ctx, slug, req.Nickname, req.Content, ipAddress)
	if err != nil {
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "must be") {
			util.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if strings.Contains(err.Error(), "rate limit") {
			util.RespondError(w, http.StatusTooManyRequests, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			util.RespondError(w, http.StatusNotFound, "Article not found")
			return
		}
		util.RespondError(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	util.RespondSuccess(w, http.StatusCreated, comment, nil)
}

// DeleteComment handles DELETE /api/v1/comments/:id
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	idStr := chi.URLParam(r, "id")

	if idStr == "" {
		util.RespondError(w, http.StatusBadRequest, "Comment ID is required")
		return
	}

	// Parse UUID
	commentID, err := uuid.Parse(idStr)
	if err != nil {
		util.RespondError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	// Delete comment
	if err := h.commentService.Delete(ctx, commentID); err != nil {
		util.RespondError(w, http.StatusInternalServerError, "Failed to delete comment")
		return
	}

	util.RespondSuccess(w, http.StatusOK, map[string]string{"message": "Comment deleted successfully"}, nil)
}

// extractIPAddress extracts the client IP address from the request
func extractIPAddress(r *http.Request) string {
	// Check X-Forwarded-For header first (for proxies/load balancers)
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(forwarded, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	// RemoteAddr includes port, strip it
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}

	return ip
}
