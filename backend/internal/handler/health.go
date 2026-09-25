package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var startTime = time.Now()

const Version = "1.0.0"

type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, redisClient *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redisClient,
	}
}

type HealthResponse struct {
	Status   string        `json:"status"`
	Version  string        `json:"version"`
	Uptime   string        `json:"uptime"`
	Database DatabaseCheck `json:"database"`
	Redis    *RedisCheck   `json:"redis,omitempty"`
}

type DatabaseCheck struct {
	Status string `json:"status"`
}

type RedisCheck struct {
	Status string `json:"status"`
}

// LivezHandler checks if the process is alive (Liveness Probe).
// Strictly does NOT check downstream dependencies to prevent cascading restart storms.
func (h *HealthHandler) LivezHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "UP",
		"version": Version,
		"uptime":  time.Since(startTime).Round(time.Second).String(),
	})
}

// ReadyzHandler verifies that dependencies are accessible (Readiness Probe).
// If DB is unreachable, returns 503 so Kubernetes removes this Pod from Ingress.
func (h *HealthHandler) ReadyzHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	w.Header().Set("Content-Type", "application/json")

	// 1. Check PostgreSQL (Mandatory)
	if err := h.db.Ping(ctx); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":   "DOWN",
			"database": "unreachable: " + err.Error(),
		})
		return
	}

	// 2. Check Redis (Optional / Warning if failed)
	redisStatus := "connected"
	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			redisStatus = "unreachable: " + err.Error()
		}
	} else {
		redisStatus = "disabled"
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "READY",
		"database": "connected",
		"redis":    redisStatus,
	})
}

// Check provides full diagnostics for /health
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(startTime)

	// Check database connection
	dbStatus := "ok"
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.db.Ping(ctx); err != nil {
		dbStatus = "error"
	}

	// Check Redis connection
	var redisCheck *RedisCheck
	if h.redis != nil {
		rStatus := "ok"
		if err := h.redis.Ping(ctx).Err(); err != nil {
			rStatus = "error"
		}
		redisCheck = &RedisCheck{Status: rStatus}
	}

	response := HealthResponse{
		Status:  "ok",
		Version: Version,
		Uptime:  uptime.Round(time.Second).String(),
		Database: DatabaseCheck{
			Status: dbStatus,
		},
		Redis: redisCheck,
	}

	// If database is down, return 503 degraded
	statusCode := http.StatusOK
	if dbStatus == "error" {
		statusCode = http.StatusServiceUnavailable
		response.Status = "degraded"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(response)
}

// Legacy health check function for backward compatibility
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
