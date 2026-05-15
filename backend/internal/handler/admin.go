package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gryffin-uit-alpha/myblogspot/internal/model"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/gryffin-uit-alpha/myblogspot/internal/util"
)

type AdminHandler struct {
	service  *service.AdminService
	validate *validator.Validate
}

func NewAdminHandler(service *service.AdminService) *AdminHandler {
	return &AdminHandler{
		service:  service,
		validate: validator.New(),
	}
}

func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		util.RespondJSON(w, http.StatusBadRequest, model.ErrorResponse("INVALID_REQUEST", "Invalid request body"))
		return
	}

	if err := h.validate.Struct(req); err != nil {
		util.RespondJSON(w, http.StatusBadRequest, model.ErrorResponse("VALIDATION_ERROR", err.Error()))
		return
	}

	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		util.RespondJSON(w, http.StatusUnauthorized, model.ErrorResponse("UNAUTHORIZED", "Invalid credentials"))
		return
	}

	// Set HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    resp.Token,
		Path:     "/",
		MaxAge:   86400, // 24 hours
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteStrictMode,
	})

	util.RespondJSON(w, http.StatusOK, model.SuccessResponse(resp))
}
