package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/config"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/middleware"
)

func main() {
	cfg := config.Load()

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.CORS.AllowedOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimit.Requests))

	r.Get("/health", handler.HealthCheck)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
