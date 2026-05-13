package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gryffin-uit-alpha/myblogspot/internal/config"
	"github.com/gryffin-uit-alpha/myblogspot/internal/db"
	"github.com/gryffin-uit-alpha/myblogspot/internal/handler"
	"github.com/gryffin-uit-alpha/myblogspot/internal/middleware"
	"github.com/gryffin-uit-alpha/myblogspot/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()

	// Initialize database connection
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Test database connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connection established")

	// Initialize queries and services
	queries := db.New(pool)
	articleService := service.NewArticleService(queries)
	categoryService := service.NewCategoryService(queries)
	tagService := service.NewTagService(queries)
	searchService := service.NewSearchService(queries)
	commentService := service.NewCommentService(queries)

	// Initialize handlers
	articleHandler := handler.NewArticleHandler(articleService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	categoryHandler.ArticleService = articleService // For getting articles by category
	tagHandler := handler.NewTagHandler(tagService)
	searchHandler := handler.NewSearchHandler(searchService)
	commentHandler := handler.NewCommentHandler(commentService)

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

		// Category routes
		r.Get("/categories", categoryHandler.ListCategories)
		r.Get("/categories/{slug}", categoryHandler.GetCategory)
		r.Get("/categories/{slug}/articles", categoryHandler.GetCategoryArticles)

		// Tag routes
		r.Get("/tags", tagHandler.ListTags)
		r.Get("/tags/{slug}", tagHandler.GetTag)
		r.Get("/tags/{slug}/articles", tagHandler.GetTagArticles)

		// Search route
		r.Get("/search", searchHandler.Search)

		// Comment routes
		r.Get("/articles/{slug}/comments", commentHandler.ListComments)
		r.Post("/articles/{slug}/comments", commentHandler.CreateComment)
		r.Delete("/comments/{id}", commentHandler.DeleteComment)
	})

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
