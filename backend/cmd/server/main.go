package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/config"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/middleware"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	_ "github.com/lib/pq"
)

func main() {
	cfg := config.Load()

	// Initialize database connection
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	database, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Test database connection
	if err := database.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connection established")

	// Initialize queries and services
	queries := db.New(database)
	articleService := service.NewArticleService(queries)

	// Initialize handlers
	articleHandler := handler.NewArticleHandler(articleService)

	// Setup router
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.CORS.AllowedOrigins))
	r.Use(middleware.RateLimit(cfg.RateLimit.Requests))

	// Health check
	r.Get("/health", handler.HealthCheck)

	// Public API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Article routes
		r.Get("/articles", articleHandler.ListArticles)
		r.Get("/articles/{slug}", articleHandler.GetArticle)
		r.Post("/articles/{id}/view", articleHandler.TrackView)
	})

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
