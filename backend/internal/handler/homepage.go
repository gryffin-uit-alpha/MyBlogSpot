package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
)

type HomepageHandler struct {
	service *service.HomepageService
}

func NewHomepageHandler(service *service.HomepageService) *HomepageHandler {
	return &HomepageHandler{service: service}
}

func (h *HomepageHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.service.GetSettings(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func (h *HomepageHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req service.HomepageSettings
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateSettings(r.Context(), &req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Settings updated successfully"})
}
