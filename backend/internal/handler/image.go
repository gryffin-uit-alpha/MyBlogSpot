package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
)

type ImageHandler struct {
	service *service.ImageService
}

func NewImageHandler(service *service.ImageService) *ImageHandler {
	return &ImageHandler{service: service}
}

func (h *ImageHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "File too large (max 10MB)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Failed to read image file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	folder := r.FormValue("folder")
	if folder == "" {
		folder = "general"
	}

	altText := r.FormValue("alt_text")

	result, err := h.service.UploadImage(r.Context(), file, header, folder, altText)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	markdown := h.service.GetMarkdownSyntax(result)

	response := map[string]interface{}{
		"id":       result.ID,
		"url":      result.URL,
		"filename": result.Filename,
		"folder":   result.Folder,
		"alt_text": result.AltText,
		"markdown": markdown,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *ImageHandler) ListImages(w http.ResponseWriter, r *http.Request) {
	folder := r.URL.Query().Get("folder")
	var folderPtr *string
	if folder != "" && folder != "undefined" && folder != "null" {
		folderPtr = &folder
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	images, total, err := h.service.ListImages(r.Context(), folderPtr, int32(limit), int32(offset))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"images": images,
		"pagination": map[string]interface{}{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *ImageHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Image ID is required", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteImage(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
