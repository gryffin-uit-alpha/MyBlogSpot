package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var startTime = time.Now()

const Version = "1.0.0"

type HealthHandler struct {
	db *pgxpool.Pool
}

func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{db: db}
}

type HealthResponse struct {
	Status   string        `json:"status"`
	Version  string        `json:"version"`
	Uptime   string        `json:"uptime"`
	Database DatabaseCheck `json:"database"`
}

type DatabaseCheck struct {
	Status string `json:"status"`
}

func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(startTime)

	// Check database connection
	dbStatus := "ok"
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.db.Ping(ctx); err != nil {
		dbStatus = "error"
	}

	response := HealthResponse{
		Status:  "ok",
		Version: Version,
		Uptime:  uptime.Round(time.Second).String(),
		Database: DatabaseCheck{
			Status: dbStatus,
		},
	}

	// If database is down, return 503
	statusCode := http.StatusOK
	if dbStatus == "error" {
		statusCode = http.StatusServiceUnavailable
		response.Status = "degraded"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

// Legacy health check function for backward compatibility
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
